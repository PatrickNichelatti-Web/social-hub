import { useState, useEffect } from "react";
import * as db from "./db";

const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STATUS_COLS = [
  { id:"draft",label:"Rascunho",color:"#888780" },
  { id:"production",label:"Em produção",color:"#378ADD" },
  { id:"approval",label:"Aprovação",color:"#EF9F27" },
  { id:"approved",label:"Aprovado",color:"#639922" },
  { id:"scheduled",label:"Agendado",color:"#1D9E75" }
];
const VIEWS = { CLIENTS:"clients",CALENDAR:"calendar",PIPELINE:"pipeline",SETTINGS:"settings" };

function Badge({type,types}){const t=(types||[]).find(x=>x.slug===type)||{label:type,icon:"•",bg_color:"#F1EFE8",text_color:"#444"};return <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:t.bg_color,color:t.text_color,fontWeight:500,whiteSpace:"nowrap"}}>{t.icon} {t.label}</span>;}
function Modal({title,onClose,children,wide}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:"24px 28px",width:wide?720:500,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h2 style={{margin:0,fontSize:18,fontWeight:600}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button></div>{children}</div></div>);}
function Field({label,value,onChange,type="text",placeholder,rows,options}){const s={width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e0e0e0",background:"#f9f9f9",color:"#1a1a1a",fontSize:14,fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"};return(<div style={{marginBottom:14}}>{label&&<label style={{fontSize:12,color:"#888",display:"block",marginBottom:4,fontWeight:500}}>{label}</label>}{rows?<textarea style={{...s,resize:"vertical"}} rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>:options?<select style={s} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input type={type} style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</div>);}
function Btn({children,onClick,primary,small,disabled,danger,style:sx}){return(<button disabled={disabled} onClick={onClick} style={{padding:small?"6px 14px":"10px 20px",borderRadius:8,fontSize:small?12:14,fontWeight:500,cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",background:primary?"#1D9E75":danger?"#E24B4A":"#fff",color:primary||danger?"#fff":"#333",border:primary||danger?"none":"1px solid #ddd",opacity:disabled?0.5:1,...sx}}>{children}</button>);}

const defClient = {name:"",industry:"",instagram:"",persona:"",tone:"",colors:"#1D9E75, #0C447C",fonts:"",posts_per_month:12,reels_per_month:4,stories_per_day:3,notes:""};

export default function SocialHub({ session }) {
  const [view,setView]=useState(VIEWS.CLIENTS);
  const [clients,setClients]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [cTypes,setCTypes]=useState([]);
  const [sel,setSel]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showCF,setShowCF]=useState(false);
  const [eClient,setEClient]=useState({...defClient});
  const [eCId,setECId]=useState(null);
  const [calM,setCalM]=useState(new Date().getMonth());
  const [calY,setCalY]=useState(new Date().getFullYear());
  const [aiL,setAiL]=useState(false);
  const [aiR,setAiR]=useState(null);
  const [taskModal,setTaskModal]=useState(null);
  const [eTask,setETask]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [nTask,setNTask]=useState({title:"",type:"post",day:1,time:"12:00",description:"",hashtags:"",status:"draft",approval_note:""});
  const [drag,setDrag]=useState(null);
  const [sbOpen,setSbOpen]=useState(true);
  const [profile,setProfile]=useState(null);

  // Load initial data
  useEffect(()=>{
    async function load(){
      try{
        const [p,cl,tk,ct]=await Promise.all([db.getProfile(),db.getClients(),db.getTasks(),db.getContentTypes()]);
        setProfile(p);setClients(cl);setTasks(tk);setCTypes(ct);
      }catch(e){console.error("Load error:",e);}
      setLoading(false);
    }
    load();
  },[]);

  const ac=clients.find(c=>c.id===sel);
  const dim=new Date(calY,calM+1,0).getDate();
  const cTasks=tasks.filter(t=>t.client_id===sel);
  const mTasks=cTasks.filter(t=>t.month===calM&&t.year===calY);
  const stats=STATUS_COLS.reduce((a,c)=>({...a,[c.id]:cTasks.filter(t=>t.status===c.id).length}),{});

  // CLIENT CRUD
  async function saveCl(){
    if(!eClient.name)return;
    try{
      if(eCId){const upd=await db.updateClient(eCId,eClient);setClients(clients.map(c=>c.id===eCId?upd:c));}
      else{const nc=await db.createClient(eClient);setClients([nc,...clients]);if(!sel)setSel(nc.id);}
    }catch(e){alert("Erro: "+e.message);}
    setShowCF(false);setEClient({...defClient});setECId(null);
  }
  async function delCl(id){
    try{await db.deleteClient(id);setClients(clients.filter(c=>c.id!==id));setTasks(tasks.filter(t=>t.client_id!==id));if(sel===id)setSel(null);}catch(e){alert("Erro: "+e.message);}
  }

  // TASK CRUD
  async function addTask(td){
    try{const t=await db.createTask({...td,client_id:sel,month:calM,year:calY});setTasks([...tasks,t]);}catch(e){alert("Erro: "+e.message);}
  }
  async function updTask(id,u){
    try{const t=await db.updateTask(id,u);setTasks(tasks.map(x=>x.id===id?t:x));}catch(e){alert("Erro: "+e.message);}
  }
  async function delTask(id){
    try{await db.deleteTask(id);setTasks(tasks.filter(t=>t.id!==id));setTaskModal(null);setETask(null);}catch(e){alert("Erro: "+e.message);}
  }

  // AI CALENDAR (calls Anthropic directly for now - will move to backend later)
  async function genCal(){
    if(!ac)return;setAiL(true);setAiR(null);
    const apiKey=prompt("Cole sua API Key da Anthropic:");
    if(!apiKey){setAiL(false);return;}
    const tl=cTypes.map(t=>t.slug).join("|");
    const p=`Você é um social media manager. Gere cronograma para ${MONTHS[calM]} ${calY} (${dim} dias).\nCliente: ${ac.name}|${ac.industry}|Persona:${ac.persona}|Tom:${ac.tone}\nContrato: ${ac.posts_per_month} posts, ${ac.reels_per_month} reels, ${ac.stories_per_day} stories/dia\nTipos: ${tl}\nRegras: distribuir uniformemente, horários 7h/12h/18h/21h, REELs com roteiro, POSTs com CTA.\nRESPONDA APENAS JSON: {"items":[{"day":1,"time":"12:00","type":"post","title":"titulo","description":"desc","hashtags":"#tags"}]}`;
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:p}]})});
      const data=await resp.json();
      const text=(data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||text);
      if(parsed.items){
        await db.deleteTasksByClientMonth(ac.id,calM,calY);
        const newTasks=await db.createTasks(parsed.items.map(i=>({client_id:ac.id,day:i.day,month:calM,year:calY,time:i.time,type:i.type,title:i.title,description:i.description,hashtags:i.hashtags||"",status:"draft",approval_note:""})));
        setTasks(prev=>[...prev.filter(t=>!(t.client_id===ac.id&&t.month===calM&&t.year===calY)),...newTasks]);
        setAiR({ok:true,n:newTasks.length});
      }
    }catch(e){setAiR({ok:false,e:e.message});}
    setAiL(false);
  }

  function getCalDays(){const f=new Date(calY,calM,1).getDay();const d=[];for(let i=0;i<f;i++)d.push(null);for(let i=1;i<=dim;i++)d.push(i);return d;}

  const nav=[{id:VIEWS.CLIENTS,l:"Clientes",i:"👥"},{id:VIEWS.CALENDAR,l:"Calendário",i:"📅"},{id:VIEWS.PIPELINE,l:"Pipeline",i:"📋"},{id:VIEWS.SETTINGS,l:"Configurações",i:"⚙️"}];
  const tOpts=cTypes.map(t=>({value:t.slug,label:t.label}));
  const sOpts=STATUS_COLS.map(s=>({value:s.id,label:s.label}));

  function TF({task,setT,onSave,onCancel,title,onDel,onDup}){
    return(<Modal title={title} onClose={onCancel} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Field label="Título" value={task.title} onChange={v=>setT({...task,title:v})} placeholder="Ex: Post sobre tendências"/>
        <Field label="Tipo" value={task.type} onChange={v=>setT({...task,type:v})} options={tOpts}/>
        <Field label="Dia" type="number" value={task.day} onChange={v=>setT({...task,day:Math.min(Math.max(parseInt(v)||1,1),dim)})}/>
        <Field label="Horário" type="time" value={task.time} onChange={v=>setT({...task,time:v})}/>
        <Field label="Status" value={task.status} onChange={v=>setT({...task,status:v})} options={sOpts}/>
        <Field label="Hashtags" value={task.hashtags||""} onChange={v=>setT({...task,hashtags:v})} placeholder="#marketing"/>
      </div>
      <Field label="Descrição / Roteiro" value={task.description||""} onChange={v=>setT({...task,description:v})} rows={5} placeholder="Roteiro, briefing, CTA..."/>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:8,borderTop:"1px solid #eee",paddingTop:16}}>
        <div style={{display:"flex",gap:8}}>
          {onDel&&<Btn small danger onClick={onDel}>🗑 Excluir</Btn>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onCancel}>Cancelar</Btn>
          <Btn primary onClick={onSave}>Salvar</Btn>
        </div>
      </div>
    </Modal>);
  }

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f5f0",fontFamily:"'DM Sans',sans-serif"}}><p style={{color:"#888"}}>Carregando dados...</p></div>;

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",color:"#1a1a1a",background:"#f5f5f0"}}>
      {/* Sidebar */}
      <div style={{width:sbOpen?220:56,background:"#fff",borderRight:"1px solid #eee",display:"flex",flexDirection:"column",transition:"width 0.2s",flexShrink:0,overflow:"hidden"}}>
        <div style={{padding:sbOpen?"20px 16px 12px":"20px 8px 12px",display:"flex",alignItems:"center",gap:10}}>
          <div onClick={()=>setSbOpen(!sbOpen)} style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1D9E75,#0F6E56)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>SH</div>
          {sbOpen&&<span style={{fontWeight:700,fontSize:15,whiteSpace:"nowrap"}}>Social Hub</span>}
        </div>
        <div style={{padding:"8px",flex:1}}>
          {nav.map(n=>(<div key={n.id} onClick={()=>setView(n.id)} style={{padding:sbOpen?"10px 12px":"10px 8px",borderRadius:8,marginBottom:2,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:view===n.id?"#f0f0ea":"transparent",fontWeight:view===n.id?600:400,fontSize:14}}>
            <span style={{fontSize:16,flexShrink:0,width:24,textAlign:"center"}}>{n.i}</span>
            {sbOpen&&<span style={{whiteSpace:"nowrap"}}>{n.l}</span>}
          </div>))}
        </div>
        {sbOpen&&(<div style={{padding:"12px 16px",borderTop:"1px solid #eee",fontSize:12}}>
          <div style={{color:"#888",marginBottom:4}}>{profile?.name||session.user.email}</div>
          <button onClick={db.signOut} style={{background:"none",border:"none",color:"#E24B4A",cursor:"pointer",fontSize:12,padding:0,fontFamily:"'DM Sans',sans-serif"}}>Sair</button>
        </div>)}
      </div>

      {/* Main */}
      <div style={{flex:1,minWidth:0,overflowY:"auto"}}>
        <div style={{padding:"14px 24px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff"}}>
          <h1 style={{margin:0,fontSize:18,fontWeight:600}}>{nav.find(n=>n.id===view)?.i} {nav.find(n=>n.id===view)?.l}</h1>
          {clients.length>0&&view!==VIEWS.SETTINGS&&(<select value={sel||""} onChange={e=>setSel(e.target.value)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #ddd",background:"#f9f9f9",color:"#333",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}><option value="">Selecione um cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
        </div>
        <div style={{padding:24}}>

{/* CLIENTS */}
{view===VIEWS.CLIENTS&&(<div>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <p style={{margin:0,color:"#888",fontSize:14}}>Seus clientes</p>
    <Btn primary onClick={()=>{setEClient({...defClient});setECId(null);setShowCF(true);}}>+ Novo cliente</Btn>
  </div>
  {clients.length===0&&<div style={{textAlign:"center",padding:60,color:"#888"}}><p style={{fontSize:40}}>👥</p><p>Nenhum cliente.</p></div>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
    {clients.map(c=>(<div key={c.id} onClick={()=>setSel(c.id)} style={{background:"#fff",borderRadius:12,padding:20,cursor:"pointer",border:sel===c.id?"2px solid #1D9E75":"1px solid #eee"}}>
      <div style={{fontWeight:600,fontSize:16}}>{c.name}</div>
      <div style={{fontSize:13,color:"#888"}}>{c.industry}</div>
      {c.instagram&&<div style={{fontSize:12,color:"#1D9E75",marginTop:4}}>@{c.instagram}</div>}
      <div style={{fontSize:12,color:"#888",margin:"8px 0",lineHeight:1.5}}>{c.persona?.slice(0,80)}{c.persona?.length>80?"...":""}</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:"#888",borderTop:"1px solid #f0f0f0",paddingTop:8}}><span>{c.posts_per_month} posts</span><span>{c.reels_per_month} reels</span><span>{c.stories_per_day} stories/dia</span></div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn small onClick={e=>{e.stopPropagation();setEClient(c);setECId(c.id);setShowCF(true);}}>Editar</Btn>
        <Btn small onClick={e=>{e.stopPropagation();delCl(c.id);}} style={{color:"#E24B4A"}}>Excluir</Btn>
      </div>
    </div>))}
  </div>
  {showCF&&(<Modal title={eCId?"Editar cliente":"Novo cliente"} onClose={()=>setShowCF(false)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Field label="Nome" value={eClient.name} onChange={v=>setEClient({...eClient,name:v})} placeholder="ConvertX"/>
      <Field label="Segmento" value={eClient.industry||""} onChange={v=>setEClient({...eClient,industry:v})}/>
      <Field label="Instagram" value={eClient.instagram||""} onChange={v=>setEClient({...eClient,instagram:v})} placeholder="sem @"/>
      <Field label="Tom de voz" value={eClient.tone||""} onChange={v=>setEClient({...eClient,tone:v})}/>
    </div>
    <Field label="Persona" value={eClient.persona||""} onChange={v=>setEClient({...eClient,persona:v})} rows={3} placeholder="Público-alvo..."/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
      <Field label="Posts/mês" type="number" value={eClient.posts_per_month} onChange={v=>setEClient({...eClient,posts_per_month:parseInt(v)||0})}/>
      <Field label="Reels/mês" type="number" value={eClient.reels_per_month} onChange={v=>setEClient({...eClient,reels_per_month:parseInt(v)||0})}/>
      <Field label="Stories/dia" type="number" value={eClient.stories_per_day} onChange={v=>setEClient({...eClient,stories_per_day:parseInt(v)||0})}/>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}><Btn onClick={()=>setShowCF(false)}>Cancelar</Btn><Btn primary onClick={saveCl}>Salvar</Btn></div>
  </Modal>)}
</div>)}

{/* CALENDAR */}
{view===VIEWS.CALENDAR&&(<div>
  {!ac?<div style={{textAlign:"center",padding:60,color:"#888"}}><p>Selecione um cliente.</p></div>:(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{if(calM===0){setCalM(11);setCalY(calY-1);}else setCalM(calM-1);}} style={{background:"#fff",border:"1px solid #ddd",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit"}}>←</button>
        <span style={{fontWeight:600,fontSize:16,minWidth:160,textAlign:"center"}}>{MONTHS[calM]} {calY}</span>
        <button onClick={()=>{if(calM===11){setCalM(0);setCalY(calY+1);}else setCalM(calM+1);}} style={{background:"#fff",border:"1px solid #ddd",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit"}}>→</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn small onClick={()=>{setNTask({title:"",type:cTypes[0]?.slug||"post",day:1,time:"12:00",description:"",hashtags:"",status:"draft",approval_note:""});setShowNew(true);}}>+ Novo item</Btn>
        <Btn primary onClick={genCal} disabled={aiL}>{aiL?"⏳ Gerando...":"🤖 Gerar com IA"}</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {cTypes.map(t=>{const n=mTasks.filter(tk=>tk.type===t.slug).length;return(<span key={t.id} style={{padding:"4px 10px",borderRadius:20,background:t.bg_color,color:t.text_color,fontSize:11,fontWeight:500}}>{t.icon} {t.label} ({n})</span>);})}
    </div>
    {aiR&&<div style={{padding:"12px 16px",borderRadius:8,marginBottom:16,fontSize:13,background:aiR.ok?"#E1F5EE":"#FCEBEB",color:aiR.ok?"#085041":"#791F1F"}}>{aiR.ok?`✅ ${aiR.n} itens criados!`:`❌ ${aiR.e}`}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:"#e0e0e0",borderRadius:12,overflow:"hidden",border:"1px solid #e0e0e0"}}>
      {DAYS.map(d=><div key={d} style={{padding:8,textAlign:"center",fontSize:12,fontWeight:600,color:"#888",background:"#f5f5f0"}}>{d}</div>)}
      {getCalDays().map((day,i)=>{
        const dt=day?mTasks.filter(t=>t.day===day).sort((a,b)=>(a.time||"").localeCompare(b.time||"")):[];
        return(<div key={i} style={{minHeight:90,padding:6,background:"#fff",opacity:day?1:0.3}}>
          {day&&<>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:"#888"}}>{day}</span>
              <span onClick={()=>{setNTask({title:"",type:cTypes[0]?.slug||"post",day,time:"12:00",description:"",hashtags:"",status:"draft",approval_note:""});setShowNew(true);}} style={{fontSize:14,color:"#1D9E75",cursor:"pointer"}}>+</span>
            </div>
            {dt.slice(0,3).map(t=>(<div key={t.id} onClick={()=>{setETask({...t});setTaskModal(t.id);}} style={{fontSize:10,padding:"3px 5px",borderRadius:4,marginBottom:2,cursor:"pointer",background:cTypes.find(x=>x.slug===t.type)?.bg_color||"#F1EFE8",color:cTypes.find(x=>x.slug===t.type)?.text_color||"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><b>{t.time}</b> {t.title?.slice(0,18)}</div>))}
            {dt.length>3&&<div style={{fontSize:10,color:"#888"}}>+{dt.length-3}</div>}
          </>}
        </div>);
      })}
    </div>
    {mTasks.length>0&&(<div style={{marginTop:24}}>
      <h3 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Todos os itens</h3>
      {mTasks.sort((a,b)=>a.day-b.day||(a.time||"").localeCompare(b.time||"")).map(t=>(<div key={t.id} onClick={()=>{setETask({...t});setTaskModal(t.id);}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"#fff",border:"1px solid #eee",cursor:"pointer",marginBottom:8}}>
        <div style={{minWidth:44,textAlign:"center"}}><div style={{fontSize:18,fontWeight:600,lineHeight:1}}>{t.day}</div><div style={{fontSize:10,color:"#888"}}>{MONTHS[calM]?.slice(0,3)}</div></div>
        <div style={{width:1,height:32,background:"#eee"}}/>
        <div style={{minWidth:44,fontSize:13,color:"#888",fontWeight:500}}>{t.time||"--:--"}</div>
        <Badge type={t.type} types={cTypes}/>
        <div style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
        <div style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:STATUS_COLS.find(s=>s.id===t.status)?.color+"22",color:STATUS_COLS.find(s=>s.id===t.status)?.color,fontWeight:500}}>{STATUS_COLS.find(s=>s.id===t.status)?.label}</div>
      </div>))}
    </div>)}
  </>)}
</div>)}

{/* PIPELINE */}
{view===VIEWS.PIPELINE&&(<div>
  {!ac?<div style={{textAlign:"center",padding:60,color:"#888"}}><p>Selecione um cliente.</p></div>:(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:20}}>
      {STATUS_COLS.map(c=>(<div key={c.id} style={{background:"#fff",borderRadius:8,padding:"12px 14px",textAlign:"center",border:"1px solid #eee"}}><div style={{fontSize:22,fontWeight:600,color:c.color}}>{stats[c.id]||0}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{c.label}</div></div>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:`repeat(${STATUS_COLS.length},minmax(0,1fr))`,gap:10}}>
      {STATUS_COLS.map(col=>(<div key={col.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(drag){updTask(drag,{status:col.id});setDrag(null);}}} style={{background:"#f9f9f7",borderRadius:10,padding:10,minHeight:300}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${col.color}`}}><span style={{fontSize:13,fontWeight:600}}>{col.label}</span><span style={{fontSize:11,background:col.color+"22",color:col.color,padding:"1px 7px",borderRadius:10,fontWeight:600}}>{cTasks.filter(t=>t.status===col.id).length}</span></div>
        {cTasks.filter(t=>t.status===col.id).sort((a,b)=>(a.day||0)-(b.day||0)).map(t=>(<div key={t.id} draggable onDragStart={()=>setDrag(t.id)} onClick={()=>{setETask({...t});setTaskModal(t.id);}} style={{background:"#fff",borderRadius:8,padding:"10px 12px",cursor:"grab",border:"1px solid #eee",fontSize:12,marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><Badge type={t.type} types={cTypes}/>{t.day>0&&<span style={{color:"#888",fontSize:11}}>{t.day}/{calM+1} {t.time}</span>}</div>
          <div style={{fontWeight:500,fontSize:13}}>{t.title}</div>
        </div>))}
      </div>))}
    </div>
  </>)}
</div>)}

{/* SETTINGS */}
{view===VIEWS.SETTINGS&&(<div style={{maxWidth:500}}>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee",marginBottom:16}}>
    <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>Conta</h3>
    <p style={{fontSize:14,color:"#333",margin:"0 0 4px"}}>{profile?.name}</p>
    <p style={{fontSize:13,color:"#888",margin:"0 0 12px"}}>{session.user.email}</p>
    <p style={{fontSize:12,color:"#888",margin:0}}>Plano: <b style={{color:"#1D9E75"}}>{profile?.plan||"free"}</b></p>
  </div>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee",marginBottom:16}}>
    <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>Tipos de conteúdo</h3>
    {cTypes.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:8,border:"1px solid #eee",marginBottom:6}}>
      <span style={{fontSize:16}}>{t.icon}</span>
      <span style={{padding:"2px 8px",borderRadius:4,background:t.bg_color,color:t.text_color,fontSize:12,fontWeight:500}}>{t.label}</span>
      <span style={{flex:1}}/>
    </div>))}
  </div>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee"}}>
    <h3 style={{margin:"0 0 8px",fontSize:15,fontWeight:600}}>Estatísticas</h3>
    <p style={{fontSize:13,color:"#888",margin:0}}>{clients.length} clientes · {tasks.length} tarefas · {cTypes.length} tipos</p>
  </div>
</div>)}

        </div>
      </div>

      {showNew&&<TF title="Novo item" task={nTask} setT={setNTask} onCancel={()=>setShowNew(false)} onSave={async()=>{if(nTask.title){await addTask(nTask);setShowNew(false);}}}/>}
      {taskModal&&eTask&&<TF title="Editar item" task={eTask} setT={setETask} onCancel={()=>{setTaskModal(null);setETask(null);}} onSave={async()=>{await updTask(taskModal,eTask);setTaskModal(null);setETask(null);}} onDel={()=>delTask(taskModal)}/>}
    </div>
  );
}
