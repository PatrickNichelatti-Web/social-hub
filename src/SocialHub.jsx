import { useState, useEffect, useRef } from "react";
import * as db from "./db";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  bg: "#F0F0ED",
  bgCard: "rgba(255,255,255,0.72)",
  bgCardHover: "rgba(255,255,255,0.88)",
  bgSidebar: "rgba(255,255,255,0.6)",
  bgInput: "rgba(255,255,255,0.8)",
  bgBadge: "rgba(0,0,0,0.06)",
  border: "rgba(0,0,0,0.07)",
  borderHover: "rgba(0,0,0,0.14)",
  accent: "#1A1A1A",
  accentGreen: "#16A34A",
  accentGreenLight: "rgba(22,163,74,0.1)",
  text: "#0F0F0F",
  textSub: "#6B6B6B",
  textMuted: "#A0A0A0",
  shadow: "0 2px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  shadowHover: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  shadowModal: "0 32px 80px rgba(0,0,0,0.16)",
  radius: "18px",
  radiusSm: "12px",
  radiusXl: "24px",
  blur: "blur(20px)",
  font: "'DM Sans', system-ui, sans-serif",
};

// ─── STATUS CONFIG ────────────────────────────────────────────────
const STATUS = [
  { id:"draft", label:"Rascunho", color:"#9CA3AF", bg:"rgba(156,163,175,0.12)" },
  { id:"production", label:"Em produção", color:"#3B82F6", bg:"rgba(59,130,246,0.1)" },
  { id:"approval", label:"Aprovação", color:"#F59E0B", bg:"rgba(245,158,11,0.1)" },
  { id:"approved", label:"Aprovado", color:"#16A34A", bg:"rgba(22,163,74,0.1)" },
  { id:"scheduled", label:"Agendado", color:"#8B5CF6", bg:"rgba(139,92,246,0.1)" },
];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const VIEWS = { CLIENTS:"clients", CALENDAR:"calendar", PIPELINE:"pipeline", TRENDS:"trends", SETTINGS:"settings" };

// ─── MICRO COMPONENTS ─────────────────────────────────────────────
function Card({ children, style, onClick, hover = true }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.bgCardHover : T.bgCard,
        backdropFilter: T.blur,
        WebkitBackdropFilter: T.blur,
        border: `1px solid ${hov ? T.borderHover : T.border}`,
        borderRadius: T.radius,
        boxShadow: hov ? T.shadowHover : T.shadow,
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: hov && onClick ? "translateY(-1px) scale(1.005)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: color || T.textSub, background: bg || T.bgBadge, letterSpacing: "0.02em",
    }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS.find(x => x.id === status) || STATUS[0];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600,
      color: s.color, background: s.bg,
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.color,display:"inline-block"}}/>
      {s.label}
    </span>
  );
}

function TypeBadge({ type, types }) {
  const t = (types||[]).find(x => x.slug === type) || {label: type, icon:"•", bg_color:"rgba(0,0,0,0.06)", text_color:"#555"};
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px", borderRadius:99, fontSize:11, fontWeight:600,
      color: t.text_color, background: t.bg_color,
    }}>
      <span style={{fontSize:12}}>{t.icon}</span> {t.label}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", size = "md", disabled, style: sx }) {
  const [pressed, setPressed] = useState(false);
  const styles = {
    primary: { background: T.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.border}` },
    green: { background: T.accentGreen, color: "#fff", border: "none" },
    danger: { background: "rgba(239,68,68,0.1)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)" },
    default: { background: "rgba(255,255,255,0.9)", color: T.text, border: `1px solid ${T.border}` },
  };
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 12, borderRadius: T.radiusSm },
    md: { padding: "9px 18px", fontSize: 13, borderRadius: T.radiusSm },
    lg: { padding: "13px 28px", fontSize: 14, borderRadius: T.radius },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...styles[variant], ...sizes[size],
        fontFamily: T.font, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
        backdropFilter: "blur(10px)",
        display: "inline-flex", alignItems: "center", gap: 6,
        boxShadow: variant === "primary" || variant === "green" ? "0 2px 12px rgba(0,0,0,0.15)" : "none",
        ...sx
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, rows, options }) {
  const s = {
    width: "100%", padding: "10px 14px", borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`, background: T.bgInput,
    backdropFilter: "blur(10px)", color: T.text, fontSize: 13,
    fontFamily: T.font, boxSizing: "border-box", outline: "none",
    transition: "border 0.2s", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>}
      {rows ? <textarea style={{ ...s, resize: "vertical" }} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : options ? <select style={s} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,15,15,0.3)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
        borderRadius: T.radiusXl, padding: "32px",
        width: wide ? 680 : 480, maxWidth: "95vw",
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: T.shadowModal,
        border: `1px solid ${T.border}`,
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{title}</h2>
              {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSub }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ background: T.bgBadge, border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: T.textSub, transition: "all 0.15s" }}>×</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: T.bgCard, borderRadius: T.radius, padding: 24, border: `1px solid ${T.border}` }}>
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 18 : 12, width: `${w}%`, background: "rgba(0,0,0,0.06)", borderRadius: 6, marginBottom: i === 0 ? 16 : 8, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

