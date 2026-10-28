/* Renders levels, XP, streaks, badges and learning graphs from local test history. */
(() => {
  "use strict";
  const SUBJECTS={
    science:"Science",mathematics:"Mathematics",english:"English","social-science":"Social Science",hindi:"Hindi"
  };
  const $=id=>document.getElementById(id);
  const profileStore=window.C10Storage.createLocalStore({
    kind:"local-profile-identity",recordId:"default",defaults:()=>({profileId:""}),
    validate:value=>!!value&&typeof value.profileId==="string"
  });
  const profile=window.C10ProfileModel.normalizeProfile(profileStore.load(),"");
  function loadLedger(subject){
    return window.C10Storage.createLocalStore({
      kind:"test-attempt-ledger",recordId:subject,
      defaults:()=>({attempts:[],activeAttempt:null,answerRecords:[]}),
      validate:value=>!!value&&Array.isArray(value.attempts)&&Array.isArray(value.answerRecords)&&
        (value.activeAttempt===null||typeof value.activeAttempt==="object")
    }).load();
  }
  function getAttempts(){
    const result=[];
    for(const [subject,subjectTitle] of Object.entries(SUBJECTS)){
      const ledger=loadLedger(subject);
      for(const attempt of ledger.attempts||[]){
        if(attempt.profileId&&profile.profileId&&attempt.profileId!==profile.profileId)continue;
        result.push({...attempt,subjectId:attempt.subjectId||subject,subjectTitle});
      }
    }
    return result.sort((a,b)=>String(a.submittedAt||a.startedAt).localeCompare(String(b.submittedAt||b.startedAt)));
  }
  function el(tag,className,text){
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=String(text);
    return element;
  }
  function showEmpty(container,message){
    container.innerHTML="";
    const empty=el("div","empty-chart",message);
    container.appendChild(empty);
  }
  function renderTrend(items){
    const container=$("scoreTrendChart");container.innerHTML="";
    if(!items.length){showEmpty(container,"Complete a test to start your score graph.");return;}
    items.forEach((item,index)=>{
      const column=el("div","trend-item");
      column.setAttribute("title",item.label+" · "+item.accuracy+"% · "+item.score+"/"+item.maxScore);
      const value=el("div","trend-value",item.accuracy+"%");
      const track=el("div","trend-track");
      const bar=el("div","trend-bar");
      bar.style.height=Math.max(3,112*item.accuracy/100)+"px";
      bar.setAttribute("aria-hidden","true");track.appendChild(bar);
      const label=el("div","trend-label",item.shortLabel+" "+(index+1));
      column.append(value,track,label);container.appendChild(column);
    });
  }
  function renderSubjects(items){
    const container=$("subjectAccuracyChart");container.innerHTML="";
    if(!items.length){showEmpty(container,"Subject results will appear here after practice.");return;}
    items.forEach(subject=>{
      const row=el("div","subject-bar-row");
      const label=el("div","subject-bar-label",subject.emoji+" "+subject.title);
      const track=el("div","subject-track");
      const fill=el("div","subject-fill");
      fill.style.width=subject.accuracy+"%";
      track.appendChild(fill);
      const value=el("div","subject-percent",subject.accuracy+"%");
      row.append(label,track,value);container.appendChild(row);
    });
  }
  function renderWeek(days){
    const container=$("weeklyActivityChart");container.innerHTML="";
    const maximum=Math.max(1,...days.map(day=>day.count));
    days.forEach(day=>{
      const column=el("div","week-day");
      column.setAttribute("title",day.date+" · "+day.count+" completed tests");
      const count=el("div","week-count",day.count);
      const track=el("div","week-track");
      const bar=el("div","week-fill");
      bar.style.height=day.count?Math.max(5,82*day.count/maximum)+"px":"0px";
      track.appendChild(bar);
      column.append(count,track,el("div","week-label",day.label));container.appendChild(column);
    });
  }
  function renderBadges(badges,earned){
    const container=$("badgeGrid");container.innerHTML="";
    $("badgeCountLabel").textContent=earned+" unlocked";
    badges.forEach(badge=>{
      const card=el("article","achievement "+(badge.earned?"earned":"locked"));
      card.setAttribute("aria-label",badge.title+(badge.earned?" earned":" locked"));
      card.append(
        el("div","achievement-emoji",badge.emoji),
        el("strong","",badge.title),
        el("span","",badge.description),
        el("span","",badge.earned?"✓ Unlocked":"🔒 Not yet")
      );
      container.appendChild(card);
    });
  }
  async function renderSubjectLaunches(){
    const container=$("subjectLaunchCards");
    if(!container)return;
    const cards=Array.from(container.querySelectorAll("[data-subject-id]"));
    let student=null;
    try{student=window.C10StudentAuth&&window.C10StudentAuth.currentUser?window.C10StudentAuth.currentUser():null;}catch(_){}
    if(!student){
      try{student=JSON.parse(sessionStorage.getItem("c10playground_static_student_v1")||"null");}catch(_){}
    }
    const classId=String(student&&student.classId||"10");
    try{
      const response=await fetch("./data/classes.json",{cache:"no-store"});
      if(!response.ok)throw new Error("Class catalogue unavailable");
      const catalog=await response.json();
      const record=(catalog.classes||[]).find(item=>String(item.classId)===classId&&item.active!==false);
      const subjects=record&&Array.isArray(record.subjects)?record.subjects:[];
      await Promise.all(cards.map(async card=>{
        const subject=card.dataset.subjectId;
        const allowed=subjects.includes(subject);
        card.hidden=!allowed;
        card.style.display=allowed?"":"none";
        if(!allowed)return;
        const bankId=classId==="10"?subject:"class-"+classId+"-"+subject;
        const meta=card.querySelector("[data-bank-meta]");
        try{
          const bankResponse=await fetch("./data/"+bankId+".json",{cache:"no-store"});
          if(!bankResponse.ok)throw new Error("Bank not published");
          const bank=await bankResponse.json();
          const total=(bank||[]).reduce((sum,chapter)=>sum+(Array.isArray(chapter.questions)?chapter.questions.length:0),0);
          if(meta)meta.textContent=total.toLocaleString()+" MCQs · "+bank.length+" chapter sets";
        }catch(_){card.hidden=true;card.style.display="none";}
      }));
      let note=$("subjectLaunchStatus");
      if(!note){note=document.createElement("p");note.id="subjectLaunchStatus";note.className="dash-help";container.insertAdjacentElement("afterend",note);}
      const visible=cards.some(card=>!card.hidden);
      note.textContent=visible?"":"No practice banks are published for this class yet.";
      note.hidden=visible;
    }catch(_){
      cards.forEach(card=>{card.hidden=true;card.style.display="none";});
      let note=$("subjectLaunchStatus");
      if(!note){note=document.createElement("p");note.id="subjectLaunchStatus";note.className="dash-help";container.insertAdjacentElement("afterend",note);}
      note.textContent="Practice subjects could not be loaded. Please refresh the page.";
      note.hidden=false;
    }
  }
  function render(){
    const attempts=getAttempts();
    const summary=window.C10Gamification.calculate(attempts);
    const level=summary.level;
    $("dashboardTitle").textContent=profile.displayName?"Keep going, "+profile.displayName+"!":"Ready to level up?";
    $("dashboardIntro").textContent=summary.attempts
      ? "You're building your skills one session at a time. Keep practising to unlock the next level."
      : "Every question you tackle helps build your skills. Finish a test to earn your first XP and unlock achievements.";
    $("levelNumber").textContent=level.level;
    $("levelTitle").textContent=level.emoji+" "+level.title;
    $("xpTotalLabel").textContent=summary.xp+" XP earned";
    $("dashXpStat").textContent=summary.xp.toLocaleString();
    $("dashTestsStat").textContent=summary.attempts;
    $("dashStreakStat").textContent=summary.streak.current+" day"+(summary.streak.current===1?"":"s");
    $("dashBadgesStat").textContent=summary.earnedBadges+" / "+summary.badges.length;
    const bar=$("levelProgressFill");
    bar.style.width=level.progressPercent+"%";
    $("levelProgress").setAttribute("aria-valuenow",String(level.progressPercent));
    if(level.maxLevel){
      $("xpProgressLabel").textContent="Maximum level reached";
      $("levelNextHint").textContent="All levels unlocked — keep learning!";
    }else{
      $("xpProgressLabel").textContent=summary.xp+" / "+level.nextXp+" XP";
      $("levelNextHint").textContent=level.xpToNext+" XP to Level "+level.nextLevel+" · "+level.nextTitle;
    }
    renderTrend(summary.last10);
    renderSubjects(summary.subjectStats.filter(subject=>subject.tests>0));
    renderWeek(summary.streak.last7);
    renderBadges(summary.badges,summary.earnedBadges);
  }
  render();
  renderSubjectLaunches();
})();
