/* Client for the optional Cloudflare API. Tokens are short-lived and kept in sessionStorage. */
(() => {
  "use strict";
  const TOKEN_KEY="c10playground_api_session";
  const BASE=String(window.C10_API_BASE||"").replace(/\/+$/,"");
  let sessionToken=sessionStorage.getItem(TOKEN_KEY)||"";
  let cachedUser=null;
  function isConfigured(){return /^https:\/\//i.test(BASE)&&!BASE.includes("REPLACE_WITH");}
  function isAuthenticated(){return !!sessionToken;}
  function saveSession(result){
    if(!result||!result.token)throw new Error("The server did not return a session token.");
    sessionToken=String(result.token);sessionStorage.setItem(TOKEN_KEY,sessionToken);
    cachedUser=result.user||null;
    return result;
  }
  function clearSession(){sessionToken="";cachedUser=null;sessionStorage.removeItem(TOKEN_KEY);}
  async function request(path,options={}) {
    if(!isConfigured())throw new Error("Central accounts are not configured yet. The Cloudflare API must be deployed and js/api-config.js configured.");
    const headers=new Headers(options.headers||{});
    if(options.body!==undefined)headers.set("Content-Type","application/json");
    if(options.auth!==false&&sessionToken)headers.set("Authorization","Bearer "+sessionToken);
    let response;
    try {
      response=await fetch(BASE+path,{method:options.method||"GET",headers,body:options.body===undefined?undefined:JSON.stringify(options.body),cache:"no-store",redirect:"follow"});
    } catch (_) {throw new Error("Cannot reach the C10 account service. Check API configuration and deployment.");}
    const payload=await response.json().catch(()=>({}));
    if(response.status===401&&options.auth!==false)clearSession();
    if(!response.ok||payload.ok===false)throw new Error(payload.error||("Account service returned HTTP "+response.status+"."));
    return payload;
  }
  async function githubLogin(){
    if(!isConfigured())throw new Error("GitHub Admin sign-in is not configured. Deploy the Cloudflare Worker and set js/api-config.js first.");
    window.location.href=BASE+"/api/auth/github/start";
  }
  async function completeGithubCallback(){
    const raw=String(location.hash||"");
    if(!raw.startsWith("#"))return null;
    const params=new URLSearchParams(raw.slice(1));
    const err=params.get("auth_error"),githubCode=params.get("auth_code"),studentCode=params.get("student_code");
    if(!err&&!githubCode&&!studentCode)return null;
    history.replaceState(null,"",location.pathname+location.search);
    if(err)throw new Error("Sign-in failed: "+err.replace(/_/g," ")+". Check the account setup and authorised GitHub login.");
    const result=studentCode
      ?await request("/api/auth/student-exchange",{method:"POST",auth:false,body:{code:studentCode}})
      :await request("/api/auth/exchange",{method:"POST",auth:false,body:{code:githubCode}});
    return saveSession(result);
  }
  async function studentLoginPage(){
    if(!isConfigured())throw new Error("Student accounts are not configured yet. The account service must be deployed first.");
    window.location.href=BASE+"/student-login";
  }
  async function openStudentAccount(){
    const result=await request("/api/student/account-link",{method:"POST",body:{}});
    window.location.href=result.url;
  }
  async function loginStudent(studentId,password){
    const result=await request("/api/student/login",{method:"POST",auth:false,body:{studentId,password}});
    saveSession(result);
    return result;
  }
  async function currentUser(){
    if(!sessionToken)return null;
    const result=await request("/api/auth/me");
    cachedUser=result.user||null;
    return result;
  }
  async function logout(){
    try{if(sessionToken&&isConfigured())await request("/api/auth/logout",{method:"POST",body:{}});}finally{clearSession();}
  }
  function api(path,options){return request(path,options);}
  function currentRole(){return cachedUser&&cachedUser.role||null;}
  window.C10Api=Object.freeze({
    isConfigured,isAuthenticated,currentRole,request,api,githubLogin,completeGithubCallback,
    loginStudent,currentUser,logout,getToken:()=>sessionToken,studentLoginPage,openStudentAccount,
    studentMe:()=>request("/api/student/me"),
    updateStudentProfile:profile=>request("/api/student/profile",{method:"PATCH",body:profile}),
    changeStudentPassword:(currentPassword,newPassword)=>request("/api/student/change-password",{method:"POST",body:{currentPassword,newPassword}}),
    getStudentAttempts:()=>request("/api/student/attempts"),
    saveStudentAttempt:attempt=>request("/api/student/attempts",{method:"POST",body:{attempt}}),
    adminStudents:()=>request("/api/admin/students"),
    createStudent:profile=>request("/api/admin/students",{method:"POST",body:profile}),
    updateStudent:(id,profile)=>request("/api/admin/students/"+encodeURIComponent(id),{method:"PATCH",body:profile}),
    removeStudent:id=>request("/api/admin/students/"+encodeURIComponent(id),{method:"DELETE"}),
    resetStudentPassword:id=>request("/api/admin/students/"+encodeURIComponent(id)+"/password-reset",{method:"POST",body:{}}),
    adminClasses:()=>request("/api/admin/classes"),
    createClass:entry=>request("/api/admin/classes",{method:"POST",body:entry}),
    updateClass:(id,entry)=>request("/api/admin/classes/"+encodeURIComponent(id),{method:"PATCH",body:entry}),
    progressReport:(classId,subjectId)=>request("/api/admin/reports/progress?"+new URLSearchParams({classId:classId||"",subjectId:subjectId||""})),
    leaderboard:(classId,subjectId)=>request("/api/admin/reports/leaderboard?"+new URLSearchParams({classId:classId||"",subjectId:subjectId||""}))
  });
})();
