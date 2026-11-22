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
  let activeUser=null, profile=null, loading=null, photoObjectUrl=null, pendingPhoto=null;
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
    const summaryPhoto=$('clientSummaryAvatarImg');
    const summaryFallback=$('clientSummaryAvatarFallback');
    if(!blob){
      photo.hidden=true;
      photo.removeAttribute('src');
      placeholder.hidden=false;
      if(summaryPhoto){summaryPhoto.hidden=true;summaryPhoto.removeAttribute('src');}
      if(summaryFallback)summaryFallback.hidden=false;
      return;
    }
    photoObjectUrl=URL.createObjectURL(blob);
    photo.src=photoObjectUrl;
    photo.hidden=false;
    placeholder.hidden=true;
    if(summaryPhoto){summaryPhoto.src=photoObjectUrl;summaryPhoto.hidden=false;}
    if(summaryFallback)summaryFallback.hidden=true;
  }
  function renderSummary(){
    if(!profile)return;
    const initials=String(profile.full_name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0].toLocaleUpperCase('fr')).join('')||'CL';
    placeholder.textContent=initials;
    const summaryFallback=$('clientSummaryAvatarFallback');
    if(summaryFallback)summaryFallback.textContent=initials;
    $('clientSummaryName').textContent=profile.full_name||'Mon profil';
    $('clientSummaryJob').textContent=profile.professional_title||'Profession à compléter';
    $('clientSummaryCompany').textContent=profile.company_name||'Entreprise à compléter';
    $('clientSummaryCountry').textContent=profile.country||'Niger';
    $('clientSummaryBio').textContent=profile.biography||'Ajoutez une présentation de votre expertise, vos services et votre expérience.';
  }
  function showSummary(note=''){
    renderSummary();
    $('clientProfileCancel').hidden=true;
    $('clientProfileSummary').hidden=false;
    $('clientProfileEditor').hidden=true;
    const messageEl=$('clientSummaryStatus');
    if(messageEl)messageEl.textContent=note;
    $('clientProfileSummary').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function showEditor(){
    $('clientProfileSummary').hidden=true;
    $('clientProfileEditor').hidden=false;
    $('clientProfileCancel').hidden=!(profile && (profile.full_name||profile.avatar_path));
    $('clientProfileSave').focus();
  }
  async function restoreSavedProfile(){
    if(!profile)return;
    pendingPhoto=null;
    $('clientAvatarFile').value='';
    fill(profile);
    $('clientAvatarSelection').textContent=profile.avatar_path?'Photo enregistrée':'Aucune photo enregistrée';
    try{await displayAvatar(profile.avatar_path);}
    catch(error){setImage(null);status('Impossible de réafficher la photo : '+message(error),true);}
  }
  $('clientProfileCancel')?.addEventListener('click',async()=>{
    if(!profile)return;
    $('clientProfileCancel').disabled=true;
    try{
      await restoreSavedProfile();
      showSummary('Modifications annulées : votre profil enregistré a été conservé.');
    }finally{$('clientProfileCancel').disabled=false;}
  });
  $('clientProfileEdit')?.addEventListener('click',showEditor);

  function storedFileUrl(path){
    return '/storage/v1/object/authenticated/agency-client-avatars/'+path.split('/').map(encodeURIComponent).join('/');
  }
  async function displayAvatar(path){
    if(!path){setImage(null);return;}
    const response=await fetch(BASE+storedFileUrl(path),{
      headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token()},cache:'no-store'
    });
    if(!response.ok)throw Error('La photo enregistrée ne peut pas être chargée ('+response.status+').');
    const blob=await response.blob();
    if(!blob.type.startsWith('image/'))throw Error('Le fichier enregistré n’est pas une image.');
    setImage(blob);
  }
  function fill(current){
    const initials=String(current.full_name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0].toLocaleUpperCase('fr')).join('')||'CL';
    placeholder.textContent=initials;
    $('clientSummaryAvatarFallback').textContent=initials;
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
    pendingPhoto=null;
    $('clientAvatarFile').value='';
    $('clientAvatarSelection').textContent='Aucune photo sélectionnée';
    $('clientProfileSummary').hidden=true;
    $('clientProfileEditor').hidden=false;
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
      let avatarError='';
      try{await displayAvatar(profile.avatar_path);}
      catch(error){setImage(null);avatarError=message(error);}
      $('clientAvatarSelection').textContent=profile.avatar_path?'Photo enregistrée':'Aucune photo enregistrée';
      status(avatarError?'Le profil a été chargé, mais '+avatarError:'Vous pouvez modifier vos informations à tout moment.',Boolean(avatarError));
      if(profile.full_name&&(profile.professional_title||profile.company_name||profile.biography||profile.avatar_path)){
        showSummary(avatarError?'Photo indisponible. Vous pouvez la remplacer en modifiant votre profil.':'Profil enregistré dans votre espace privé.');
      }else{
        $('clientProfileSummary').hidden=true;
        $('clientProfileEditor').hidden=false;
      }
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
    button.setAttribute('aria-busy','true');
    $('clientProfileSaveLabel').textContent='Enregistrement en cours…';
    $('clientProfileCancel').disabled=true;
    $('clientAvatarFile').disabled=true;
    status(pendingPhoto?'Enregistrement du profil et de la photo…':'Enregistrement de votre profil…');
    try{
      if(pendingPhoto){
        const typeMap={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
        const file=pendingPhoto;
        if(!typeMap[file.type]||file.size<1||file.size>2*1024*1024){
          throw Error('Photo invalide : choisissez un JPG, PNG ou WebP de 2 Mo maximum.');
        }
        const path=activeUser.id+'/avatar-'+Date.now()+'.'+typeMap[file.type];
        const response=await fetch(BASE+'/storage/v1/object/agency-client-avatars/'+path,{
          method:'POST',
          headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token(),'Content-Type':file.type,'x-upsert':'false'},
          body:file,cache:'no-store'
        });
        if(!response.ok){
          let failure={};
          try{failure=await response.json();}catch{}
          throw Error('La photo n’a pas été enregistrée : '+message(failure)+' ('+response.status+').');
        }
        updated.avatar_path=path;
      }
      const rows=await request(editUrl(activeUser.id),{
        method:'PATCH',body:JSON.stringify(updated),prefer:'return=representation'
      });
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Supabase n’a pas confirmé la sauvegarde du profil.');
      profile=rows[0];
      pendingPhoto=null;
      $('clientAvatarFile').value='';
      $('clientAvatarSelection').textContent=profile.avatar_path?'Photo enregistrée':'Aucune photo enregistrée';
      let avatarVisible=true;
      if(profile.avatar_path){
        try{await displayAvatar(profile.avatar_path);}
        catch(error){avatarVisible=false;setImage(null);}
      }
      status(avatarVisible?'Profil enregistré avec succès.':'Profil enregistré, mais la photo ne peut pas encore être affichée.',!avatarVisible);
      showSummary(avatarVisible?'Vos informations'+(profile.avatar_path?' et votre photo':'')+' ont été enregistrées dans votre espace privé.':'Profil enregistré. La photo n’a pas pu être rechargée ; utilisez Modifier mon profil pour la remplacer.');
    }catch(error){
      status(message(error),true);
      // Keep the selected file and its preview so the visitor can correct and retry.
    }finally{
      button.disabled=false;
      button.removeAttribute('aria-busy');
      $('clientProfileSaveLabel').textContent='Enregistrer et afficher mon profil';
      $('clientProfileCancel').disabled=false;
      $('clientAvatarFile').disabled=false;
    }
  });
  $('clientProfileBio').addEventListener('input',event=>{
    $('clientBioLength').textContent=event.currentTarget.value.length;
  });
  $('clientAvatarFile').addEventListener('change',event=>{
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;
    const types=['image/jpeg','image/png','image/webp'];
    if(!types.includes(file.type)||file.size>2*1024*1024||file.size<1){
      input.value='';
      return status('Choisissez une photo JPG, PNG ou WebP de 2 Mo maximum.',true);
    }
    if(!profile||!activeUser||!token()){
      input.value='';
      return status('Connectez-vous avant de choisir une photo.',true);
    }
    pendingPhoto=file;
    setImage(file);
    $('clientAvatarSelection').textContent='Aperçu : '+file.name+' — photo non encore enregistrée';
    status('Aperçu prêt. Appuyez sur « Enregistrer et afficher mon profil » pour sauvegarder la photo.');
  });
  window.addEventListener('bsa:client-authenticated',()=>{load();});
  window.addEventListener('bsa:client-logout',logoutProfile);
  window.addEventListener('pagehide',()=>{if(photoObjectUrl)URL.revokeObjectURL(photoObjectUrl);});
  // Also initialize an existing session when reloading the page.
  if(token())load();
})();
