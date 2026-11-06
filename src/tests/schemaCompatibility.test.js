import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DataService, getPendingChangeCount, setSupabaseClient } from '../services/supabaseClient';
import { createFakeSupabase } from './helpers/fakeSupabase';
import { signIn } from '../services/authService';
import { INITIAL_PROJECT } from '../services/mockData';
const task={id:'a',project_id:INITIAL_PROJECT.id,title:'Normal edit',story_points:3,due_date:null,blocked_reason:''};
beforeEach(()=>{const map=new Map();vi.stubGlobal('localStorage',{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)});vi.spyOn(console,'warn').mockImplementation(()=>{});});
afterEach(()=>{setSupabaseClient(undefined);vi.unstubAllGlobals();vi.restoreAllMocks();});
async function oldSchema(error={code:'PGRST204',message:"Could not find the 'due_date' column of 'tasks' in the schema cache"}) {
  const client=createFakeSupabase(),base=client.from;let attempts=0;
  client.from=table=>{
    const builder=base(table),upsert=builder.upsert;
    builder.upsert=rows=>{
      attempts++;upsert(rows);
      if(rows.some(row=>Object.hasOwn(row,'due_date')||Object.hasOwn(row,'blocked_reason')))builder.then=resolve=>resolve({data:null,error});
      return builder;
    };
    return builder;
  };
  await authenticate(client);return {client,attempts:()=>attempts};
}
it('retries ordinary task edits without unused metadata on an unmigrated schema',async()=>{
  const {client,attempts}=await oldSchema();await DataService.saveTasks([task]);
  expect(attempts()).toBe(2);expect(getPendingChangeCount()).toBe(0);
  expect(client.db.tasks[0]).toMatchObject({id:'a',title:'Normal edit'});expect(client.db.tasks[0]).not.toHaveProperty('due_date');
});
it('retains nonempty metadata in the queue instead of silently dropping it',async()=>{
  const {client,attempts}=await oldSchema();await DataService.saveTasks([{...task,due_date:'2026-11-07'}]);
  expect(attempts()).toBe(1);expect(client.db.tasks).toEqual([]);expect(getPendingChangeCount()).toBe(1);
});
it('does not retry unrelated database errors as missing schema support',async()=>{
  const {attempts}=await oldSchema({code:'42501',message:'permission denied'});await DataService.saveTasks([task]);
  expect(attempts()).toBe(1);expect(getPendingChangeCount()).toBe(1);
});
it('continues to clear previously set fields on a migrated database',async()=>{
  const client=createFakeSupabase({tasks:[{...task,due_date:'2026-11-07',blocked_reason:'Waiting'}]});await authenticate(client);
  await DataService.saveTasks([task]);expect(client.db.tasks[0]).toMatchObject({due_date:null,blocked_reason:''});
});
async function authenticate(client) {
 const user={id:'test-user',email:'darshan@pes.edu'};
 client.auth={signInWithPassword:async()=>({error:null}),getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null})};
 setSupabaseClient(client);await signIn(user.email,'test password');
}
