import {FEEDBACK_KEY,parseFeedback,hapticFeedback} from '../utils/workspaceFeedback';
let settings,notice=null,timeout;const listeners=new Set();
export const subscribeFeedback=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
const changed=()=>listeners.forEach(fn=>fn());
export const getFeedbackSettings=()=>{if(settings)return settings;try{settings=parseFeedback(localStorage.getItem(FEEDBACK_KEY));}catch{settings=parseFeedback(null);}return settings;};
export const getFeedbackNotice=()=>notice;
export function saveFeedbackSettings(next){settings=parseFeedback(JSON.stringify(next));try{localStorage.setItem(FEEDBACK_KEY,JSON.stringify(settings));}catch{clearTimeout(timeout);notice={id:'preferences-storage-error',complete:false,message:'Appearance changed for this session. Browser storage could not save these preferences.'};timeout=setTimeout(dismissFeedback,6000);}changed();}
export function dismissFeedback(){clearTimeout(timeout);notice=null;changed();}
export function announceSaved(record){
 const p=getFeedbackSettings();
 notice={id:record.id,complete:record.to==='done',message:`${record.to==='done'?'Completed':record.type==='CREATE'?'Created':'Saved'}: ${record.target||'work item'}`};
 hapticFeedback(notice.complete?'complete':'saved',{enabled:p.haptics,reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,hidden:document.hidden});
 clearTimeout(timeout);timeout=setTimeout(dismissFeedback,6000);changed();
}
