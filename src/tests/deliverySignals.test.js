import { describe,it,expect } from 'vitest';
import {deliverySignals,sprintClock,taskAgeDays} from '../utils/deliverySignals';
const now=new Date('2026-10-22T12:00:00Z');
const sprint={start_date:'2026-10-19',end_date:'2026-10-23',status:'active'};
const tasks=[
 {id:'a',title:'Review API',priority:'critical',status:'review',assignee_id:'a',updated_at:'2026-10-14T12:00:00Z'},
 {id:'b',title:'Ship UI',priority:'high',status:'in_progress',assignee_id:null,updated_at:'2026-10-22T01:00:00Z'},
 {id:'c',title:'Closed',priority:'critical',status:'done',assignee_id:null,updated_at:'2026-01-01'},
];
describe('Delivery signals',()=>{
 it('computes counts from unfinished scoped items and independent review totals',()=>{const s=deliverySignals(tasks,['a'],sprint,now);expect(s).toMatchObject({wip:2,review:1,critical:1,unassigned:1,stale:1,open:2,done:1});expect(s.priorities.find(p=>p.id==='critical')).toMatchObject({done:1,total:2});expect(s.attention).toHaveLength(2)});
 it('provides honest empty and unknown states',()=>{expect(deliverySignals([],[],null,now)).toMatchObject({wip:0,review:0,critical:0,stale:0,clock:null,attention:[]});expect(taskAgeDays({updated_at:'bad'},now)).toBeNull();expect(taskAgeDays({updated_at:'2027-01-01'},now)).toBeNull()});
 it('uses creation fallback and seven elapsed days boundary',()=>{expect(taskAgeDays({created_at:'2026-10-15T12:00:00Z'},now)).toBe(7);expect(taskAgeDays({updated_at:'2026-10-15T12:00:01Z'},now)).toBe(6)});
 it('does not silently count unknown/future dates as stale',()=>{const s=deliverySignals([{title:'Unknown',status:'todo',updated_at:'bad'}],[],null,now);expect(s.stale).toBe(0);expect(s.unknownAge).toBe(1)});
 it('counts inclusive UTC calendar dates and clamps before/after schedule',()=>{expect(sprintClock(sprint,now)).toMatchObject({duration:5,elapsed:4,percentage:80,daysLeft:1,overdue:false});expect(sprintClock(sprint,'2026-10-01')).toMatchObject({elapsed:0,percentage:0});expect(sprintClock(sprint,'2026-10-30')).toMatchObject({percentage:100,overdue:true});expect(sprintClock({...sprint,status:'completed'},'2026-10-30').overdue).toBe(false)});
 it('handles one day and invalid ranges',()=>{expect(sprintClock({...sprint,end_date:sprint.start_date},'2026-10-19').percentage).toBe(100);expect(sprintClock({...sprint,end_date:'bad'},now)).toBeNull();expect(sprintClock({...sprint,end_date:'2026-10-01'},now)).toBeNull()});
});