// ─── NAV ICONS ────────────────────────────────────────────────────
const NavIcon = ({ id }) => {
  const icons = {
    clients: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    pipeline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="8" width="5" height="13" rx="1"/><rect x="17" y="5" width="5" height="16" rx="1"/></svg>,
    trends: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return icons[id] || null;
};

const defClient = { name:"",industry:"",instagram:"",persona:"",tone:"",colors:"#16A34A, #0F172A",fonts:"",posts_per_month:12,reels_per_month:4,stories_per_day:3,notes:"" };
const defTask = { title:"",type:"post",day:1,time:"12:00",description:"",hashtags:"",status:"draft",approval_note:"" };

// ─── MAIN APP ─────────────────────────────────────────────────────
function TaskForm({ task, setT, onSave, onCancel, title, onDel, tOpts, sOpts, dim, calM, calY }) {
  // Build date string from task.day + calM + calY for the date input
  const pad = n => String(n).padStart(2, "0");
  const dateVal = task.day ? `${calY}-${pad(calM + 1)}-${pad(task.day)}` : "";

  function handleDateChange(v) {
    if (!v) return;
    const [y, m, d] = v.split("-").map(Number);
    setT({ ...task, day: d, month: m - 1, year: y });
  }

  const inputS = { width:"100%", padding:"10px 14px", borderRadius:T.radiusSm, border:`1px solid ${T.border}`, background:T.bgInput, backdropFilter:"blur(10px)", color:T.text, fontSize:13, fontFamily:T.font, boxSizing:"border-box", outline:"none", transition:"border 0.2s" };
  const labelS = { fontSize:11, color:T.textMuted, display:"block", marginBottom:5, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" };

  return (
    <Modal title={title} onClose={onCancel} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Field label="Título" value={task.title} onChange={v => setT({ ...task, title: v })} placeholder="Ex: Post sobre tendências" />
        <Field label="Tipo" value={task.type} onChange={v => setT({ ...task, type: v })} options={tOpts} />

        {/* Data picker */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelS}>Data</label>
          <input type="date" value={dateVal} onChange={e => handleDateChange(e.target.value)} style={inputS} />
        </div>

        <Field label="Horário" type="time" value={task.time} onChange={v => setT({ ...task, time: v })} />
        <Field label="Status" value={task.status} onChange={v => setT({ ...task, status: v })} options={sOpts} />
        <Field label="Hashtags" value={task.hashtags || ""} onChange={v => setT({ ...task, hashtags: v })} placeholder="#marketing #digital" />
      </div>
      <Field label="Descrição / Roteiro" value={task.description || ""} onChange={v => setT({ ...task, description: v })} rows={5} placeholder="Roteiro detalhado, briefing, CTA, dicas de gravação..." />
      <Field label="Nota de aprovação" value={task.approval_note || ""} onChange={v => setT({ ...task, approval_note: v })} rows={2} placeholder="Comentários e feedback do cliente..." />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
        <div>{onDel && <Btn variant="danger" size="sm" onClick={onDel}>Excluir</Btn>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="primary" onClick={onSave}>Salvar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ReviewModal({ items, selIdx, setSelIdx, activeTab, setActiveTab, onRemove, onUpdate, onApprove, onRegenerate, onClose, origin, T }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,15,15,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(30px)", borderRadius: 24, padding: 40, width: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.16)", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: T.text }}>Todos os itens removidos</div>
          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>Você removeu todos os itens da revisão.</div>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 100, background: T.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
        </div>
      </div>
    );
  }

  const sel = Math.min(selIdx, items.length - 1);
  const d = items[sel] || {};
  const isTrend = d._isTrend;
  const typeColors = { reel: { bg: "#EEEDFE", txt: "#3C3489" }, post: { bg: "#E6F1FB", txt: "#0C447C" }, carousel: { bg: "#EAF3DE", txt: "#27500A" }, carrossel: { bg: "#EAF3DE", txt: "#27500A" }, story: { bg: "#FAEEDA", txt: "#633806" } };
  const tc = typeColors[d.type] || typeColors.post;
  const typeIcons = { reel: "▶", post: "◻", carousel: "◫", carrossel: "◫", story: "○" };

  const tabs = isTrend
    ? [{ key: 0, label: "Prévia" }, { key: 1, label: "Roteiro" }, { key: 2, label: "Legenda" }, { key: 3, label: "Hook & Música" }, { key: 4, label: "Edição" }, { key: 5, label: "Nota" }]
    : [{ key: 0, label: "Prévia" }, { key: 1, label: "Roteiro" }, { key: 2, label: "Legenda" }, { key: 3, label: "Design" }, { key: 4, label: "Nota" }];

  function renderPreview() {
    const previewFrame = (bg, content) => (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <div style={{ width: 180, height: 320, border: `3px solid ${T.border}`, borderRadius: 22, overflow: "hidden", background: "#000", display: "flex", flexDirection: "column" }}>
          {content}
        </div>
      </div>
    );

    if (d.type === "reel" || (isTrend && (d.type === "reel" || !d.type))) {
      return previewFrame(null, (
        <>
          <div style={{ flex: 1, background: "linear-gradient(135deg,#1a0533,#3d1452)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative" }}>
            <div style={{ position: "absolute", top: 10, left: 10, fontSize: 9, color: "#fff", background: "rgba(0,0,0,0.4)", padding: "3px 7px", borderRadius: 99, fontWeight: 600 }}>Reel</div>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, marginBottom: 10 }}>▶</div>
            <div style={{ fontSize: 10, color: "#fff", textAlign: "center", fontWeight: 600, lineHeight: 1.4, padding: "0 8px" }}>{(d.hook || d.title || "").slice(0, 80)}</div>
            <div style={{ position: "absolute", right: 8, bottom: 60, display: "flex", flexDirection: "column", gap: 8 }}>
              {["❤", "💬", "↗", "🔖"].map((ic, i) => <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>{ic}</div>)}
            </div>
          </div>
          <div style={{ background: "#000", padding: "6px 10px", color: "#fff" }}>
            <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>@{d.title?.slice(0, 18) || "cliente"}</div>
            <div style={{ fontSize: 8, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(d.caption || d.title || "").slice(0, 40)}</div>
            {d.music && <div style={{ fontSize: 8, opacity: 0.8, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>♪ {d.music.slice(0, 24)}</div>}
          </div>
        </>
      ));
    }

    if (d.type === "post") {
      return previewFrame(null, (
        <>
          <div style={{ background: "#fafafa", padding: "6px 8px", display: "flex", alignItems: "center", gap: 6, borderBottom: "0.5px solid #eee" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#0C447C" }} />
            <div style={{ fontSize: 9, color: "#111", fontWeight: 600 }}>Cliente</div>
          </div>
          <div style={{ flex: 1, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
            <div style={{ background: "#fff", width: "100%", padding: 12, borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#0C447C", fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>POST</div>
              <div style={{ fontSize: 11, color: "#111", fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{(d.title || "").slice(0, 40)}</div>
              <div style={{ fontSize: 8, color: "#555", lineHeight: 1.5 }}>{(d.description || "").slice(0, 80)}</div>
            </div>
          </div>
          <div style={{ background: "#fafafa", padding: "5px 8px" }}>
            <div style={{ fontSize: 8, color: "#666", lineHeight: 1.4 }}>{(d.caption || "").slice(0, 50)}</div>
          </div>
        </>
      ));
    }

    if (d.type === "carousel" || d.type === "carrossel") {
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "30px 0", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <div key={n} style={{ width: 60, height: 80, borderRadius: 8, background: i === 0 ? "#27500A" : "#EAF3DE", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, border: `1.5px solid ${i === 0 ? "#16A34A" : "#C0DD97"}`, color: i === 0 ? "#fff" : "#27500A" }}>
              <div style={{ fontSize: 10, fontWeight: 800 }}>{n}/5</div>
              <div style={{ fontSize: 7, textAlign: "center", padding: "0 4px" }}>{i === 0 ? "capa" : `slide ${n}`}</div>
            </div>
          ))}
        </div>
      );
    }

    if (d.type === "story") {
      return previewFrame(null, (
        <>
          <div style={{ flex: 1, background: "#FAEEDA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#633806", textAlign: "center", lineHeight: 1.4 }}>{(d.title || "").slice(0, 50)}</div>
            <div style={{ width: "80%", background: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 9, color: "#633806", border: "0.5px solid rgba(0,0,0,0.1)" }}>Toque para responder</div>
          </div>
          <div style={{ height: 24, background: "#000" }} />
        </>
      ));
    }

    return <div style={{ padding: 40, textAlign: "center", color: T.textSub, fontSize: 13 }}>Prévia não disponível</div>;
  }

  function renderTabContent() {
    const textAreaStyle = { width: "100%", minHeight: 140, padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgInput, fontSize: 13, fontFamily: T.font, lineHeight: 1.7, color: T.text, resize: "vertical", outline: "none", boxSizing: "border-box" };
    const labelStyle = { fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "block" };

    if (activeTab === 0) return renderPreview();

    if (activeTab === 1) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Roteiro / Descrição</label>
          <textarea style={textAreaStyle} value={d.description || ""} onChange={e => onUpdate(sel, { description: e.target.value })} placeholder="Roteiro detalhado: hook, desenvolvimento, CTA..." />
        </div>
      );
    }

    if (activeTab === 2) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Legenda</label>
          <textarea style={textAreaStyle} value={d.caption || ""} onChange={e => onUpdate(sel, { caption: e.target.value })} placeholder="Legenda para o post..." />
          <label style={{ ...labelStyle, marginTop: 16 }}>Hashtags</label>
          <input style={{ ...textAreaStyle, minHeight: "auto", height: 40 }} value={d.hashtags || ""} onChange={e => onUpdate(sel, { hashtags: e.target.value })} placeholder="#marketing #digital" />
        </div>
      );
    }

    if (isTrend && activeTab === 3) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Hook (primeiros 3s)</label>
          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.04)", borderRadius: 10, fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>{d.hook || "—"}</div>
          <label style={labelStyle}>Música / Áudio viral</label>
          <div style={{ padding: "10px 14px", background: "rgba(22,163,74,0.08)", borderRadius: 10, fontSize: 13, color: T.accentGreen, fontWeight: 600, marginBottom: 16 }}>♪ {d.music || "Não especificado"}</div>
          <label style={labelStyle}>Por que viralizou</label>
          <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{d.why_viral}</div>
        </div>
      );
    }

    if (isTrend && activeTab === 4) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Dicas de gravação e edição</label>
          <textarea style={textAreaStyle} value={d.design_brief || ""} onChange={e => onUpdate(sel, { design_brief: e.target.value })} />
          {d.source_url && <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted }}>Fonte: <a href={d.source_url} target="_blank" rel="noreferrer" style={{ color: T.accentGreen }}>{d.source_url.slice(0, 50)}...</a></div>}
        </div>
      );
    }

    if (!isTrend && activeTab === 3) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Briefing de Design</label>
          <textarea style={textAreaStyle} value={d.design_brief || ""} onChange={e => onUpdate(sel, { design_brief: e.target.value })} placeholder="Cores, tipografia, layout, estilo visual..." />
        </div>
      );
    }

    const noteTab = isTrend ? 5 : 4;
    if (activeTab === noteTab) {
      return (
        <div style={{ padding: "4px 0" }}>
          <label style={labelStyle}>Sugestão ou observação</label>
          <textarea style={{ ...textAreaStyle, minHeight: 120 }} value={d.note || ""} onChange={e => onUpdate(sel, { note: e.target.value })} placeholder="Ex: mudar foco para e-commerce, ajustar o hook, trocar horário..." />
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>Esta nota será usada pela IA se você clicar em "Regerar".</div>
        </div>
      );
    }

    return null;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,15,15,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease", padding: 20 }}>
      <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(30px)", borderRadius: 20, width: "100%", maxWidth: 980, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.2)", border: `1px solid ${T.border}`, animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>{origin === "trends" ? "Tendências encontradas" : "Revisar calendário gerado"}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textSub }}>{items.length} {items.length === 1 ? "item" : "itens"} para revisar</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: T.textSub }}>×</button>
        </div>

        {/* Cards scrollable row */}
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${T.border}`, overflowX: "auto", whiteSpace: "nowrap", background: "rgba(0,0,0,0.02)" }}>
          <div style={{ display: "inline-flex", gap: 10 }}>
            {items.map((it, idx) => {
              const c = typeColors[it.type] || typeColors.post;
              const icon = typeIcons[it.type] || "◻";
              return (
                <div key={it._id || idx} onClick={() => { setSelIdx(idx); setActiveTab(0); }} style={{ cursor: "pointer", minWidth: 180, borderRadius: 12, border: `2px solid ${idx === sel ? T.accentGreen : T.border}`, background: "#fff", overflow: "hidden", transition: "all 0.15s", position: "relative", flexShrink: 0 }}>
                  <div style={{ height: 68, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 24, color: c.txt }}>
                    {icon}
                    <div style={{ position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: c.bg, color: c.txt, textTransform: "uppercase", border: `0.5px solid ${c.txt}30` }}>{it.type || "post"}</div>
                    <button onClick={e => { e.stopPropagation(); onRemove(idx); }} style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: `0.5px solid ${T.border}`, cursor: "pointer", fontSize: 11, color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{it.day ? `Dia ${it.day}` : ""} {it.time ? `· ${it.time}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 24px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map(tab => (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "12px 16px", fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? T.accentGreen : T.textSub, borderBottom: `2px solid ${activeTab === tab.key ? T.accentGreen : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap" }}>
              {tab.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 100, background: "transparent", border: `1px solid ${T.border}`, color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: T.font, fontWeight: 500 }}>Descartar tudo</button>
            <button onClick={onRegenerate} style={{ padding: "9px 18px", borderRadius: 100, background: "transparent", border: `1px solid ${T.border}`, color: T.text, fontSize: 13, cursor: "pointer", fontFamily: T.font, fontWeight: 500 }}>↺ Regerar com notas</button>
          </div>
          <button onClick={onApprove} style={{ padding: "11px 24px", borderRadius: 100, background: T.accentGreen, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, boxShadow: "0 2px 12px rgba(22,163,74,0.3)" }}>✓ Aprovar e salvar {items.length} {items.length === 1 ? "item" : "itens"}</button>
        </div>
      </div>
    </div>
  );
}


export default function SocialHub({ session }) {
  const [view, setView] = useState(VIEWS.CLIENTS);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cTypes, setCTypes] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCF, setShowCF] = useState(false);
  const [eClient, setEClient] = useState({ ...defClient });
  const [eCId, setECId] = useState(null);
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [aiL, setAiL] = useState(false);
  const [aiR, setAiR] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [eTask, setETask] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [nTask, setNTask] = useState({ ...defTask });
  const [drag, setDrag] = useState(null);
  const [sbOpen, setSbOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("sh_apikey") || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("sh_geminikey") || "");
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("sh_provider") || "claude");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [trendQ, setTrendQ] = useState("");
  const [trendR, setTrendR] = useState(null);
  const [savedTrends, setSavedTrends] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewSelIdx, setReviewSelIdx] = useState(0);
  const [reviewTab, setReviewTab] = useState(0);
  const [reviewOrigin, setReviewOrigin] = useState("calendar");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${T.bg}; font-family: ${T.font}; }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes slideIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
      @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
      @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
      input:focus, textarea:focus, select:focus { border-color: rgba(0,0,0,0.3) !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [p, cl, tk, ct] = await Promise.all([db.getProfile(), db.getClients(), db.getTasks(), db.getContentTypes()]);
        setProfile(p); setClients(cl); setTasks(tk); setCTypes(ct);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (sel && ac) {
      db.getTrendsByClient(ac.id).then(ts => setSavedTrends(ts)).catch(e => console.error(e));
    } else {
      setSavedTrends([]);
    }
  }, [sel]);

  function saveApiKey() {
    localStorage.setItem("sh_apikey", apiKey);
    localStorage.setItem("sh_geminikey", geminiKey);
    localStorage.setItem("sh_provider", aiProvider);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }
  function checkKey() {
    // API key is now stored securely on the server (Vercel env vars)
    // No client-side key needed
    return true;
  }

  async function callAI(prompt, useWebSearch = false) {
    // Chama o backend seguro (Vercel API Route)
    // A API key fica no servidor, nunca exposta no frontend
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, useWebSearch }),
    });
    if (!resp.ok) {
      const e = await resp.json();
      throw new Error(e.error || "Erro no servidor");
    }
    const data = await resp.json();
    return (data.text || "").replace(/```json|```/g, "").trim();
  }

  // ===== REVIEW MODAL HANDLERS =====
  function closeReview() {
    setReviewModal(null);
    setReviewItems([]);
    setReviewSelIdx(0);
    setReviewTab(0);
  }

  function removeReviewItem(idx) {
    setReviewItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (reviewSelIdx >= next.length) setReviewSelIdx(Math.max(0, next.length - 1));
      else if (idx <= reviewSelIdx && reviewSelIdx > 0) setReviewSelIdx(reviewSelIdx - 1);
      return next;
    });
  }

  function updateReviewItem(idx, updates) {
    setReviewItems(prev => prev.map((it, i) => i === idx ? { ...it, ...updates } : it));
  }

  async function approveReview() {
    if (!reviewItems || reviewItems.length === 0) { closeReview(); return; }
    try {
      if (reviewOrigin === "calendar") {
        // Salvar como tarefas do cronograma
        await db.deleteTasksByClientMonth(ac.id, calM, calY);
        const toInsert = reviewItems.map(i => ({
          client_id: ac.id,
          day: i.day, month: calM, year: calY, time: i.time,
          type: i.type, title: i.title,
          description: i.description || "",
          hashtags: i.hashtags || "",
          status: "draft",
          approval_note: (i.note ? "Nota: " + i.note : "") + (i.caption ? "\n\nLEGENDA:\n" + i.caption : "") + (i.design_brief ? "\n\nDESIGN:\n" + i.design_brief : "")
        }));
        const nt = await db.createTasks(toInsert);
        setTasks(prev => [...prev.filter(t => !(t.client_id === ac.id && t.month === calM && t.year === calY)), ...nt]);
        setAiR({ ok: true, n: nt.length, msg: `${nt.length} itens salvos no calendário!` });
      }
      // Tendências ja foram salvas no resTrends, não precisa salvar novamente
    } catch(e) {
      alert("Erro ao salvar: " + e.message);
      return;
    }
    closeReview();
  }

  async function regenerateReview() {
    if (!confirm("Isso vai descartar os itens atuais e gerar uma nova versão com as notas como contexto. Continuar?")) return;
    const notes = reviewItems.filter(i => i.note).map(i => `Item "${i.title}": ${i.note}`).join("\n");
    closeReview();
    if (reviewOrigin === "calendar") {
      // TODO: incluir notas no prompt da próxima geração
      await genCal();
    } else {
      await resTrends();
    }
  }

  const ac = clients.find(c => c.id === sel);
  const dim = new Date(calY, calM + 1, 0).getDate();
  const cTasks = tasks.filter(t => t.client_id === sel);
  const mTasks = cTasks.filter(t => t.month === calM && t.year === calY);
  const stats = STATUS.reduce((a, c) => ({ ...a, [c.id]: cTasks.filter(t => t.status === c.id).length }), {});

  async function saveCl() {
    if (!eClient.name) return;
    try {
      if (eCId) { const u = await db.updateClient(eCId, eClient); setClients(clients.map(c => c.id === eCId ? u : c)); }
      else { const nc = await db.createClient(eClient); setClients([nc, ...clients]); if (!sel) setSel(nc.id); }
    } catch(e) { alert(e.message); }
    setShowCF(false); setEClient({ ...defClient }); setECId(null);
  }
  async function delCl(id) { try { await db.deleteClient(id); setClients(clients.filter(c => c.id !== id)); setTasks(tasks.filter(t => t.client_id !== id)); if (sel === id) setSel(null); } catch(e) { alert(e.message); } }
  async function addTask(td) { try { const t = await db.createTask({ ...td, client_id: sel, month: calM, year: calY }); setTasks([...tasks, t]); } catch(e) { alert(e.message); } }
  async function updTask(id, u) { try { const t = await db.updateTask(id, u); setTasks(tasks.map(x => x.id === id ? t : x)); } catch(e) { alert(e.message); } }
  async function delTask(id) { try { await db.deleteTask(id); setTasks(tasks.filter(t => t.id !== id)); setTaskModal(null); setETask(null); } catch(e) { alert(e.message); } }

  // Carregar tendências salvas de um cliente
  async function loadTrendsForClient(clientId) {
    if (!clientId) return [];
    try {
      const ts = await db.getTrendsByClient(clientId);
      setSavedTrends(ts);
      return ts;
    } catch(e) { console.error(e); return []; }
  }

  // Verificar se as tendências salvas ainda são virais
  async function validateSavedTrends(trends, clientIndustry) {
    if (!trends || trends.length === 0) return { valid: [], invalid: [] };
    const trendNames = trends.map(t => t.name).join(" | ");
    const prompt = `Você é um analista de tendências de social media. Hoje é ${new Date().toLocaleDateString("pt-BR")}.
Analise as tendências abaixo e diga quais AINDA estão virais/em alta AGORA no nicho "${clientIndustry}" e quais já passaram:

Tendências salvas: ${trendNames}

Use a busca para verificar cada uma nas fontes:
- TikTok Creative Center (creativecenter.tiktok.com)
- Later.com, Hootsuite e Sprout Social (publicam tendências semanais)
- Google Trends (trends.google.com)
- YouTube Trending

Retorne APENAS JSON neste formato:
{"results":[{"name":"nome exato da tendência","still_valid":true,"reason":"razão curta"}]}`;

    try {
      const text = await callAI(prompt, true);
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
      const valid = [], invalid = [];
      trends.forEach(t => {
        const r = parsed.results?.find(x => x.name === t.name || x.name.toLowerCase().includes(t.name.toLowerCase().slice(0,20)));
        if (r && r.still_valid === false) invalid.push(t);
        else valid.push(t);
      });
      return { valid, invalid };
    } catch(e) {
      console.error("validation failed:", e);
      return { valid: trends, invalid: [] };
    }
  }

  async function genCal() {
    if (!ac || !checkKey()) return;

    // 1. Carregar tendências salvas
    const trends = await loadTrendsForClient(ac.id);

    // 2. Se não tem tendências, bloquear
    if (!trends || trends.length === 0) {
      setAiR({ ok: false, needsTrends: true, e: "Você ainda não pesquisou tendências para este cliente. Pesquise tendências primeiro para que o calendário seja baseado no que está viral agora." });
      return;
    }

    setAiL(true); setAiR(null);

    let trendsToUse = trends;
    let regenerated = false;

    // 3. Validar tendências
    try {
      setAiR({ ok: true, loading: true, msg: "Verificando se as tendências ainda estão em alta..." });
      const { valid, invalid } = await validateSavedTrends(trends, ac.industry);

      if (invalid.length > 0) {
        // Deletar tendências inválidas
        await db.markTrendsInvalid(invalid.map(t => t.id));
        await db.deleteInvalidTrends(ac.id);
      }

      if (valid.length === 0) {
        // Todas passaram — gerar novas automaticamente
        setAiR({ ok: true, loading: true, msg: "Suas tendências já passaram. Buscando tendências atualizadas..." });
        const newTrends = await fetchTrends(ac.industry, ac);
        if (newTrends && newTrends.length > 0) {
          const saved = await db.createTrends(newTrends.map(t => ({
            client_id: ac.id,
            name: t.name, platform: t.platform, why_viral: t.why_viral,
            script: t.script, hook: t.hook, caption: t.caption || "",
            editing_tips: t.editing_tips, hashtags: t.hashtags,
            music: t.music || "", best_time: t.best_time,
            estimated_reach: t.estimated_reach, format: t.format || "reel"
          })));
          trendsToUse = saved;
          regenerated = true;
        }
      } else {
        trendsToUse = valid;
      }
    } catch(e) {
      console.error("validation error:", e);
    }

    // 4. Gerar calendário baseado nas tendências válidas
    setAiR({ ok: true, loading: true, msg: regenerated ? "Tendências atualizadas! Gerando calendário..." : "Gerando calendário com base nas tendências atuais..." });

    const trendsContext = trendsToUse.map(t => `- ${t.name} (${t.platform}): ${t.why_viral} | Hook: ${t.hook}`).join("\n");

    const p = `Você é um social media manager expert. Gere cronograma completo para ${MONTHS[calM]} ${calY} (${dim} dias).

CLIENTE: ${ac.name}
Segmento: ${ac.industry}
Persona: ${ac.persona}
Tom de voz: ${ac.tone}
Cores da marca: ${ac.colors}
Contrato: ${ac.posts_per_month} posts, ${ac.reels_per_month} reels, ${ac.stories_per_day} stories/dia

TENDÊNCIAS VIRAIS ATUAIS (use como base para os conteúdos):
${trendsContext}

Tipos disponíveis: ${cTypes.map(t => t.slug).join("|")}

REGRAS:
- Distribuir uniformemente pelo mês
- Horários: 7h, 12h, 18h, 21h (melhores para Brasil)
- REELs: roteiro completo com hook + desenvolvimento + CTA + dicas de edição
- POSTs: headlines fortes, texto principal, CTA e briefing de design
- CARROSSÉIS: roteiro slide-a-slide (5 slides) + briefing
- STORIES: sequência e enquetes/interação
- Aproveitar as tendências virais como inspiração para pelo menos 40% dos REELs
- Para cada item incluir: roteiro, legenda, briefing de design (com cores), hashtags

RESPONDA APENAS JSON:
{"items":[{"day":1,"time":"12:00","type":"post","title":"","description":"roteiro completo","caption":"legenda pronta","design_brief":"briefing de design","hashtags":"#tags","inspired_by":"nome da tendência (se aplicável)"}]}`;

    try {
      const text = await callAI(p, false);
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
      if (parsed.items && parsed.items.length > 0) {
        // Preparar items para revisão (sem salvar ainda!)
        setReviewItems(parsed.items.map((i, idx) => ({
          ...i,
          _id: `tmp_${idx}`,
          client_id: ac.id,
          month: calM,
          year: calY,
          status: "draft",
          approval_note: "",
          note: ""
        })));
        setReviewOrigin("calendar");
        setReviewSelIdx(0);
        setReviewTab(0);
        setReviewModal(true);
        setAiR({ ok: true, n: parsed.items.length, regenerated, msg: regenerated ? `Tendências atualizadas automaticamente! ${parsed.items.length} itens gerados para revisão.` : `${parsed.items.length} itens gerados para sua revisão.` });
      }
    } catch(e) { setAiR({ ok: false, e: e.message }); }
    setAiL(false);
  }

  // Pesquisa tendências (extraído para função separada — reutilizável)
  async function fetchTrends(niche, client) {
    const prompt = `Você é um especialista sênior em marketing viral para Instagram e TikTok brasileiro.
Hoje é ${new Date().toLocaleDateString("pt-BR")}. Pesquise AGORA na web as tendências virais REAIS no nicho: "${niche}".
${client ? `Cliente: ${client.name} | Persona: ${client.persona}` : ""}

FONTES OBRIGATÓRIAS para buscar (use web_search para TODAS):
1. TikTok Creative Center (creativecenter.tiktok.com) — trending sounds, hashtags, creators
2. Later.com/blog e Hootsuite.com/blog — relatórios semanais de tendências
3. Google Trends (trends.google.com.br) — termos em alta no Brasil
4. Sprout Social e Metricool — análises de engajamento
5. YouTube Trending Brasil — formatos virais

Execute pelo menos 4 buscas diferentes como:
- "tendências ${niche} instagram ${new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}"
- "tiktok trending sounds ${niche} brasil"
- "reels virais ${niche} hook"
- "formato viral ${niche} tiktok"

Retorne 5 tendências REAIS e ATUAIS com dados que você encontrou. JSON apenas:
{"trends":[{
  "name":"nome exato da tendência",
  "platform":"Instagram|TikTok|Ambos",
  "format":"reel|post|carrossel|story",
  "why_viral":"por que está viralizando com dados reais de engajamento",
  "script":"roteiro completo passo a passo com timings",
  "hook":"gancho dos primeiros 3 segundos",
  "caption":"legenda pronta para usar",
  "editing_tips":"dicas detalhadas de gravação e edição",
  "hashtags":"#hashtags relevantes",
  "music":"música trending ou áudio do TikTok (se aplicável)",
  "best_time":"melhor horário para postar",
  "estimated_reach":"alto|médio",
  "source_url":"link de onde a informação foi encontrada (se possível)"
}]}`;

    const text = await callAI(prompt, true);
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
    return parsed.trends || [];
  }

  async function resTrends() {
    if (!checkKey()) return;
    setAiL(true); setTrendR(null);
    const q = trendQ || ac?.industry || "marketing digital";
    try {
      const trends = await fetchTrends(q, ac);
      if (ac && trends.length > 0) {
        // Salvar no banco
        await db.deleteTrendsByClient(ac.id);
        const saved = await db.createTrends(trends.map(t => ({
          client_id: ac.id,
          name: t.name, platform: t.platform, why_viral: t.why_viral,
          script: t.script, hook: t.hook, caption: t.caption || "",
          editing_tips: t.editing_tips, hashtags: t.hashtags,
          music: t.music || "", best_time: t.best_time,
          estimated_reach: t.estimated_reach, format: t.format || "reel",
          source_url: t.source_url || ""
        })));
        setSavedTrends(saved);

        // Abrir modal de revisão
        setReviewItems(saved.map((t, idx) => ({
          _id: t.id || `tmp_${idx}`,
          _isTrend: true,
          title: t.name,
          day: 1,
          time: "18:00",
          type: t.format || "reel",
          description: t.script,
          caption: t.caption,
          design_brief: t.editing_tips,
          hashtags: t.hashtags,
          platform: t.platform,
          hook: t.hook,
          why_viral: t.why_viral,
          music: t.music,
          best_time: t.best_time,
          estimated_reach: t.estimated_reach,
          source_url: t.source_url,
          note: ""
        })));
        setReviewOrigin("trends");
        setReviewSelIdx(0);
        setReviewTab(0);
        setReviewModal(true);
      }
      setTrendR({ trends });
    } catch(e) { setTrendR({ error: e.message }); }
    setAiL(false);
  }

  function getCalDays() { const f = new Date(calY, calM, 1).getDay(); const d = []; for (let i = 0; i < f; i++) d.push(null); for (let i = 1; i <= dim; i++) d.push(i); return d; }

  const nav = [
    { id: VIEWS.CLIENTS, l: "Clientes" },
    { id: VIEWS.CALENDAR, l: "Calendário" },
    { id: VIEWS.PIPELINE, l: "Pipeline" },
    { id: VIEWS.TRENDS, l: "Tendências" },
    { id: VIEWS.SETTINGS, l: "Configurações" },
  ];
  const tOpts = cTypes.map(t => ({ value: t.slug, label: t.label }));
  const sOpts = STATUS.map(s => ({ value: s.id, label: s.label }));



  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font }}>
      <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>SH</span>
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.textMuted, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: T.font }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: sbOpen ? 220 : 64, background: T.bgSidebar,
        backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0, overflow: "hidden", position: "relative",
      }}>
        {/* Logo */}
        <div style={{ padding: sbOpen ? "24px 20px 20px" : "24px 16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${T.border}` }}>
          <div onClick={() => setSbOpen(!sbOpen)} style={{ width: 36, height: 36, borderRadius: 11, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", transition: "transform 0.15s" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em" }}>SH</span>
          </div>
          {sbOpen && <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Social Hub</div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Dashboard</div>
          </div>}
        </div>

        {/* Nav items */}
        <div style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n, i) => {
            const active = view === n.id;
            return (
              <div key={n.id} onClick={() => setView(n.id)} style={{
                padding: sbOpen ? "10px 12px" : "10px",
                borderRadius: T.radiusSm, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                background: active ? T.bgCard : "transparent",
                color: active ? T.text : T.textSub,
                boxShadow: active ? T.shadow : "none",
                border: `1px solid ${active ? T.border : "transparent"}`,
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                animation: `slideIn 0.3s ease ${i * 0.05}s both`,
              }}>
                <div style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <NavIcon id={n.id} />
                </div>
                {sbOpen && <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>{n.l}</span>}
                {sbOpen && active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: T.accentGreen }} />}
              </div>
            );
          })}
        </div>

        {/* User */}
        {sbOpen && (
          <div style={{ padding: "16px 16px 20px", borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1A1A1A, #444)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{(profile?.name || session.user.email)?.[0]?.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || "Usuário"}</div>
                <div style={{ fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</div>
              </div>
            </div>
            <button onClick={db.signOut} style={{ marginTop: 10, width: "100%", padding: "7px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: "transparent", fontSize: 12, color: T.textSub, cursor: "pointer", fontFamily: T.font, fontWeight: 500, transition: "all 0.15s" }}>
              Sair
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{
          padding: "16px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: T.bgCard, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
          borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: "-0.025em" }}>
              {nav.find(n => n.id === view)?.l}
            </h1>
            {ac && view !== VIEWS.SETTINGS && view !== VIEWS.CLIENTS && (
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textMuted }}>Cliente: {ac.name}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {clients.length > 0 && view !== VIEWS.SETTINGS && (
              <select value={sel || ""} onChange={e => setSel(e.target.value)} style={{
                padding: "8px 14px", borderRadius: T.radiusSm,
                border: `1px solid ${T.border}`, background: T.bgInput,
                backdropFilter: "blur(10px)", color: T.text, fontSize: 13,
                fontFamily: T.font, fontWeight: 500, cursor: "pointer", outline: "none",
              }}>
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, flex: 1, animation: "fadeIn 0.3s ease" }}>

{/* ──── SETTINGS ──── */}
{view === VIEWS.SETTINGS && (
  <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{(profile?.name || session.user.email)?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{profile?.name || "Usuário"}</div>
          <div style={{ fontSize: 13, color: T.textSub }}>{session.user.email}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Badge color={T.accentGreen} bg={T.accentGreenLight}>{profile?.plan || "free"}</Badge>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 13, color: T.textSub, padding: "14px 0", borderTop: `1px solid ${T.border}` }}>
        <span>{clients.length} clientes</span>
        <span>·</span>
        <span>{tasks.length} tarefas</span>
        <span>·</span>
        <span>{cTypes.length} tipos</span>
      </div>
    </Card>

    <Card style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 12 }}>🤖 Inteligência Artificial</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: T.radiusSm, background: T.accentGreenLight, border: `1px solid rgba(22,163,74,0.2)` }}>
        <span style={{ fontSize: 20 }}>✓</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.accentGreen }}>IA configurada e pronta para usar</div>
          <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Claude Sonnet — gerenciado com segurança pelo servidor</div>
        </div>
      </div>
    </Card>

    <Card style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Tipos de conteúdo</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cTypes.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.radiusSm, background: "rgba(0,0,0,0.025)", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <TypeBadge type={t.slug} types={cTypes} />
            <span style={{ fontSize: 12, color: T.textMuted, marginLeft: "auto" }}>{t.slug}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
)}

