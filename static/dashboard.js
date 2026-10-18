const notice = document.getElementById("notice");
function showNotice(message) { if(!notice)return; notice.textContent = message; notice.classList.add("show"); setTimeout(() => notice.classList.remove("show"), 2800); }
async function api(url, options={}) { const response=await fetch(url,options); const data=await response.json().catch(()=>({})); if(!response.ok)throw new Error(data.error||"Something went wrong."); return data; }
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadOverview(){
 const data=await api("/api/overview");
 const open=document.getElementById("open-count"),done=document.getElementById("done-count"),count=document.getElementById("appointment-count");
 if(open)open.textContent=data.stats.open_tasks;if(done)done.textContent=data.stats.completed_tasks;if(count)count.textContent=data.appointments.length+(data.doctor_bookings||[]).length;
 const taskHtml=(tasks,full)=>tasks.map(t=>`<div class="task-row ${t.completed?"done":""}">${full?`<input type="checkbox" aria-label="Mark task complete" data-task-check="${t.id}" ${t.completed?"checked":""}>`:"<span class='task-bullet'>"+(t.completed?"✓":"•")+"</span>"}<div class="task-text"><strong>${esc(t.title)}</strong><small>${full?esc(t.details||t.category||"Care task")+(t.due_date?" · Due "+esc(t.due_date):""):(t.due_date?"Due "+esc(t.due_date):"")}</small></div>${full?`<button class="delete-btn" data-task-delete="${t.id}">Delete</button>`:""}</div>`).join("");
 const tasks=document.getElementById("task-list");if(tasks)tasks.innerHTML=taskHtml(data.tasks,true)||'<p class="empty-note">Currently no plan. Add a confirmed next step when you are ready.</p>';
 const overviewTasks=document.getElementById("overview-task-list");if(overviewTasks)overviewTasks.innerHTML=taskHtml(data.tasks.slice(0,4),false)||'<p class="empty-note">Currently no plan. Add a confirmed next step when you are ready.</p>';
 const personalApptHtml=data.appointments.map(a=>`<div class="simple-row"><div><strong>${esc(a.title)}</strong><small>${esc(a.appointment_date)} · ${esc(a.location||"Location not added")}<br>${esc(a.notes||"")}</small></div></div>`).join("");
 const bookingHtml=(data.doctor_bookings||[]).map(a=>`<div class="simple-row"><div><strong>${esc(a.doctor_name)} · ${esc(a.specialty)}</strong><small>${esc(a.appointment_date)} at ${esc(a.appointment_time)} · <b>${esc(a.status)}</b>${a.staff_note?"<br>Staff note: "+esc(a.staff_note):""}</small></div></div>`).join("");
 const appts=document.getElementById("appointment-list");if(appts)appts.innerHTML=personalApptHtml||'<p class="empty-note">Currently no appointment.</p>';
 const overviewAppts=document.getElementById("overview-appointment-list");if(overviewAppts)overviewAppts.innerHTML=(bookingHtml+personalApptHtml)||'<p class="empty-note">Currently no appointment.</p>';
 const meds=document.getElementById("medication-list");if(meds)meds.innerHTML=data.medications.map(m=>`<div class="simple-row"><div><strong>${esc(m.name)}</strong><small>${esc(m.schedule||"Schedule not added")}<br>${esc(m.instructions||"")}</small></div></div>`).join("")||'<p class="empty-note">Currently no medication records.</p>';
}
const taskForm=document.getElementById("task-form");
if(taskForm)taskForm.addEventListener("submit",async e=>{
 e.preventDefault();
 const f=e.currentTarget;
 const titleInput=f.elements.namedItem("title");
 const dueDateInput=f.elements.namedItem("due_date");
 const submitButton=f.querySelector('button[type="submit"]');
 const title=(titleInput?.value||"").trim();
 if(!title){showNotice("Please enter a care task.");titleInput?.focus();return;}
 if(submitButton){submitButton.disabled=true;submitButton.dataset.originalText=submitButton.textContent;submitButton.textContent="Saving…";}
 try{
   const result=await api("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,due_date:dueDateInput?.value||"",details:"",category:"Care"})});
   f.reset();
   await loadOverview();
   showNotice(result.duplicate?"This task is already in your care plan.":"Task added to your care plan.");
 }catch(err){showNotice(err.message||"Could not save the task. Please try again.");}
 finally{if(submitButton){submitButton.disabled=false;submitButton.textContent=submitButton.dataset.originalText||"Add task";}}
});
document.getElementById("task-list")?.addEventListener("change",async e=>{if(!e.target.matches("[data-task-check]"))return;try{await api("/api/tasks/"+e.target.dataset.taskCheck,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({completed:e.target.checked})});await loadOverview()}catch(err){showNotice(err.message)}});
document.getElementById("task-list")?.addEventListener("click",async e=>{const b=e.target.closest("[data-task-delete]");if(!b)return;try{await api("/api/tasks/"+b.dataset.taskDelete,{method:"DELETE"});await loadOverview();showNotice("Task deleted.")}catch(err){showNotice(err.message)}});
const apptForm=document.getElementById("appointment-form");
if(apptForm)apptForm.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;try{await api("/api/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:f.title.value,appointment_date:f.appointment_date.value,location:f.location.value,notes:f.notes.value})});f.reset();await loadOverview();showNotice("Appointment saved.")}catch(err){showNotice(err.message)}});
const medForm=document.getElementById("medication-form");
if(medForm)medForm.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;try{await api("/api/medications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.name.value,schedule:f.schedule.value,instructions:f.instructions.value})});f.reset();await loadOverview();showNotice("Medication record saved.")}catch(err){showNotice(err.message)}});
if(document.querySelector(".dashboard-body"))loadOverview().catch(err=>showNotice(err.message));
