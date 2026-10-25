/* Local profile, test history, and portable JSON backup/restore. */
(() => {
  "use strict";
  const SUBJECTS = {
    science:"Science",
    mathematics:"Mathematics",
    english:"English",
    "social-science":"Social Science",
    hindi:"Hindi"
  };
  const $ = id => document.getElementById(id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  const profileStore = window.C10Storage.createLocalStore({
    kind:"local-profile-identity",
    recordId:"default",
    defaults:()=>({profileId:""}),
    validate:value=>!!value&&typeof value.profileId==="string"
  });
  const prior = profileStore.load();
  const profileId = prior.profileId || window.C10Storage.createId();
  let profile = window.C10ProfileModel.normalizeProfile(prior,profileId);
  let remoteUser=null,remoteAttempts=[],localAccount=window.C10StudentAuth&&window.C10StudentAuth.currentUser?window.C10StudentAuth.currentUser():null;
  if(!window.C10ProfileModel.validateProfile(profile)){
    profileStore.save(profile);
  }

  function subjectStore(kind,subject){
    if(kind==="subject-progress"){
      return window.C10Storage.createLocalStore({
        kind,recordId:subject,legacyKey:"c10playground_v1_"+subject,
        defaults:()=>({missed:[],answered:0,correct:0,attempts:[]}),
        validate:value=>!!value&&Array.isArray(value.missed)&&Number.isFinite(value.answered)&&
          Number.isFinite(value.correct)&&Array.isArray(value.attempts)
      });
    }
    return window.C10Storage.createLocalStore({
      kind,recordId:subject,
      defaults:()=>({attempts:[],activeAttempt:null,answerRecords:[]}),
      validate:value=>!!value&&Array.isArray(value.attempts)&&Array.isArray(value.answerRecords)&&
        (value.activeAttempt===null||typeof value.activeAttempt==="object")
    });
  }

  function setStatus(message,isError=false){
    $("pageStatus").textContent=message;
    $("pageStatus").style.color=isError?"#a33333":"";
  }

  function populateStates(){
    const select=$("state");
    window.C10ProfileModel.statesAndUTs.forEach(item=>{
      const option=document.createElement("option");
      option.value=item.name;option.textContent=item.name;
      select.appendChild(option);
    });
  }

  async function populateClasses(){
    const select=$("classLevel");
    if(typeof fetch!=="function")return;
    const selected=String(profile.classLevel||select.value||"10");
    try{
      const response=await fetch("./data/classes.json",{cache:"no-store"});
      if(!response.ok)throw new Error("Class catalogue unavailable.");
      const data=await response.json();
      if(!data||data.kind!=="class-catalog"||!Array.isArray(data.classes))throw new Error("Class catalogue is invalid.");
      select.innerHTML="";
      data.classes.filter(item=>item.active!==false).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)).forEach(item=>{
        const option=document.createElement("option");
        option.value=String(item.classId);option.textContent=String(item.label||("Class "+item.classId));
        select.appendChild(option);
      });
      if(!data.classes.some(item=>String(item.classId)===selected&&item.active!==false)){
        const legacy=document.createElement("option");
        legacy.value=selected;legacy.textContent="Class "+selected+" (not currently listed)";
        select.appendChild(legacy);
      }
      select.value=selected;
    }catch(error){
      setStatus("Class catalogue could not be loaded. The existing class selection is retained.",true);
    }
  }

  function renderForm(){
    $("studentId").value=profile.studentId;
    $("displayName").value=profile.displayName;
    $("school").value=profile.school;
    $("classLevel").value=profile.classLevel;
    $("city").value=profile.city;
    $("state").value=profile.state;
  }

  function readForm(){
    const value={
      ...profile,
      displayName:$("displayName").value.trim(),
      school:$("school").value.trim(),
      classLevel:$("classLevel").value,
      city:$("city").value.trim(),
      state:$("state").value,
      updatedAt:now()
    };
    return value;
  }

  async function saveProfile(event){
    event.preventDefault();
    const proposed=readForm();
    if(!window.C10ProfileModel.validateProfile(proposed)){
      setStatus("Please complete the nickname, school, class, city and Indian state/Union Territory fields.",true);
      const firstInvalid=["displayName","school","classLevel","city","state"].find(id=>!$(id).value.trim());
      if(firstInvalid)$(firstInvalid).focus();
      else if(!window.C10ProfileModel.statesAndUTs.some(item=>item.name===$("state").value))$("state").focus();
      return;
    }
    profile=proposed;profileStore.save(profile);renderForm();
    if(window.C10Api&&window.C10Api.isAuthenticated()&&remoteUser&&remoteUser.role==="student"){
      try{
        const result=await window.C10Api.updateStudentProfile({displayName:profile.displayName,school:profile.school,classId:profile.classLevel,city:profile.city,state:profile.state});
        profile=window.C10ProfileModel.normalizeProfile(result.profile,result.profile.profileId);profileStore.save(profile);renderForm();
        setStatus("Profile saved locally and synced to your student account.");
      }catch(error){setStatus("Profile saved on this device, but central sync failed: "+error.message,true);}
    }else if(localAccount)setStatus("Profile saved on this device. Student account sign-in does not sync data yet; export a JSON backup before changing devices.");
    else setStatus("Profile saved on this device. Progress and history remain local; export a JSON backup before changing devices.");
    renderHistory();
  }

  function readLedgers(){
    const rows=[];
    for(const [subject,title] of Object.entries(SUBJECTS)){
      const ledger=subjectStore("test-attempt-ledger",subject).load();
      for(const attempt of ledger.attempts||[]){
        if(attempt.profileId && attempt.profileId!==profile.profileId)continue;
        rows.push({...attempt,subjectId:attempt.subjectId||subject,subjectTitle:title});
      }
    }
    const seen=new Set(rows.map(row=>String(row.attemptId||"")));
    for(const attempt of remoteAttempts){
      if(seen.has(String(attempt.attemptId)))continue;
      const title=SUBJECTS[attempt.subjectId]||attempt.subjectId||"Practice";
      rows.push({...attempt,subjectId:attempt.subjectId,subjectTitle:title,correctCount:attempt.score,questionCount:attempt.maxScore});
      seen.add(String(attempt.attemptId));
    }
    return rows.sort((a,b)=>String(b.submittedAt||b.startedAt).localeCompare(String(a.submittedAt||a.startedAt)));
  }

  function formatDuration(seconds){
    const total=Math.max(0,Math.floor(Number(seconds)||0));
    const hours=Math.floor(total/3600),minutes=Math.floor((total%3600)/60),remaining=total%60;
    return hours>0?[hours,minutes,remaining].map(n=>String(n).padStart(2,"0")).join(":"):
      [minutes,remaining].map(n=>String(n).padStart(2,"0")).join(":");
  }
  function formatDate(value){
    if(!value)return "Date unavailable";
    const date=new Date(value);
    return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
  }
  function modeLabel(attempt){
    return ({
      "learn":"Learn",
      "test":"Test",
      "practice":"Retry missed",
      "mixed-practice":"Mixed practice",
      "timed-exam":"Timed exam",
      "pdf-practice":"PDF practice",
      "pdf-exam":"PDF exam"
    })[attempt.mode]||String(attempt.mode||"Practice");
  }
  function renderHistory(){
    const rows=readLedgers();
    $("attemptCount").textContent=String(rows.length);
    const percentages=rows.filter(row=>Number(row.maxScore)>0&&Number.isFinite(Number(row.score)))
      .map(row=>Number(row.score)/Number(row.maxScore)*100);
    $("averageScore").textContent=percentages.length?Math.round(percentages.reduce((a,b)=>a+b,0)/percentages.length)+"%":"—";
    $("totalTime").textContent=formatDuration(rows.reduce((total,row)=>total+Math.max(0,Number(row.durationSeconds)||0),0));
    const container=$("historyList");container.innerHTML="";
    if(!rows.length){
      const empty=document.createElement("p");empty.className="status";
      empty.textContent="No completed tests found for this profile yet. Finish a practice session and it will appear here.";
      container.appendChild(empty);return;
    }
    rows.slice(0,50).forEach(attempt=>{
      const row=document.createElement("article");row.className="history-row";
      const detail=document.createElement("div");
      const title=document.createElement("div");title.className="history-title";
      title.textContent=attempt.subjectTitle+" · "+modeLabel(attempt);
      const meta=document.createElement("div");meta.className="history-meta";
      meta.textContent=formatDate(attempt.submittedAt||attempt.startedAt)+" · "+formatDuration(attempt.durationSeconds)+" · "+
        (attempt.status==="timed-out"?"Timed out":attempt.status==="submitted"?"Submitted":String(attempt.status||"Completed"));
      detail.append(title,meta);
      const score=document.createElement("div");score.className="history-score";
      const strong=document.createElement("strong");
      strong.textContent=Number.isFinite(Number(attempt.score))&&Number(attempt.maxScore)>0?
        Number(attempt.score)+" / "+Number(attempt.maxScore):"—";
      const pct=document.createElement("div");pct.className="history-meta";
      pct.textContent=Number(attempt.maxScore)>0&&Number.isFinite(Number(attempt.score))?
        Math.round(Number(attempt.score)/Number(attempt.maxScore)*100)+"%":"No score";
      score.append(strong,pct);row.append(detail,score);container.appendChild(row);
    });
  }

  function makeBackup(){
    const subjectData={};
    for(const subject of Object.keys(SUBJECTS)){
      subjectData[subject]={
        progress:subjectStore("subject-progress",subject).load(),
        ledger:subjectStore("test-attempt-ledger",subject).load()
      };
    }
    for(const attempt of remoteAttempts){
      const ledger=subjectData[attempt.subjectId]&&subjectData[attempt.subjectId].ledger;
      if(!ledger||ledger.attempts.some(item=>String(item.attemptId)===String(attempt.attemptId)))continue;
      ledger.attempts.push({
        schemaVersion:1,kind:"test-attempt",attemptId:attempt.attemptId,profileId:profile.profileId,
        subjectId:attempt.subjectId,mode:attempt.mode,source:{type:"central-sync",sourceId:attempt.subjectId},
        questionBankVersion:"central-v1",status:attempt.status,startedAt:attempt.startedAt,
        submittedAt:attempt.submittedAt,durationSeconds:attempt.durationSeconds,timeLimitSeconds:null,
        score:attempt.score,maxScore:attempt.maxScore,correctCount:attempt.score,questionCount:attempt.maxScore,
        answeredCount:0,skippedCount:0,unansweredCount:0,questionIds:attempt.payload&&attempt.payload.questionIds||[],answerRecordIds:[]
      });
    }
    for(const subject of Object.keys(SUBJECTS))subjectData[subject].ledger.attempts.sort((a,b)=>String(b.submittedAt||"").localeCompare(String(a.submittedAt||"")));
    return {schemaVersion:1,kind:"c10-playground-backup",exportedAt:now(),profile:clone(profile),subjectData};
  }

  function downloadBackup(){
    const backup=makeBackup();
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download="c10-playground-backup-"+new Date().toISOString().slice(0,10)+".json";
    link.style.display="none";
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setStatus("JSON backup prepared. Keep the downloaded file private; it contains profile and test-history data.");
  }

  async function importBackup(event){
    const file=event.target.files&&event.target.files[0];
    event.target.value="";
    if(!file)return;
    try{
      const text=await file.text();
      let bundle;
      try{bundle=JSON.parse(text);}catch(_){throw new Error("The selected file is not valid JSON.");}
      if(!window.C10ProfileModel.isValidBackup(bundle)){
        throw new Error("This file is not a supported C10 Playground version 1 backup, or its profile/history structure is invalid.");
      }
      const missingSubjects=Object.keys(SUBJECTS).filter(subject=>!bundle.subjectData[subject]);
      if(missingSubjects.length)throw new Error("The backup is missing subject records: "+missingSubjects.join(", ")+".");
      if(!confirm("Import this backup and replace the profile and local progress/history for all supported subjects on this device? Export your current data first if you need to keep it."))return;

      profile=window.C10ProfileModel.normalizeProfile(bundle.profile,bundle.profile.profileId);
      if(!window.C10ProfileModel.validateProfile(profile))throw new Error("The profile fields in this backup are incomplete.");
      profileStore.save(profile);
      for(const subject of Object.keys(SUBJECTS)){
        const data=bundle.subjectData[subject];
        if(!data.progress||!data.ledger)throw new Error("Missing progress or history for "+SUBJECTS[subject]+".");
        subjectStore("subject-progress",subject).save(data.progress);
        subjectStore("test-attempt-ledger",subject).save(data.ledger);
      }
      renderForm();renderHistory();
      setStatus("Backup imported successfully. This device now uses Student ID "+profile.studentId+".");
    }catch(error){
      setStatus(error&&error.message?error.message:"Unable to import this backup.",true);
    }
  }

  function accountStatus(message,isError=false){
    const el=$("studentAccountStatus");if(!el)return;
    el.textContent=message;el.className="notice"+(isError?" admin-status error":"");
  }
  function updateAccountUI(){
    const configured=!!(window.C10Api&&window.C10Api.isConfigured());
    const signedInRemote=!!remoteUser&&remoteUser.role==="student";
    const signedIn=signedInRemote||!!localAccount;
    $("studentLoginBtn").disabled=!(configured||!!window.C10StudentAuth);
    $("studentLoginPassword").disabled=!(configured||!!window.C10StudentAuth);
    $("studentLoginUsername").disabled=!(configured||!!window.C10StudentAuth);
    $("studentLogoutBtn").hidden=!signedIn;
    $("studentLoginForm").hidden=signedIn;
    $("studentChangePasswordForm").hidden=!(signedInRemote&&remoteUser.mustChangePassword);
    if(configured){
      if(!signedIn)accountStatus("Sign in with the username and password provided by the administrator.");
      else if(signedInRemote&&remoteUser.mustChangePassword)accountStatus("Signed in as "+remoteUser.username+". Change the temporary password before syncing progress.");
      else if(signedInRemote)accountStatus("Signed in as "+remoteUser.username+". Profile and completed tests sync with this account.");
    }else if(localAccount){
      accountStatus("Signed in as "+localAccount.username+" on this browser. This simple account file does not sync history or protect quiz content; ask the admin to reset your password if needed.");
    }else if(window.C10StudentAuth){
      accountStatus("Sign in with your assigned username and password. Progress stays in this browser; the account file is a simple starter, not secure access control.");
    }else accountStatus("Student account file unavailable. Local practice and JSON backups still work.");
  }
  function applyRemoteProfile(remoteProfile){
    profile=window.C10ProfileModel.normalizeProfile(remoteProfile,remoteProfile.profileId);
    profileStore.save(profile);renderForm();
  }
  async function refreshRemoteAttempts(){
    if(!remoteUser||remoteUser.role!=="student"||remoteUser.mustChangePassword)return;
    try{
      const result=await window.C10Api.getStudentAttempts();remoteAttempts=result.attempts||[];renderHistory();
    }catch(error){accountStatus("Signed in, but cloud history could not be loaded: "+error.message,true);}
  }
  async function studentLogin(event){
    event.preventDefault();
    const username=$("studentLoginUsername").value.trim().toLowerCase(),password=$("studentLoginPassword").value;
    try{
      if(window.C10Api&&window.C10Api.isConfigured()){
        const result=await window.C10Api.loginStudent(username,password);
        remoteUser=result.user;remoteUser.mustChangePassword=!!result.user.mustChangePassword;
        applyRemoteProfile(result.profile);
        $("currentStudentPassword").value=password;$("studentLoginPassword").value="";
        updateAccountUI();
        if(remoteUser.mustChangePassword)accountStatus("Welcome, "+remoteUser.username+". Please change the temporary password now.");
        else{accountStatus("Signed in successfully. Loading your central progress…");await refreshRemoteAttempts();accountStatus("Signed in as "+remoteUser.username+". Your account and completed tests are connected.");}
        renderHistory();
        return;
      }
      if(!window.C10StudentAuth)throw new Error("Student account file is unavailable. Local practice and backups still work.");
      const result=await window.C10StudentAuth.login(username,password);
      localAccount=result.account;
      $("studentLoginPassword").value="";
      updateAccountUI();
      renderHistory();
    }catch(error){accountStatus(error.message||"Student sign-in failed.",true);}
  }
  async function restoreStudentSession(){
    if(window.C10Api&&window.C10Api.isConfigured()&&window.C10Api.isAuthenticated()){
      try{
        const result=await window.C10Api.currentUser();
        if(!result||!result.user||result.user.role!=="student"){updateAccountUI();return;}
        remoteUser=result.user;
        if(result.profile)applyRemoteProfile(result.profile);
        updateAccountUI();
        if(!remoteUser.mustChangePassword)await refreshRemoteAttempts();
        else accountStatus("Your temporary password must be changed before you can sync progress.");
      }catch(error){updateAccountUI();accountStatus("Account session expired or unavailable. Sign in again to sync.",true);}
      return;
    }
    if(window.C10StudentAuth){
      try{localAccount=await window.C10StudentAuth.restoreSession();}
      catch(_){localAccount=null;}
    }
    updateAccountUI();
  }
  async function studentLogout(){
    if(remoteUser&&window.C10Api){try{await window.C10Api.logout();}catch(_){}}
    if(window.C10StudentAuth)window.C10StudentAuth.logout();
    remoteUser=null;remoteAttempts=[];localAccount=null;
    $("studentLoginPassword").value="";
    $("currentStudentPassword").value="";$("newStudentPassword").value="";$("confirmStudentPassword").value="";
    updateAccountUI();accountStatus("Signed out. Local progress remains on this device.");renderHistory();
  }
  async function changeStudentPassword(event){
    event.preventDefault();
    const current=$("currentStudentPassword").value,newPass=$("newStudentPassword").value,confirmPass=$("confirmStudentPassword").value;
    if(newPass!==confirmPass){accountStatus("New password and confirmation do not match.",true);return;}
    if(newPass.length<12||!/[A-Za-z]/.test(newPass)||!/[0-9]/.test(newPass)){accountStatus("Use at least 12 characters including letters and numbers.",true);return;}
    try{
      await window.C10Api.changeStudentPassword(current,newPass);
      $("currentStudentPassword").value="";$("newStudentPassword").value="";$("confirmStudentPassword").value="";
      const result=await window.C10Api.currentUser();remoteUser=result.user;updateAccountUI();
      accountStatus("Password changed. Your account is ready to sync across devices.");
      await refreshRemoteAttempts();
    }catch(error){accountStatus(error.message||"Unable to change password.",true);}
  }

  function init(){
    populateStates();renderForm();populateClasses();renderHistory();
    $("profileForm").addEventListener("submit",saveProfile);
    $("studentLoginForm").addEventListener("submit",studentLogin);
    $("studentLogoutBtn").addEventListener("click",studentLogout);
    $("studentChangePasswordForm").addEventListener("submit",changeStudentPassword);
    updateAccountUI();restoreStudentSession();
    $("exportBtn").addEventListener("click",downloadBackup);
    $("importBtn").addEventListener("click",()=>$("backupFile").click());
    $("backupFile").addEventListener("change",importBackup);
  }
  init();
})();
