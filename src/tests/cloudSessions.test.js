import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {restoreSession,verifyCloudSession,signIn} from '../services/authService';
import {setSupabaseClient,DataService} from '../services/supabaseClient';
import {createFakeSupabase} from './helpers/fakeSupabase';
import {INITIAL_PROJECT} from '../services/mockData';
let data;
beforeEach(()=>{data=new Map();vi.stubGlobal('localStorage',{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)});});
afterEach(()=>{setSupabaseClient(undefined);vi.unstubAllGlobals();});
it('does not trust an edited browser marker for a configured cloud identity',async()=>{
 data.set('sprintflow_session',JSON.stringify({memberId:'u-1',email:'darshan@pes.edu',mode:'supabase'}));
 setSupabaseClient({auth:{getUser:async()=>({data:{user:{id:'auth-eshwar',email:'eshwar@pes.edu'}},error:null})}});
 expect(restoreSession()).toBe(null);expect((await verifyCloudSession()).id).toBe('auth-eshwar');
});
it('accepts a verified cloud identity independently of the local demo team list',async()=>{
 const user={id:'auth-new',email:'new.person@example.com',user_metadata:{full_name:'New Person'}};
 const signOut=vi.fn(async()=>({}));
 setSupabaseClient({auth:{signOut,signInWithPassword:async()=>({data:{user},error:null}),getUser:async()=>({data:{user},error:null})}});
 await expect(signIn(user.email,'supabase-password')).resolves.toMatchObject({id:user.id,email:user.email,mode:'supabase'});
 expect(signOut).not.toHaveBeenCalled();
});
it('fails closed on verification error without erasing saved work',async()=>{
 data.set('sprintflow_tasks','[{"id":"saved"}]');setSupabaseClient({auth:{getUser:async()=>({data:{user:null},error:new Error('expired')})}});
 await expect(verifyCloudSession()).rejects.toThrow('expired');expect(data.get('sprintflow_tasks')).toContain('saved');
});
it('restricts cloud sprint and task reads to the selected project even for multi-project members',async()=>{
 const cloud=createFakeSupabase({tasks:[{id:'a',project_id:INITIAL_PROJECT.id,story_points:3},{id:'b',project_id:'other',story_points:3}],sprints:[{id:'s',project_id:INITIAL_PROJECT.id},{id:'x',project_id:'other'}]});setSupabaseClient(cloud);
 DataService.setActiveProject(INITIAL_PROJECT.id);
 expect((await DataService.getTasks()).map(t=>t.id)).toEqual(['a']);expect((await DataService.getSprints()).map(t=>t.id)).toEqual(['s']);
});
it('isolates cached project data and pending uploads between verified identities and restores prior work',async()=>{
 const {activateSessionCache}=await import('../services/sessionCache');
 data.set('sprintflow_session',JSON.stringify({mode:'demo'}));data.set('sprintflow_tasks','[{"id":"demo-work"}]');
 activateSessionCache('endpoint:alice');data.set('sprintflow_tasks','[{"id":"alice-private"}]');data.set('sprintflow_pending_sync','{"seq":1,"tables":{"tasks":1},"activity":[]}');
 activateSessionCache('endpoint:bob');expect(data.get('sprintflow_tasks')).not.toContain('alice-private');expect(data.get('sprintflow_pending_sync')).not.toContain('"tasks":1');
 activateSessionCache('endpoint:alice');expect(data.get('sprintflow_tasks')).toContain('alice-private');expect(data.get('sprintflow_pending_sync')).toContain('"tasks":1');
 activateSessionCache('demo');expect(data.get('sprintflow_tasks')).toContain('demo-work');
});

it('quarantines a legacy cloud cache instead of exposing it through local demo sign-in',async()=>{
 const {activateSessionCache}=await import('../services/sessionCache');
 data.set('sprintflow_session',JSON.stringify({mode:'supabase'}));data.set('sprintflow_tasks','[{"id":"old-cloud-private"}]');
 activateSessionCache('demo');expect(data.get('sprintflow_tasks')).not.toContain('old-cloud-private');expect(data.get('sprintflow_cache_backup:legacy-unverified')).toContain('old-cloud-private');
});
