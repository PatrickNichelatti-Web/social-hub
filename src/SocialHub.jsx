import { useState, useEffect, useCallback } from "react";

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

const CONTENT_TYPES = {
  post: { label: "Post", icon: "◻", bg: "#E6F1FB", color: "#0C447C" },
  reel: { label: "Reel", icon: "▶", bg: "#EEEDFE", color: "#3C3489" },
  carousel: { label: "Carrossel", icon: "◫", bg: "#E1F5EE", color: "#085041" },
  story: { label: "Story", icon: "○", bg: "#FBEAF0", color: "#72243E" },
  story_seq: { label: "Seq. Stories", icon: "◎", bg: "#FAECE7", color: "#712B13" }
};

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function loadData(key, fallback) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}
function saveData(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error("Save error:", e); }
}

function Badge({ type }) {
  const t = CONTENT_TYPES[type] || CONTENT_TYPES.post;
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: t.bg, color: t.color, fontWeight: 500, whiteSpace: "nowrap" }}>{t.icon} {t.label}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", width: wide ? 680 : 480, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, rows, options }) {
  const s = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f9f9f9", color: "#1a1a1a", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
      {rows ? <textarea style={{ ...s, resize: "vertical" }} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : options ? <select style={s} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input type={type} style={s} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function Btn({ children, onClick, primary, small, disabled, style: sx }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
      background: primary ? "#1D9E75" : "#fff", color: primary ? "#fff" : "#333",
      border: primary ? "none" : "1px solid #ddd", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...sx
    }}>{children}</button>
  );
}

const defaultClient = { name: "", industry: "", instagram: "", persona: "", tone: "", colors: "#1D9E75, #0C447C", fonts: "", postsPerMonth: 12, reelsPerMonth: 4, storiesPerDay: 3, notes: "" };

