export const clampMapZoom = value => Math.max(.1, Math.min(1.6, Number.isFinite(value) ? value : 1));
export function buildProjectMap(project, sprints, tasks, query = '') {
  if (!project?.id) return { nodes:[],edges:[],groups:[],matches:[],width:900,height:500,total:0 };
  const projectSprints = sprints.filter(s=>s.project_id===project.id);
  const sprintIds = new Set(projectSprints.map(s=>s.id));
  const projectTasks = tasks.filter(t=>t.project_id===project.id);
  const needle = query.trim().toLocaleLowerCase();
  const allGroups = [...projectSprints.map(s=>({...s,kind:'sprint'})),{id:'__backlog',name:'Unscheduled backlog',kind:'backlog'},...(projectTasks.some(t=>t.sprint_id&&!sprintIds.has(t.sprint_id))?[{id:'__unlinked',name:'Unlinked sprint',kind:'unlinked'}]:[])];
  const groupFor = task => !task.sprint_id ? '__backlog' : sprintIds.has(task.sprint_id) ? task.sprint_id : '__unlinked';
  const projectMatches = `${project.key} ${project.name}`.toLocaleLowerCase().includes(needle);
  const matches = projectTasks.filter(t=>!needle||projectMatches||`${t.id} ${t.title} ${t.assignee_name || ''} ${(t.labels || []).join(' ')} ${allGroups.find(g=>g.id===groupFor(t))?.name}`.toLocaleLowerCase().includes(needle));
  const groups = allGroups.map(g=>({...g,tasks:matches.filter(t=>groupFor(t)===g.id)})).filter(g=>!needle||g.tasks.length||g.name.toLocaleLowerCase().includes(needle)||projectMatches);
  const drawn = new Set(matches.slice(0,80).map(t=>t.id));
  const width = Math.max(900,groups.length*310+80);
  const nodes = [{key:'project',kind:'project',data:project,label:project.name,x:width/2-125,y:35,w:250,h:110}];
  const edges = [];
  let height = 500;
  groups.forEach((g,index)=>{
    const x = 70+index*310, key=`group:${g.id}`;
    nodes.push({key,kind:g.kind,data:g,label:g.name,x,y:230,w:250,h:115});
    edges.push({key:`project:${g.id}`,from:'project',to:key,path:`M ${width/2} 145 V 185 H ${x+125} V 230`});
    g.tasks.filter(t=>drawn.has(t.id)).forEach((t,row)=>{
      const y = 410+row*110, taskKey=`task:${t.id}`;
      nodes.push({key:taskKey,kind:'task',data:t,label:t.title,x,y,w:250,h:85});
      edges.push({key:`${g.id}:${t.id}`,from:key,to:taskKey,path:`M ${x} 288 H ${x-22} V ${y+42} H ${x}`});
      height = Math.max(height,y+130);
    });
  });
  return {nodes,edges,groups,matches,width,height,total:projectTasks.length,shown:drawn.size};
}
