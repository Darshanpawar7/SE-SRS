import {recoverLocalSave} from './localPersistence';
import {INITIAL_PROJECT,INITIAL_SPRINTS,INITIAL_TASKS} from './mockData';
const OWNER='sprintflow_cache_owner';
const defaults={sprintflow_project:JSON.stringify(INITIAL_PROJECT),sprintflow_sprints:JSON.stringify(INITIAL_SPRINTS),sprintflow_tasks:JSON.stringify(INITIAL_TASKS),sprintflow_activity:'[]',sprintflow_selected_sprint:'',sprintflow_burndown_history:'{}',sprintflow_pending_sync:'{"seq":0,"tables":{},"deletedTaskIds":[],"deletedSprintIds":[],"activity":[]}'};
// Isolate displayed caches and upload queues by endpoint + verified cloud identity.
// Backups stay in this browser; none are imported into another actor's upload queue.
// `email` is the verified account's email; it lets the first run after an upgrade keep
// the cache (and unsent changes) that the same account left before owners were recorded.
export function activateSessionCache(owner, email) {
 recoverLocalSave();
 let previous=localStorage.getItem(OWNER);
 if(!previous){
   let marker;try{marker=JSON.parse(localStorage.getItem('sprintflow_session')||'null');}catch{marker=null;}
   const sameAccount=owner!=='demo' && marker?.mode==='supabase' && Boolean(email) && marker?.email===email;
   previous=sameAccount ? owner : marker?.mode==='supabase' || (owner!=='demo' && marker?.mode!=='demo') ? 'legacy-unverified' : 'demo';
 }
 // Record the owner even when nothing changes, so a later switch backs up under the right name.
 if(previous===owner){localStorage.setItem(OWNER,owner);return;}
 const backupKey=value=>`sprintflow_cache_backup:${value}`;
 const previousValues=Object.fromEntries(Object.keys(defaults).map(key=>[key,localStorage.getItem(key)??defaults[key]]));
 localStorage.setItem(backupKey(previous),JSON.stringify(previousValues));
 let restored=defaults;
 const saved=localStorage.getItem(backupKey(owner));
 if(saved){const parsed=JSON.parse(saved);restored=Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,typeof parsed[key]==='string'?parsed[key]:value]));}
 const entries=[...Object.entries(restored),[OWNER,owner]];
 localStorage.setItem('sprintflow_save_journal',JSON.stringify(entries));recoverLocalSave();
}
