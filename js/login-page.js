/* Landing-page sign-in flow. Static student sign-in is a low-risk GitHub Pages MVP. */
(() => {
  "use strict";
  const form=document.getElementById("studentLoginForm");
  const username=document.getElementById("username");
  const password=document.getElementById("password");
  const submit=document.getElementById("loginSubmit");
  const adminForm=document.getElementById("adminLoginForm");
  const adminUsername=document.getElementById("adminUsername");
  const adminPassword=document.getElementById("adminPassword");
  const adminSubmit=document.getElementById("adminLoginSubmit");
  const status=document.getElementById("loginStatus");
  const say=(message,type="")=>{status.textContent=message;status.className="login-status"+(type?" "+type:"");};
  function hasStudentSession(){try{return !!JSON.parse(sessionStorage.getItem("c10playground_static_student_v1")||"null")?.username;}catch(_){return false;}}
  if(hasStudentSession()&&window.C10StudentAuth){
    window.C10StudentAuth.restoreSession().then(account=>{if(account)location.replace("./dashboard.html");});
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    submit.disabled=true;submit.textContent="Signing in…";
    try{
      if(!window.C10StudentAuth)throw new Error("Student sign-in is unavailable. Please reload the page.");
      await window.C10StudentAuth.login(username.value,password.value);
      password.value="";
      say("Signed in. Opening your dashboard…","success");
      location.assign("./dashboard.html");
    }catch(error){say(error&&error.message?error.message:"Unable to sign in. Check your username and password.","error");}
    finally{submit.disabled=false;submit.innerHTML='Sign in to ExamGuru <span aria-hidden="true">→</span>';}
  });
  const ADMIN_USERNAME="Jayaprakashganathe@gmail.com";
  // SHA-256 digest of the temporary MVP password; this is obfuscation, not secure auth.
  const ADMIN_PASSWORD_SHA256="c5c784554396ac628057cbad338efdf79fe7b1d797317728cf4b52d14af18ae2";
  async function sha256(text){
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  adminForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!adminForm.reportValidity())return;
    adminSubmit.disabled=true;
    try{
      const enteredUsername=adminUsername.value.trim().toLowerCase();
      const enteredHash=await sha256(adminPassword.value);
      if(enteredUsername!==ADMIN_USERNAME.toLowerCase()||enteredHash!==ADMIN_PASSWORD_SHA256){
        throw new Error("Admin username or password is incorrect.");
      }
      sessionStorage.setItem("examguru_mvp_admin_session_v1",JSON.stringify({username:ADMIN_USERNAME,role:"admin",signedInAt:Date.now()}));
      sessionStorage.removeItem("c10playground_static_student_v1");
      adminPassword.value="";
      say("Admin sign-in successful. Opening Admin Workspace…","success");
      location.assign("./admin.html");
    }catch(error){
      say(error&&error.message?error.message:"Unable to sign in as administrator.","error");
    }finally{adminSubmit.disabled=false;}
  });
  const params=new URLSearchParams(location.search);
  if(params.get("admin")==="login-required")say("Please sign in with the administrator account to open the Admin Workspace.","error");

})();