{/* ──── CLIENTS ──── */}
{view === VIEWS.CLIENTS && (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>{clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado{clients.length !== 1 ? "s" : ""}</p>
      </div>
      <Btn variant="primary" onClick={() => { setEClient({ ...defClient }); setECId(null); setShowCF(true); }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Novo cliente
      </Btn>
    </div>

    {clients.length === 0 && (
      <Card style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 6 }}>Nenhum cliente ainda</div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>Adicione seu primeiro cliente para começar a gerenciar conteúdo.</div>
        <Btn variant="primary" onClick={() => { setEClient({ ...defClient }); setECId(null); setShowCF(true); }}>Adicionar cliente</Btn>
      </Card>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
      {clients.map((c, i) => (
        <Card key={c.id} onClick={() => setSel(c.id)} style={{ padding: 22, border: sel === c.id ? "2px solid rgba(22,163,74,0.4)" : undefined, animation: `slideIn 0.3s ease ${i * 0.05}s both` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: "-0.01em" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 3 }}>{c.industry}</div>
              {c.instagram && <div style={{ fontSize: 12, color: T.accentGreen, marginTop: 4, fontWeight: 500 }}>@{c.instagram}</div>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {c.colors?.split(",").slice(0, 3).map((col, j) => (
                <div key={j} style={{ width: 14, height: 14, borderRadius: 4, background: col.trim(), border: `1px solid ${T.border}` }} />
              ))}
            </div>
          </div>
          {c.persona && <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, marginBottom: 14 }}>{c.persona.slice(0, 90)}{c.persona.length > 90 ? "..." : ""}</div>}
          <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: `1px solid ${T.border}`, marginBottom: 14 }}>
            <Badge>{c.posts_per_month} posts</Badge>
            <Badge>{c.reels_per_month} reels</Badge>
            <Badge>{c.stories_per_day} stories/dia</Badge>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setEClient(c); setECId(c.id); setShowCF(true); }}>Editar</Btn>
            <Btn size="sm" variant="danger" onClick={e => { e.stopPropagation(); if (confirm("Excluir cliente?")) delCl(c.id); }}>Excluir</Btn>
          </div>
        </Card>
      ))}
    </div>

    {showCF && (
      <Modal title={eCId ? "Editar cliente" : "Novo cliente"} subtitle="Configure o perfil completo do cliente" onClose={() => setShowCF(false)} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Nome da empresa" value={eClient.name} onChange={v => setEClient({ ...eClient, name: v })} placeholder="ConvertX" />
          <Field label="Segmento" value={eClient.industry || ""} onChange={v => setEClient({ ...eClient, industry: v })} placeholder="Marketing Digital" />
          <Field label="Instagram" value={eClient.instagram || ""} onChange={v => setEClient({ ...eClient, instagram: v })} placeholder="sem o @" />
          <Field label="Tom de voz" value={eClient.tone || ""} onChange={v => setEClient({ ...eClient, tone: v })} placeholder="informal, direto, provocativo" />
          <Field label="Cores da marca" value={eClient.colors || ""} onChange={v => setEClient({ ...eClient, colors: v })} placeholder="#16A34A, #0F172A" />
          <Field label="Fontes" value={eClient.fonts || ""} onChange={v => setEClient({ ...eClient, fonts: v })} placeholder="Montserrat, Poppins" />
        </div>
        <Field label="Persona / público-alvo" value={eClient.persona || ""} onChange={v => setEClient({ ...eClient, persona: v })} rows={3} placeholder="Descreva o público: idade, dores, desejos, comportamento..." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
          <Field label="Posts/mês" type="number" value={eClient.posts_per_month} onChange={v => setEClient({ ...eClient, posts_per_month: parseInt(v) || 0 })} />
          <Field label="Reels/mês" type="number" value={eClient.reels_per_month} onChange={v => setEClient({ ...eClient, reels_per_month: parseInt(v) || 0 })} />
          <Field label="Stories/dia" type="number" value={eClient.stories_per_day} onChange={v => setEClient({ ...eClient, stories_per_day: parseInt(v) || 0 })} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <Btn variant="ghost" onClick={() => setShowCF(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveCl}>Salvar cliente</Btn>
        </div>
      </Modal>
    )}
  </div>
)}

