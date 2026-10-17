from __future__ import annotations

import os
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ALLOWED_ORIGINS = [x.strip() for x in os.environ.get(
    "ALLOWED_ORIGINS", "https://bickriservice-agency.org,https://www.bickriservice-agency.org"
).split(",") if x.strip()]

app = FastAPI(title="Bickri Partner Analytics", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def service_headers() -> dict[str, str]:
    if not SUPABASE_URL or not SERVICE_KEY:
        raise HTTPException(status_code=503, detail="Service analytics non configuré.")
    return {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}


async def supabase_get(path: str, headers: dict[str, str] | None = None) -> Any:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/{path}",
                headers={**service_headers(), **(headers or {})},
            )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Lecture des statistiques impossible.")
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Base de données momentanément indisponible.") from exc


async def require_admin(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Connexion administrateur requise.")
    access_token = authorization[7:].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Jeton de session invalide.")
    # Validate the session with Supabase Auth; never trust a role sent by the browser.
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {access_token}"},
            )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Session invalide ou expirée.")
        user = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Vérification de session indisponible.") from exc

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalide.")
    profiles = await supabase_get(
        f"profiles?id=eq.{user_id}&select=role&limit=1"
    )
    if isinstance(profiles, list) and profiles and profiles[0].get("role") == "admin":
        return user

    # Compatibility with the existing Bickri admin allow-list, when that table exists.
    try:
        allowlist = await supabase_get(
            f"bickri_admin_users?user_id=eq.{user_id}&select=user_id&limit=1"
        )
        if isinstance(allowlist, list) and allowlist:
            return user
    except HTTPException:
        # The compatibility allow-list may not exist in every deployment.
        pass
    raise HTTPException(status_code=403, detail="Accès réservé à l’administration.")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "bickri-partner-analytics"}


def build_forecast(daily_values: list[int]) -> dict[str, Any]:
    if len(daily_values) < 14 or sum(daily_values) < 30:
        return {
            "available": False,
            "message": "Prévisions indisponibles : collectez au moins 14 jours et 30 événements.",
            "next_7_days": None,
        }
    # A compact linear trend model trained on real daily event counts.
    y = torch.tensor(daily_values, dtype=torch.float32)
    x = torch.arange(len(y), dtype=torch.float32)
    x = (x - x.mean()) / (x.std(unbiased=False) + 1e-6)
    features = torch.stack([x, torch.ones_like(x)], dim=1)
    weights = torch.linalg.lstsq(features, y).solution
    future_x = torch.arange(len(y), len(y) + 7, dtype=torch.float32)
    future_x = (future_x - (len(y) - 1) / 2) / (torch.tensor(daily_values, dtype=torch.float32).std(unbiased=False) + 1e-6)
    # Use the same normalization as training.
    train_x = torch.arange(len(y), dtype=torch.float32)
    mean_x = train_x.mean()
    std_x = train_x.std(unbiased=False) + 1e-6
    future_x = (torch.arange(len(y), len(y) + 7, dtype=torch.float32) - mean_x) / std_x
    future_features = torch.stack([future_x, torch.ones_like(future_x)], dim=1)
    predictions = torch.clamp(future_features @ weights, min=0)
    return {
        "available": True,
        "method": "PyTorch — régression linéaire sur les événements quotidiens",
        "next_7_days": [round(float(v)) for v in predictions],
        "estimated_total_7_days": round(float(predictions.sum())),
        "disclaimer": "Estimation indicative, pas une garantie. Elle s’améliore avec davantage d’historique.",
    }


@app.get("/v1/partner-analytics")
async def partner_analytics(_: dict[str, Any] = Depends(require_admin)) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=90)
    start_iso = start.isoformat().replace("+00:00", "Z")
    partners, events = await __import__("asyncio").gather(
        supabase_get("agency_partners?select=id,name,slug,active,badge_verified&order=name.asc&limit=1000"),
        supabase_get(
            "agency_partner_clicks?select=partner_id,event_type,created_at,referral_code"
            f"&created_at=gte.{start_iso}&order=created_at.asc&limit=10000"
        ),
    )
    partners = partners if isinstance(partners, list) else []
    events = events if isinstance(events, list) else []
    by_id = {str(p.get("id")): p for p in partners}
    event_counts = Counter(str(e.get("event_type") or "unknown") for e in events)
    partner_counts: Counter[str] = Counter()
    daily = Counter()
    for event in events:
        pid = str(event.get("partner_id") or "")
        if pid:
            partner_counts[pid] += 1
        created = event.get("created_at")
        if created:
            try:
                day = datetime.fromisoformat(created.replace("Z", "+00:00")).date().isoformat()
                daily[day] += 1
            except ValueError:
                pass
    days = [(start.date() + timedelta(days=i)).isoformat() for i in range(91)]
    daily_values = [int(daily.get(day, 0)) for day in days]
    ranking = []
    for pid, count in partner_counts.most_common():
        partner = by_id.get(pid, {})
        ranking.append({
            "name": partner.get("name", "Partenaire"),
            "slug": partner.get("slug", ""),
            "events": count,
            "active": bool(partner.get("active", False)),
        })
    ranking.sort(key=lambda p: p["events"], reverse=True)
    return {
        "generated_at": now.isoformat(),
        "period_days": 90,
        "totals": {
            "partners": len(partners),
            "active_partners": sum(1 for p in partners if p.get("active")),
            "verified_partners": sum(1 for p in partners if p.get("badge_verified")),
            "tracked_events": len(events),
            "profile_views": event_counts.get("profile_view", 0),
            "shares": event_counts.get("share_click", 0),
            "website_clicks": event_counts.get("website_click", 0),
            "contact_clicks": event_counts.get("contact_click", 0),
            "leads": event_counts.get("lead", 0),
            "sales": event_counts.get("sale", 0),
        },
        "daily": [{"date": d, "events": int(daily.get(d, 0))} for d in days],
        "ranking": ranking[:20],
        "event_breakdown": dict(event_counts),
        "forecast": build_forecast(daily_values),
        "notes": [
            "Les statistiques comptent les événements effectivement enregistrés dans agency_partner_clicks.",
            "Les données antérieures à la mise en place du suivi ne sont pas reconstituées.",
            "Une visite ne correspond pas nécessairement à une personne unique."
        ],
    }
