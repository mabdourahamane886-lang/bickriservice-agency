(() => {
  'use strict';
  // Supabase Auth (publishable key), protected by RLS. Never store server secrets here.
  const BASE='https://okdohokhlkxrmxpevees.supabase.co';
  const PUBLIC_KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
  const $=id=>document.getElementById(id);
  const section=$('clientProfileSection');
  if(!section)return;
  const form=$('clientProfileForm');
  const photo=$('clientAvatarPreview');
  const placeholder=$('clientAvatarPlaceholder');
  let activeUser=null, profile=null, loading=null, photoObjectUrl=null;
  const token=()=>sessionStorage.getItem('bsa_client_token')||'';
  function message(value){
    if(typeof value==='string')return value;
    if(value && typeof value==='object'){
      const inner=value.message||value.error_description||value.msg||value.error;
      if(typeof inner==='string')return inner;
      if(inner && typeof inner.message==='string')return inner.message;
    }
    return 'Une erreur est survenue. Réessayez.';
  }
  function status(value,isError=false){
    const el=$('clientProfileStatus');
    if(el){el.textContent=message(value);el.dataset.error=isError?'true':'false';}
  }
  async function request(path,{method='GET',body,contentType='application/json',prefer}={}){
    const jwt=token();
    if(!jwt)throw Object.assign(Error('Connectez-vous pour accéder à votre profil.'),{httpStatus:401});
    const headers={apikey:PUBLIC_KEY,Authorization:'Bearer '+jwt};
    if(contentType)headers['Content-Type']=contentType;
    if(prefer)headers.Prefer=prefer;
    const response=await fetch(BASE+path,{method,headers,body,cache:'no-store'});
    const text=await response.text();
    let parsed={};
    if(text){try{parsed=JSON.parse(text);}catch{parsed={message:text.slice(0,220)};}}
    if(!response.ok)throw Object.assign(Error(message(parsed)),{httpStatus:response.status});
    return parsed;
  }
  const query=uid=>'/rest/v1/agency_client_profiles?user_id=eq.'+encodeURIComponent(uid)+'&select=user_id,full_name,professional_title,company_name,country,biography,avatar_path&limit=1';
  const editUrl=uid=>'/rest/v1/agency_client_profiles?user_id=eq.'+encodeURIComponent(uid);
  async function getOrCreateProfile(user){
    let rows=await request(query(user.id));
    if(Array.isArray(rows)&&rows[0])return rows[0];
    const newRecord={
      user_id:user.id,
      full_name:String(user.user_metadata?.full_name||'').trim().slice(0,120),
      professional_title:'',
      company_name:'',
      country:'Niger',
      biography:''
    };
    try{
      rows=await request('/rest/v1/agency_client_profiles',{method:'POST',body:JSON.stringify(newRecord),prefer:'return=representation'});
    }catch(error){
      if(error.httpStatus!==409)throw error; // A simultaneous tab may already have created it.
      rows=await request(query(user.id));
    }
    if(!Array.isArray(rows)||!rows[0])throw Error('Le profil n’a pas pu être initialisé.');
    return rows[0];
  }
  function setImage(blob){
    if(photoObjectUrl){URL.revokeObjectURL(photoObjectUrl);photoObjectUrl=null;}
    if(!blob){
      photo.hidden=true;
      photo.removeAttribute('src');
      placeholder.hidden=false;
      return;
    }
    photoObjectUrl=URL.createObjectURL(blob);
    photo.src=photoObjectUrl;
    photo.hidden=false;
    placeholder.hidden=true;
  }
  function storedFileUrl(path){
    return '/storage/v1/object/authenticated/agency-client-avatars/'+path.split('/').map(encodeURIComponent).join('/');
  }
  async function displayAvatar(path){
    if(!path){setImage(null);return;}
    const response=await fetch(BASE+storedFileUrl(path),{
      headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token()},cache:'no-store'
    });
    if(!response.ok){setImage(null);return;}
    const blob=await response.blob();
    if(!blob.type.startsWith('image/')){setImage(null);return;}
    setImage(blob);
  }
  function fill(current){
    $('clientProfileName').value=current.full_name||'';
    $('clientProfileTitleJob').value=current.professional_title||'';
    $('clientProfileCompany').value=current.company_name||'';
    $('clientProfileCountry').value=current.country||'Niger';
    $('clientProfileBio').value=current.biography||'';
    $('clientBioLength').textContent=$('clientProfileBio').value.length;
  }
  function logoutProfile(){
    activeUser=null;
    profile=null;
    section.hidden=true;
    form.reset();
    setImage(null);
    status('');
  }
  async function load(){
    if(loading)return loading;
    if(!token()){logoutProfile();return;}
    loading=(async()=>{
      const user=await request('/auth/v1/user');
      if(!user.id)throw Error('La session doit être renouvelée.');
      activeUser=user;
      profile=await getOrCreateProfile(user);
      section.hidden=false;
      fill(profile);
      await displayAvatar(profile.avatar_path).catch(()=>setImage(null));
      status('Votre profil est privé. Vous pouvez le modifier à tout moment.');
    })().catch(error=>{
      if(error.httpStatus===401){
        logoutProfile();
        window.dispatchEvent(new Event('bsa:client-session-expired'));
      }else{
        section.hidden=false;
        status('Impossible de charger le profil : '+message(error),true);
      }
    }).finally(()=>{loading=null;});
    return loading;
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!activeUser||!profile||!token())return status('Connectez-vous pour enregistrer votre profil.',true);
    const button=$('clientProfileSave');
    const updated={
      full_name:$('clientProfileName').value.trim().slice(0,120),
      professional_title:$('clientProfileTitleJob').value.trim().slice(0,140),
      company_name:$('clientProfileCompany').value.trim().slice(0,160),
      country:$('clientProfileCountry').value.trim().slice(0,100)||'Niger',
      biography:$('clientProfileBio').value.trim().slice(0,1200),
      updated_at:new Date().toISOString()
    };
    if(!updated.full_name)return status('Veuillez saisir votre nom.',true);
    button.disabled=true;
    status('Enregistrement du profil…');
    try{
      const rows=await request(editUrl(activeUser.id),{
        method:'PATCH',body:JSON.stringify(updated),prefer:'return=representation'
      });
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Le profil n’a pas été modifié. Réessayez.');
      profile=rows[0];
      status('Votre profil professionnel a été enregistré.');
    }catch(error){status(message(error),true);}
    finally{button.disabled=false;}
  });
  $('clientProfileBio').addEventListener('input',event=>{
    $('clientBioLength').textContent=event.currentTarget.value.length;
  });
  $('clientAvatarFile').addEventListener('change',async event=>{
    const input=event.currentTarget,file=input.files?.[0];
    if(!file)return;
    const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    if(!types[file.type]||file.size>2*1024*1024||file.size<1){
      input.value='';
      return status('Choisissez une image JPG, PNG ou WebP de 2 Mo maximum.',true);
    }
    if(!profile||!activeUser||!token()){input.value='';return status('Connectez-vous avant d’ajouter une photo.',true);}
    input.disabled=true;
    status('Téléversement de votre photo…');
    const path=activeUser.id+'/avatar-'+Date.now()+'.'+types[file.type];
    try{
      const jwt=token();
      const uploaded=await fetch(BASE+'/storage/v1/object/agency-client-avatars/'+path,{
        method:'POST',
        headers:{
          apikey:PUBLIC_KEY,Authorization:'Bearer '+jwt,'Content-Type':file.type,'x-upsert':'false'
        },
        body:file,cache:'no-store'
      });
      if(!uploaded.ok){
        let info={};try{info=await uploaded.json();}catch{}
        throw Error(message(info));
      }
      const rows=await request(editUrl(activeUser.id),{
        method:'PATCH',
        body:JSON.stringify({avatar_path:path,updated_at:new Date().toISOString()}),
        prefer:'return=representation'
      });
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Photo envoyée, mais le profil n’a pas pu être mis à jour.');
      profile={...profile,avatar_path:path};
      await displayAvatar(path);
      status('Photo de profil enregistrée. Elle reste privée.');
    }catch(error){status('Impossible d’enregistrer la photo : '+message(error),true);}
    finally{input.disabled=false;input.value='';}
  });
  window.addEventListener('bsa:client-authenticated',()=>{load();});
  window.addEventListener('bsa:client-logout',logoutProfile);
  window.addEventListener('pagehide',()=>{if(photoObjectUrl)URL.revokeObjectURL(photoObjectUrl);});
  // Also initialize an existing session when reloading the page.
  if(token())load();
})();
