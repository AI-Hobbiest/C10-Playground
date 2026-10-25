/* C10 Playground Admin Workspace.
 * This is a local authoring/reporting workbench. It does not authenticate users,
 * publish files, store credentials, or send student backups to a server.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const SUBJECTS = {
    science:"Science",mathematics:"Mathematics",english:"English",
    "social-science":"Social Science",hindi:"Hindi"
  };
  const EMPTY_CLASSES={schemaVersion:1,kind:"class-catalog",classes:[]};
  const EMPTY_MANIFEST={schemaVersion:1,kind:"knowledge-base-manifest",resources:[]};
  let classCatalog=structuredCloneSafe(EMPTY_CLASSES);
  let knowledgeManifest=structuredCloneSafe(EMPTY_MANIFEST);
  let bankSubject="science",bank=[],selectedChapter=0,selectedQuestion=-1,selectedImages=[];
  let bankDirty=false,bankLoaded=false,classesDirty=false,manifestDirty=false;
  let pendingAssets=[],selectedImageFile=null,selectedImageUrl="";
  let pendingResources=[],selectedResourceFile=null,selectedResourceUrl="";
  let studentBackups=[],editingStudentProfileId=null;
  const pendingAssetByPath=new Map();

  function structuredCloneSafe(value){return JSON.parse(JSON.stringify(value));}
  function slug(value){return String(value||"file").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"file";}
  function setStatus(id,message,type=""){
    const el=$(id);if(!el)return;
    el.textContent=message;el.className="admin-status"+(type?" "+type:"");
  }
  function make(tag,cls,text){
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);return el;
  }
  function button(label,cls,onClick){
    const el=make("button","admin-btn"+(cls?" "+cls:""),label);el.type="button";el.addEventListener("click",onClick);return el;
  }
  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;a.style.display="none";document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function downloadJson(value,filename){
    downloadBlob(new Blob([JSON.stringify(value,null,2)+"\n"],{type:"application/json"}),filename);
  }
  function csvEscape(value){
    const s=value==null?"":String(value);
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function downloadCsv(rows,filename){
    const text=rows.map(row=>row.map(csvEscape).join(",")).join("\r\n");
    downloadBlob(new Blob(["\ufeff",text],{type:"text/csv;charset=utf-8"}),filename);
  }
  async function parseJsonFile(file){
    let value;try{value=JSON.parse(await file.text());}catch(_){throw new Error(file.name+" is not valid JSON.");}
    return value;
  }
  function activeClasses(){
    return classCatalog.classes.filter(item=>item.active!==false).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||String(a.label).localeCompare(String(b.label)));
  }
  function classLabel(id){
    const found=classCatalog.classes.find(item=>String(item.classId)===String(id));
    return found?found.label:(id?"Class "+id:"—");
  }
  function setTab(name){
    document.querySelectorAll(".admin-tab-button").forEach(item=>item.classList.toggle("active",item.dataset.tab===name));
    document.querySelectorAll(".admin-panel").forEach(item=>item.classList.toggle("active",item.id==="tab-"+name));
    if(name==="leaderboard")renderLeaderboard();
    if(name==="students")renderStudents();
  }
  function initTabs(){
    document.querySelectorAll(".admin-tab-button").forEach(item=>item.addEventListener("click",()=>setTab(item.dataset.tab)));
  }

  // QUESTION BANKS
  function normalizeImportedBank(data,subject){
    if(Array.isArray(data)){
      return data.map((chapter,i)=>({
        chapter_no:Number(chapter.chapter_no||chapter.chapterNo||i+1),
        title:String(chapter.title||"").trim(),
        key:String(chapter.key||chapter.chapterKey||slug(chapter.title)),
        section:chapter.section||"",
        questions:(chapter.questions||[]).map((q,j)=>({
          ...q,id:q.id??q.questionId??("q-"+(j+1)),
          question:String(q.question||q.prompt||""),
          options:Array.isArray(q.options)?q.options.map(o=>typeof o==="string"?o:String(o.text||"")):[],
          answer:Number(q.answer),explanation:String(q.explanation||""),
          difficulty:q.difficulty||"Medium",images:Array.isArray(q.images)?q.images:[]
        }))
      }));
    }
    if(data&&data.kind==="question-bank"&&data.schemaVersion===1){
      return window.C10QuestionBank.normalize(data,subject).map((chapter,i)=>({
        chapter_no:chapter.chapter_no||i+1,title:chapter.title,key:chapter.chapterKey,
        section:chapter.section||"",
        questions:chapter.questions.map(q=>({
          id:q.id,question:q.question,options:q.options,answer:q.answer,
          explanation:q.explanation,difficulty:q.difficulty,images:q.images||[]
        }))
      }));
    }
    throw new Error("Unsupported bank format. Import a legacy chapter-array JSON or a C10 Playground v1 question-bank JSON.");
  }
  function validateBank(data){
    if(!Array.isArray(data)||!data.length)throw new Error("A bank must contain at least one chapter.");
    const chapterIds=new Set();
    data.forEach((chapter,ci)=>{
      if(!chapter.title||!Array.isArray(chapter.questions))throw new Error("Chapter "+(ci+1)+" needs a title and questions array.");
      const chapterKey=String(chapter.key||slug(chapter.title));
      if(chapterIds.has(chapterKey))throw new Error("Duplicate chapter key: "+chapterKey);
      chapterIds.add(chapterKey);
      chapter.questions.forEach((q,qi)=>{
        const label="Chapter "+chapter.title+", question "+(qi+1);
        if(!String(q.id??"").trim())throw new Error(label+" needs an ID.");
        if(!String(q.question||"").trim())throw new Error(label+" needs question text.");
        if(!Array.isArray(q.options)||q.options.length<2||q.options.some(o=>!String(o||"").trim()))throw new Error(label+" needs at least two non-empty options.");
        if(!Number.isInteger(Number(q.answer))||Number(q.answer)<0||Number(q.answer)>=q.options.length)throw new Error(label+" has an invalid correct-answer index.");
        if(!String(q.explanation||"").trim())throw new Error(label+" needs an explanation.");
        q.images=window.C10QuestionBank.normalizeImages(q.images||[]);
      });
    });
    return true;
  }
  function questionCount(){return bank.reduce((n,c)=>n+c.questions.length,0);}
  function setBankDirty(message){
    bankDirty=true;
    setStatus("bankStatus",(message||"Question bank has draft changes.")+" Export the bank JSON before leaving this workspace.");
    updateSummary();
  }
  async function loadBank(){
    const subject=$("bankSubject").value;
    if(bankDirty&&!confirm("Discard unexported question-bank drafts and load another bank?"))return;
    bankSubject=subject;setStatus("bankStatus","Loading "+SUBJECTS[subject]+" bank…");
    try{
      const response=await fetch("./data/"+subject+".json",{cache:"no-store"});
      if(!response.ok)throw new Error("Could not load published bank (HTTP "+response.status+").");
      const data=await response.json();
      bank=normalizeImportedBank(data,subject);validateBank(bank);
      bankLoaded=true;bankDirty=false;selectedChapter=0;selectedQuestion=-1;
      renderChapters();renderQuestions();clearQuestionEditor();updateSummary();
      setStatus("bankStatus","Loaded "+SUBJECTS[subject]+": "+bank.length+" chapters and "+questionCount()+" questions.","success");
    }catch(error){bank=[];bankLoaded=false;renderChapters();renderQuestions();clearQuestionEditor();setStatus("bankStatus",error.message||"Unable to load bank.","error");updateSummary();}
  }
  function renderChapters(){
    const select=$("bankChapter");select.innerHTML="";
    bank.forEach((chapter,i)=>{const opt=make("option","",String(chapter.chapter_no).padStart(2,"0")+" · "+chapter.title+" ("+chapter.questions.length+")");opt.value=String(i);select.appendChild(opt);});
    if(bank.length){selectedChapter=Math.max(0,Math.min(selectedChapter,bank.length-1));select.value=String(selectedChapter);}
    else {const opt=make("option","","Load a bank first");opt.value="";select.appendChild(opt);}
    const chosen=bank[selectedChapter];
    $("newChapterTitle").value="";
    $("renameChapterBtn").disabled=!chosen;$("deleteChapterBtn").disabled=!chosen;
  }
  function renderQuestions(){
    const list=$("questionList");list.innerHTML="";
    const chapter=bank[selectedChapter];
    if(!chapter){list.appendChild(make("div","admin-empty","Load a question bank first."));return;}
    if(!chapter.questions.length){list.appendChild(make("div","admin-empty","No questions yet. Create the first question before exporting this chapter."));return;}
    chapter.questions.forEach((q,i)=>{
      const item=make("button","admin-list-item"+(i===selectedQuestion?" active":""));
      item.type="button";
      const title=make("strong","",String(q.id)+" · "+(q.question||"Untitled question"));
      const meta=make("small","",q.options.length+" options"+(q.images&&q.images.length?" · "+q.images.length+" image(s)":""));
      item.append(title,meta);item.addEventListener("click",()=>selectQuestion(i));list.appendChild(item);
    });
  }
  function clearQuestionEditor(){
    selectedQuestion=-1;selectedImages=[];
    $("questionEditorTitle").textContent="Question editor · new question";
    $("qId").value="";$("qPrompt").value="";
    for(let i=0;i<4;i++)$("qOption"+i).value="";
    $("qAnswer").value="0";$("qExplanation").value="";$("qDifficulty").value="Medium";
    $("saveQuestionBtn").textContent="Add question to chapter draft";$("deleteQuestionBtn").disabled=true;
    renderQuestionImages();
  }
  function selectQuestion(index){
    const q=bank[selectedChapter]&&bank[selectedChapter].questions[index];if(!q)return;
    selectedQuestion=index;selectedImages=structuredCloneSafe(q.images||[]);
    $("questionEditorTitle").textContent="Editing question "+q.id;
    $("qId").value=String(q.id);$("qPrompt").value=q.question||"";
    for(let i=0;i<4;i++)$("qOption"+i).value=q.options[i]||"";
    $("qAnswer").value=String(q.answer);$("qExplanation").value=q.explanation||"";
    $("qDifficulty").value=["Easy","Medium","Hard","Unspecified"].includes(q.difficulty)?q.difficulty:"Medium";
    $("saveQuestionBtn").textContent="Save question draft";$("deleteQuestionBtn").disabled=false;
    renderQuestions();renderQuestionImages();
  }
  function selectNewQuestion(){
    if(!bankLoaded){setStatus("bankStatus","Load a question bank before adding a question.","error");return;}
    if(!bank[selectedChapter]){setStatus("bankStatus","Choose a chapter first.","error");return;}
    clearQuestionEditor();
    $("qId").value=nextQuestionId();
  }
  function nextQuestionId(){
    const ids=bank.flatMap(c=>c.questions.map(q=>String(q.id)));
    const n=ids.reduce((m,id)=>Math.max(m,Number(id)||0),0)+1;
    return ids.includes("q-"+n)?"q-"+Date.now().toString(36):n;
  }
  function saveQuestion(){
    if(!bankLoaded||!bank[selectedChapter]){setStatus("bankStatus","Load a bank and choose a chapter first.","error");return;}
    const id=$("qId").value.trim(),prompt=$("qPrompt").value.trim();
    const options=[0,1,2,3].map(i=>$("qOption"+i).value.trim());
    const answer=Number($("qAnswer").value),explanation=$("qExplanation").value.trim();
    if(!id||!prompt||options.some(v=>!v)||!explanation){setStatus("bankStatus","Complete the ID, question, all four options and explanation.","error");return;}
    if(!Number.isInteger(answer)||answer<0||answer>3){setStatus("bankStatus","Choose a valid correct answer.","error");return;}
    if(bank.some((chapter,ci)=>chapter.questions.some((q,qi)=>String(q.id)===id&&!(ci===selectedChapter&&qi===selectedQuestion)))){
      setStatus("bankStatus","Question IDs must be unique across this subject bank.","error");return;
    }
    let images;
    try{images=window.C10QuestionBank.normalizeImages(selectedImages);}catch(error){setStatus("bankStatus",error.message,"error");return;}
    const existing=selectedQuestion>=0?bank[selectedChapter].questions[selectedQuestion]:null;
    const question={...(existing||{}),id,question:prompt,options,answer,explanation,difficulty:$("qDifficulty").value,images};
    if(selectedQuestion>=0)bank[selectedChapter].questions[selectedQuestion]=question;
    else {bank[selectedChapter].questions.push(question);selectedQuestion=bank[selectedChapter].questions.length-1;}
    validateBank(bank);renderChapters();renderQuestions();selectQuestion(selectedQuestion);
    setBankDirty("Saved question "+id+" in the local draft.");
  }
  function deleteQuestion(){
    const chapter=bank[selectedChapter],q=chapter&&chapter.questions[selectedQuestion];if(!q)return;
    if(!confirm("Remove question "+q.id+" from this local draft? Export the bank to keep the change."))return;
    chapter.questions.splice(selectedQuestion,1);selectedQuestion=-1;
    renderChapters();renderQuestions();clearQuestionEditor();setBankDirty("Question removed from draft.");
  }
  function addChapter(){
    if(!bankLoaded){setStatus("bankStatus","Load a bank before adding a chapter.","error");return;}
    const title=$("newChapterTitle").value.trim();
    if(!title){setStatus("bankStatus","Enter a chapter title.","error");$("newChapterTitle").focus();return;}
    if(bank.some(c=>c.title.toLowerCase()===title.toLowerCase())){setStatus("bankStatus","A chapter with that title already exists.","error");return;}
    const number=bank.reduce((m,c)=>Math.max(m,Number(c.chapter_no)||0),0)+1;
    let key=slug(title),used=new Set(bank.map(c=>String(c.key)));
    if(used.has(key))key+="-"+number;
    bank.push({chapter_no:number,title,key,questions:[]});selectedChapter=bank.length-1;
    renderChapters();renderQuestions();selectNewQuestion();setBankDirty("Added chapter. Add at least one question before publishing.");
  }
  function renameChapter(){
    const chapter=bank[selectedChapter];if(!chapter)return;
    const title=$("newChapterTitle").value.trim();
    if(!title){setStatus("bankStatus","Enter the new chapter title in the field first.","error");return;}
    if(bank.some((c,i)=>i!==selectedChapter&&c.title.toLowerCase()===title.toLowerCase())){setStatus("bankStatus","That chapter title is already used.","error");return;}
    chapter.title=title;renderChapters();renderQuestions();setBankDirty("Chapter renamed. Its stable chapter key was preserved.");
  }
  function deleteChapter(){
    const chapter=bank[selectedChapter];if(!chapter)return;
    if(!confirm("Remove chapter '"+chapter.title+"' and all "+chapter.questions.length+" question(s) from this local draft?"))return;
    bank.splice(selectedChapter,1);selectedChapter=Math.max(0,selectedChapter-1);selectedQuestion=-1;
    if(!bank.length){setStatus("bankStatus","The bank is empty. Add a new chapter before exporting.");}
    renderChapters();renderQuestions();clearQuestionEditor();setBankDirty("Chapter removed from draft.");
  }
  function exportBank(){
    if(!bankLoaded){setStatus("bankStatus","Load a bank first.","error");return;}
    try{validateBank(bank);}catch(error){setStatus("bankStatus","Cannot export: "+error.message,"error");return;}
    downloadJson(bank,""+bankSubject+".json");bankDirty=false;
    setStatus("bankStatus","Exported "+bankSubject+".json. Review and upload it to data/"+bankSubject+".json in GitHub. Download all new image assets and place them at their referenced paths.","success");
    updateSummary();
  }
  async function importBank(event){
    const file=event.target.files&&event.target.files[0];event.target.value="";if(!file)return;
    try{
      if(bankDirty&&!confirm("Discard unexported changes to the current bank?"))return;
      const data=await parseJsonFile(file);bank=normalizeImportedBank(data,bankSubject);validateBank(bank);
      bankLoaded=true;bankDirty=true;selectedChapter=0;selectedQuestion=-1;
      renderChapters();renderQuestions();clearQuestionEditor();
      setStatus("bankStatus","Imported "+file.name+" as a local draft. Export it after any edits.","success");updateSummary();
    }catch(error){setStatus("bankStatus",error.message||"Unable to import bank.","error");}
  }
  function onImageFileChanged(){
    if(selectedImageUrl)URL.revokeObjectURL(selectedImageUrl);
    selectedImageFile=$("imageFile").files&&$("imageFile").files[0]||null;
    selectedImageUrl="";
    if(!selectedImageFile)return;
    if(!/^image\/(png|jpeg|webp|gif)$/.test(selectedImageFile.type)){
      selectedImageFile=null;$("imageFile").value="";setStatus("bankStatus","Use PNG, JPEG, WebP or GIF for question diagrams.","error");return;
    }
    selectedImageUrl=URL.createObjectURL(selectedImageFile);
    const ext=selectedImageFile.name.includes(".")?selectedImageFile.name.split(".").pop().toLowerCase():"png";
    const stem=slug(selectedImageFile.name.replace(/\.[^.]+$/,""));
    $("imagePath").value="./assets/questions/"+bankSubject+"/"+stem+"."+ext;
    if(!$("imageAlt").value.trim())$("imageAlt").value=selectedImageFile.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," ");
    setStatus("bankStatus","Selected "+selectedImageFile.name+". Add alt text, then attach it to the question.");
  }
  function addImageToQuestion(){
    const path=$("imagePath").value.trim(),alt=$("imageAlt").value.trim(),caption=$("imageCaption").value.trim();
    if(!path||!alt){setStatus("bankStatus","A repository path and meaningful alternative text are required.","error");return;}
    try{window.C10QuestionBank.normalizeImages([{src:path,alt,caption}]);}catch(error){setStatus("bankStatus",error.message,"error");return;}
    if(selectedImageFile){
      const previous=pendingAssetByPath.get(path);
      if(previous&&previous.file!==selectedImageFile){setStatus("bankStatus","That asset path is already used by another pending file. Choose a different path.","error");return;}
      const asset={path,file:selectedImageFile,previewUrl:selectedImageUrl};
      if(!previous){pendingAssets.push(asset);pendingAssetByPath.set(path,asset);}
    }
    selectedImages.push({src:path,alt,caption});
    selectedImageFile=null;selectedImageUrl="";$("imageFile").value="";$("imagePath").value="";$("imageAlt").value="";$("imageCaption").value="";
    renderQuestionImages();renderPendingAssets();setBankDirty("Attached image metadata to the current editor. Save the question to keep it in the bank draft.");
  }
  function renderQuestionImages(){
    const container=$("questionImageList");container.innerHTML="";
    if(!selectedImages.length){container.appendChild(make("div","admin-empty",selectedQuestion<0?"No images attached to the new question.":"No images attached to this question."));return;}
    selectedImages.forEach((image,index)=>{
      const row=make("div","admin-image-row"),preview=make("img");
      const pending=pendingAssetByPath.get(image.src);
      preview.src=pending?pending.previewUrl:image.src;preview.alt=image.alt;
      const text=make("div");text.append(make("strong","",image.alt),make("small","",image.src+(image.caption?" · "+image.caption:"")));
      const actions=make("div","admin-image-actions");
      actions.appendChild(button("Remove","danger",()=>{selectedImages.splice(index,1);renderQuestionImages();setBankDirty("Removed image metadata.");}));
      row.append(preview,text,actions);container.appendChild(row);
    });
  }
  function renderPendingAssets(){
    const list=$("pendingAssets");list.innerHTML="";
    if(!pendingAssets.length){list.appendChild(make("div","admin-empty","No new image assets. Existing repository paths can be referenced directly."));return;}
    pendingAssets.forEach(asset=>{
      const row=make("div","admin-image-row"),img=make("img");img.src=asset.previewUrl;img.alt=asset.file.name;
      const info=make("div");info.append(make("strong","",asset.file.name),make("small","",asset.path+" · "+Math.round(asset.file.size/1024)+" KB"));
      const actions=make("div","admin-image-actions");
      actions.appendChild(button("Download file","secondary",()=>{downloadBlob(asset.file,asset.path.split("/").pop());asset.downloaded=true;}));
      row.append(img,info,actions);list.appendChild(row);
    });
  }

  // CLASSES
  async function loadClasses(){
    try{
      const response=await fetch("./data/classes.json",{cache:"no-store"});
      if(!response.ok)throw new Error("Could not load classes.json.");
      const data=await response.json();
      if(!data||data.kind!=="class-catalog"||!Array.isArray(data.classes))throw new Error("Published class catalogue has an invalid shape.");
      classCatalog=data;classesDirty=false;renderClasses();renderLeaderClassOptions();updateSummary();setStatus("classesStatus","Loaded "+activeClasses().length+" active classes.","success");
      setStatus("overviewStatus","Class catalogue and knowledge-base manifest loaded. This workspace prepares local drafts; it does not publish files.");
    }catch(error){setStatus("classesStatus",error.message||"Class catalogue failed to load.","error");}
  }
  function renderClasses(){
    const container=$("classesTable");container.innerHTML="";
    const table=make("table","admin-table"),thead=make("thead"),hr=make("tr");
    ["Class ID","Display label","Status","Actions"].forEach(x=>hr.appendChild(make("th","",x)));thead.appendChild(hr);table.appendChild(thead);
    const body=make("tbody");
    classCatalog.classes.slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)).forEach(item=>{
      const tr=make("tr");tr.append(make("td","",item.classId),make("td","",item.label),make("td","",item.active===false?"Inactive":"Active"));
      const td=make("td");td.appendChild(button(item.active===false?"Activate":"Deactivate","secondary",()=>{
        item.active=item.active===false;classesDirty=true;renderClasses();renderLeaderClassOptions();setStatus("classesStatus","Class change is a local draft. Export classes.json to keep it.","success");updateSummary();
      }));
      td.appendChild(button("Rename","secondary",()=>{
        const label=prompt("Display label for "+item.classId,item.label);
        if(label&&label.trim()){item.label=label.trim();classesDirty=true;renderClasses();renderLeaderClassOptions();setStatus("classesStatus","Class label updated in this draft. Export classes.json.","success");}
      }));
      td.appendChild(button("Remove","danger",()=>{
        if(!confirm("Remove "+item.label+" from the published class catalogue draft? Existing historic backups are not deleted."))return;
        classCatalog.classes=classCatalog.classes.filter(x=>x!==item);classesDirty=true;renderClasses();renderLeaderClassOptions();setStatus("classesStatus","Class removed from this draft. Export classes.json.","success");updateSummary();
      }));
      tr.appendChild(td);body.appendChild(tr);
    });
    table.appendChild(body);container.appendChild(table);
    if(!classCatalog.classes.length)container.appendChild(make("div","admin-empty","No classes defined. Add a class."));
  }
  function addClass(){
    const id=$("classId").value.trim(),label=$("classLabel").value.trim();
    if(!/^[A-Za-z0-9_-]{1,20}$/.test(id)){setStatus("classesStatus","Class ID must use 1–20 letters, numbers, hyphens or underscores.","error");return;}
    if(!label){setStatus("classesStatus","Enter a display label.","error");return;}
    if(classCatalog.classes.some(x=>String(x.classId).toLowerCase()===id.toLowerCase())){setStatus("classesStatus","That class ID already exists.","error");return;}
    classCatalog.classes.push({classId:id,label,sortOrder:classCatalog.classes.length+1,active:true});classesDirty=true;
    $("classId").value="";$("classLabel").value="";
    renderClasses();renderLeaderClassOptions();updateSummary();setStatus("classesStatus","Added class to local draft. Export classes.json and publish it via GitHub.","success");
  }
  function exportClasses(){downloadJson(classCatalog,"classes.json");classesDirty=false;setStatus("classesStatus","Exported classes.json. Upload it to data/classes.json to publish the class catalogue.","success");}
  function renderLeaderClassOptions(){
    const select=$("leaderClass"),previous=select.value;select.innerHTML="";
    const first=make("option","","All imported classes");first.value="";select.appendChild(first);
    const ids=new Set(studentBackups.map(item=>String(item.backup.profile.classLevel||"")));
    [...ids].filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).forEach(id=>{
      const opt=make("option","",classLabel(id));opt.value=id;select.appendChild(opt);
    });
    if([...select.options].some(option=>option.value===previous))select.value=previous;
  }

  // KNOWLEDGE BASE INVENTORY
  async function loadManifest(){
    try{
      const response=await fetch("./data/knowledge-base.json",{cache:"no-store"});
      if(!response.ok)throw new Error("Could not load knowledge-base.json.");
      const data=await response.json();
      if(!data||data.kind!=="knowledge-base-manifest"||!Array.isArray(data.resources))throw new Error("Knowledge-base manifest has an invalid shape.");
      knowledgeManifest=data;renderKnowledgeTable();setStatus("knowledgeStatus","Loaded "+knowledgeManifest.resources.length+" resource manifest record(s).");
    }catch(error){setStatus("knowledgeStatus",error.message||"Could not load resource manifest.","error");}
  }
  function selectedResourceChanged(){
    if(selectedResourceUrl)URL.revokeObjectURL(selectedResourceUrl);
    selectedResourceFile=$("resourceFile").files&&$("resourceFile").files[0]||null;
    selectedResourceUrl="";
    if(!selectedResourceFile)return;
    selectedResourceUrl=URL.createObjectURL(selectedResourceFile);
    if(!$("resourceTitle").value.trim())$("resourceTitle").value=selectedResourceFile.name.replace(/\.[^.]+$/,"");
    if(!$("resourcePath").value.trim())$("resourcePath").value="knowledge/"+slug($("resourceSubject").value||"general")+"/"+slug(selectedResourceFile.name.replace(/\.[^.]+$/,""))+(selectedResourceFile.name.includes(".")?"."+selectedResourceFile.name.split(".").pop().toLowerCase():"");
    const fileType=selectedResourceFile.type==="application/pdf"?" PDF":selectedResourceFile.type.startsWith("image/")?" image":" file";
    setStatus("knowledgeStatus","Selected "+selectedResourceFile.name+" ("+Math.round(selectedResourceFile.size/1024)+" KB). It will be downloaded separately for manual repository upload.");
  }
  function addResource(){
    if(!selectedResourceFile){setStatus("knowledgeStatus","Choose a resource file first.","error");return;}
    const title=$("resourceTitle").value.trim(),path=$("resourcePath").value.trim();
    if(!title||!path){setStatus("knowledgeStatus","A resource title and repository path are required.","error");return;}
    if(!/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._~!%()-]+(?:\/[A-Za-z0-9._~!%()-]+)*$/.test(path)){setStatus("knowledgeStatus","Use a safe repository-relative path such as knowledge/science/chapter.pdf.","error");return;}
    if(knowledgeManifest.resources.some(r=>r.path===path)){setStatus("knowledgeStatus","That repository path already exists in the manifest.","error");return;}
    const resource={resourceId:"resource-"+Date.now().toString(36),title,type:$("resourceType").value,
      subject:$("resourceSubject").value,chapter:$("resourceChapter").value.trim(),path,
      rightsNote:$("resourceRights").value.trim(),mimeType:selectedResourceFile.type||"application/octet-stream",
      sizeBytes:selectedResourceFile.size,status:"draft"};
    knowledgeManifest.resources.push(resource);manifestDirty=true;
    pendingResources.push({resource,file:selectedResourceFile,previewUrl:selectedResourceUrl});
    selectedResourceFile=null;selectedResourceUrl="";$("resourceFile").value="";
    $("resourceTitle").value="";$("resourceChapter").value="";$("resourcePath").value="";$("resourceRights").value="";
    renderPendingResources();renderKnowledgeTable();setStatus("knowledgeStatus","Added resource metadata to the local manifest. Download the file and manifest, then upload the file to the exact path shown.","success");
  }
  function renderPendingResources(){
    const list=$("pendingResources");list.innerHTML="";
    if(!pendingResources.length){list.appendChild(make("div","admin-empty","No resource files selected in this session."));return;}
    pendingResources.forEach(record=>{
      const row=make("div","admin-image-row");
      const icon=make("div","","📄");icon.style.fontSize="1.7rem";icon.style.textAlign="center";
      const meta=make("div");meta.append(make("strong","",record.file.name),make("small","",record.resource.path+" · "+Math.round(record.file.size/1024)+" KB"));
      const actions=make("div","admin-image-actions");
      actions.appendChild(button("Download file","secondary",()=>{downloadBlob(record.file,record.resource.path.split("/").pop());record.downloaded=true;}));
      row.append(icon,meta,actions);list.appendChild(row);
    });
  }
  function renderKnowledgeTable(){
    const container=$("knowledgeTable");container.innerHTML="";
    if(!knowledgeManifest.resources.length){container.appendChild(make("div","admin-empty","No knowledge resources are registered yet."));return;}
    const table=make("table","admin-table"),thead=make("thead"),hr=make("tr");
    ["Title","Type","Subject","Repository path","Status","Actions"].forEach(x=>hr.appendChild(make("th","",x)));thead.appendChild(hr);table.appendChild(thead);
    const body=make("tbody");
    knowledgeManifest.resources.forEach(resource=>{
      const tr=make("tr");
      tr.append(make("td","",resource.title),make("td","",resource.type),make("td","",resource.subject||"—"),make("td","",resource.path),make("td","",resource.status||"manifest"));
      const actions=make("td");actions.appendChild(button("Remove","danger",()=>{
        if(!confirm("Remove this resource entry from the local manifest? This does not delete any file already published in GitHub."))return;
        knowledgeManifest.resources=knowledgeManifest.resources.filter(x=>x.resourceId!==resource.resourceId);manifestDirty=true;
        pendingResources=pendingResources.filter(x=>x.resource.resourceId!==resource.resourceId);
        renderKnowledgeTable();renderPendingResources();
      }));tr.appendChild(actions);body.appendChild(tr);
    });
    table.appendChild(body);container.appendChild(table);
  }
  function exportManifest(){downloadJson(knowledgeManifest,"knowledge-base.json");manifestDirty=false;setStatus("knowledgeStatus","Exported knowledge-base.json. Upload it to data/knowledge-base.json. Upload resource files separately and ensure rights permit public redistribution.","success");}
  $("importManifestBtn").addEventListener("click",()=>$("manifestFile").click());
  async function importManifest(event){
    const file=event.target.files&&event.target.files[0];event.target.value="";if(!file)return;
    try{
      const data=await parseJsonFile(file);
      if(!data||data.kind!=="knowledge-base-manifest"||!Array.isArray(data.resources))throw new Error("Unsupported knowledge-base manifest.");
      if(data.resources.some(r=>!r.resourceId||!r.title||!r.path||!r.type))throw new Error("Every resource needs an ID, title, type and path.");
      knowledgeManifest=data;manifestDirty=true;renderKnowledgeTable();setStatus("knowledgeStatus","Imported resource manifest as a local draft.","success");
    }catch(error){setStatus("knowledgeStatus",error.message||"Unable to import manifest.","error");}
  }

  // STUDENTS, REPORTS AND LEADERBOARDS (uploaded backups only)
  function completedAttempts(record,subject=""){
    const subjects=subject?[subject]:Object.keys(SUBJECTS),rows=[];
    subjects.forEach(id=>{
      const data=record.backup.subjectData[id],ledger=data&&data.ledger;
      (ledger&&Array.isArray(ledger.attempts)?ledger.attempts:[]).forEach(attempt=>{
        if(!["submitted","timed-out"].includes(attempt.status)||Number(attempt.maxScore)<=0)return;
        const score=Number(attempt.score??attempt.correctCount);
        const max=Number(attempt.maxScore);
        if(!Number.isFinite(score)||!Number.isFinite(max)||max<=0)return;
        rows.push({...attempt,subjectId:id,subjectTitle:SUBJECTS[id]||id,percentage:Math.round(score/max*100)});
      });
    });
    return rows.sort((a,b)=>String(b.submittedAt||b.startedAt).localeCompare(String(a.submittedAt||a.startedAt)));
  }
  function studentStats(record,subject=""){
    const attempts=completedAttempts(record,subject),avg=attempts.length?Math.round(attempts.reduce((s,a)=>s+a.percentage,0)/attempts.length):null;
    const last=attempts[0]&&(attempts[0].submittedAt||attempts[0].startedAt);
    return {attempts,attemptCount:attempts.length,average:avg,last};
  }
  function readableDate(value){
    if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleDateString();
  }
  function renderStudents(){
    $("statStudents").textContent=String(studentBackups.length);
    const container=$("studentsTable");container.innerHTML="";
    if(!studentBackups.length){container.appendChild(make("div","admin-empty","Import one or more private student backup JSON files to view profile data and progress reports."));setStatus("studentStatus","No student backups loaded.");renderLeaderClassOptions();updateSummary();return;}
    const table=make("table","admin-table"),thead=make("thead"),hr=make("tr");
    ["Student ID","Display name","School","Class","Tests","Avg. score","Last activity","Actions"].forEach(x=>hr.appendChild(make("th","",x)));thead.appendChild(hr);table.appendChild(thead);
    const body=make("tbody");
    studentBackups.forEach(record=>{
      const p=record.backup.profile,stats=studentStats(record);
      const tr=make("tr");
      tr.append(make("td","",p.studentId),make("td","",p.displayName),make("td","",p.school),make("td","",classLabel(p.classLevel)),make("td","",stats.attemptCount),make("td","",stats.average==null?"—":stats.average+"%"),make("td","",readableDate(stats.last)));
      const actions=make("td"),edit=button("Edit","secondary",()=>openProfileEditor(record));
      actions.append(edit,button("Download backup","secondary",()=>downloadStudentBackup(record)),button("Remove","danger",()=>removeStudent(record)));
      tr.appendChild(actions);body.appendChild(tr);
    });
    table.appendChild(body);container.appendChild(table);
    setStatus("studentStatus",studentBackups.length+" student backup(s) loaded in memory. "+studentBackups.reduce((n,r)=>n+studentStats(r).attemptCount,0)+" completed test record(s) found.","success");
    renderLeaderClassOptions();updateSummary();
  }
  async function importStudentBackups(event){
    const files=Array.from(event.target.files||[]);event.target.value="";
    if(!files.length)return;
    let imported=0,errors=[];
    for(const file of files){
      try{
        const backup=await parseJsonFile(file);
        if(!window.C10ProfileModel.isValidBackup(backup))throw new Error("not a valid C10 Playground v1 backup");
        const key=String(backup.profile.profileId);
        const record={backup,sourceFilename:file.name,importedAt:new Date().toISOString()};
        const existing=studentBackups.findIndex(item=>String(item.backup.profile.profileId)===key);
        if(existing>=0)studentBackups[existing]=record;else studentBackups.push(record);
        imported++;
      }catch(error){errors.push(file.name+": "+(error.message||"invalid backup"));}
    }
    renderStudents();
    setStatus("studentStatus",imported+" backup(s) imported."+(errors.length?" Rejected: "+errors.join(" · "):"")+" Data remains in this tab's memory only.",errors.length?"error":"success");
  }
  function removeStudent(record){
    if(!confirm("Remove "+record.backup.profile.displayName+" from the imported workbench list? This does not erase data from the student's device."))return;
    studentBackups=studentBackups.filter(item=>item!==record);renderStudents();renderLeaderboard();
  }
  function openProfileEditor(record){
    editingStudentProfileId=String(record.backup.profile.profileId);
    const p=record.backup.profile;
    $("editStudentName").value=p.displayName||"";$("editStudentSchool").value=p.school||"";
    $("editStudentCity").value=p.city||"";$("editStudentState").value=p.state||"";
    const select=$("editStudentClass");select.innerHTML="";
    classCatalog.classes.forEach(item=>{const opt=make("option","",item.label);opt.value=String(item.classId);select.appendChild(opt);});
    if(!classCatalog.classes.some(item=>String(item.classId)===String(p.classLevel))){const opt=make("option","",classLabel(p.classLevel)+" (not in catalogue)");opt.value=String(p.classLevel);select.appendChild(opt);}
    select.value=String(p.classLevel);
    $("studentEditStatus").textContent="Editing imported backup: "+p.studentId;
    $("profileEditorModal").classList.remove("hide");$("editStudentName").focus();
  }
  function closeProfileEditor(){
    $("profileEditorModal").classList.add("hide");editingStudentProfileId=null;
  }
  function getEditingStudent(){return studentBackups.find(item=>String(item.backup.profile.profileId)===editingStudentProfileId)||null;}
  function saveEditedStudent(){
    const record=getEditingStudent();if(!record){setStatus("studentEditStatus","Student backup is no longer loaded.","error");return;}
    const profile=record.backup.profile;
    const proposed={...profile,displayName:$("editStudentName").value.trim(),school:$("editStudentSchool").value.trim(),
      classLevel:$("editStudentClass").value,city:$("editStudentCity").value.trim(),state:$("editStudentState").value.trim(),updatedAt:new Date().toISOString()};
    if(!window.C10ProfileModel.validateProfile(proposed)){setStatus("studentEditStatus","Profile is not valid. Complete all required fields and use a recognised Indian State/UT.","error");return;}
    record.backup.profile=proposed;
    $("studentEditStatus").textContent="Profile updated inside the imported backup only. Download the revised backup if needed.";
    renderStudents();renderLeaderboard();
  }
  function downloadStudentBackup(record){
    const file="c10-playground-backup-"+slug(record.backup.profile.studentId)+"-"+new Date().toISOString().slice(0,10)+".json";
    downloadJson(record.backup,file);
    setStatus("studentStatus","Downloaded revised/private backup for "+record.backup.profile.studentId+". The student must import it on their device for the change to take effect.","success");
  }
  function clearImportedStudents(){
    if(!studentBackups.length)return;
    if(!confirm("Clear all imported student backups from this workbench session? Original files and student devices are not changed."))return;
    studentBackups=[];renderStudents();renderLeaderboard();
  }
  function progressReportRows(){
    const rows=[["Student ID","Display name","School","Class","City","State / UT","Subject","Mode","Started at","Submitted at","Score","Max score","Percentage","Duration seconds","Status"]];
    studentBackups.forEach(record=>{
      const p=record.backup.profile,attempts=completedAttempts(record);
      if(!attempts.length){rows.push([p.studentId,p.displayName,p.school,classLabel(p.classLevel),p.city,p.state,"","","","","","","","","No completed tests"]);return;}
      attempts.forEach(a=>rows.push([p.studentId,p.displayName,p.school,classLabel(p.classLevel),p.city,p.state,a.subjectTitle,a.mode||"",a.startedAt||"",a.submittedAt||"",a.score??a.correctCount??"",a.maxScore??"",a.percentage,a.durationSeconds??"",a.status||""]));
    });
    return rows;
  }
  function exportProgressReport(){
    if(!studentBackups.length){setStatus("studentStatus","Import student backups before exporting a progress report.","error");return;}
    downloadCsv(progressReportRows(),"c10-progress-report-"+new Date().toISOString().slice(0,10)+".csv");
    setStatus("studentStatus","Progress report downloaded. Keep it private; it contains student profile details.","success");
  }
  function renderLeaderboard(){
    const container=$("leaderboardTable");container.innerHTML="";
    const subject=$("leaderSubject").value,classId=$("leaderClass").value;
    const ranked=studentBackups.filter(record=>!classId||String(record.backup.profile.classLevel)===classId)
      .map(record=>({record,stats:studentStats(record,subject)}))
      .filter(item=>item.stats.attemptCount)
      .sort((a,b)=>b.stats.average-a.stats.average||b.stats.attemptCount-a.stats.attemptCount||String(a.record.backup.profile.displayName).localeCompare(String(b.record.backup.profile.displayName)));
    if(!ranked.length){container.appendChild(make("div","admin-empty","No completed tests match these filters. Import student backups and/or change the filters."));setStatus("leaderboardStatus","No ranked students for the selected filters.");return;}
    const table=make("table","admin-table"),thead=make("thead"),hr=make("tr");
    ["Rank","Student","Class","Subject scope","Tests","Average score","Best score","Last activity"].forEach(x=>hr.appendChild(make("th","",x)));thead.appendChild(hr);table.appendChild(thead);
    const body=make("tbody");
    ranked.forEach((item,i)=>{
      const p=item.record.backup.profile,attempts=item.stats.attempts;
      const best=Math.max(...attempts.map(a=>a.percentage));
      const tr=make("tr");
      tr.append(make("td","",i+1),make("td","",p.displayName+" · "+p.studentId),make("td","",classLabel(p.classLevel)),make("td","",subject?SUBJECTS[subject]:"All subjects"),make("td","",item.stats.attemptCount),make("td","",item.stats.average+"%"),make("td","",best+"%"),make("td","",readableDate(item.stats.last)));
      body.appendChild(tr);
    });
    table.appendChild(body);container.appendChild(table);
    setStatus("leaderboardStatus","Ranking "+ranked.length+" student(s) by average completed-test percentage. Based only on imported backups.","success");
  }
  function exportLeaderboard(){
    const subject=$("leaderSubject").value,classId=$("leaderClass").value;
    const ranked=studentBackups.filter(record=>!classId||String(record.backup.profile.classLevel)===classId)
      .map(record=>({record,stats:studentStats(record,subject)})).filter(item=>item.stats.attemptCount)
      .sort((a,b)=>b.stats.average-a.stats.average||b.stats.attemptCount-a.stats.attemptCount);
    const rows=[["Rank","Student ID","Display name","School","Class","Subject","Completed tests","Average score","Best score","Last activity"]];
    ranked.forEach((item,i)=>rows.push([i+1,item.record.backup.profile.studentId,item.record.backup.profile.displayName,item.record.backup.profile.school,classLabel(item.record.backup.profile.classLevel),subject?SUBJECTS[subject]:"All subjects",item.stats.attemptCount,item.stats.average,Math.max(...item.stats.attempts.map(a=>a.percentage)),item.stats.last||""]));
    downloadCsv(rows,"c10-leaderboard-"+new Date().toISOString().slice(0,10)+".csv");
  }
  function updateSummary(){
    $("statQuestions").textContent=bankLoaded?String(questionCount()):"—";
    $("statClasses").textContent=String(activeClasses().length);
    $("statStudents").textContent=String(studentBackups.length);
  }
  function init(){
    initTabs();
    $("loadBankBtn").addEventListener("click",loadBank);
    $("chooseBankBtn").addEventListener("click",()=>$("bankFile").click());
    $("bankFile").addEventListener("change",importBank);
    $("bankSubject").addEventListener("change",()=>{
      const next=$("bankSubject").value;if(next===bankSubject)return;
      loadBank();
      if(bankSubject!==next)$("bankSubject").value=bankSubject;
    });
    $("bankChapter").addEventListener("change",()=>{selectedChapter=Number($("bankChapter").value)||0;selectedQuestion=-1;renderQuestions();clearQuestionEditor();});
    $("addChapterBtn").addEventListener("click",addChapter);
    $("renameChapterBtn").addEventListener("click",renameChapter);
    $("deleteChapterBtn").addEventListener("click",deleteChapter);
    $("newQuestionBtn").addEventListener("click",selectNewQuestion);
    $("saveQuestionBtn").addEventListener("click",saveQuestion);
    $("deleteQuestionBtn").addEventListener("click",deleteQuestion);
    $("exportBankBtn").addEventListener("click",exportBank);
    $("imageFile").addEventListener("change",onImageFileChanged);
    $("addImageBtn").addEventListener("click",addImageToQuestion);
    $("addClassBtn").addEventListener("click",addClass);
    $("exportClassesBtn").addEventListener("click",exportClasses);
    $("reloadClassesBtn").addEventListener("click",()=>loadClasses());
    $("resourceFile").addEventListener("change",selectedResourceChanged);
    $("addResourceBtn").addEventListener("click",addResource);
    $("exportManifestBtn").addEventListener("click",exportManifest);
    $("manifestFile").addEventListener("change",importManifest);
    $("studentBackups").addEventListener("change",importStudentBackups);
    $("clearStudentsBtn").addEventListener("click",clearImportedStudents);
    $("exportReportBtn").addEventListener("click",exportProgressReport);
    $("leaderClass").addEventListener("change",renderLeaderboard);
    $("leaderSubject").addEventListener("change",renderLeaderboard);
    $("exportLeaderboardBtn").addEventListener("click",exportLeaderboard);
    $("closeProfileEditor").addEventListener("click",closeProfileEditor);
    $("profileEditorModal").addEventListener("click",event=>{if(event.target===$("profileEditorModal"))closeProfileEditor();});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!$("profileEditorModal").classList.contains("hide"))closeProfileEditor();});
    $("saveStudentProfileBtn").addEventListener("click",saveEditedStudent);
    $("downloadStudentBackupBtn").addEventListener("click",()=>{const record=getEditingStudent();if(record)downloadStudentBackup(record);});
    if(window.addEventListener)window.addEventListener("beforeunload",event=>{
      if(bankDirty||classesDirty||manifestDirty||pendingAssets.some(asset=>!asset.downloaded)||pendingResources.some(record=>!record.downloaded)||studentBackups.length){
        event.preventDefault();event.returnValue="";
      }
    });
    loadClasses();loadManifest();loadBank();renderStudents();renderKnowledgeTable();renderPendingResources();renderPendingAssets();updateSummary();
  }
  init();
})();
