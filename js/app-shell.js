/* Responsive, session-aware navigation for ExamGuru / C10 Playground. */
(() => {
  "use strict";
  const links=[
    {label:"Sign in",icon:"🔐",href:"./index.html",page:"index.html",auth:"guest"},
    {section:"LEARN",auth:"student"},
    {label:"Dashboard",icon:"🏡",href:"./dashboard.html",page:"dashboard.html",auth:"student"},
    {label:"All subjects",icon:"📚",href:"./dashboard.html#subjects",page:"dashboard.html",hash:"#subjects",auth:"student"},
    {label:"Levels & rewards",icon:"🏆",href:"./dashboard.html#rewards",page:"dashboard.html",hash:"#rewards",auth:"student"},
    {section:"SUBJECTS",auth:"student"},
    {label:"Science",icon:"🧪",href:"./practice.html?subject=science",page:"practice.html",subject:"science",auth:"student"},
    {label:"Mathematics",icon:"📐",href:"./practice.html?subject=mathematics",page:"practice.html",subject:"mathematics",auth:"student"},
    {label:"English",icon:"📖",href:"./practice.html?subject=english",page:"practice.html",subject:"english",auth:"student"},
    {label:"Social Science",icon:"🌍",href:"./practice.html?subject=social-science",page:"practice.html",subject:"social-science",auth:"student"},
    {label:"Hindi",icon:"📝",href:"./practice.html?subject=hindi",page:"practice.html",subject:"hindi",auth:"student"},
    {section:"MY LEARNING",auth:"student"},
    {label:"My profile",icon:"👤",href:"./profile.html#profile",page:"profile.html",hash:"#profile",auth:"student"},
    {label:"Test history",icon:"📈",href:"./profile.html#history",page:"profile.html",hash:"#history",auth:"student"},
    {label:"Levels & rewards",icon:"🏆",href:"./dashboard.html#rewards",page:"dashboard.html",hash:"#rewards",auth:"student"},
    {label:"Backup & restore",icon:"💾",href:"./profile.html#backup",page:"profile.html",hash:"#backup",auth:"student"},
    {section:"ADMINISTRATION",auth:"admin"},
    {label:"Overview",icon:"🏠",href:"./admin.html#tab-overview",page:"admin.html",hash:"#tab-overview",auth:"admin"},
    {label:"Question banks",icon:"🧩",href:"./admin.html#tab-banks",page:"admin.html",hash:"#tab-banks",auth:"admin"},
    {label:"Classes & subjects",icon:"🏫",href:"./admin.html#tab-classes",page:"admin.html",hash:"#tab-classes",auth:"admin"},
    {label:"Knowledge base",icon:"📚",href:"./admin.html#tab-knowledge",page:"admin.html",hash:"#tab-knowledge",auth:"admin"},
    {label:"Students & reports",icon:"👩‍🎓",href:"./admin.html#tab-students",page:"admin.html",hash:"#tab-students",auth:"admin"},
    {label:"Leaderboards",icon:"🏆",href:"./admin.html#tab-leaderboard",page:"admin.html",hash:"#tab-leaderboard",auth:"admin"},
    {label:"Admin access",icon:"🔐",href:"./admin.html#tab-access",page:"admin.html",hash:"#tab-access",auth:"admin"},
    {label:"Operations",icon:"⚙️",href:"./admin.html#tab-operations",page:"admin.html",hash:"#tab-operations",auth:"admin"}
  ];
  function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
  function getLocation(){const last=location.pathname.split("/").filter(Boolean).pop()||"index.html";const file=last.includes(".")?last:"index.html";const params=new URLSearchParams(location.search);return {file,subject:params.get("subject")||"",hash:location.hash||""};}
  function isActive(item,current){if(item.page!==current.file)return false;if(item.subject)return item.subject===current.subject;if(item.hash)return current.hash===item.hash||(current.file==="profile.html"&&!current.hash&&item.hash==="#profile");if(item.page==="dashboard.html")return current.hash!=="#rewards"&&current.hash!=="#subjects";if(item.page==="profile.html")return !["#profile","#history","#rewards","#backup"].includes(current.hash);return item.page!=="practice.html"&&!item.hash;}
  function readStaticStudent(){
    try{
      if(window.C10StudentAuth&&window.C10StudentAuth.currentUser)return window.C10StudentAuth.currentUser();
      const value=JSON.parse(sessionStorage.getItem("c10playground_static_student_v1")||"null");
      return value&&typeof value.username==="string"?{username:value.username,role:"student",classId:String(value.classId||"10")}:null;
    }catch(_){return null;}
  }
  async function authState(){
    try{
      const admin=JSON.parse(sessionStorage.getItem("examguru_mvp_admin_session_v1")||"null");
      if(admin&&admin.role==="admin"&&admin.username==="Jayaprakashganathe@gmail.com")return {role:"admin",username:admin.username};
    }catch(_){}
    if(window.C10Api&&window.C10Api.isConfigured&&window.C10Api.isConfigured()&&window.C10Api.isAuthenticated()){
      try{
        const result=await window.C10Api.currentUser();
        if(result&&result.user&&result.user.role==="admin")return {role:"admin",username:result.user.githubLogin||result.user.username||""};
        if(result&&result.user&&result.user.role==="student")return {role:"student",username:result.user.username||"",classId:String(result.user.classId||"10")};
      }catch(_){}
    }
    const student=readStaticStudent();
    return student?{role:"student",username:student.username,classId:String(student.classId||"10")}: {role:"guest",username:""};
  }
  async function configuredSubjects(classId){
    try{
      const response=await fetch("./data/classes.json",{cache:"no-store"});
      if(!response.ok)return null;
      const data=await response.json();
      const entry=(data.classes||[]).find(item=>String(item.classId)===String(classId)&&item.active!==false);
      return entry&&Array.isArray(entry.subjects)?{configured:true,subjects:entry.subjects.map(String),label:entry.label||("Class "+classId)}:null;
    }catch(_){return null;}
  }
  function applySectionFocus(){
    const current=getLocation();
    if(current.file==="dashboard.html"){
      const main=document.getElementById("dashboard");
      if(main){
        const target=current.hash==="#subjects"?"subjects":current.hash==="#rewards"?"rewards":"";
        Array.from(main.children).forEach(child=>{child.hidden=!!target&&child.id!==target&&child.tagName!=="FOOTER";});
      }
      return;
    }
    if(current.file==="profile.html"){
      const target=["#profile","#history","#backup"].includes(current.hash)?current.hash.slice(1):"";
      ["profile","history","backup"].forEach(id=>{
        const section=document.getElementById(id);
        if(section)section.hidden=!!target&&id!==target;
      });
      const grid=document.querySelector(".profile-grid");
      if(grid&&target)grid.style.gridTemplateColumns="minmax(0,1fr)";
      else if(grid)grid.style.gridTemplateColumns="";
    }
  }
  function applyConfiguredSubjectVisibility(config){
    if(!config||getLocation().file!=="dashboard.html")return;
    const cards=Array.from(document.querySelectorAll(".subject-launch-card[href*='subject=']"));
    cards.forEach(card=>{const url=new URL(card.href,location.href);card.hidden=!config.subjects.includes(url.searchParams.get("subject"));});
    let notice=document.getElementById("configuredSubjectsNotice");
    if(!notice&&cards.length){notice=node("p","c10-subjects-notice");notice.id="configuredSubjectsNotice";notice.setAttribute("role","status");cards[0].parentElement.insertBefore(notice,cards[0]);}
    if(notice){notice.hidden=config.subjects.length>0;notice.textContent="No subjects have been configured for "+config.label+" yet. Please ask your administrator to configure the class subjects.";}
  }
  async function createNav(){
    if(document.getElementById("c10Sidebar"))return;
    const current=getLocation(),auth=await authState();
    const subjectConfig=auth.role==="student"?await configuredSubjects(auth.classId):null;
    const sidebar=node("aside","c10-sidebar");sidebar.id="c10Sidebar";sidebar.setAttribute("aria-label","Main navigation");
    const brand=node("div","c10-brand");const mark=node("div","c10-brand-mark");const logo=node("img");logo.src="./assets/examguru-saraswati.svg";logo.alt="";logo.width=38;logo.height=38;mark.appendChild(logo);brand.appendChild(mark);
    const brandCopy=node("div","c10-brand-copy");brandCopy.append(node("div","c10-brand-title","ExamGuru"),node("div","c10-brand-sub","Learn · Practise · Level up"));brand.appendChild(brandCopy);sidebar.appendChild(brand);
    const list=node("nav","c10-nav-list");list.setAttribute("aria-label","Learning and account");
    links.forEach(item=>{
      if(item.auth!==auth.role)return;
      if(item.subject&&subjectConfig&& !subjectConfig.subjects.includes(item.subject))return;
      if(item.section){list.appendChild(node("div","c10-nav-label",item.section));return;}
      const link=node("a","c10-nav-link");link.href=item.href;
      if(isActive(item,current)){link.classList.add("active");link.setAttribute("aria-current","page");}
      link.append(node("span","c10-nav-icon",item.icon),node("span","",item.label));link.addEventListener("click",()=>closeMenu());list.appendChild(link);
    });
    if(auth.role!=="guest"){
      const logout=node("button","c10-nav-link c10-nav-action");
      logout.type="button";logout.append(node("span","c10-nav-icon","↪"),node("span","", "Sign out"));
      logout.addEventListener("click",async()=>{
        logout.disabled=true;
        try{if(window.C10Api&&window.C10Api.isAuthenticated())await window.C10Api.logout();}catch(_){}
        if(window.C10StudentAuth&&window.C10StudentAuth.logout)window.C10StudentAuth.logout();
        try{sessionStorage.removeItem("c10playground_static_student_v1");sessionStorage.removeItem("c10playground_api_session");sessionStorage.removeItem("examguru_mvp_admin_session_v1");}catch(_){}
        location.replace("./index.html");
      });
      list.appendChild(logout);
    }
    sidebar.appendChild(list);
    const bottom=node("div","c10-sidebar-bottom");
    bottom.append(node("div","",auth.role==="guest"?"Sign in to open your learning dashboard.":"Signed in"+(auth.username?" as "+auth.username:"")+"."));
    sidebar.appendChild(bottom);
    const mobileBar=node("div","c10-mobilebar"),toggle=node("button","c10-menu-toggle","☰");
    toggle.type="button";toggle.setAttribute("aria-label","Open navigation menu");toggle.setAttribute("aria-controls","c10Sidebar");toggle.setAttribute("aria-expanded","false");
    toggle.addEventListener("click",()=>sidebar.classList.contains("open")?closeMenu():openMenu());
    const mobileCopy=node("div","");mobileCopy.append(node("div","c10-mobile-title","ExamGuru"),node("div","c10-mobile-sub",auth.role==="guest"?"Sign in to continue":"Learn · Practise · Level up"));mobileBar.append(toggle,mobileCopy);
    const scrim=node("button","c10-nav-scrim");scrim.type="button";scrim.setAttribute("aria-label","Close navigation menu");scrim.addEventListener("click",closeMenu);
    document.body.prepend(sidebar);document.body.prepend(mobileBar);document.body.prepend(scrim);document.body.classList.add("c10-shell-ready");
    if(subjectConfig)applyConfiguredSubjectVisibility(subjectConfig);
    window.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();});
    window.addEventListener("hashchange",()=>{if(sidebar.classList.contains("open"))closeMenu();applySectionFocus();});
  }
  function openMenu(){const sidebar=document.getElementById("c10Sidebar"),toggle=document.querySelector(".c10-menu-toggle"),scrim=document.querySelector(".c10-nav-scrim");if(!sidebar)return;sidebar.classList.add("open");if(scrim)scrim.classList.add("visible");document.body.classList.add("c10-menu-open");toggle.setAttribute("aria-expanded","true");toggle.setAttribute("aria-label","Close navigation menu");toggle.textContent="×";}
  function closeMenu(){const sidebar=document.getElementById("c10Sidebar"),toggle=document.querySelector(".c10-menu-toggle"),scrim=document.querySelector(".c10-nav-scrim");if(!sidebar)return;sidebar.classList.remove("open");if(scrim)scrim.classList.remove("visible");document.body.classList.remove("c10-menu-open");if(toggle){toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open navigation menu");toggle.textContent="☰";}}
  window.addEventListener("c10-auth-changed",()=>{
    ["c10Sidebar",".c10-mobilebar",".c10-nav-scrim"].forEach(selector=>{
      const element=selector.startsWith(".")?document.querySelector(selector):document.getElementById(selector);
      if(element)element.remove();
    });
    document.body.classList.remove("c10-shell-ready","c10-menu-open");
    createNav();
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",createNav,{once:true});else createNav();
})();
