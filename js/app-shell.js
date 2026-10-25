/* Shared responsive navigation for all C10 Playground screens. */
(() => {
  "use strict";
  const links = [
    {section:"LEARN"},
    {label:"Dashboard",icon:"🏡",href:"./dashboard.html",page:"dashboard.html"},
    {label:"All subjects",icon:"📚",href:"./index.html",page:"index.html"},
    {section:"SUBJECTS"},
    {label:"Science",icon:"🧪",href:"./science.html",page:"science.html"},
    {label:"Mathematics",icon:"📐",href:"./practice.html?subject=mathematics",page:"practice.html",subject:"mathematics"},
    {label:"English",icon:"📖",href:"./practice.html?subject=english",page:"practice.html",subject:"english"},
    {label:"Social Science",icon:"🌍",href:"./practice.html?subject=social-science",page:"practice.html",subject:"social-science"},
    {label:"Hindi",icon:"📝",href:"./practice.html?subject=hindi",page:"practice.html",subject:"hindi"},
    {section:"MY LEARNING"},
    {label:"My profile",icon:"👤",href:"./profile.html#profile",page:"profile.html",hash:"#profile"},
    {label:"Test history",icon:"📈",href:"./profile.html#history",page:"profile.html",hash:"#history"},
    {label:"Levels & rewards",icon:"🏆",href:"./profile.html#rewards",page:"profile.html",hash:"#rewards"},
    {label:"Backup & restore",icon:"💾",href:"./profile.html#backup",page:"profile.html",hash:"#backup"}
  ];

  function node(tag,className,text){
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function getLocation(){
    const file=location.pathname.split("/").filter(Boolean).pop()||"index.html";
    const params=new URLSearchParams(location.search);
    return {file,subject:params.get("subject")||"",hash:location.hash||""};
  }
  function isActive(item,current){
    if(item.page!==current.file)return false;
    if(item.subject)return item.subject===current.subject;
    if(item.hash)return current.hash===item.hash;
    if(item.page==="profile.html")return !["#profile","#history","#rewards","#backup"].includes(current.hash);
    return item.page!=="practice.html"&&!item.hash;
  }
  function createNav(){
    if(document.getElementById("c10Sidebar"))return;
    const current=getLocation();
    const sidebar=node("aside","c10-sidebar");
    sidebar.id="c10Sidebar";
    sidebar.setAttribute("aria-label","Main navigation");
    const brand=node("div","c10-brand");
    brand.append(node("div","c10-brand-mark","C10"));
    const brandCopy=node("div","c10-brand-copy");
    brandCopy.append(node("div","c10-brand-title","C10 Playground"),node("div","c10-brand-sub","Class 10 · Learn & level up"));
    brand.appendChild(brandCopy);sidebar.appendChild(brand);
    const list=node("nav","c10-nav-list");
    list.setAttribute("aria-label","Learning and account");
    links.forEach(item=>{
      if(item.section){list.appendChild(node("div","c10-nav-label",item.section));return;}
      const link=node("a","c10-nav-link");
      link.href=item.href;
      if(isActive(item,current)){
        link.classList.add("active");
        link.setAttribute("aria-current","page");
      }
      link.append(node("span","c10-nav-icon",item.icon),node("span","",item.label));
      link.addEventListener("click",()=>closeMenu());
      list.appendChild(link);
    });
    sidebar.appendChild(list);
    const bottom=node("div","c10-sidebar-bottom");
    bottom.append(node("div","","A little progress every day adds up."),node("span","c10-shell-credit","Conceptualised by JP Ganathe"));
    sidebar.appendChild(bottom);

    const mobileBar=node("div","c10-mobilebar");
    const toggle=node("button","c10-menu-toggle","☰");
    toggle.type="button";toggle.setAttribute("aria-label","Open navigation menu");
    toggle.setAttribute("aria-controls","c10Sidebar");toggle.setAttribute("aria-expanded","false");
    toggle.addEventListener("click",()=>sidebar.classList.contains("open")?closeMenu():openMenu());
    const mobileCopy=node("div","");
    mobileCopy.append(node("div","c10-mobile-title","C10 Playground"),node("div","c10-mobile-sub","Learn · Practise · Level up"));
    mobileBar.append(toggle,mobileCopy);
    const scrim=node("button","c10-nav-scrim");
    scrim.type="button";scrim.setAttribute("aria-label","Close navigation menu");
    scrim.addEventListener("click",closeMenu);
    document.body.prepend(sidebar);
    document.body.prepend(mobileBar);
    document.body.prepend(scrim);
    document.body.classList.add("c10-shell-ready");
    window.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();});
    window.addEventListener("hashchange",()=>{if(!sidebar.classList.contains("open"))return;closeMenu();});
  }
  function openMenu(){
    const sidebar=document.getElementById("c10Sidebar");
    const toggle=document.querySelector(".c10-menu-toggle");
    const scrim=document.querySelector(".c10-nav-scrim");
    if(!sidebar)return;
    sidebar.classList.add("open");scrim.classList.add("visible");
    document.body.classList.add("c10-menu-open");
    toggle.setAttribute("aria-expanded","true");toggle.setAttribute("aria-label","Close navigation menu");
    toggle.textContent="×";
  }
  function closeMenu(){
    const sidebar=document.getElementById("c10Sidebar");
    const toggle=document.querySelector(".c10-menu-toggle");
    const scrim=document.querySelector(".c10-nav-scrim");
    if(!sidebar)return;
    sidebar.classList.remove("open");if(scrim)scrim.classList.remove("visible");
    document.body.classList.remove("c10-menu-open");
    if(toggle){toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open navigation menu");toggle.textContent="☰";}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",createNav,{once:true});else createNav();
})();
