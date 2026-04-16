import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
      else setSuccess("Conta criada! Verifique seu email para confirmar.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setError(error.message);
      else setSuccess("Email de recuperação enviado!");
    }
    setLoading(false);
  }

  const s = {
    wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f0", fontFamily: "'DM Sans', sans-serif", padding: 20 },
    card: { background: "#fff", borderRadius: 16, padding: "40px 36px", width: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
    logo: { width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, margin: "0 auto 16px" },
    title: { textAlign: "center", fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" },
    sub: { textAlign: "center", fontSize: 14, color: "#888", margin: "0 0 28px" },
    input: { width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e0e0e0", background: "#f9f9f9", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", marginBottom: 14 },
    btn: { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
    link: { background: "none", border: "none", color: "#1D9E75", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: 0, fontWeight: 500 },
    err: { padding: "10px 14px", borderRadius: 8, background: "#FCEBEB", color: "#791F1F", fontSize: 13, marginBottom: 14 },
    ok: { padding: "10px 14px", borderRadius: 8, background: "#E1F5EE", color: "#085041", fontSize: 13, marginBottom: 14 },
    footer: { display: "flex", justifyContent: "center", gap: 8, marginTop: 20, fontSize: 13, color: "#888", alignItems: "center" }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>SH</div>
        <h1 style={s.title}>Social Hub</h1>
        <p style={s.sub}>
          {mode === "login" && "Entre na sua conta"}
          {mode === "signup" && "Crie sua conta"}
          {mode === "reset" && "Recupere sua senha"}
        </p>

        {error && <div style={s.err}>{error}</div>}
        {success && <div style={s.ok}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input style={s.input} type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          {mode !== "reset" && (
            <input style={s.input} type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          )}
          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar email"}
          </button>
        </form>

        <div style={s.footer}>
          {mode === "login" && (<>
            <span>Não tem conta?</span>
            <button style={s.link} onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}>Criar conta</button>
            <span>·</span>
            <button style={s.link} onClick={() => { setMode("reset"); setError(null); setSuccess(null); }}>Esqueci a senha</button>
          </>)}
          {mode === "signup" && (<>
            <span>Já tem conta?</span>
            <button style={s.link} onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>Entrar</button>
          </>)}
          {mode === "reset" && (<>
            <button style={s.link} onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>Voltar ao login</button>
          </>)}
        </div>
      </div>
    </div>
  );
}
