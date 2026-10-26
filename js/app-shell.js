/* Responsive, session-aware navigation for ExamGuru / C10 Playground. */
(() => {
  "use strict";
  const links=[
    {label:"Sign in",icon:"🔐",href:"./index.html",page:"index.html",auth:"guest"},
    {section:"LEARN",auth:"student"},
    {label:"Dashboard",icon:"🏡",href:"./dashboard.html",page:"dashboard.html",auth:"student"},
    {label:"All subjects",icon:"📚",href:"./dashboard.html#subjects",page:"dashboard.html",hash:"#subjects",auth:"student"},
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
    {label:"Admin Workspace",icon:"🛠️",href:"./admin.html",page:"admin.html",auth:"admin"}
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
    if(window.C10Api&&window.C10Api.isConfigured&&window.C10Api.isConfigured()&&window.C10Api.isAuthenticated()){
      try{
        const result=await window.C10Api.currentUser();
        if(result&&result.user&&result.user.role==="admin")return {role:"admin",username:result.user.githubLogin||result.user.username||""};
        if(result&&result.user&&result.user.role==="student")return {role:"student",username:result.user.username||""};
      }catch(_){}
    }
    const student=readStaticStudent();
    return student?{role:"student",username:student.username}: {role:"guest",username:""};
  }
  async function createNav(){
    if(document.getElementById("c10Sidebar"))return;
    const current=getLocation(),auth=await authState();
    const sidebar=node("aside","c10-sidebar");sidebar.id="c10Sidebar";sidebar.setAttribute("aria-label","Main navigation");
    const brand=node("div","c10-brand");brand.append(node("div","c10-brand-mark","EG"));
    const brandCopy=node("div","c10-brand-copy");brandCopy.append(node("div","c10-brand-title","ExamGuru"),node("div","c10-brand-sub","Learn · Practise · Level up"));brand.appendChild(brandCopy);sidebar.appendChild(brand);
    const list=node("nav","c10-nav-list");list.setAttribute("aria-label","Learning and account");
    links.forEach(item=>{
      if(item.auth!==auth.role)return;
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
        try{sessionStorage.removeItem("c10playground_static_student_v1");sessionStorage.removeItem("c10playground_api_session");}catch(_){}
        location.replace("./index.html");
      });
      list.appendChild(logout);
    }
    sidebar.appendChild(list);
    const bottom=node("div","c10-sidebar-bottom");
    bottom.append(node("div","",auth.role==="guest"?"Sign in to open your learning dashboard.":"Signed in"+(auth.username?" as "+auth.username:"")+"."));
    bottom.append(node("span","c10-shell-credit","Conceptualised by JP Ganathe"));sidebar.appendChild(bottom);
    const mobileBar=node("div","c10-mobilebar"),toggle=node("button","c10-menu-toggle","☰");
    toggle.type="button";toggle.setAttribute("aria-label","Open navigation menu");toggle.setAttribute("aria-controls","c10Sidebar");toggle.setAttribute("aria-expanded","false");
    toggle.addEventListener("click",()=>sidebar.classList.contains("open")?closeMenu():openMenu());
    const mobileCopy=node("div","");mobileCopy.append(node("div","c10-mobile-title","ExamGuru"),node("div","c10-mobile-sub",auth.role==="guest"?"Sign in to continue":"Learn · Practise · Level up"));mobileBar.append(toggle,mobileCopy);
    const scrim=node("button","c10-nav-scrim");scrim.type="button";scrim.setAttribute("aria-label","Close navigation menu");scrim.addEventListener("click",closeMenu);
    document.body.prepend(sidebar);document.body.prepend(mobileBar);document.body.prepend(scrim);document.body.classList.add("c10-shell-ready");
    window.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();});
    window.addEventListener("hashchange",()=>{if(sidebar.classList.contains("open"))closeMenu();});
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
