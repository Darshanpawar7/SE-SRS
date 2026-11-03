import {expect,it,vi} from 'vitest';
import {parseFeedback,hapticFeedback,workspaceKey} from '../utils/workspaceFeedback';
it('defaults to visual motion with opt-in vibration and handles corrupt preferences',()=>{expect(parseFeedback('bad')).toEqual({animations:true,haptics:false});expect(parseFeedback('{"animations":false,"haptics":true}')).toEqual({animations:false,haptics:true});});
it('never vibrates without consent, activation, capability, or with reduced motion',()=>{
 const vibrate=vi.fn(()=>true),nav={vibrate,userActivation:{hasBeenActive:true}};
 expect(hapticFeedback('complete',{enabled:false,navigator:nav})).toBe(false);
 expect(hapticFeedback('complete',{enabled:true,navigator:nav,reduced:true})).toBe(false);
 expect(hapticFeedback('complete',{enabled:true,navigator:{vibrate,userActivation:{hasBeenActive:false}}})).toBe(false);
 expect(vibrate).not.toHaveBeenCalled();expect(hapticFeedback('complete',{enabled:true,navigator:nav})).toBe(true);expect(vibrate).toHaveBeenCalledWith([12,35,20]);
});
it('single-key actions never interrupt typing, composition or platform shortcuts',()=>{
 const e={key:'n',target:{closest:()=>null}};expect(workspaceKey(e)).toBe('new');expect(workspaceKey({...e,target:{closest:()=>({})}})).toBe(null);expect(workspaceKey({...e,ctrlKey:true})).toBe(null);expect(workspaceKey({...e,isComposing:true})).toBe(null);expect(workspaceKey({...e,key:'?'})).toBe('help');
});
