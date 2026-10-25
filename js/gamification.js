/* Derived XP, levels, streaks, badges and chart data. No extra personal data is stored. */
(() => {
  "use strict";
  const LEVELS = [
    {level:1,title:"Curious Starter",xp:0,emoji:"🌱"},
    {level:2,title:"Practice Scout",xp:100,emoji:"🧭"},
    {level:3,title:"Concept Builder",xp:250,emoji:"🧱"},
    {level:4,title:"Quiz Challenger",xp:450,emoji:"⚡"},
    {level:5,title:"Knowledge Ranger",xp:700,emoji:"🗺️"},
    {level:6,title:"Subject Champion",xp:1000,emoji:"🏅"},
    {level:7,title:"Master Learner",xp:1400,emoji:"🎓"},
    {level:8,title:"Learning Legend",xp:1900,emoji:"🌟"},
    {level:9,title:"Grand Scholar",xp:2500,emoji:"👑"}
  ];
  const SUBJECTS = [
    {id:"science",title:"Science",emoji:"🧪"},
    {id:"mathematics",title:"Mathematics",emoji:"📐"},
    {id:"english",title:"English",emoji:"📖"},
    {id:"social-science",title:"Social Science",emoji:"🌍"},
    {id:"hindi",title:"Hindi",emoji:"📝"}
  ];
  const dateKey = value => {
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return "";
    return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
  };
  const addDays = (key,delta) => {
    const [year,month,day]=key.split("-").map(Number);
    const date=new Date(year,month-1,day);
    date.setDate(date.getDate()+delta);
    return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
  };
  const completed = attempt => ["submitted","timed-out"].includes(attempt.status) && Number(attempt.maxScore)>0;
  const accuracy = attempt => Number(attempt.maxScore)>0 ? Math.max(0,Math.min(100,Math.round(Number(attempt.score||0)/Number(attempt.maxScore)*100))) : 0;
  function xpFor(attempt){
    if(!completed(attempt))return 0;
    const correct=Math.max(0,Math.floor(Number(attempt.correctCount??attempt.score)||0));
    const percent=accuracy(attempt);
    return 10 + correct*2 + (percent>=70?5:0) + (percent>=90?10:0);
  }
  function levelFor(xp){
    let current=LEVELS[0];
    for(const level of LEVELS){if(xp>=level.xp)current=level;else break;}
    const next=LEVELS.find(level=>level.level===current.level+1)||null;
    const progress=next?Math.max(0,Math.min(100,Math.round((xp-current.xp)/(next.xp-current.xp)*100))):100;
    return {...current,nextLevel:next?next.level:null,nextTitle:next?next.title:null,nextXp:next?next.xp:null,
      currentLevelXp:current.xp,xpToNext:next?Math.max(0,next.xp-xp):0,progressPercent:progress,maxLevel:!next};
  }
  function streakStats(attempts,now=new Date()){
    const dates=[...new Set(attempts.map(attempt=>dateKey(attempt.submittedAt||attempt.startedAt)).filter(Boolean))].sort();
    const set=new Set(dates);
    let best=0,running=0,prior="";
    dates.forEach(date=>{
      running=prior&&addDays(prior,1)===date?running+1:1;
      best=Math.max(best,running);prior=date;
    });
    const today=dateKey(now),yesterday=addDays(today,-1);
    let current=0,cursor=set.has(today)?today:set.has(yesterday)?yesterday:"";
    while(cursor&&set.has(cursor)){current++;cursor=addDays(cursor,-1);}
    const last7=[];
    for(let back=6;back>=0;back--){
      const key=addDays(today,-back);
      last7.push({date:key,label:new Date(Number(key.slice(0,4)),Number(key.slice(5,7))-1,Number(key.slice(8,10))).toLocaleDateString(undefined,{weekday:"short"}),count:attempts.filter(attempt=>dateKey(attempt.submittedAt||attempt.startedAt)===key).length});
    }
    return {current,best,activeDays:dates.length,last7};
  }
  function badgesFor(attempts,xp,streak,subjects){
    const tests=attempts.length;
    const perfect=attempts.some(attempt=>accuracy(attempt)===100);
    const strongCount=attempts.filter(attempt=>accuracy(attempt)>=90).length;
    const catalog=[
      {id:"first-step",title:"First Step",emoji:"👣",description:"Complete your first test",earned:tests>=1},
      {id:"three-tests",title:"Getting Warm",emoji:"🔥",description:"Complete 3 tests",earned:tests>=3},
      {id:"ten-tests",title:"Steady Solver",emoji:"🛠️",description:"Complete 10 tests",earned:tests>=10},
      {id:"perfect",title:"Perfect Focus",emoji:"💯",description:"Score 100% on a test",earned:perfect},
      {id:"accuracy-ace",title:"Accuracy Ace",emoji:"🎯",description:"Score 90% or higher on 5 tests",earned:strongCount>=5},
      {id:"explorer",title:"Subject Explorer",emoji:"🧭",description:"Practise 3 different subjects",earned:subjects.length>=3},
      {id:"well-rounded",title:"All-Round Learner",emoji:"🌈",description:"Practise all 5 subjects",earned:subjects.length>=5},
      {id:"streak-three",title:"Three-Day Spark",emoji:"📅",description:"Practise on 3 consecutive days",earned:streak.best>=3},
      {id:"streak-five",title:"Five-Day Streak",emoji:"🚀",description:"Practise on 5 consecutive days",earned:streak.best>=5},
      {id:"level-five",title:"Knowledge Ranger",emoji:"🗺️",description:"Reach Level 5",earned:levelFor(xp).level>=5},
      {id:"level-eight",title:"Learning Legend",emoji:"👑",description:"Reach Level 8",earned:levelFor(xp).level>=8}
    ];
    return catalog.map(badge=>({...badge,earnedAt:null}));
  }
  function calculate(input,now=new Date()){
    const attempts=(Array.isArray(input)?input:[]).filter(completed).map(attempt=>({
      ...attempt,
      subjectId:String(attempt.subjectId||""),
      accuracy:accuracy(attempt),
      xpEarned:xpFor(attempt)
    })).sort((a,b)=>String(a.submittedAt||a.startedAt).localeCompare(String(b.submittedAt||b.startedAt)));
    const xp=attempts.reduce((sum,attempt)=>sum+attempt.xpEarned,0);
    const level=levelFor(xp);
    const subjectIds=[...new Set(attempts.map(attempt=>attempt.subjectId).filter(Boolean))];
    const subjects=SUBJECTS.map(subject=>{
      const matching=attempts.filter(attempt=>attempt.subjectId===subject.id);
      const totalQuestions=matching.reduce((sum,attempt)=>sum+Number(attempt.answeredCount??attempt.questionCount??attempt.maxScore??0),0);
      const correct=matching.reduce((sum,attempt)=>sum+Number(attempt.correctCount??attempt.score??0),0);
      return {...subject,tests:matching.length,questionCount:totalQuestions,correct,
        accuracy:totalQuestions?Math.round(correct/totalQuestions*100):0,
        averageScore:matching.length?Math.round(matching.reduce((sum,attempt)=>sum+attempt.accuracy,0)/matching.length):null};
    });
    const activeSubjects=subjects.filter(subject=>subject.tests>0);
    const streak=streakStats(attempts,now);
    const badges=badgesFor(attempts,xp,streak,subjectIds);
    const recent=attempts.slice(-10);
    const last10=recent.map((attempt,index)=>({
      id:attempt.attemptId||String(index),
      label:attempt.subjectId?((SUBJECTS.find(subject=>subject.id===attempt.subjectId)||{}).title||attempt.subjectId):"Test",
      shortLabel:(SUBJECTS.find(subject=>subject.id===attempt.subjectId)||{}).emoji||"📘",
      accuracy:attempt.accuracy,
      score:Number(attempt.score||0),
      maxScore:Number(attempt.maxScore||0),
      date:attempt.submittedAt||attempt.startedAt
    }));
    const allTimeAverage=attempts.length?Math.round(attempts.reduce((sum,attempt)=>sum+attempt.accuracy,0)/attempts.length):null;
    return {
      attempts:attempts.length,xp,level,streak,
      badges,earnedBadges:badges.filter(badge=>badge.earned).length,
      allTimeAverage,activeSubjects:activeSubjects.length,subjects:activeSubjects,
      subjectStats:subjects,last10
    };
  }
  window.C10Gamification=Object.freeze({schemaVersion:1,levels:LEVELS.map(level=>({...level})),xpFor,levelFor,streakStats,calculate});
})();
