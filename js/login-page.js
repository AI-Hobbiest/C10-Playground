/* Landing-page sign-in flow. Static student sign-in is a low-risk GitHub Pages MVP. */
(() => {
  "use strict";
  const form=document.getElementById("studentLoginForm");
  const username=document.getElementById("username");
  const password=document.getElementById("password");
  const submit=document.getElementById("loginSubmit");
  const github=document.getElementById("githubAdminLogin");
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
  github.addEventListener("click",()=>{
    if(!window.C10Api||!window.C10Api.isConfigured()){
      say("GitHub admin sign-in is not connected yet. It requires the secure account service, GitHub OAuth credentials and a server-side allowlist. No GitHub username will be trusted by this page alone.","error");
      return;
    }
    github.disabled=true;say("Redirecting to GitHub for administrator verification…");
    try{window.C10Api.githubLogin();}catch(error){github.disabled=false;say(error.message||"GitHub sign-in could not be started.","error");}
  });
})();
