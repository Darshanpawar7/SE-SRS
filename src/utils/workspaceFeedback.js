export const FEEDBACK_KEY='sprintflow_feedback_preferences';
export function parseFeedback(value) {
 try { const p=JSON.parse(value||'{}') || {};return {animations:p.animations!==false,haptics:p.haptics===true,theme:p.theme==='dark'?'dark':'light',compactNavigation:p.compactNavigation===true}; } catch{return {animations:true,haptics:false,theme:'light',compactNavigation:false};}
}
export function hapticFeedback(kind,{enabled,navigator:nav=globalThis.navigator,reduced=false,hidden=false}={}) {
 if(!enabled||reduced||hidden||!nav?.vibrate||!nav.userActivation?.hasBeenActive)return false;
 try {return nav.vibrate(kind==='complete'?[12,35,20]:10);}catch{return false;}
}
export function workspaceKey(event) {
 const target=event.target;
 if(event.isComposing||event.metaKey||event.ctrlKey||event.altKey||target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable="true"],dialog[open]'))return null;
 if(event.key.toLowerCase()==='n'&&!event.shiftKey)return 'new';
 if(event.key==='?')return 'help';
 return null;
}
