const SUBJECTS = new Set(["science","mathematics","english","social-science","hindi"]);
const PASSWORD_ITERATIONS = 210000;
const SESSION_HOURS = 8;
const INDIAN_STATES_AND_UTS = new Set(["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"]);
const MODES = new Set(["learn","test","practice","mixed-practice","timed-exam","pdf-practice","pdf-exam"]);
const STUDENT_LOGIN_HTML = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>Student sign-in · C10 Playground</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:#f4f3fb;color:#211b48;font:16px/1.5 system-ui,sans-serif}.card{width:min(460px,100%);padding:28px;background:#fff;border:1px solid #e4e0f3;border-radius:20px;box-shadow:0 16px 48px #211b481a}.brand{font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;font-weight:850;color:#6250e8}.field{display:grid;gap:6px;margin:15px 0}.field label{font-weight:750;font-size:.85rem}.field input{width:100%;padding:12px;border:1px solid #d8d3ee;border-radius:10px;font:inherit}.btn{width:100%;border:0;border-radius:10px;padding:12px;background:#6250e8;color:#fff;font:inherit;font-weight:800;cursor:pointer}.status{padding:11px;border-radius:10px;background:#f3f0ff;color:#4a3c99;font-size:.85rem;margin:12px 0}.error{background:#fff0f0;color:#992727}.muted{color:#726d88;font-size:.9rem;line-height:1.5}.link{display:inline-block;margin-top:15px;color:#5140bd;font-weight:750;text-decoration:none}</style></head><body><main class=\"card\"><div class=\"brand\">C10 Playground</div><h1>Student sign-in</h1><p class=\"muted\">Use the Student ID and password supplied by your administrator. Password entry is hosted by the account service, not on the public GitHub Pages site.</p><div id=\"status\" class=\"status\" role=\"status\">Sign in to connect your profile and test history.</div><form id=\"login\"><div class=\"field\"><label for=\"username\">Student ID</label><input id=\"username\" autocomplete=\"username\" autocapitalize=\"characters\" required maxlength=\"40\" placeholder=\"C10-XXXXXXXX\"></div><div class=\"field\"><label for=\"password\">Password</label><input id=\"password\" type=\"password\" autocomplete=\"current-password\" required maxlength=\"256\"></div><button id=\"submit\" class=\"btn\">Sign in securely</button></form><a class=\"link\" href=\"https://ai-hobbiest.github.io/C10-Playground/\">← Return to C10 Playground</a><script>(function(){const form=document.getElementById(\"login\"),status=document.getElementById(\"status\"),submit=document.getElementById(\"submit\");function msg(text,error){status.textContent=text;status.className=\"status\"+(error?\" error\":\"\");}form.addEventListener(\"submit\",async function(event){event.preventDefault();submit.disabled=true;msg(\"Verifying account…\");try{const r=await fetch(\"/api/student/login\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({studentId:document.getElementById(\"username\").value.trim(),password:document.getElementById(\"password\").value}),cache:\"no-store\"});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||\"Sign-in failed.\");sessionStorage.setItem(\"c10_account_session_token\",d.token);document.getElementById(\"password\").value=\"\";if(d.user&&d.user.mustChangePassword){msg(\"Temporary password accepted. Opening password change…\");location.replace(\"/student-account\");return;}const h=await fetch(\"/api/student/account-return\",{method:\"POST\",headers:{\"Authorization\":\"Bearer \"+d.token,\"Content-Type\":\"application/json\"},body:\"{}\",cache:\"no-store\"}),back=await h.json().catch(()=>({}));if(!h.ok||!back.ok)throw new Error(back.error||\"Unable to return to the portal.\");msg(\"Signed in. Returning to the portal…\");location.replace(back.returnUrl);}catch(error){msg(error.message||\"Sign-in failed.\",true);submit.disabled=false;}});const e=new URLSearchParams(location.search).get(\"error\");if(e)msg(e.replace(/_/g,\" \"),true);})();</script></main></body></html>";
const STUDENT_ACCOUNT_HTML = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>Student account · C10 Playground</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:#f4f3fb;color:#211b48;font:16px/1.5 system-ui,sans-serif}.card{width:min(540px,100%);padding:28px;background:#fff;border:1px solid #e4e0f3;border-radius:20px;box-shadow:0 16px 48px #211b481a}.brand{font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;font-weight:850;color:#6250e8}.field{display:grid;gap:6px;margin:15px 0}.field label{font-weight:750;font-size:.85rem}.field input{width:100%;padding:12px;border:1px solid #d8d3ee;border-radius:10px;font:inherit}.btn{width:100%;border:0;border-radius:10px;padding:12px;background:#6250e8;color:#fff;font:inherit;font-weight:800;cursor:pointer;margin:7px 0}.secondary{background:#efedff;color:#4533bd}.status{padding:11px;border-radius:10px;background:#f3f0ff;color:#4a3c99;font-size:.85rem;margin:12px 0}.error{background:#fff0f0;color:#992727}.muted{color:#726d88;font-size:.9rem;line-height:1.5}.link{display:inline-block;margin-top:12px;color:#5140bd;font-weight:750;text-decoration:none}</style></head><body><main class=\"card\"><div class=\"brand\">C10 Playground</div><h1>Student account security</h1><p id=\"intro\" class=\"muted\">Change or reset your password here. This page is hosted by the account service.</p><div id=\"status\" class=\"status\" role=\"status\">Checking session…</div><form id=\"form\" hidden><div class=\"field\"><label for=\"current\">Current or temporary password</label><input id=\"current\" type=\"password\" autocomplete=\"current-password\" required></div><div class=\"field\"><label for=\"next\">New password</label><input id=\"next\" type=\"password\" autocomplete=\"new-password\" minlength=\"12\" required></div><div class=\"field\"><label for=\"confirm\">Confirm new password</label><input id=\"confirm\" type=\"password\" autocomplete=\"new-password\" minlength=\"12\" required></div><p class=\"muted\">Use at least 12 characters including letters and numbers. Your temporary password will stop working after this change.</p><button id=\"save\" class=\"btn\">Change password</button></form><button id=\"signout\" class=\"btn secondary\">Sign out</button><a class=\"link\" href=\"https://ai-hobbiest.github.io/C10-Playground/profile.html\">Continue to student portal</a><script>(function(){const status=document.getElementById(\"status\"),form=document.getElementById(\"form\"),intro=document.getElementById(\"intro\");let token=sessionStorage.getItem(\"c10_account_session_token\")||\"\";function msg(t,e){status.textContent=t;status.className=\"status\"+(e?\" error\":\"\");}async function api(path,body,method){const r=await fetch(path,{method:method||\"POST\",headers:{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer \"+token},body:body===undefined?undefined:JSON.stringify(body),cache:\"no-store\"}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||\"Account request failed.\");return d;}async function boot(){const code=new URLSearchParams(location.hash.slice(1)).get(\"account_code\");if(code){history.replaceState(null,\"\",location.pathname+location.search);const r=await fetch(\"/api/auth/account-exchange\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({code}),cache:\"no-store\"}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||\"Account access link expired. Return to the portal and try again.\");token=d.token;sessionStorage.setItem(\"c10_account_session_token\",token);}if(!token){form.hidden=true;msg(\"Please sign in again to manage your account.\",true);return;}const me=await api(\"/api/auth/me\",undefined,\"GET\");if(!me.user||me.user.role!==\"student\")throw new Error(\"Student account required.\");intro.textContent=\"Account: \"+(me.user.studentId||me.user.username)+\". Passwords are stored as salted hashes, not readable text.\";form.hidden=false;msg(me.mustChangePassword?\"A password change is required before syncing your student data.\":\"You can change your password here. Other active sessions are revoked after the change.\");}form.addEventListener(\"submit\",async e=>{e.preventDefault();const current=document.getElementById(\"current\").value,next=document.getElementById(\"next\").value,confirm=document.getElementById(\"confirm\").value;if(next!==confirm){msg(\"New password and confirmation do not match.\",true);return;}if(next.length<12||!/[A-Za-z]/.test(next)||!/[0-9]/.test(next)){msg(\"Use at least 12 characters including letters and numbers.\",true);return;}document.getElementById(\"save\").disabled=true;try{await api(\"/api/student/change-password\",{currentPassword:current,newPassword:next});document.getElementById(\"current\").value=\"\";document.getElementById(\"next\").value=\"\";document.getElementById(\"confirm\").value=\"\";msg(\"Password changed. Returning to the portal…\");const back=await api(\"/api/student/account-return\",{});setTimeout(()=>location.replace(back.returnUrl),250);}catch(error){msg(error.message||\"Password change failed.\",true);document.getElementById(\"save\").disabled=false;}});document.getElementById(\"signout\").addEventListener(\"click\",async()=>{try{await api(\"/api/auth/logout\",{});}catch(_){}sessionStorage.removeItem(\"c10_account_session_token\");token=\"\";msg(\"Signed out.\");form.hidden=true;});boot().catch(e=>msg(e.message||\"Unable to load student account.\",true));})();</script></main></body></html>";
const isoNow = () => new Date().toISOString();
const randomBytes = length => crypto.getRandomValues(new Uint8Array(length));
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2,"0")).join("");
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const randomToken = (length=32) => base64url(randomBytes(length));
const uid = () => crypto.randomUUID();
const sha256 = async value => hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)))));
const allowedAdmins = env => new Set(String(env.ADMIN_GITHUB_USERS||"").split(",").map(x=>x.trim().replace(/^@/,"").toLowerCase()).filter(Boolean));
const frontendOrigin = env => String(env.FRONTEND_ORIGIN||"https://ai-hobbiest.github.io").replace(/\/+$/,"");
const adminUrl = env => String(env.FRONTEND_ADMIN_URL||"https://ai-hobbiest.github.io/C10-Playground/admin.html");
const apiPublicUrl = env => String(env.API_PUBLIC_URL||"").replace(/\/+$/,"");