{/* ──── CALENDAR ──── */}
{view === VIEWS.CALENDAR && (
  <div>
    {!ac ? (
      <Card style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 6 }}>Selecione um cliente</div>
        <div style={{ fontSize: 13, color: T.textSub }}>Escolha um cliente no menu superior para ver e gerenciar o calendário.</div>
      </Card>
    ) : (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { if (calM === 0) { setCalM(11); setCalY(calY-1); } else setCalM(calM-1); }} style={{ width: 36, height: 36, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgCard, backdropFilter: "blur(10px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.text, transition: "all 0.15s" }}>‹</button>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, minWidth: 170, textAlign: "center", letterSpacing: "-0.02em" }}>{MONTHS[calM]} {calY}</div>
            <button onClick={() => { if (calM === 11) { setCalM(0); setCalY(calY+1); } else setCalM(calM+1); }} style={{ width: 36, height: 36, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgCard, backdropFilter: "blur(10px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.text, transition: "all 0.15s" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {mTasks.length > 0 && <span style={{ fontSize: 12, color: T.textMuted, padding: "5px 10px", background: T.bgCard, borderRadius: 99, border: `1px solid ${T.border}` }}>{mTasks.length} itens</span>}
            <Btn size="sm" onClick={() => { setNTask({ ...defTask, type: cTypes[0]?.slug || "post", day: 1 }); setShowNew(true); }}>+ Novo item</Btn>
            <Btn variant="primary" onClick={genCal} disabled={aiL}>{aiL ? "⏳ Gerando..." : "✦ Gerar com IA"}</Btn>
          </div>
        </div>

        {/* Type chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {cTypes.map(t => {
            const n = mTasks.filter(tk => tk.type === t.slug).length;
            return <span key={t.id} style={{ padding: "4px 12px", borderRadius: 99, background: t.bg_color, color: t.text_color, fontSize: 11, fontWeight: 600 }}>{t.icon} {t.label} · {n}</span>;
          })}
        </div>

        {aiR && aiR.needsTrends && (
          <Card style={{ padding: "20px 24px", marginBottom: 16, borderLeft: "3px solid #F59E0B", background: "rgba(245,158,11,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 22, marginTop: 2 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Você ainda não pesquisou tendências</div>
                <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, marginBottom: 12 }}>Para gerar um calendário de alta performance, preciso primeiro saber o que está viralizando no nicho do seu cliente. Pesquise as tendências atuais e eu uso elas como base para criar conteúdos com maior chance de viralizar.</div>
                <Btn size="sm" variant="primary" onClick={() => { setAiR(null); setView(VIEWS.TRENDS); }}>→ Ir para Tendências</Btn>
              </div>
            </div>
          </Card>
        )}
        {aiR && !aiR.needsTrends && aiR.loading && (
          <Card style={{ padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.accentGreen, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{aiR.msg}</span>
          </Card>
        )}
        {aiR && !aiR.needsTrends && !aiR.loading && (
          <div style={{ padding: "12px 16px", borderRadius: T.radiusSm, marginBottom: 16, fontSize: 13, fontWeight: 500, background: aiR.ok ? T.accentGreenLight : "rgba(239,68,68,0.08)", color: aiR.ok ? T.accentGreen : "#DC2626", border: `1px solid ${aiR.ok ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            {aiR.ok ? `✓ ${aiR.msg || `${aiR.n} itens criados`}` : `✕ ${aiR.e}`}
          </div>
        )}

        {/* Calendar grid */}
        <Card style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.border}` }}>
            {DAYS.map(d => <div key={d} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {getCalDays().map((day, i) => {
              const dt = day ? mTasks.filter(t => t.day === day).sort((a,b) => (a.time||"").localeCompare(b.time||"")) : [];
              return (
                <div key={i} style={{ minHeight: 100, padding: "8px 6px", borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, opacity: day ? 1 : 0.3, transition: "background 0.15s" }}>
                  {day && <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{day}</span>
                      <span onClick={() => { setNTask({ ...defTask, type: cTypes[0]?.slug || "post", day }); setShowNew(true); }} style={{ fontSize: 15, color: T.accentGreen, cursor: "pointer", fontWeight: 700, lineHeight: 1, opacity: 0.7, transition: "opacity 0.15s" }}>+</span>
                    </div>
                    {dt.slice(0, 3).map(t => (
                      <div key={t.id} onClick={() => { setETask({ ...t }); setTaskModal(t.id); }} style={{ fontSize: 10, padding: "3px 6px", borderRadius: 6, marginBottom: 2, cursor: "pointer", background: cTypes.find(x => x.slug === t.type)?.bg_color || "rgba(0,0,0,0.05)", color: cTypes.find(x => x.slug === t.type)?.text_color || T.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, transition: "opacity 0.15s" }}>
                        <span style={{ opacity: 0.7 }}>{t.time}</span> {t.title?.slice(0, 16)}
                      </div>
                    ))}
                    {dt.length > 3 && <div style={{ fontSize: 10, color: T.textMuted, padding: "1px 6px" }}>+{dt.length-3}</div>}
                  </>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* List */}
        {mTasks.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 14, letterSpacing: "-0.01em" }}>Cronograma de {MONTHS[calM]}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {mTasks.sort((a,b) => a.day - b.day || (a.time||"").localeCompare(b.time||"")).map((t, i) => (
                <Card key={t.id} onClick={() => { setETask({ ...t }); setTaskModal(t.id); }} style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, animation: `slideIn 0.3s ease ${i * 0.03}s both` }}>
                  <div style={{ minWidth: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{t.day}</div>
                    <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{MONTHS[calM]?.slice(0, 3)}</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: T.border }} />
                  <div style={{ minWidth: 44, fontSize: 12, color: T.textSub, fontWeight: 600 }}>{t.time || "--:--"}</div>
                  <TypeBadge type={t.type} types={cTypes} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.text }}>{t.title}</div>
                  <StatusBadge status={t.status} />
                </Card>
              ))}
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}

{/* ──── PIPELINE ──── */}
{view === VIEWS.PIPELINE && (
  <div>
    {!ac ? (
      <Card style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 6 }}>Selecione um cliente</div>
        <div style={{ fontSize: 13, color: T.textSub }}>Escolha um cliente para ver o pipeline de produção.</div>
      </Card>
    ) : (
      <>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {STATUS.map((s, i) => (
            <Card key={s.id} style={{ padding: "16px", textAlign: "center", animation: `slideIn 0.3s ease ${i * 0.06}s both` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{stats[s.id] || 0}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontWeight: 600, letterSpacing: "0.02em" }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Kanban */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS.length}, minmax(0, 1fr))`, gap: 12 }}>
          {STATUS.map(col => (
            <div key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (drag) { updTask(drag, { status: col.id }); setDrag(null); } }}
              style={{ background: "rgba(0,0,0,0.025)", borderRadius: T.radius, padding: 12, minHeight: 320, border: `1px solid ${T.border}` }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${col.color}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: "0.01em" }}>{col.label}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: col.bg, color: col.color, fontWeight: 700 }}>{cTasks.filter(t => t.status === col.id).length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cTasks.filter(t => t.status === col.id).sort((a,b) => (a.day||0) - (b.day||0)).map(t => (
                  <Card key={t.id} draggable onDragStart={() => setDrag(t.id)} onClick={() => { setETask({ ...t }); setTaskModal(t.id); }} style={{ padding: "10px 12px", cursor: "grab" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <TypeBadge type={t.type} types={cTypes} />
                      {t.day > 0 && <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>{t.day}/{calM+1}</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{t.title}</div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
)}

{/* ──── TRENDS ──── */}
{view === VIEWS.TRENDS && (
  <div>
    <Card style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
      <input value={trendQ} onChange={e => setTrendQ(e.target.value)} placeholder={ac ? `Pesquisar tendências para ${ac.name}...` : "Digite um nicho ou tema..."} onKeyDown={e => e.key === "Enter" && resTrends()} style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent", fontSize: 14, fontFamily: T.font, color: T.text, outline: "none" }} />
      <Btn variant="primary" onClick={resTrends} disabled={aiL}>{aiL ? "Pesquisando..." : "✦ Pesquisar"}</Btn>
    </Card>

    {aiL && (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1,2,3].map(i => <SkeletonCard key={i} />)}
      </div>
    )}
    {trendR?.error && <Card style={{ padding: 20 }}><span style={{ color: "#DC2626", fontSize: 13 }}>✕ {trendR.error}</span></Card>}

    {savedTrends.length > 0 && !aiL && (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Tendências salvas para {ac?.name || "este cliente"}</div>
          <Btn size="sm" variant="ghost" onClick={() => { setReviewItems(savedTrends.map((t,idx) => ({ _id: t.id, _isTrend: true, title: t.name, day: 1, time: "18:00", type: t.format || "reel", description: t.script, caption: t.caption, design_brief: t.editing_tips, hashtags: t.hashtags, platform: t.platform, hook: t.hook, why_viral: t.why_viral, music: t.music, best_time: t.best_time, estimated_reach: t.estimated_reach, source_url: t.source_url, note: "" }))); setReviewOrigin("trends"); setReviewSelIdx(0); setReviewTab(0); setReviewModal(true); }}>Ver detalhes</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginBottom: 20 }}>
          {savedTrends.map((t, i) => (
            <Card key={t.id} style={{ padding: 16, cursor: "pointer" }} onClick={() => { setReviewItems(savedTrends.map((tt,idx) => ({ _id: tt.id, _isTrend: true, title: tt.name, day: 1, time: "18:00", type: tt.format || "reel", description: tt.script, caption: tt.caption, design_brief: tt.editing_tips, hashtags: tt.hashtags, platform: tt.platform, hook: tt.hook, why_viral: tt.why_viral, music: tt.music, best_time: tt.best_time, estimated_reach: tt.estimated_reach, source_url: tt.source_url, note: "" }))); setReviewOrigin("trends"); setReviewSelIdx(i); setReviewTab(0); setReviewModal(true); }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <Badge>{t.platform}</Badge>
                <Badge color={T.accentGreen} bg={T.accentGreenLight}>Alcance {t.estimated_reach}</Badge>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.01em" }}>{t.name}</div>
              <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: 8 }}>{(t.why_viral || "").slice(0, 90)}{(t.why_viral || "").length > 90 ? "..." : ""}</div>
              {t.music && <div style={{ fontSize: 11, color: T.accentGreen, fontWeight: 600 }}>♪ {t.music.slice(0, 30)}</div>}
            </Card>
          ))}
        </div>
      </div>
    )}
    {!trendR && !aiL && (
      <Card style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>Pesquise tendências virais</div>
        <div style={{ fontSize: 13, color: T.textSub }}>A IA analisa o que está viralizando e gera roteiros prontos para gravar.</div>
      </Card>
    )}
  </div>
)}

        </div>
      </div>

      {/* ── MODALS ── */}
      {reviewModal && (
        <ReviewModal
          items={reviewItems}
          selIdx={reviewSelIdx}
          setSelIdx={setReviewSelIdx}
          activeTab={reviewTab}
          setActiveTab={setReviewTab}
          onRemove={removeReviewItem}
          onUpdate={updateReviewItem}
          onApprove={approveReview}
          onRegenerate={regenerateReview}
          onClose={closeReview}
          origin={reviewOrigin}
          T={T}
        />
      )}
      {showNew && <TaskForm title="Novo item" task={nTask} setT={setNTask} tOpts={tOpts} sOpts={sOpts} dim={dim} calM={calM} calY={calY} onCancel={() => setShowNew(false)} onSave={async () => { if (nTask.title) { await addTask(nTask); setShowNew(false); } }} />}
      {taskModal && eTask && <TaskForm title="Editar item" task={eTask} setT={setETask} tOpts={tOpts} sOpts={sOpts} dim={dim} calM={calM} calY={calY} onCancel={() => { setTaskModal(null); setETask(null); }} onSave={async () => { await updTask(taskModal, eTask); setTaskModal(null); setETask(null); }} onDel={() => { if (confirm("Excluir?")) delTask(taskModal); }} />}
    </div>
  );
}
