const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { criarMotor } = require('./engine');

const RAIZ = path.join(__dirname, '..');
const CONFIG = path.join(RAIZ, 'config.json');

if (!fs.existsSync(CONFIG)) {
  console.log('⚠️  config.json não encontrado. Rode primeiro: npm run setup');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const { responder, pausar } = criarMotor(cfg);
const enviadasPeloBot = new Set();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(RAIZ, 'auth'));
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }) });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 Escaneie o QR Code no WhatsApp > Aparelhos conectados:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') console.log(`✅ ${cfg.nomeBot} está online!`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('🚪 Sessão encerrada. Apague a pasta "auth" e rode de novo para novo QR.');
        process.exit(0);
      }
      console.log('🔄 Reconectando...');
      iniciar();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      const jid = m.key.remoteJid;
      if (!m.message || !jid || jid === 'status@broadcast') continue;
      if (jid.endsWith('@g.us') && !cfg.responderGrupos) continue;

      const texto = m.message.conversation
        || m.message.extendedTextMessage?.text
        || m.message.imageMessage?.caption || '';

      // Se você (dono) responder manualmente, o bot pausa nessa conversa.
      if (m.key.fromMe) {
        if (enviadasPeloBot.delete(m.key.id)) continue; // mensagem do próprio bot
        if (texto.trim().toLowerCase() !== '#bot') { pausar(jid); continue; }
      }

      const respostas = responder(jid, texto);
      for (const r of respostas) {
        await sock.sendPresenceUpdate('composing', jid);
        await esperar(cfg.delayDigitandoMs || 0);
        const enviada = await sock.sendMessage(jid, { text: r });
        if (enviada?.key?.id) enviadasPeloBot.add(enviada.key.id);
      }
    }
  });
}

iniciar().catch((e) => { console.error('Erro:', e); process.exit(1); });