function headersFor(request,env,extra={}) {
  const origin=request.headers.get("Origin")||"";
  const allowed=new Set([frontendOrigin(env),"http://localhost:8787","http://127.0.0.1:8787"]);
  const headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Vary":"Origin",...extra});
  if(allowed.has(origin)){headers.set("Access-Control-Allow-Origin",origin);headers.set("Access-Control-Allow-Headers","Authorization, Content-Type");headers.set("Access-Control-Allow-Methods","GET, POST, PATCH, DELETE, OPTIONS");headers.set("Access-Control-Max-Age","600");}
  return headers;
}
function json(request,env,payload,status=200,extra={}) {
  return new Response(JSON.stringify(payload),{status,headers:headersFor(request,env,extra)});
}
function fail(request,env,status,message) { return json(request,env,{ok:false,error:message},status); }
function redirect(location) { return new Response(null,{status:302,headers:{Location:location,"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}}); }
async function readJson(request) {
  const length=Number(request.headers.get("Content-Length")||0);
  if(length>1024*1024)throw new Error("Request body is too large (limit 1 MB).");
  try{return await request.json();}catch(_){throw new Error("Request body must be valid JSON.");}
}
function validPassword(password) { return typeof password==="string"&&password.length>=12&&password.length<=256&&/[A-Za-z]/.test(password)&&/\d/.test(password); }
function makeTempPassword() {
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out="";for(const byte of randomBytes(20))out+=alphabet[byte%alphabet.length];return out;
}
function passwordSalt() { return base64url(randomBytes(16)); }
async function passwordHash(password,salt) {
  let encoded=salt.replace(/-/g,"+").replace(/_/g,"/");
  encoded+="=".repeat((4-encoded.length%4)%4);
  const saltBytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:saltBytes,iterations:PASSWORD_ITERATIONS},material,256)));
}
function equalText(a,b) {
  const x=String(a||""),y=String(b||"");if(x.length!==y.length)return false;
  let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);return diff===0;
}
function adminAllowed(env,login) { return allowedAdmins(env).has(String(login||"").toLowerCase()); }
async function writeAudit(env,actor,action,target,details={}) {
  await env.DB.prepare("INSERT INTO audit_logs(actor_user_id,action,target_id,details_json,created_at) VALUES(?,?,?,?,?)")
    .bind(actor||null,action,target==null?null:String(target),JSON.stringify(details),isoNow()).run();
}
async function createSession(env,userId) {
  const token=randomToken(32),now=isoNow(),expires=new Date(Date.now()+SESSION_HOURS*3600*1000).toISOString();
  await env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?)")
    .bind(await sha256(token),userId,expires,now,now).run();
  return {token,expiresAt:expires};
}
async function identify(request,env) {
  const match=(request.headers.get("Authorization")||"").match(/^Bearer ([A-Za-z0-9_-]{30,100})$/);
  if(!match)return null;
  const row=await env.DB.prepare("SELECT s.token_hash,s.expires_at,u.id AS user_id,u.username,u.role,u.github_login,u.enabled,u.must_change_password,p.student_id,p.display_name,p.school,p.class_id,p.city,p.state,p.status AS profile_status,p.created_at AS profile_created_at,p.updated_at AS profile_updated_at FROM auth_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN student_profiles p ON p.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?")
    .bind(await sha256(match[1]),isoNow()).first();
  if(!row||row.enabled!==1)return null;
  if(row.role==="admin"&&!adminAllowed(env,row.github_login))return null;
  if(row.role==="student"&&row.profile_status!=="active")return null;
  return row;
}
function profileFor(row) {
  return {profileId:row.user_id,studentId:row.student_id,displayName:row.display_name,school:row.school,classLevel:String(row.class_id),city:row.city,state:row.state,createdAt:row.profile_created_at,updatedAt:row.profile_updated_at};
}
function publicUser(row) {
  return {id:row.user_id||row.id,username:row.username,role:row.role,githubLogin:row.github_login||null,studentId:row.student_id||null,displayName:row.display_name||row.github_login||row.username,mustChangePassword:Number(row.must_change_password)===1};
}
async function requireAuth(request,env) {
  const who=await identify(request,env);
  return who?{who}:{error:fail(request,env,401,"Sign in required or session expired.")};
}
async function lockoutCheck(env,identifier) {
  const id=await sha256(String(identifier).trim().toLowerCase());
  const row=await env.DB.prepare("SELECT failures,window_started_at,locked_until FROM login_limits WHERE identifier_hash=?").bind(id).first();
  return row&&row.locked_until&&row.locked_until>isoNow()?{locked:true,id,until:row.locked_until,row}:{locked:false,id,row};
}
async function recordLoginFailure(env,limit) {
  const now=Date.now(),row=limit.row,windowStart=row?new Date(row.window_started_at).getTime():0;
  const sameWindow=!!row&&now-windowStart<15*60*1000;
  const failures=(sameWindow?Number(row.failures):0)+1;
  const start=sameWindow?row.window_started_at:isoNow();
  const locked=failures>=8?new Date(now+15*60*1000).toISOString():null;
  await env.DB.prepare("INSERT INTO login_limits(identifier_hash,failures,window_started_at,locked_until) VALUES(?,?,?,?) ON CONFLICT(identifier_hash) DO UPDATE SET failures=excluded.failures,window_started_at=excluded.window_started_at,locked_until=excluded.locked_until")
    .bind(limit.id,failures,start,locked).run();
  return !!locked;
}
async function recordLoginSuccess(env,limit) { await env.DB.prepare("DELETE FROM login_limits WHERE identifier_hash=?").bind(limit.id).run(); }
async function findClass(env,classId) { return env.DB.prepare("SELECT class_id,label,active FROM classes WHERE class_id=?").bind(String(classId)).first(); }
function validProfileFields(value) {
  return !!value&&typeof value.displayName==="string"&&value.displayName.trim().length>0&&value.displayName.length<=80&&
    typeof value.school==="string"&&value.school.trim().length>0&&value.school.length<=160&&
    typeof value.classId==="string"&&/^[A-Za-z0-9_-]{1,20}$/.test(value.classId)&&
    typeof value.city==="string"&&value.city.trim().length>0&&value.city.length<=100&&INDIAN_STATES_AND_UTS.has(value.state);
}

