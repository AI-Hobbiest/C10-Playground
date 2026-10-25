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
})();
