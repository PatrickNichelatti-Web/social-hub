import { useState, useEffect } from "react";

const VIEWS = { CLIENTS: "clients", CALENDAR: "calendar", PIPELINE: "pipeline", TRENDS: "trends", SETTINGS: "settings" };
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STATUS_COLS = [
  { id: "draft", label: "Rascunho", color: "#888780" },
  { id: "production", label: "Em produção", color: "#378ADD" },
  { id: "approval", label: "Aprovação", color: "#EF9F27" },
  { id: "approved", label: "Aprovado", color: "#639922" },
  { id: "scheduled", label: "Agendado", color: "#1D9E75" }
];
const DEFAULT_TYPES = [
  { id: "post", label: "Post", icon: "◻", bg: "#E6F1FB", color: "#0C447C" },
  { id: "reel", label: "Reel", icon: "▶", bg: "#EEEDFE", color: "#3C3489" },
  { id: "carousel", label: "Carrossel", icon: "◫", bg: "#E1F5EE", color: "#085041" },
  { id: "story", label: "Story", icon: "○", bg: "#FBEAF0", color: "#72243E" },
  { id: "story_seq", label: "Seq. Stories", icon: "◎", bg: "#FAECE7", color: "#712B13" }
];
const COLOR_PRESETS = [
  { bg: "#E6F1FB", color: "#0C447C" }, { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#E1F5EE", color: "#085041" }, { bg: "#FBEAF0", color: "#72243E" },
  { bg: "#FAECE7", color: "#712B13" }, { bg: "#FAEEDA", color: "#633806" },
  { bg: "#EAF3DE", color: "#27500A" }, { bg: "#FCEBEB", color: "#791F1F" },
  { bg: "#F1EFE8", color: "#2C2C2A" }
];

function gid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function ld(k, fb) { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : fb; } catch { return fb; } }
function sd(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

function Badge({ type, types }) {
  const t = (types||[]).find(x => x.id === type) || { label: type, icon: "•", bg: "#F1EFE8", color: "#444" };
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: t.bg, color: t.color, fontWeight: 500, whiteSpace: "nowrap" }}>{t.icon} {t.label}</span>;
}
function Modal({ title, onClose, children, wide }) {
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", width: wide ? 720 : 500, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
      </div>{children}
    </div></div>);
}
function Field({ label, value, onChange, type="text", placeholder, rows, options }) {
  const s = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f9f9f9", color: "#1a1a1a", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" };
  return (<div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
    {rows ? <textarea style={{ ...s, resize: "vertical" }} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      : options ? <select style={s} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
  </div>);
}
function Btn({ children, onClick, primary, small, disabled, danger, style: sx }) {
  return (<button disabled={disabled} onClick={onClick} style={{
    padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
    background: primary ? "#1D9E75" : danger ? "#E24B4A" : "#fff", color: primary || danger ? "#fff" : "#333",
    border: primary || danger ? "none" : "1px solid #ddd", opacity: disabled ? 0.5 : 1, ...sx
  }}>{children}</button>);
}

const defClient = { name:"",industry:"",instagram:"",persona:"",tone:"",colors:"#1D9E75, #0C447C",fonts:"",postsPerMonth:12,reelsPerMonth:4,storiesPerDay:3,notes:"" };
const defTask = { title:"",type:"post",day:1,time:"12:00",description:"",hashtags:"",status:"draft",approvalNote:"" };

export default function SocialHub() {
  const [view, setView] = useState(VIEWS.CLIENTS);
  const [clients, setClients] = useState(() => ld("sh_clients",[]));
  const [tasks, setTasks] = useState(() => ld("sh_tasks",[]));
  const [sel, setSel] = useState(() => ld("sh_selected",null));
  const [apiKey, setApiKey] = useState(() => ld("sh_apikey",""));
  const [cTypes, setCTypes] = useState(() => ld("sh_types", DEFAULT_TYPES));
  const [showCF, setShowCF] = useState(false);
  const [eClient, setEClient] = useState({...defClient});
  const [eCId, setECId] = useState(null);
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [aiL, setAiL] = useState(false);
  const [aiR, setAiR] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [eTask, setETask] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [nTask, setNTask] = useState({...defTask});
  const [tQ, setTQ] = useState("");
  const [tR, setTR] = useState(null);
  const [drag, setDrag] = useState(null);
  const [sbOpen, setSbOpen] = useState(true);
  const [showTF, setShowTF] = useState(false);
  const [eType, setEType] = useState({ id:"",label:"",icon:"•",bg:"#E6F1FB",color:"#0C447C" });
  const [eTId, setETId] = useState(null);

  useEffect(() => { sd("sh_clients",clients); },[clients]);
  useEffect(() => { sd("sh_tasks",tasks); },[tasks]);
  useEffect(() => { sd("sh_selected",sel); },[sel]);
  useEffect(() => { sd("sh_apikey",apiKey); },[apiKey]);
  useEffect(() => { sd("sh_types",cTypes); },[cTypes]);

  const ac = clients.find(c => c.id === sel);
  const dim = new Date(calY, calM+1, 0).getDate();
  const cTasks = tasks.filter(t => t.clientId === sel);
  const mTasks = cTasks.filter(t => t.month === calM && t.year === calY);
  const stats = STATUS_COLS.reduce((a,c) => ({...a,[c.id]:cTasks.filter(t=>t.status===c.id).length}),{});

  async function callAI(p) {
    if(!apiKey){alert("Configure a API Key em Configurações.");setView(VIEWS.SETTINGS);return null;}
    const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:p}]})});
    if(!r.ok) throw new Error("API Error: "+r.status);
    const d = await r.json();
    return (d.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"").replace(/```json|```/g,"").trim();
  }

  function saveCl(){if(!eClient.name)return;if(eCId){setClients(clients.map(c=>c.id===eCId?{...eClient,id:eCId}:c));}else{const nc={...eClient,id:gid()};setClients([...clients,nc]);if(!sel)setSel(nc.id);}setShowCF(false);setEClient({...defClient});setECId(null);}
  function delCl(id){setClients(clients.filter(c=>c.id!==id));setTasks(tasks.filter(t=>t.clientId!==id));if(sel===id)setSel(clients.find(c=>c.id!==id)?.id||null);}
  function addTask(td){const t={...td,id:gid(),clientId:sel,month:calM,year:calY};setTasks([...tasks,t]);}
  function updTask(id,u){setTasks(tasks.map(t=>t.id===id?{...t,...u}:t));}
  function delTask(id){setTasks(tasks.filter(t=>t.id!==id));setTaskModal(null);setETask(null);}
  function dupTask(t){setTasks([...tasks,{...t,id:gid(),title:t.title+" (cópia)",status:"draft"}]);}
  function saveCT(){if(!eType.label)return;if(eTId){setCTypes(cTypes.map(t=>t.id===eTId?{...eType,id:eTId}:t));}else{setCTypes([...cTypes,{...eType,id:eType.label.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")||gid()}]);}setShowTF(false);setEType({id:"",label:"",icon:"•",bg:"#E6F1FB",color:"#0C447C"});setETId(null);}
  function delCT(id){if(cTypes.length<=1)return;setCTypes(cTypes.filter(t=>t.id!==id));}

  async function genCal(){
    if(!ac)return;setAiL(true);setAiR(null);
    const tl=cTypes.map(t=>t.id).join("|");
    const p=`Você é um social media manager. Gere cronograma para ${MONTHS[calM]} ${calY} (${dim} dias).\nCliente: ${ac.name}|${ac.industry}|Persona:${ac.persona}|Tom:${ac.tone}\nContrato: ${ac.postsPerMonth} posts, ${ac.reelsPerMonth} reels, ${ac.storiesPerDay} stories/dia\nTipos: ${tl}\nRegras: distribuir uniformemente, horários 7h/12h/18h/21h, REELs com roteiro, POSTs com CTA.\nRESPONDA APENAS JSON: {"items":[{"day":1,"time":"12:00","type":"post","title":"titulo","description":"desc","hashtags":"#tags"}]}`;
    try{const raw=await callAI(p);if(!raw){setAiL(false);return;}const parsed=JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]||raw);
    if(parsed.items){const nt=parsed.items.map(i=>({id:gid(),clientId:ac.id,day:i.day,month:calM,year:calY,time:i.time,type:i.type,title:i.title,description:i.description,hashtags:i.hashtags||"",status:"draft",approvalNote:""}));setTasks(prev=>[...prev.filter(t=>!(t.clientId===ac.id&&t.month===calM&&t.year===calY)),...nt]);setAiR({ok:true,n:nt.length});}}catch(e){setAiR({ok:false,e:e.message});}setAiL(false);
  }
  async function resTrends(){
    if(!tQ&&!ac)return;setAiL(true);setTR(null);
    const q=tQ||ac?.industry||"marketing digital";
    const p=`Especialista em viral. Tendências no nicho "${q}". 5 trends com name,platform,why_viral,script,hook,editing_tips,hashtags,best_time,estimated_reach. JSON apenas: {"trends":[...]}`;
    try{const raw=await callAI(p);if(!raw){setAiL(false);return;}setTR(JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]||raw));}catch(e){setTR({error:e.message});}setAiL(false);
  }
  function getCalDays(){const f=new Date(calY,calM,1).getDay();const d=[];for(let i=0;i<f;i++)d.push(null);for(let i=1;i<=dim;i++)d.push(i);return d;}

  const nav=[{id:VIEWS.CLIENTS,l:"Clientes",i:"👥"},{id:VIEWS.CALENDAR,l:"Calendário",i:"📅"},{id:VIEWS.PIPELINE,l:"Pipeline",i:"📋"},{id:VIEWS.TRENDS,l:"Tendências",i:"🔥"},{id:VIEWS.SETTINGS,l:"Configurações",i:"⚙️"}];
  const tOpts=cTypes.map(t=>({value:t.id,label:t.label}));
  const sOpts=STATUS_COLS.map(s=>({value:s.id,label:s.label}));

  function TF({task,setT,onSave,onCancel,title,onDel,onDup}){
    return(<Modal title={title} onClose={onCancel} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Field label="Título" value={task.title} onChange={v=>setT({...task,title:v})} placeholder="Ex: Post sobre tendências"/>
        <Field label="Tipo" value={task.type} onChange={v=>setT({...task,type:v})} options={tOpts}/>
        <Field label="Dia" type="number" value={task.day} onChange={v=>setT({...task,day:Math.min(Math.max(parseInt(v)||1,1),dim)})}/>
        <Field label="Horário" type="time" value={task.time} onChange={v=>setT({...task,time:v})}/>
        <Field label="Status" value={task.status} onChange={v=>setT({...task,status:v})} options={sOpts}/>
        <Field label="Hashtags" value={task.hashtags} onChange={v=>setT({...task,hashtags:v})} placeholder="#marketing"/>
      </div>
      <Field label="Descrição / Roteiro" value={task.description} onChange={v=>setT({...task,description:v})} rows={5} placeholder="Roteiro, briefing, CTA..."/>
      <Field label="Nota de aprovação" value={task.approvalNote||""} onChange={v=>setT({...task,approvalNote:v})} rows={2} placeholder="Comentários do cliente..."/>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:8,borderTop:"1px solid #eee",paddingTop:16}}>
        <div style={{display:"flex",gap:8}}>
          {onDup&&<Btn small onClick={()=>{onDup(task);onCancel();}}>📋 Duplicar</Btn>}
          {onDel&&<Btn small danger onClick={onDel}>🗑 Excluir</Btn>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onCancel}>Cancelar</Btn>
          <Btn primary onClick={onSave}>Salvar</Btn>
        </div>
      </div>
    </Modal>);
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'DM Sans', sans-serif",color:"#1a1a1a",background:"#f5f5f0"}}>
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
        {sbOpen&&ac&&(<div style={{padding:"12px 16px",borderTop:"1px solid #eee",fontSize:12}}><div style={{color:"#888",marginBottom:4}}>Cliente ativo</div><div style={{fontWeight:600,fontSize:13}}>{ac.name}</div>{ac.instagram&&<div style={{color:"#1D9E75",marginTop:2}}>@{ac.instagram}</div>}</div>)}
      </div>

      <div style={{flex:1,minWidth:0,overflowY:"auto"}}>
        <div style={{padding:"14px 24px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff"}}>
          <h1 style={{margin:0,fontSize:18,fontWeight:600}}>{nav.find(n=>n.id===view)?.i} {nav.find(n=>n.id===view)?.l}</h1>
          {clients.length>0&&view!==VIEWS.SETTINGS&&(<select value={sel||""} onChange={e=>setSel(e.target.value)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #ddd",background:"#f9f9f9",color:"#333",fontSize:13,fontFamily:"'DM Sans', sans-serif"}}><option value="">Selecione um cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
        </div>
        <div style={{padding:24}}>

{/* SETTINGS */}
{view===VIEWS.SETTINGS&&(<div style={{maxWidth:600}}>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee",marginBottom:16}}>
    <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>API Key</h3>
    <Field type="password" value={apiKey} onChange={setApiKey} placeholder="sk-ant-..."/>
    {apiKey&&<div style={{padding:"6px 12px",borderRadius:8,background:"#E1F5EE",color:"#085041",fontSize:12}}>✅ Configurada</div>}
  </div>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee",marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h3 style={{margin:0,fontSize:15,fontWeight:600}}>Tipos de conteúdo</h3>
      <Btn small primary onClick={()=>{setEType({id:"",label:"",icon:"•",bg:"#E6F1FB",color:"#0C447C"});setETId(null);setShowTF(true);}}>+ Novo tipo</Btn>
    </div>
    {cTypes.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,border:"1px solid #eee",marginBottom:6}}>
      <span style={{fontSize:18,width:28,textAlign:"center"}}>{t.icon}</span>
      <span style={{padding:"3px 10px",borderRadius:4,background:t.bg,color:t.color,fontSize:12,fontWeight:500}}>{t.label}</span>
      <span style={{flex:1,fontSize:12,color:"#888"}}>{t.id}</span>
      <Btn small onClick={()=>{setEType(t);setETId(t.id);setShowTF(true);}}>Editar</Btn>
      {cTypes.length>1&&<Btn small onClick={()=>delCT(t.id)} style={{color:"#E24B4A"}}>×</Btn>}
    </div>))}
    <Btn small onClick={()=>setCTypes(DEFAULT_TYPES)} style={{marginTop:8,color:"#888"}}>Restaurar padrão</Btn>
  </div>
  <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #eee"}}>
    <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>Dados</h3>
    <p style={{fontSize:13,color:"#888",marginBottom:12}}>{clients.length} clientes · {tasks.length} tarefas · {cTypes.length} tipos</p>
    <Btn small onClick={()=>{if(confirm("Apagar tudo?")){setClients([]);setTasks([]);setSel(null);setCTypes(DEFAULT_TYPES);}}} style={{color:"#E24B4A"}}>Limpar tudo</Btn>
  </div>
  {showTF&&(<Modal title={eTId?"Editar tipo":"Novo tipo"} onClose={()=>setShowTF(false)}>
    <Field label="Nome" value={eType.label} onChange={v=>setEType({...eType,label:v})} placeholder="Ex: Live, Thread..."/>
    <Field label="Ícone" value={eType.icon} onChange={v=>setEType({...eType,icon:v})} placeholder="◻ ▶ 🎬"/>
    <div style={{marginBottom:14}}>
      <label style={{fontSize:12,color:"#888",display:"block",marginBottom:8,fontWeight:500}}>Cor</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {COLOR_PRESETS.map((c,i)=>(<div key={i} onClick={()=>setEType({...eType,bg:c.bg,color:c.color})} style={{width:36,height:36,borderRadius:8,background:c.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",border:eType.bg===c.bg?"2px solid #1D9E75":"2px solid transparent"}}><span style={{color:c.color,fontWeight:700,fontSize:12}}>A</span></div>))}
      </div>
    </div>
    <div style={{marginBottom:14}}><label style={{fontSize:12,color:"#888",marginBottom:4,display:"block"}}>Preview</label><span style={{padding:"4px 12px",borderRadius:6,background:eType.bg,color:eType.color,fontWeight:500,fontSize:13}}>{eType.icon} {eType.label||"Nome"}</span></div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn onClick={()=>setShowTF(false)}>Cancelar</Btn><Btn primary onClick={saveCT}>Salvar</Btn></div>
  </Modal>)}
</div>)}

{/* CLIENTS */}
{view===VIEWS.CLIENTS&&(<div>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <p style={{margin:0,color:"#888",fontSize:14}}>Perfis com persona, identidade visual e contrato.</p>
    <Btn primary onClick={()=>{setEClient({...defClient});setECId(null);setShowCF(true);}}>+ Novo cliente</Btn>
  </div>
  {clients.length===0&&<div style={{textAlign:"center",padding:60,color:"#888"}}><p style={{fontSize:40}}>👥</p><p>Nenhum cliente.</p></div>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
    {clients.map(c=>(<div key={c.id} onClick={()=>setSel(c.id)} style={{background:"#fff",borderRadius:12,padding:20,cursor:"pointer",border:sel===c.id?"2px solid #1D9E75":"1px solid #eee"}}>
      <div style={{fontWeight:600,fontSize:16}}>{c.name}</div>
      <div style={{fontSize:13,color:"#888"}}>{c.industry}</div>
      {c.instagram&&<div style={{fontSize:12,color:"#1D9E75",marginTop:4}}>@{c.instagram}</div>}
      <div style={{fontSize:12,color:"#888",margin:"8px 0",lineHeight:1.5}}>{c.persona?.slice(0,80)}{c.persona?.length>80?"...":""}</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:"#888",borderTop:"1px solid #f0f0f0",paddingTop:8}}><span>{c.postsPerMonth} posts</span><span>{c.reelsPerMonth} reels</span><span>{c.storiesPerDay} stories/dia</span></div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn small onClick={e=>{e.stopPropagation();setEClient(c);setECId(c.id);setShowCF(true);}}>Editar</Btn>
        <Btn small onClick={e=>{e.stopPropagation();delCl(c.id);}} style={{color:"#E24B4A"}}>Excluir</Btn>
      </div>
    </div>))}
  </div>
  {showCF&&(<Modal title={eCId?"Editar cliente":"Novo cliente"} onClose={()=>setShowCF(false)} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
      <Field label="Nome" value={eClient.name} onChange={v=>setEClient({...eClient,name:v})} placeholder="ConvertX"/>
      <Field label="Segmento" value={eClient.industry} onChange={v=>setEClient({...eClient,industry:v})}/>
      <Field label="Instagram" value={eClient.instagram} onChange={v=>setEClient({...eClient,instagram:v})} placeholder="sem @"/>
      <Field label="Tom de voz" value={eClient.tone} onChange={v=>setEClient({...eClient,tone:v})}/>
      <Field label="Cores" value={eClient.colors} onChange={v=>setEClient({...eClient,colors:v})}/>
      <Field label="Fontes" value={eClient.fonts} onChange={v=>setEClient({...eClient,fonts:v})}/>
    </div>
    <Field label="Persona" value={eClient.persona} onChange={v=>setEClient({...eClient,persona:v})} rows={3} placeholder="Público-alvo..."/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
      <Field label="Posts/mês" type="number" value={eClient.postsPerMonth} onChange={v=>setEClient({...eClient,postsPerMonth:parseInt(v)||0})}/>
      <Field label="Reels/mês" type="number" value={eClient.reelsPerMonth} onChange={v=>setEClient({...eClient,reelsPerMonth:parseInt(v)||0})}/>
      <Field label="Stories/dia" type="number" value={eClient.storiesPerDay} onChange={v=>setEClient({...eClient,storiesPerDay:parseInt(v)||0})}/>
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
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {mTasks.length>0&&<span style={{fontSize:12,color:"#888"}}>{mTasks.length} itens</span>}
        <Btn small onClick={()=>{setNTask({...defTask,day:1});setShowNew(true);}}>+ Novo item</Btn>
        <Btn primary onClick={genCal} disabled={aiL}>{aiL?"⏳ Gerando...":"🤖 Gerar com IA"}</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {cTypes.map(t=>{const n=mTasks.filter(tk=>tk.type===t.id).length;return(<span key={t.id} style={{padding:"4px 10px",borderRadius:20,background:t.bg,color:t.color,fontSize:11,fontWeight:500}}>{t.icon} {t.label} ({n})</span>);})}
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
              <span onClick={()=>{setNTask({...defTask,day});setShowNew(true);}} style={{fontSize:14,color:"#1D9E75",cursor:"pointer"}} title="Adicionar">+</span>
            </div>
            {dt.slice(0,3).map(t=>(<div key={t.id} onClick={()=>{setETask({...t});setTaskModal(t.id);}} style={{fontSize:10,padding:"3px 5px",borderRadius:4,marginBottom:2,cursor:"pointer",background:cTypes.find(x=>x.id===t.type)?.bg||"#F1EFE8",color:cTypes.find(x=>x.id===t.type)?.color||"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><b>{t.time}</b> {t.title?.slice(0,18)}</div>))}
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

{/* TRENDS */}
{view===VIEWS.TRENDS&&(<div>
  <div style={{display:"flex",gap:10,marginBottom:20}}>
    <input value={tQ} onChange={e=>setTQ(e.target.value)} placeholder={ac?`Tendências para ${ac.name}...`:"Nicho..."} style={{flex:1,padding:"10px 16px",borderRadius:10,border:"1px solid #ddd",background:"#fff",fontSize:14,fontFamily:"'DM Sans', sans-serif",outline:"none"}} onKeyDown={e=>e.key==="Enter"&&resTrends()}/>
    <Btn primary onClick={resTrends} disabled={aiL}>{aiL?"⏳":"🔍 Pesquisar"}</Btn>
  </div>
  {aiL&&<div style={{textAlign:"center",padding:40,color:"#888"}}>🤖 Analisando...</div>}
  {tR?.error&&<div style={{padding:12,borderRadius:8,background:"#FCEBEB",color:"#791F1F",fontSize:13}}>❌ {tR.error}</div>}
  {tR?.trends?.map((tr,i)=>(<div key={i} style={{background:"#fff",borderRadius:12,border:"1px solid #eee",overflow:"hidden",marginBottom:16}}>
    <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontWeight:600,fontSize:16}}>{tr.name}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>{tr.platform} · {tr.best_time}</div></div>
      <Btn small onClick={()=>addTask({title:tr.name,type:"reel",day:1,time:"12:00",description:`GANCHO: ${tr.hook}\n\nROTEIRO:\n${tr.script}\n\nEDIÇÃO:\n${tr.editing_tips}\n\nHASHTAGS: ${tr.hashtags}`,hashtags:tr.hashtags||"",status:"draft",approvalNote:""})}>+ Adicionar</Btn>
    </div>
    <div style={{padding:"16px 20px",fontSize:13,lineHeight:1.6}}>
      <div style={{marginBottom:10}}><b style={{color:"#888",fontSize:12}}>Por que viralizou:</b> {tr.why_viral}</div>
      <div style={{marginBottom:10,padding:"8px 12px",borderRadius:8,background:"#EEEDFE",color:"#534AB7",fontWeight:600}}>{tr.hook}</div>
      <div style={{marginBottom:10,whiteSpace:"pre-wrap"}}><b style={{color:"#888",fontSize:12}}>Roteiro:</b><br/>{tr.script}</div>
      <div><b style={{color:"#888",fontSize:12}}>Edição:</b> {tr.editing_tips}</div>
      {tr.hashtags&&<div style={{fontSize:12,color:"#1D9E75",marginTop:8}}>{tr.hashtags}</div>}
    </div>
  </div>))}
  {!tR&&!aiL&&<div style={{textAlign:"center",padding:60,color:"#888"}}><p style={{fontSize:40}}>🔥</p><p>Pesquise tendências virais</p></div>}
</div>)}

        </div>
      </div>

      {showNew&&<TF title="Novo item" task={nTask} setT={setNTask} onCancel={()=>setShowNew(false)} onSave={()=>{if(nTask.title){addTask(nTask);setShowNew(false);setNTask({...defTask});}}}/>}
      {taskModal&&eTask&&<TF title="Editar item" task={eTask} setT={setETask} onCancel={()=>{setTaskModal(null);setETask(null);}} onSave={()=>{updTask(taskModal,eTask);setTaskModal(null);setETask(null);}} onDel={()=>delTask(taskModal)} onDup={dupTask}/>}
    </div>
  );
}