async function studentLogin(request,env) {
  const body=await readJson(request),username=String(body.username||body.studentId||"").trim().toUpperCase(),password=String(body.password||"");
  if(!username||!password)return fail(request,env,400,"Enter your Student ID and password.");
  const limit=await lockoutCheck(env,username);
  if(limit.locked)return fail(request,env,429,"Too many login attempts. Try again after 15 minutes.");
  const row=await env.DB.prepare("SELECT u.*,p.student_id,p.display_name,p.school,p.class_id,p.city,p.state,p.status AS profile_status,p.created_at AS profile_created_at,p.updated_at AS profile_updated_at FROM users u JOIN student_profiles p ON p.user_id=u.id WHERE (upper(u.username)=? OR upper(p.student_id)=?) AND u.role='student' LIMIT 1")
    .bind(username,username).first();
  let matches=false;
  if(row&&row.password_salt&&row.password_hash)matches=equalText(await passwordHash(password,row.password_salt),row.password_hash);
  else await passwordHash(password,"AAAAAAAAAAAAAAAAAAAAAA");
  if(!row||row.enabled!==1||row.profile_status!=="active"||!matches){
    const locked=await recordLoginFailure(env,limit);
    return fail(request,env,locked?429:401,locked?"Too many login attempts. Try again after 15 minutes.":"Student ID or password is incorrect.");
  }
  await recordLoginSuccess(env,limit);
  const session=await createSession(env,row.id);
  return json(request,env,{ok:true,...session,user:publicUser(row),profile:profileFor({...row,user_id:row.id})},200);
}
function htmlResponse(html) {
  return new Response(html,{status:200,headers:{
    "Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer","X-Frame-Options":"DENY",
    "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  }});
}
async function createHandoffCode(env,userId,type) {
  const code=randomToken(32),now=isoNow(),expires=new Date(Date.now()+60*1000).toISOString();
  await env.DB.prepare("INSERT INTO handoff_codes(code_hash,user_id,code_type,expires_at,created_at) VALUES(?,?,?,?,?)").bind(await sha256(code),userId,type,expires,now).run();
  return code;
}
async function exchangeHandoff(request,env,body,expectedType) {
  const code=String(body.code||"");
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(code))return fail(request,env,400,"Invalid or expired student handoff code.");
  const hash=await sha256(code),row=await env.DB.prepare("SELECT user_id,code_type,expires_at FROM handoff_codes WHERE code_hash=?").bind(hash).first();
  await env.DB.prepare("DELETE FROM handoff_codes WHERE code_hash=?").bind(hash).run();
  if(!row||row.code_type!==expectedType||row.expires_at<=isoNow())return fail(request,env,401,"This sign-in link has expired or was already used.");
  const user=await env.DB.prepare("SELECT u.id AS user_id,u.username,u.role,u.github_login,u.enabled,u.must_change_password,p.student_id,p.display_name,p.school,p.class_id,p.city,p.state,p.status AS profile_status,p.created_at AS profile_created_at,p.updated_at AS profile_updated_at FROM users u LEFT JOIN student_profiles p ON p.user_id=u.id WHERE u.id=?").bind(row.user_id).first();
  if(!user||user.enabled!==1||user.role!=="student"||user.profile_status!=="active")return fail(request,env,403,"Student account is disabled.");
  const session=await createSession(env,user.user_id);
  return json(request,env,{ok:true,...session,user:publicUser(user),profile:profileFor(user),mustChangePassword:Number(user.must_change_password)===1});
}
async function studentAccountLink(request,env,who) {
  if(who.role!=="student")return fail(request,env,403,"Student account required.");
  const code=await createHandoffCode(env,who.user_id,"account-access");
  return json(request,env,{ok:true,url:apiPublicUrl(env)+"/student-account#account_code="+encodeURIComponent(code)});
}
async function studentAccountReturn(request,env,who) {
  if(who.role!=="student")return fail(request,env,403,"Student account required.");
  const code=await createHandoffCode(env,who.user_id,"account-return");
  const profileUrl=String(env.FRONTEND_PROFILE_URL||"https://ai-hobbiest.github.io/C10-Playground/profile.html");
  return json(request,env,{ok:true,returnUrl:profileUrl+"#student_code="+encodeURIComponent(code)});
}

async function githubStart(request,env) {
  if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||!env.API_PUBLIC_URL)return fail(request,env,503,"GitHub sign-in is not configured on the API service.");
  if(!allowedAdmins(env).size)return fail(request,env,503,"No authorised GitHub admin accounts are configured.");
  const state=randomToken(32),now=isoNow(),expires=new Date(Date.now()+10*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO oauth_states(state_hash,expires_at,created_at) VALUES(?,?,?)").bind(await sha256(state),expires,now).run();
  const target=new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id",env.GITHUB_CLIENT_ID);
  target.searchParams.set("redirect_uri",apiPublicUrl(env)+"/api/auth/github/callback");
  target.searchParams.set("scope","read:user");target.searchParams.set("state",state);
  return redirect(target.toString());
}
async function githubCallback(request,env) {
  const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state");
  if(!code||!state)return redirect(adminUrl(env)+"#auth_error=github_authorization_cancelled");
  const stateHash=await sha256(state),stateRow=await env.DB.prepare("SELECT expires_at FROM oauth_states WHERE state_hash=?").bind(stateHash).first();
  await env.DB.prepare("DELETE FROM oauth_states WHERE state_hash=?").bind(stateHash).run();
  if(!stateRow||stateRow.expires_at<=isoNow())return redirect(adminUrl(env)+"#auth_error=invalid_oauth_state");
  const tokenResponse=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","User-Agent":"C10-Playground"},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:apiPublicUrl(env)+"/api/auth/github/callback"})});
  const tokenBody=await tokenResponse.json().catch(()=>({}));
  if(!tokenResponse.ok||!tokenBody.access_token)return redirect(adminUrl(env)+"#auth_error=github_token_exchange_failed");
  const userResponse=await fetch("https://api.github.com/user",{headers:{"Authorization":"Bearer "+tokenBody.access_token,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"C10-Playground"}});
  const gh=await userResponse.json().catch(()=>({})),login=String(gh.login||"");
  if(!userResponse.ok||!login||!adminAllowed(env,login))return redirect(adminUrl(env)+"#auth_error=github_account_not_authorized");
  const authCode=randomToken(32),now=isoNow(),expires=new Date(Date.now()+60*1000).toISOString();
  await env.DB.prepare("INSERT INTO oauth_codes(code_hash,github_login,expires_at,created_at) VALUES(?,?,?,?)").bind(await sha256(authCode),login,expires,now).run();
  return redirect(adminUrl(env)+"#auth_code="+encodeURIComponent(authCode));
}
async function exchangeGithubCode(request,env) {
  const body=await readJson(request),code=String(body.code||"");
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(code))return fail(request,env,400,"Invalid or expired GitHub sign-in code.");
  const hash=await sha256(code),row=await env.DB.prepare("SELECT github_login,expires_at FROM oauth_codes WHERE code_hash=?").bind(hash).first();
  await env.DB.prepare("DELETE FROM oauth_codes WHERE code_hash=?").bind(hash).run();
  if(!row||row.expires_at<=isoNow()||!adminAllowed(env,row.github_login))return fail(request,env,401,"GitHub sign-in code expired or already used.");
  const userId=uid(),now=isoNow(),username="github:"+row.github_login.toLowerCase();
  await env.DB.prepare("INSERT INTO users(id,username,role,github_login,enabled,must_change_password,created_at,updated_at) VALUES(?,?,'admin',?,1,0,?,?) ON CONFLICT(github_login) DO UPDATE SET username=excluded.username,role='admin',enabled=1,updated_at=excluded.updated_at")
    .bind(userId,username,row.github_login,now,now).run();
  const admin=await env.DB.prepare("SELECT * FROM users WHERE github_login=?").bind(row.github_login).first();
  if(!admin)return fail(request,env,500,"Unable to create admin session.");
  const session=await createSession(env,admin.id);
  await writeAudit(env,admin.id,"admin-login",row.github_login,{provider:"github"});
  return json(request,env,{ok:true,...session,user:{id:admin.id,username:admin.github_login,githubLogin:admin.github_login,role:"admin",mustChangePassword:false}});
}
async function logout(request,env,who) {
  const token=(request.headers.get("Authorization")||"").slice(7);
  if(token)await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(await sha256(token)).run();
  return json(request,env,{ok:true});
}
async function getStudentMe(request,env,who) { return json(request,env,{ok:true,user:publicUser(who),profile:profileFor(who),mustChangePassword:Number(who.must_change_password)===1}); }
async function updateStudentProfile(request,env,who) {
  const body=await readJson(request),profile={displayName:String(body.displayName||"").trim(),school:String(body.school||"").trim(),classId:String(body.classId||body.classLevel||""),city:String(body.city||"").trim(),state:String(body.state||"").trim()};
  if(!validProfileFields(profile))return fail(request,env,400,"Complete display name, school, class, city and valid Indian State/UT fields.");
  const cls=await findClass(env,profile.classId);if(!cls||cls.active!==1)return fail(request,env,400,"That class is not active.");
  const now=isoNow();
  await env.DB.prepare("UPDATE student_profiles SET display_name=?,school=?,class_id=?,city=?,state=?,updated_at=? WHERE user_id=? AND status='active'").bind(profile.displayName,profile.school,profile.classId,profile.city,profile.state,now,who.user_id).run();
  await writeAudit(env,who.user_id,"student-profile-updated",who.student_id,{});
  const fresh=await env.DB.prepare("SELECT u.id AS user_id,p.student_id,p.display_name,p.school,p.class_id,p.city,p.state,p.created_at AS profile_created_at,p.updated_at AS profile_updated_at FROM users u JOIN student_profiles p ON p.user_id=u.id WHERE u.id=?").bind(who.user_id).first();
  return json(request,env,{ok:true,profile:profileFor(fresh)});
}
async function changeStudentPassword(request,env,who) {
  const body=await readJson(request),current=String(body.currentPassword||""),next=String(body.newPassword||"");
  if(!validPassword(next))return fail(request,env,400,"New password must be at least 12 characters and contain letters and numbers.");
  const user=await env.DB.prepare("SELECT password_salt,password_hash FROM users WHERE id=? AND role='student'").bind(who.user_id).first();
  if(!user)return fail(request,env,403,"Student account required.");
  if(user.password_salt&&user.password_hash&&!equalText(await passwordHash(current,user.password_salt),user.password_hash))return fail(request,env,401,"Current password is incorrect.");
  const salt=passwordSalt(),hash=await passwordHash(next,salt),now=isoNow();
  await env.DB.prepare("UPDATE users SET password_salt=?,password_hash=?,must_change_password=0,updated_at=? WHERE id=?").bind(salt,hash,now,who.user_id).run();
  const currentTokenHash=await sha256((request.headers.get("Authorization")||"").slice(7));
  await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id=? AND token_hash<>?").bind(who.user_id,currentTokenHash).run();
  await writeAudit(env,who.user_id,"student-password-changed",who.student_id,{});
  return json(request,env,{ok:true,message:"Password changed successfully."});
}
async function getStudentAttempts(request,env,who) {
  const rows=await env.DB.prepare("SELECT attempt_id,subject_id,mode,status,started_at,submitted_at,duration_seconds,score,max_score,percentage,payload_json FROM attempts WHERE user_id=? ORDER BY submitted_at DESC LIMIT 500").bind(who.user_id).all();
  return json(request,env,{ok:true,attempts:(rows.results||[]).map(row=>({attemptId:row.attempt_id,subjectId:row.subject_id,mode:row.mode,status:row.status,startedAt:row.started_at,submittedAt:row.submitted_at,durationSeconds:row.duration_seconds,score:row.score,maxScore:row.max_score,percentage:row.percentage,payload:JSON.parse(row.payload_json||"{}")}))});
}
async function saveStudentAttempt(request,env,who) {
  const body=await readJson(request),attempt=body.attempt&&typeof body.attempt==="object"?body.attempt:body;
  const id=String(attempt.attemptId||""),subject=String(attempt.subjectId||""),status=String(attempt.status||""),mode=String(attempt.mode||"");
  const score=Number(attempt.score??attempt.correctCount),maxScore=Number(attempt.maxScore??attempt.questionCount),duration=Math.max(0,Math.floor(Number(attempt.durationSeconds)||0)),submittedAt=String(attempt.submittedAt||"");
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(id)||!SUBJECTS.has(subject)||!MODES.has(mode)||!["submitted","timed-out"].includes(status)||!Number.isInteger(score)||!Number.isInteger(maxScore)||maxScore<1||score<0||score>maxScore||!Number.isFinite(Date.parse(submittedAt)))return fail(request,env,400,"Attempt payload is missing required fields or contains an invalid score/status.");
  const answers=Array.isArray(attempt.answers)?attempt.answers:[],questions=Array.isArray(attempt.questions)?attempt.questions:[];
  const payload={questionCount:maxScore,questionIds:Array.isArray(attempt.questionIds)?attempt.questionIds.slice(0,300):questions.slice(0,300).map(q=>String(q.questionKey||q.id||"")),answers:answers.slice(0,300).map((a,i)=>({questionId:String(a?.questionId||a?.record?.questionId||questions[i]?.questionKey||questions[i]?.id||""),status:String(a?.status||"unanswered"),isCorrect:a?.isCorrect===true||a?.correct===true,selectedOptionId:a?.selectedOptionId??a?.record?.selectedOptionId??null,timeSpentSeconds:Math.max(0,Math.floor(Number(a?.timeSpentSeconds||a?.record?.timeSpentSeconds)||0))}))};
  try{
    await env.DB.prepare("INSERT INTO attempts(attempt_id,user_id,subject_id,mode,status,started_at,submitted_at,duration_seconds,score,max_score,percentage,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,who.user_id,subject,mode,status,attempt.startedAt||null,submittedAt,duration,score,maxScore,Math.round(score/maxScore*10000)/100,JSON.stringify(payload),isoNow()).run();
  }catch(_){
    const existing=await env.DB.prepare("SELECT user_id FROM attempts WHERE attempt_id=?").bind(id).first();
    if(existing&&existing.user_id===who.user_id)return json(request,env,{ok:true,duplicate:true});
    return fail(request,env,409,"This attempt ID already exists or could not be stored.");
  }
  await writeAudit(env,who.user_id,"test-attempt-saved",id,{subjectId:subject,score,maxScore});
  return json(request,env,{ok:true,attemptId:id,percentage:Math.round(score/maxScore*10000)/100},201);
}
async function health(request,env) {
  if(!env.DB)return fail(request,env,503,"D1 database binding DB is not configured.");
  try{await env.DB.prepare("SELECT 1 AS ok").first();return json(request,env,{ok:true,service:"c10-playground-api",database:"connected"});}
  catch(_){return fail(request,env,503,"Database is not initialised. Apply cloudflare/schema.sql first.");}
}
async function adminListClasses(request,env) {
  const rows=await env.DB.prepare("SELECT class_id AS classId,label,sort_order AS sortOrder,active FROM classes ORDER BY sort_order,label").all();
  return json(request,env,{ok:true,classes:rows.results||[]});
}
async function adminWriteClass(request,env,who) {
  const body=await readJson(request),id=String(body.classId||"").trim(),label=String(body.label||"").trim();
  if(!/^[A-Za-z0-9_-]{1,20}$/.test(id)||!label||label.length>80)return fail(request,env,400,"Enter a safe class ID and label (max 80 characters).");
  const sort=Number.isInteger(Number(body.sortOrder))?Number(body.sortOrder):0,now=isoNow();
  try{await env.DB.prepare("INSERT INTO classes(class_id,label,sort_order,active,created_at,updated_at) VALUES(?,?,?,1,?,?)").bind(id,label,sort,now,now).run();}
  catch(_){return fail(request,env,409,"That class ID already exists.");}
  await writeAudit(env,who.user_id,"class-created",id,{label});return json(request,env,{ok:true,class:{classId:id,label,sortOrder:sort,active:1}},201);
}
async function adminUpdateClass(request,env,who,id) {
  const body=await readJson(request),current=await env.DB.prepare("SELECT class_id,label,sort_order,active FROM classes WHERE class_id=?").bind(id).first();
  if(!current)return fail(request,env,404,"Class not found.");
  const label=body.label===undefined?current.label:String(body.label).trim(),active=body.active===undefined?current.active:(body.active?1:0),sort=body.sortOrder===undefined?current.sort_order:Number(body.sortOrder);
  if(!label||label.length>80||![0,1].includes(active)||!Number.isFinite(sort))return fail(request,env,400,"Invalid class update.");
  await env.DB.prepare("UPDATE classes SET label=?,active=?,sort_order=?,updated_at=? WHERE class_id=?").bind(label,active,sort,isoNow(),id).run();
  await writeAudit(env,who.user_id,"class-updated",id,{label,active});return json(request,env,{ok:true});
}
async function createStudent(request,env,who) {
  const body=await readJson(request),profile={displayName:String(body.displayName||"").trim(),school:String(body.school||"").trim(),classId:String(body.classId||""),city:String(body.city||"").trim(),state:String(body.state||"").trim()};
  if(!validProfileFields(profile))return fail(request,env,400,"Complete all required student profile fields.");
  const cls=await env.DB.prepare("SELECT class_id,active FROM classes WHERE class_id=?").bind(profile.classId).first();
  if(!cls||cls.active!==1)return fail(request,env,400,"Choose an active class.");
  let studentId=String(body.studentId||"").trim().toUpperCase();if(!studentId)studentId="C10-"+randomToken(8).slice(0,8).toUpperCase();
  if(!/^C10-[A-Z0-9-]{4,20}$/.test(studentId))return fail(request,env,400,"Student ID must look like C10-XXXXXXXX.");
  const password=String(body.password||makeTempPassword());if(!validPassword(password))return fail(request,env,400,"Initial password must be at least 12 characters and contain letters and numbers.");
  const userId=uid(),now=isoNow(),salt=passwordSalt(),hash=await passwordHash(password,salt);
  try{
    await env.DB.prepare("INSERT INTO users(id,username,role,password_salt,password_hash,enabled,must_change_password,created_at,updated_at) VALUES(?,?,'student',?,?,1,1,?,?)").bind(userId,studentId,salt,hash,now,now).run();
    await env.DB.prepare("INSERT INTO student_profiles(user_id,student_id,display_name,school,class_id,city,state,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'active',?,?)").bind(userId,studentId,profile.displayName,profile.school,profile.classId,profile.city,profile.state,now,now).run();
  }catch(_){await env.DB.prepare("DELETE FROM users WHERE id=?").bind(userId).run();return fail(request,env,409,"A student account with that Student ID already exists.");}
  await writeAudit(env,who.user_id,"student-created",studentId,{classId:profile.classId});
  return json(request,env,{ok:true,student:{userId,studentId,...profile,status:"active"},temporaryPassword:password,mustChangePassword:true},201);
}
async function adminListStudents(request,env) {
  const rows=await env.DB.prepare("SELECT p.student_id AS studentId,p.display_name AS displayName,p.school,p.class_id AS classId,p.city,p.state,p.status,u.enabled,u.must_change_password AS mustChangePassword,COUNT(a.attempt_id) AS attemptCount,ROUND(AVG(a.percentage),1) AS averageScore,MAX(a.submitted_at) AS lastActivity FROM student_profiles p JOIN users u ON u.id=p.user_id LEFT JOIN attempts a ON a.user_id=u.id WHERE p.status!='removed' GROUP BY p.user_id ORDER BY p.display_name,p.student_id").all();
  return json(request,env,{ok:true,students:rows.results||[]});
}
async function adminUpdateStudent(request,env,who,studentId) {
  const body=await readJson(request),current=await env.DB.prepare("SELECT p.*,u.id AS account_id FROM student_profiles p JOIN users u ON u.id=p.user_id WHERE upper(p.student_id)=upper(?)").bind(studentId).first();
  if(!current||current.status==="removed")return fail(request,env,404,"Student account not found.");
  const profile={displayName:String(body.displayName??current.display_name).trim(),school:String(body.school??current.school).trim(),classId:String(body.classId??current.class_id),city:String(body.city??current.city).trim(),state:String(body.state??current.state).trim()};
  if(!validProfileFields(profile))return fail(request,env,400,"Complete all required profile fields.");
  const cls=await env.DB.prepare("SELECT active FROM classes WHERE class_id=?").bind(profile.classId).first();
  if(!cls||cls.active!==1)return fail(request,env,400,"Choose an active class.");
  const status=body.status===undefined?current.status:String(body.status);
  if(!["active","suspended"].includes(status))return fail(request,env,400,"Status must be active or suspended.");
  const now=isoNow();
  await env.DB.prepare("UPDATE student_profiles SET display_name=?,school=?,class_id=?,city=?,state=?,status=?,updated_at=? WHERE user_id=?").bind(profile.displayName,profile.school,profile.classId,profile.city,profile.state,status,now,current.user_id).run();
  await env.DB.prepare("UPDATE users SET enabled=?,updated_at=? WHERE id=?").bind(status==="active"?1:0,now,current.account_id).run();
  if(status!=="active")await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id=?").bind(current.account_id).run();
  await writeAudit(env,who.user_id,"student-updated",studentId,{status,classId:profile.classId});
  return json(request,env,{ok:true,student:{studentId,...profile,status}});
}
async function adminRemoveStudent(request,env,who,studentId) {
  const row=await env.DB.prepare("SELECT user_id,status FROM student_profiles WHERE upper(student_id)=upper(?)").bind(studentId).first();
  if(!row||row.status==="removed")return fail(request,env,404,"Student account not found.");
  const now=isoNow();
  await env.DB.prepare("UPDATE student_profiles SET status='removed',updated_at=? WHERE user_id=?").bind(now,row.user_id).run();
  await env.DB.prepare("UPDATE users SET enabled=0,updated_at=? WHERE id=?").bind(now,row.user_id).run();
  await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id=?").bind(row.user_id).run();
  await writeAudit(env,who.user_id,"student-removed",studentId,{softDelete:true});
  return json(request,env,{ok:true,message:"Login disabled. Historical attempts are retained for audit and excluded from active reports."});
}
async function adminResetStudentPassword(request,env,who,studentId) {
  const current=await env.DB.prepare("SELECT u.id FROM users u JOIN student_profiles p ON p.user_id=u.id WHERE upper(p.student_id)=upper(?) AND p.status='active'").bind(studentId).first();
  if(!current)return fail(request,env,404,"Active student account not found.");
  const password=makeTempPassword(),salt=passwordSalt(),hash=await passwordHash(password,salt),now=isoNow();
  await env.DB.prepare("UPDATE users SET password_salt=?,password_hash=?,must_change_password=1,updated_at=? WHERE id=?").bind(salt,hash,now,current.id).run();
  await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id=?").bind(current.id).run();
  await writeAudit(env,who.user_id,"student-password-reset",studentId,{mustChangePassword:true});
  return json(request,env,{ok:true,studentId,temporaryPassword:password,mustChangePassword:true,message:"Copy this temporary password now and share it privately. It will not be shown again."});
}
async function adminProgressReport(request,env) {
  const url=new URL(request.url),classId=url.searchParams.get("classId")||"",subject=url.searchParams.get("subjectId")||"";
  if(subject&&!SUBJECTS.has(subject))return fail(request,env,400,"Unknown subject filter.");
  const clauses=["p.status='active'","u.role='student'"],binds=[];
  if(classId){clauses.push("p.class_id=?");binds.push(classId);}
  if(subject){clauses.push("a.subject_id=?");binds.push(subject);}
  const rows=await env.DB.prepare("SELECT p.student_id AS studentId,p.display_name AS displayName,p.school,p.class_id AS classId,p.city,p.state,a.attempt_id AS attemptId,a.subject_id AS subjectId,a.mode,a.status,a.started_at AS startedAt,a.submitted_at AS submittedAt,a.duration_seconds AS durationSeconds,a.score,a.max_score AS maxScore,a.percentage FROM student_profiles p JOIN users u ON u.id=p.user_id LEFT JOIN attempts a ON a.user_id=u.id WHERE "+clauses.join(" AND ")+" ORDER BY a.submitted_at DESC LIMIT 5000").bind(...binds).all();
  return json(request,env,{ok:true,filters:{classId,subjectId:subject},rows:rows.results||[]});
}
async function adminLeaderboard(request,env) {
  const url=new URL(request.url),classId=url.searchParams.get("classId")||"",subject=url.searchParams.get("subjectId")||"";
  if(subject&&!SUBJECTS.has(subject))return fail(request,env,400,"Unknown subject filter.");
  const clauses=["p.status='active'","u.role='student'","a.status IN ('submitted','timed-out')"],binds=[];
  if(classId){clauses.push("p.class_id=?");binds.push(classId);}
  if(subject){clauses.push("a.subject_id=?");binds.push(subject);}
  const rows=await env.DB.prepare("SELECT p.student_id AS studentId,p.display_name AS displayName,p.school,p.class_id AS classId,COUNT(a.attempt_id) AS testsCompleted,ROUND(AVG(a.percentage),1) AS averageScore,MAX(a.percentage) AS bestScore,MAX(a.submitted_at) AS lastActivity FROM student_profiles p JOIN users u ON u.id=p.user_id JOIN attempts a ON a.user_id=u.id WHERE "+clauses.join(" AND ")+" GROUP BY p.user_id ORDER BY averageScore DESC,testsCompleted DESC,p.display_name ASC LIMIT 500").bind(...binds).all();
  return json(request,env,{ok:true,filters:{classId,subjectId:subject},leaderboard:(rows.results||[]).map((r,i)=>({...r,rank:i+1}))});
}
async function health(request,env) {
  if(!env.DB)return fail(request,env,503,"D1 database binding DB is not configured.");
  try{await env.DB.prepare("SELECT 1 AS ok").first();return json(request,env,{ok:true,service:"c10-playground-api",database:"connected"});}
  catch(_){return fail(request,env,503,"D1 is not initialised. Apply cloudflare/schema.sql first.");}
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url),path=url.pathname,method=request.method.toUpperCase();
    if(method==="OPTIONS")return new Response(null,{status:204,headers:headersFor(request,env)});
    try {
      if(path==="/api/health"&&method==="GET")return await health(request,env);
      if(path==="/api/auth/github/start"&&method==="GET")return await githubStart(request,env);
      if(path==="/api/auth/github/callback"&&method==="GET")return await githubCallback(request,env);
      if(path==="/api/auth/exchange"&&method==="POST")return await exchangeGithubCode(request,env);
      if(path==="/api/student/login"&&method==="POST")return await studentLogin(request,env);

      const auth=await requireAuth(request,env);if(auth.error)return auth.error;const who=auth.who;
      if(who.role==="student"&&Number(who.must_change_password)===1&&
         !((path==="/api/auth/me"&&method==="GET")||(path==="/api/auth/logout"&&method==="POST")||(path==="/api/student/change-password"&&method==="POST"))) {
        return fail(request,env,403,"Change your temporary password before accessing student data.");
      }
      if(path==="/api/auth/me"&&method==="GET"){
        await env.DB.prepare("UPDATE auth_sessions SET last_seen_at=? WHERE token_hash=?").bind(isoNow(),await sha256((request.headers.get("Authorization")||"").slice(7))).run();
        return json(request,env,{ok:true,user:publicUser(who),profile:who.role==="student"?profileFor(who):null,mustChangePassword:Number(who.must_change_password)===1});
      }
      if(path==="/api/auth/logout"&&method==="POST")return await logout(request,env,who);
      if(path==="/api/student/me"&&method==="GET"){if(who.role!=="student")return fail(request,env,403,"Student account required.");return await getStudentMe(request,env,who);}
      if(path==="/api/student/profile"&&method==="PATCH"){if(who.role!=="student")return fail(request,env,403,"Student account required.");return await updateStudentProfile(request,env,who);}
      if(path==="/api/student/change-password"&&method==="POST"){if(who.role!=="student")return fail(request,env,403,"Student account required.");return await changeStudentPassword(request,env,who);}
      if(path==="/api/student/attempts"&&method==="GET"){if(who.role!=="student")return fail(request,env,403,"Student account required.");return await getStudentAttempts(request,env,who);}
      if(path==="/api/student/attempts"&&method==="POST"){if(who.role!=="student")return fail(request,env,403,"Student account required.");return await saveStudentAttempt(request,env,who);}

      if(who.role!=="admin"||!adminAllowed(env,who.github_login))return fail(request,env,403,"Authorised GitHub administrator required.");
      if(path==="/api/admin/classes"&&method==="GET")return await adminListClasses(request,env);
      if(path==="/api/admin/classes"&&method==="POST")return await adminWriteClass(request,env,who);
      const classMatch=path.match(/^\/api\/admin\/classes\/([A-Za-z0-9_-]+)$/);
      if(classMatch&&method==="PATCH")return await adminUpdateClass(request,env,who,decodeURIComponent(classMatch[1]));
      if(path==="/api/admin/students"&&method==="GET")return await adminListStudents(request,env);
      if(path==="/api/admin/students"&&method==="POST")return await createStudent(request,env,who);
      const studentMatch=path.match(/^\/api\/admin\/students\/([^/]+)(?:\/(password-reset))?$/);
      if(studentMatch){const studentId=decodeURIComponent(studentMatch[1]);if(studentMatch[2]==="password-reset"&&method==="POST")return await adminResetStudentPassword(request,env,who,studentId);if(!studentMatch[2]&&method==="PATCH")return await adminUpdateStudent(request,env,who,studentId);if(!studentMatch[2]&&method==="DELETE")return await adminRemoveStudent(request,env,who,studentId);}
      if(path==="/api/admin/reports/progress"&&method==="GET")return await adminProgressReport(request,env);
      if(path==="/api/admin/reports/leaderboard"&&method==="GET")return await adminLeaderboard(request,env);
      return fail(request,env,404,"API route not found.");
    } catch(error) {
      if(error&&error.message&&/Request body/.test(error.message))return fail(request,env,400,error.message);
      return fail(request,env,500,"Request failed. Check Cloudflare Worker logs for details.");
    }
  }
};
