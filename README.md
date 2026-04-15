# Social Hub — Gestão de Social Media com IA

Dashboard completo para social media managers com geração de conteúdo via IA (Claude).

## Funcionalidades

- **Central de Clientes** — cadastro com persona, identidade visual, contrato
- **Calendário com IA** — gera cronograma completo de posts, reels e stories
- **Pipeline Kanban** — acompanhe produção → aprovação → agendamento
- **Pesquisa de Tendências** — IA analisa o que está viralizando e gera roteiros

## Deploy na Vercel

### Opção 1: Via GitHub (recomendado)

1. Crie um repositório no GitHub
2. Faça push deste projeto:
   ```bash
   cd social-hub-app
   git init
   git add .
   git commit -m "Social Hub v1"
   git remote add origin https://github.com/SEU_USER/social-hub.git
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
4. Importe o repositório do GitHub
5. A Vercel detecta automaticamente que é um projeto Vite
6. Clique em **Deploy** — pronto!

### Opção 2: Via Vercel CLI

```bash
npm i -g vercel
cd social-hub-app
vercel
```

## Configuração

Após o deploy, acesse o app e vá em **Configurações** para inserir sua API Key da Anthropic. A chave fica salva apenas no localStorage do navegador.

## Tech Stack

- React + Vite
- Anthropic API (Claude Sonnet)
- localStorage para persistência
