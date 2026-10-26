/* Guard the learner dashboard: a valid published student account is required. */
(() => {
  "use strict";
  const key="c10playground_static_student_v1";
  let present=false;
  try{present=!!JSON.parse(sessionStorage.getItem(key)||"null")?.username;}catch(_){}
  if(!present){location.replace("./index.html");return;}
  if(window.C10StudentAuth&&window.C10StudentAuth.restoreSession){
    window.C10StudentAuth.restoreSession().then(account=>{if(!account)location.replace("./index.html");})
      .catch(()=>location.replace("./index.html"));
  }
})();
