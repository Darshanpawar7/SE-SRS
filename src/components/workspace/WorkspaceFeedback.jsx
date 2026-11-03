import React,{useEffect,useRef,useSyncExternalStore} from 'react';
import {useProject} from '../../context/ProjectContext';
import {workspaceKey,hapticFeedback} from '../../utils/workspaceFeedback';
import {subscribeFeedback,getFeedbackSettings,getFeedbackNotice,saveFeedbackSettings,announceSaved,dismissFeedback} from '../../services/feedbackStore';
import './workspaceFeedback.css';
export function FeedbackSettings(){
 const p=useSyncExternalStore(subscribeFeedback,getFeedbackSettings,getFeedbackSettings);
 const supported=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
 return <fieldset className="feedback-settings"><legend>Appearance & interaction</legend><label>Color theme<select className="form-select" value={p.theme} onChange={e=>saveFeedbackSettings({...p,theme:e.target.value})}><option value="light">Ivory / evergreen</option><option value="dark">Charcoal / teal</option></select></label><label><input type="checkbox" checked={p.compactNavigation} onChange={e=>saveFeedbackSettings({...p,compactNavigation:e.target.checked})}/> Compact desktop navigation</label><label><input type="checkbox" checked={p.animations} onChange={e=>saveFeedbackSettings({...p,animations:e.target.checked})}/> Workspace animations</label><label><input type="checkbox" checked={p.haptics} disabled={!supported} onChange={e=>saveFeedbackSettings({...p,haptics:e.target.checked})}/> Device haptics {supported?'(opt-in)':'(unavailable in this browser)'}</label><p>Preferences are saved in this browser. Reduced motion and device capabilities take priority.</p>{supported&&<button type="button" className="btn btn-secondary btn-sm" onClick={()=>hapticFeedback('saved',{enabled:p.haptics,reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,hidden:document.hidden})}>Test haptics</button>}</fieldset>;
}
export default function WorkspaceFeedback({onNewTask}){
 const {activities,loading}=useProject();
 const p=useSyncExternalStore(subscribeFeedback,getFeedbackSettings,getFeedbackSettings);
 const notice=useSyncExternalStore(subscribeFeedback,getFeedbackNotice,()=>null);
 const known=useRef(null),help=useRef(null);
 useEffect(()=>{
  document.documentElement.dataset.workspaceMotion=p.animations?'on':'off';
  document.documentElement.dataset.workspaceTheme=p.theme;
  document.documentElement.dataset.compactNavigation=String(p.compactNavigation);
  return()=>{delete document.documentElement.dataset.workspaceMotion;delete document.documentElement.dataset.workspaceTheme;delete document.documentElement.dataset.compactNavigation;};
 },[p.animations,p.theme,p.compactNavigation]);
 useEffect(()=>{
  if(loading)return;
  const ids=new Set(activities.map(a=>a.id));
  if(known.current){const fresh=activities.filter(a=>!known.current.has(a.id)&&Date.now()-Date.parse(a.timestamp)<15000&&Date.now()>=Date.parse(a.timestamp));if(fresh[0])announceSaved(fresh[0]);}
  known.current=ids;
 },[activities,loading]);
 useEffect(()=>{
  const handler=event=>{
   const action=workspaceKey(event);
   if(!action||document.querySelector('dialog[open],[aria-modal="true"]'))return;
   event.preventDefault();if(action==='new')onNewTask();else help.current?.showModal();
  };
  window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
 },[onNewTask]);
 return <>
  <div className="workspace-interactions"><button type="button" className="appearance-toggle" onClick={()=>saveFeedbackSettings({...p,theme:p.theme==='dark'?'light':'dark'})} aria-label={p.theme==='dark'?'Switch to light theme':'Switch to dark theme'}><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg>{p.theme==='dark'?'Light':'Dark'}</button><button type="button" className="appearance-toggle navigation-toggle" onClick={()=>saveFeedbackSettings({...p,compactNavigation:!p.compactNavigation})} aria-pressed={p.compactNavigation}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m4-10 2 2-2 2"/></svg>{p.compactNavigation?'Expand navigation':'Compact navigation'}</button><button type="button" className="shortcut-help" onClick={()=>help.current?.showModal()} aria-label="Show keyboard shortcuts">? <span>Shortcuts</span></button></div>
  <dialog ref={help} className="shortcut-dialog" aria-labelledby="shortcuts-title"><h2 id="shortcuts-title">Keyboard shortcuts</h2><dl><dt>⌘ / Ctrl + K</dt><dd>Search actions and tasks</dd><dt>N</dt><dd>Create a task</dd><dt>?</dt><dd>Show this help</dd><dt>Escape</dt><dd>Close the native command/help dialog</dd></dl><p>Single-key shortcuts pause while typing or while a modal is open.</p><button className="btn btn-primary" onClick={()=>help.current.close()}>Close</button></dialog>
  {notice&&<div className={`saved-feedback ${notice.complete?'is-complete':''}`} role="status" aria-live="polite" key={notice.id}><span className="saved-feedback-icon" aria-hidden="true">{notice.complete?'✓':'●'}</span><span>{notice.message}</span><button onClick={dismissFeedback} aria-label="Dismiss saved confirmation">×</button></div>}
 </>;
}
