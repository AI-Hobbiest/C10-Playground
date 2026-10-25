/* Local profile, test history, and portable JSON backup/restore. */
(() => {
  "use strict";
  const SUBJECTS = {
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

  function saveProfile(event){
    event.preventDefault();
    const proposed=readForm();
    if(!window.C10ProfileModel.validateProfile(proposed)){
      setStatus("Please complete the nickname, school, class, city and Indian state/Union Territory fields.",true);
      const firstInvalid=["displayName","school","classLevel","city","state"].find(id=>!$(id).value.trim());
      if(firstInvalid)$(firstInvalid).focus();
      else if(!window.C10ProfileModel.statesAndUTs.some(item=>item.name===$("state").value))$("state").focus();
      return;
    }
    profile=proposed;
    profileStore.save(profile);
    renderForm();
    setStatus("Profile saved on this device. Your Student ID is "+profile.studentId+".");
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
    return {
      schemaVersion:1,kind:"c10-playground-backup",
      exportedAt:now(),
      profile:clone(profile),
      subjectData
    };
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

  function init(){
    populateStates();renderForm();renderHistory();
    $("profileForm").addEventListener("submit",saveProfile);
    $("exportBtn").addEventListener("click",downloadBackup);
    $("importBtn").addEventListener("click",()=>$("backupFile").click());
    $("backupFile").addEventListener("change",importBackup);
  }
  init();
})();