export default function SocialHub() {
  const [view, setView] = useState(VIEWS.CLIENTS);
  const [clients, setClients] = useState(() => loadData("sh_clients", []));
  const [tasks, setTasks] = useState(() => loadData("sh_tasks", []));
  const [selectedClient, setSelectedClient] = useState(() => loadData("sh_selected", null));
  const [apiKey, setApiKey] = useState(() => loadData("sh_apikey", ""));
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState({ ...defaultClient });
  const [editingClientId, setEditingClientId] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [trendQuery, setTrendQuery] = useState("");
  const [trendResult, setTrendResult] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { saveData("sh_clients", clients); }, [clients]);
  useEffect(() => { saveData("sh_tasks", tasks); }, [tasks]);
  useEffect(() => { saveData("sh_selected", selectedClient); }, [selectedClient]);
  useEffect(() => { saveData("sh_apikey", apiKey); }, [apiKey]);

  const activeClient = clients.find(c => c.id === selectedClient);

  async function callAI(prompt) {
    if (!apiKey) { alert("Configure sua API Key da Anthropic em Configurações."); setView(VIEWS.SETTINGS); return null; }
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] })
    });
    if (!resp.ok) throw new Error(`API Error: ${resp.status}`);
    const data = await resp.json();
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    return text.replace(/```json|```/g, "").trim();
  }

  function saveClient() {
    if (!editClient.name) return;
    if (editingClientId) {
      setClients(clients.map(c => c.id === editingClientId ? { ...editClient, id: editingClientId } : c));
    } else {
      const nc = { ...editClient, id: generateId() };
      setClients([...clients, nc]);
      if (!selectedClient) setSelectedClient(nc.id);
    }
    setShowClientForm(false); setEditClient({ ...defaultClient }); setEditingClientId(null);
  }

  function deleteClient(id) {
    setClients(clients.filter(c => c.id !== id));
    setTasks(tasks.filter(t => t.clientId !== id));
    if (selectedClient === id) setSelectedClient(clients.find(c => c.id !== id)?.id || null);
  }

  async function generateCalendar() {
    if (!activeClient) return;
    setAiLoading(true); setAiResult(null);
    const month = MONTHS[calMonth];
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prompt = `Você é um social media manager especialista. Gere um cronograma completo de conteúdo para Instagram para o mês de ${month} ${calYear} (${daysInMonth} dias).

Cliente: ${activeClient.name}
Segmento: ${activeClient.industry}
Persona: ${activeClient.persona}
Tom de voz: ${activeClient.tone}
Instagram: ${activeClient.instagram}

Contrato mensal:
- ${activeClient.postsPerMonth} posts/carrosséis
- ${activeClient.reelsPerMonth} reels
- ${activeClient.storiesPerDay} stories/dia (sequências de engajamento e vendas)

Regras:
1. Distribua os posts e reels uniformemente ao longo do mês
2. Inclua horários otimizados para o público brasileiro (7h, 12h, 18h, 21h)
3. Para cada REEL: tema, gancho (hook), roteiro resumido e dica de edição
4. Para cada POST/CARROSSEL: tema, headlines dos slides, CTA
5. Para stories: sequência diária (engajamento + venda)

RESPONDA APENAS em JSON válido, sem markdown, sem backticks:
{"items":[{"day":1,"time":"12:00","type":"post|reel|carousel|story_seq","title":"título curto","description":"descrição detalhada","hashtags":"#tag1 #tag2"}]}`;

    try {
      const raw = await callAI(prompt);
      if (!raw) { setAiLoading(false); return; }
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      if (parsed.items) {
        const newTasks = parsed.items.map(item => ({
          id: generateId(), clientId: activeClient.id, day: item.day, month: calMonth, year: calYear,
          time: item.time, type: item.type, title: item.title, description: item.description,
          hashtags: item.hashtags || "", status: "draft", approvalNote: ""
        }));
        setTasks(prev => [...prev.filter(t => !(t.clientId === activeClient.id && t.month === calMonth && t.year === calYear)), ...newTasks]);
        setAiResult({ success: true, count: newTasks.length });
      }
    } catch (e) { setAiResult({ success: false, error: e.message }); }
    setAiLoading(false);
  }

  async function researchTrends() {
    if (!trendQuery && !activeClient) return;
    setAiLoading(true); setTrendResult(null);
    const query = trendQuery || activeClient?.industry || "marketing digital";
    const prompt = `Você é um especialista em marketing viral. Analise o que está viralizando no Instagram e TikTok no nicho: "${query}".
${activeClient ? `Cliente: ${activeClient.name} | Segmento: ${activeClient.industry} | Persona: ${activeClient.persona}` : ""}

Identifique 5 tendências virais:
1. Nome e plataforma
2. POR QUE viralizou (gatilhos psicológicos)
3. ROTEIRO PRONTO para adaptar
4. Gancho (hook 3 seg), estrutura, CTA, edição
5. Hashtags e horários ideais

RESPONDA APENAS em JSON válido, sem markdown, sem backticks:
{"trends":[{"name":"","platform":"instagram|tiktok|ambos","why_viral":"","script":"","hook":"","editing_tips":"","hashtags":"","best_time":"","estimated_reach":"alto|médio"}]}`;

    try {
      const raw = await callAI(prompt);
      if (!raw) { setAiLoading(false); return; }
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      setTrendResult(parsed);
    } catch (e) { setTrendResult({ error: e.message }); }
    setAiLoading(false);
  }

  function moveTask(taskId, newStatus) {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  function getCalendarDays() {
    const first = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < first; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  const clientTasks = tasks.filter(t => t.clientId === selectedClient);
  const monthTasks = clientTasks.filter(t => t.month === calMonth && t.year === calYear);
  const stats = STATUS_COLS.reduce((a, c) => ({ ...a, [c.id]: clientTasks.filter(t => t.status === c.id).length }), {});

  const navItems = [
    { id: VIEWS.CLIENTS, label: "Clientes", icon: "👥" },
    { id: VIEWS.CALENDAR, label: "Calendário", icon: "📅" },
    { id: VIEWS.PIPELINE, label: "Pipeline", icon: "📋" },
    { id: VIEWS.TRENDS, label: "Tendências", icon: "🔥" },
    { id: VIEWS.SETTINGS, label: "Configurações", icon: "⚙️" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a", background: "#f5f5f0" }}>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 56, background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: sidebarOpen ? "20px 16px 12px" : "20px 8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>SH</div>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", letterSpacing: "-0.3px" }}>Social Hub</span>}
        </div>
        <div style={{ padding: "8px", flex: 1 }}>
          {navItems.map(n => (
            <div key={n.id} onClick={() => setView(n.id)} style={{
              padding: sidebarOpen ? "10px 12px" : "10px 8px", borderRadius: 8, marginBottom: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              background: view === n.id ? "#f0f0ea" : "transparent", fontWeight: view === n.id ? 600 : 400, fontSize: 14, transition: "background 0.15s"
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
            </div>
          ))}
        </div>
        {sidebarOpen && activeClient && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", fontSize: 12 }}>
            <div style={{ color: "#888", marginBottom: 4 }}>Cliente ativo</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{activeClient.name}</div>
            {activeClient.instagram && <div style={{ color: "#1D9E75", marginTop: 2 }}>@{activeClient.instagram}</div>}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{navItems.find(n => n.id === view)?.icon} {navItems.find(n => n.id === view)?.label}</h1>
          {clients.length > 0 && view !== VIEWS.SETTINGS && (
            <select value={selectedClient || ""} onChange={e => setSelectedClient(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9", color: "#333", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        <div style={{ padding: 24 }}>

          {/* SETTINGS */}
          {view === VIEWS.SETTINGS && (
            <div style={{ maxWidth: 500 }}>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Configure sua chave de API da Anthropic para usar os recursos de IA.</p>
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #eee" }}>
                <Field label="Anthropic API Key" type="password" value={apiKey} onChange={setApiKey} placeholder="sk-ant-..." />
                <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>Sua chave fica salva apenas no seu navegador (localStorage). Nunca é enviada a terceiros.</p>
                {apiKey && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#E1F5EE", color: "#085041", fontSize: 13 }}>✅ API Key configurada</div>}
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #eee", marginTop: 16 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Dados</h3>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>{clients.length} clientes · {tasks.length} tarefas salvas</p>
                <Btn small onClick={() => { if(confirm("Tem certeza? Todos os dados serão apagados.")) { setClients([]); setTasks([]); setSelectedClient(null); localStorage.removeItem("sh_clients"); localStorage.removeItem("sh_tasks"); localStorage.removeItem("sh_selected"); } }} style={{ color: "#E24B4A" }}>Limpar todos os dados</Btn>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {view === VIEWS.CLIENTS && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ margin: 0, color: "#888", fontSize: 14 }}>Gerencie perfis com persona, identidade visual e contrato.</p>
                <Btn primary onClick={() => { setEditClient({ ...defaultClient }); setEditingClientId(null); setShowClientForm(true); }}>+ Novo cliente</Btn>
              </div>
              {clients.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <p style={{ fontSize: 15 }}>Nenhum cliente cadastrado.</p>
                  <p style={{ fontSize: 13 }}>Adicione seu primeiro cliente para começar.</p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {clients.map(c => (
                  <div key={c.id} onClick={() => setSelectedClient(c.id)} style={{
                    background: "#fff", borderRadius: 12, padding: 20, cursor: "pointer",
                    border: selectedClient === c.id ? "2px solid #1D9E75" : "1px solid #eee", transition: "border 0.15s"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{c.industry}</div>
                        {c.instagram && <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 4 }}>@{c.instagram}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {c.colors?.split(",").slice(0, 3).map((col, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: col.trim() }} />)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>{c.persona?.slice(0, 100)}{c.persona?.length > 100 ? "..." : ""}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#888", borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                      <span>{c.postsPerMonth} posts/mês</span><span>{c.reelsPerMonth} reels/mês</span><span>{c.storiesPerDay} stories/dia</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Btn small onClick={e => { e.stopPropagation(); setEditClient(c); setEditingClientId(c.id); setShowClientForm(true); }}>Editar</Btn>
                      <Btn small onClick={e => { e.stopPropagation(); deleteClient(c.id); }} style={{ color: "#E24B4A" }}>Excluir</Btn>
                    </div>
                  </div>
                ))}
              </div>
              {showClientForm && (
                <Modal title={editingClientId ? "Editar cliente" : "Novo cliente"} onClose={() => setShowClientForm(false)} wide>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <Field label="Nome da empresa" value={editClient.name} onChange={v => setEditClient({ ...editClient, name: v })} placeholder="Ex: ConvertX" />
                    <Field label="Segmento" value={editClient.industry} onChange={v => setEditClient({ ...editClient, industry: v })} placeholder="Ex: Marketing Digital" />
                    <Field label="Instagram" value={editClient.instagram} onChange={v => setEditClient({ ...editClient, instagram: v })} placeholder="sem o @" />
                    <Field label="Tom de voz" value={editClient.tone} onChange={v => setEditClient({ ...editClient, tone: v })} placeholder="Ex: informal, direto, provocativo" />
                    <Field label="Cores da marca (hex)" value={editClient.colors} onChange={v => setEditClient({ ...editClient, colors: v })} placeholder="#1D9E75, #0C447C" />
                    <Field label="Fontes" value={editClient.fonts} onChange={v => setEditClient({ ...editClient, fonts: v })} placeholder="Ex: Montserrat, Poppins" />
                  </div>
                  <Field label="Persona / público-alvo" value={editClient.persona} onChange={v => setEditClient({ ...editClient, persona: v })} rows={3} placeholder="Descreva o público: idade, dores, desejos..." />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
                    <Field label="Posts/mês" type="number" value={editClient.postsPerMonth} onChange={v => setEditClient({ ...editClient, postsPerMonth: parseInt(v) || 0 })} />
                    <Field label="Reels/mês" type="number" value={editClient.reelsPerMonth} onChange={v => setEditClient({ ...editClient, reelsPerMonth: parseInt(v) || 0 })} />
                    <Field label="Stories/dia" type="number" value={editClient.storiesPerDay} onChange={v => setEditClient({ ...editClient, storiesPerDay: parseInt(v) || 0 })} />
                  </div>
                  <Field label="Observações extras" value={editClient.notes} onChange={v => setEditClient({ ...editClient, notes: v })} rows={2} placeholder="Informações adicionais..." />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <Btn onClick={() => setShowClientForm(false)}>Cancelar</Btn>
                    <Btn primary onClick={saveClient}>Salvar</Btn>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* CALENDAR */}
          {view === VIEWS.CALENDAR && (
            <div>
              {!activeClient ? <div style={{ textAlign: "center", padding: 60, color: "#888" }}><p>Selecione um cliente para ver o calendário.</p></div> : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>←</button>
                      <span style={{ fontWeight: 600, fontSize: 16, minWidth: 160, textAlign: "center" }}>{MONTHS[calMonth]} {calYear}</span>
                      <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>→</button>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {monthTasks.length > 0 && <span style={{ fontSize: 12, color: "#888" }}>{monthTasks.length} itens</span>}
                      <Btn primary onClick={generateCalendar} disabled={aiLoading}>{aiLoading ? "⏳ Gerando..." : "🤖 Gerar cronograma com IA"}</Btn>
                    </div>
                  </div>
                  {aiResult && (
                    <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, background: aiResult.success ? "#E1F5EE" : "#FCEBEB", color: aiResult.success ? "#085041" : "#791F1F" }}>
                      {aiResult.success ? `✅ ${aiResult.count} itens criados para ${MONTHS[calMonth]}!` : `❌ Erro: ${aiResult.error}`}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e0e0e0", borderRadius: 12, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                    {DAYS.map(d => <div key={d} style={{ padding: 8, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", background: "#f5f5f0" }}>{d}</div>)}
                    {getCalendarDays().map((day, i) => {
                      const dayTasks = day ? monthTasks.filter(t => t.day === day).sort((a, b) => (a.time || "").localeCompare(b.time || "")) : [];
                      return (
                        <div key={i} style={{ minHeight: 90, padding: 6, background: "#fff", opacity: day ? 1 : 0.3 }}>
                          {day && <>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#888" }}>{day}</div>
                            {dayTasks.slice(0, 3).map(t => (
                              <div key={t.id} onClick={() => setShowTaskDetail(t)} style={{ fontSize: 10, padding: "3px 5px", borderRadius: 4, marginBottom: 2, cursor: "pointer", background: CONTENT_TYPES[t.type]?.bg || "#F1EFE8", color: CONTENT_TYPES[t.type]?.color || "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <b>{t.time}</b> {t.title?.slice(0, 18)}
                              </div>
                            ))}
                            {dayTasks.length > 3 && <div style={{ fontSize: 10, color: "#888", padding: "2px 4px" }}>+{dayTasks.length - 3}</div>}
                          </>}
                        </div>
                      );
                    })}
                  </div>
                  {monthTasks.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Próximas postagens</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monthTasks.sort((a, b) => a.day - b.day || (a.time || "").localeCompare(b.time || "")).slice(0, 15).map(t => (
                          <div key={t.id} onClick={() => setShowTaskDetail(t)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1px solid #eee", cursor: "pointer" }}>
                            <div style={{ minWidth: 44, textAlign: "center" }}>
                              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{t.day}</div>
                              <div style={{ fontSize: 10, color: "#888" }}>{MONTHS[calMonth]?.slice(0, 3)}</div>
                            </div>
                            <div style={{ width: 1, height: 32, background: "#eee" }} />
                            <div style={{ minWidth: 44, fontSize: 13, color: "#888", fontWeight: 500 }}>{t.time || "--:--"}</div>
                            <Badge type={t.type} />
                            <div style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                            <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: STATUS_COLS.find(s => s.id === t.status)?.color + "22", color: STATUS_COLS.find(s => s.id === t.status)?.color, fontWeight: 500 }}>
                              {STATUS_COLS.find(s => s.id === t.status)?.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PIPELINE */}
          {view === VIEWS.PIPELINE && (
            <div>
              {!activeClient ? <div style={{ textAlign: "center", padding: 60, color: "#888" }}><p>Selecione um cliente para ver o pipeline.</p></div> : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 20 }}>
                    {STATUS_COLS.map(col => (
                      <div key={col.id} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid #eee" }}>
                        <div style={{ fontSize: 22, fontWeight: 600, color: col.color }}>{stats[col.id] || 0}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{col.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS_COLS.length}, minmax(0, 1fr))`, gap: 10 }}>
                    {STATUS_COLS.map(col => (
                      <div key={col.id} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragTask) moveTask(dragTask, col.id); setDragTask(null); }}
                        style={{ background: "#f9f9f7", borderRadius: 10, padding: 10, minHeight: 300 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${col.color}` }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
                          <span style={{ fontSize: 11, background: col.color + "22", color: col.color, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{clientTasks.filter(t => t.status === col.id).length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {clientTasks.filter(t => t.status === col.id).sort((a, b) => (a.day || 0) - (b.day || 0)).map(t => (
                            <div key={t.id} draggable onDragStart={() => setDragTask(t.id)} onClick={() => setShowTaskDetail(t)}
                              style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", cursor: "grab", border: "1px solid #eee", fontSize: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <Badge type={t.type} />
                                {t.day > 0 && <span style={{ color: "#888", fontSize: 11 }}>{t.day}/{calMonth + 1} {t.time}</span>}
                              </div>
                              <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>{t.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TRENDS */}
          {view === VIEWS.TRENDS && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
                <input value={trendQuery} onChange={e => setTrendQuery(e.target.value)} placeholder={activeClient ? `Pesquisar tendências para ${activeClient.name}...` : "Digite um nicho..."} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} onKeyDown={e => e.key === "Enter" && researchTrends()} />
                <Btn primary onClick={researchTrends} disabled={aiLoading}>{aiLoading ? "⏳ Pesquisando..." : "🔍 Pesquisar tendências"}</Btn>
              </div>
              {aiLoading && <div style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 14, color: "#888" }}>🤖 Analisando tendências virais com IA...</div></div>}
              {trendResult?.error && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FCEBEB", color: "#791F1F", fontSize: 13 }}>❌ {trendResult.error}</div>}
              {trendResult?.trends && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {trendResult.trends.map((tr, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
                      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16 }}>{tr.name}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{tr.platform} · {tr.best_time} · Alcance: {tr.estimated_reach}</div>
                        </div>
                        <Btn small onClick={() => { const nt = { id: generateId(), clientId: selectedClient, day: 0, month: calMonth, year: calYear, time: tr.best_time?.split(" ")[0] || "12:00", type: "reel", title: tr.name, description: `GANCHO: ${tr.hook}\n\nROTEIRO:\n${tr.script}\n\nEDIÇÃO:\n${tr.editing_tips}\n\nHASHTAGS: ${tr.hashtags}`, hashtags: tr.hashtags || "", status: "draft" }; setTasks([...tasks, nt]); }}>+ Adicionar</Btn>
                      </div>
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>Por que viralizou</div><div style={{ fontSize: 13, lineHeight: 1.6 }}>{tr.why_viral}</div></div>
                        <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>Gancho (hook)</div><div style={{ fontSize: 14, fontWeight: 600, color: "#534AB7", background: "#EEEDFE", padding: "8px 12px", borderRadius: 8 }}>{tr.hook}</div></div>
                        <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>Roteiro</div><div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{tr.script}</div></div>
                        <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>Edição e gravação</div><div style={{ fontSize: 13, lineHeight: 1.6 }}>{tr.editing_tips}</div></div>
                        {tr.hashtags && <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 8 }}>{tr.hashtags}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!trendResult && !aiLoading && (
                <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
                  <p style={{ fontSize: 15 }}>Pesquise tendências virais com IA</p>
                  <p style={{ fontSize: 13 }}>A IA analisa padrões virais e gera roteiros prontos.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {showTaskDetail && (
        <Modal title={showTaskDetail.title} onClose={() => setShowTaskDetail(null)} wide>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Badge type={showTaskDetail.type} />
            {showTaskDetail.day > 0 && <span style={{ fontSize: 13, color: "#888" }}>📅 {showTaskDetail.day}/{calMonth + 1}/{calYear} às {showTaskDetail.time}</span>}
            {showTaskDetail.hashtags && <span style={{ fontSize: 12, color: "#1D9E75" }}>{showTaskDetail.hashtags}</span>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Briefing / roteiro</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#f9f9f7", padding: "14px 16px", borderRadius: 10, maxHeight: 300, overflowY: "auto" }}>{showTaskDetail.description || "Sem descrição."}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Status</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUS_COLS.map(col => (
                <button key={col.id} onClick={() => { moveTask(showTaskDetail.id, col.id); setShowTaskDetail({ ...showTaskDetail, status: col.id }); }} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: "none",
                  background: showTaskDetail.status === col.id ? col.color : col.color + "22", color: showTaskDetail.status === col.id ? "#fff" : col.color
                }}>{col.label}</button>
              ))}
            </div>
          </div>
          <Field label="Nota de aprovação do cliente" value={showTaskDetail.approvalNote || ""} onChange={v => { setTasks(tasks.map(t => t.id === showTaskDetail.id ? { ...t, approvalNote: v } : t)); setShowTaskDetail({ ...showTaskDetail, approvalNote: v }); }} rows={2} placeholder="Comentários do cliente..." />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 16, marginTop: 8 }}>
            <Btn onClick={() => { setTasks(tasks.filter(t => t.id !== showTaskDetail.id)); setShowTaskDetail(null); }} style={{ color: "#E24B4A" }}>Excluir</Btn>
            <Btn onClick={() => setShowTaskDetail(null)}>Fechar</Btn>
            {showTaskDetail.status !== "approved" && <Btn primary onClick={() => { moveTask(showTaskDetail.id, "approved"); setShowTaskDetail({ ...showTaskDetail, status: "approved" }); }}>✓ Aprovar</Btn>}
          </div>
        </Modal>
      )}
    </div>
  );
}
