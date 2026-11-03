# 🤖 CreatorZap

Site para **qualquer pessoa** criar um bot de atendimento no WhatsApp, pelo celular ou pelo PC, sem programar:

1. Abre o site e preenche nome da empresa, menu e respostas
2. Testa no chat de simulação
3. Toca em **Criar meu bot** e escaneia o QR Code no WhatsApp → pronto, o bot está no ar

Cada pessoa recebe um link secreto para voltar e editar o próprio bot. Vários bots rodam ao mesmo tempo no mesmo servidor.

## Colocar o site no ar

O servidor precisa ficar ligado 24h (o bot mantém uma conexão aberta com o WhatsApp), então use um host que roda Node/Docker contínuo, como **Railway**, **Render** (plano pago), **Fly.io** ou uma VPS. Vercel/Netlify **não** servem.

**Railway (mais fácil):** New Project → Deploy from GitHub → escolha este repositório. Adicione um *Volume* montado em `/data` (para os bots não perderem o login quando o servidor reiniciar). Pronto, ele te dá um link público.

**Qualquer VPS com Docker:**
```bash
docker build -t creatorzap .
docker run -d -p 80:3000 -v creatorzap-data:/data --restart always creatorzap
```

**Local para testar:** `npm install && npm start` → abra http://localhost:3000

## O que o bot faz

- Boas-vindas + menu numerado; respostas por opção e por palavra-chave (ignora acentos)
- Horário de atendimento com mensagem automática fora do horário
- Opção "falar com atendente" pausa o bot naquela conversa
- Se o dono responde pelo celular, o bot pausa sozinho; `#bot` reativa
- Mostra "digitando..." e ignora grupos

## Modo terminal (sem site)

`npm run setup` e depois `npm run bot-terminal`.

> ⚠️ Usa o WhatsApp Web (Baileys), não a API oficial. Spam ou envio em massa pode banir o número.
