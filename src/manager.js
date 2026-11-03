// Gerencia vários bots ao mesmo tempo (um por usuário), cada um com sua sessão do WhatsApp.
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QR = require('qrcode');
const {
  default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { criarMotor } = require('./engine');

const DADOS = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const bots = new Map(); // id -> { cfg, motor, sock, status, qr, numero }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const pasta = (id) => path.join(DADOS, id);

function salvarConfig(id, cfg) {
  fs.mkdirSync(pasta(id), { recursive: true });
  fs.writeFileSync(path.join(pasta(id), 'config.json'), JSON.stringify(cfg, null, 2));
  const b = bots.get(id);
  if (b) { b.cfg = cfg; b.motor = criarMotor(cfg); }
}

function lerConfig(id) {
  const f = path.join(pasta(id), 'config.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

function info(id) {
  const b = bots.get(id);
  if (!b) return { status: 'parado' };
  return { status: b.status, qr: b.qr, numero: b.numero };
}

async function iniciar(id) {
  const cfg = lerConfig(id);
  if (!cfg) throw new Error('Bot não encontrado');
  const anterior = bots.get(id);
  const b = anterior || { enviadas: new Set() };
  Object.assign(b, { cfg, motor: criarMotor(cfg), status: 'conectando', qr: null });
  bots.set(id, b);

  const { state, saveCreds } = await useMultiFileAuthState(path.join(pasta(id), 'auth'));
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }) });
  b.sock = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (b.sock !== sock) return; // socket antigo
    if (qr) { b.status = 'aguardando_qr'; b.qr = await QR.toDataURL(qr, { margin: 1, width: 320 }); }
    if (connection === 'open') {
      b.status = 'online'; b.qr = null;
      b.numero = (sock.user?.id || '').split(':')[0].split('@')[0];
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (b.parando) return;
      if (code === DisconnectReason.loggedOut) {
        fs.rmSync(path.join(pasta(id), 'auth'), { recursive: true, force: true });
        b.status = 'desconectado'; b.numero = null;
        return iniciar(id).catch(() => {}); // gera QR novo
      }
      setTimeout(() => iniciar(id).catch(() => {}), 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      const jid = m.key.remoteJid;
      if (!m.message || !jid || jid === 'status@broadcast') continue;
      if (jid.endsWith('@g.us') && !b.cfg.responderGrupos) continue;
      const texto = m.message.conversation || m.message.extendedTextMessage?.text
        || m.message.imageMessage?.caption || '';
      if (m.key.fromMe) {
        if (b.enviadas.delete(m.key.id)) continue;
        if (texto.trim().toLowerCase() !== '#bot') { b.motor.pausar(jid); continue; }
      }
      try {
        for (const r of b.motor.responder(jid, texto)) {
          await sock.sendPresenceUpdate('composing', jid);
          await esperar(b.cfg.delayDigitandoMs || 0);
          const s = await sock.sendMessage(jid, { text: r });
          if (s?.key?.id) b.enviadas.add(s.key.id);
        }
      } catch (e) { console.error(`[${id}]`, e.message); }
    }
  });
}

// Conectar sem QR: gera um código de 8 letras para digitar no WhatsApp do celular.
async function codigoPareamento(id, numero) {
  const b = bots.get(id);
  if (!b?.sock) throw new Error('Ligue o bot primeiro');
  if (b.status === 'online') throw new Error('Já está conectado');
  const n = String(numero || '').replace(/\D/g, '');
  if (n.length < 10) throw new Error('Digite o número com DDI e DDD, ex: 5511999998888');
  for (let i = 0; i < 20 && b.status !== 'aguardando_qr'; i++) await esperar(500);
  const c = await b.sock.requestPairingCode(n);
  return c.match(/.{1,4}/g).join('-');
}

async function parar(id, sair = false) {
  const b = bots.get(id);
  if (!b) return;
  b.parando = true;
  try { if (sair) await b.sock?.logout(); else b.sock?.end(); } catch {}
  bots.delete(id);
  if (sair) fs.rmSync(path.join(pasta(id), 'auth'), { recursive: true, force: true });
}

function apagar(id) {
  return parar(id, true).then(() => fs.rmSync(pasta(id), { recursive: true, force: true }));
}

// Ao ligar o servidor, religa os bots que já tinham WhatsApp conectado.
function religarTodos() {
  if (!fs.existsSync(DADOS)) return;
  for (const id of fs.readdirSync(DADOS)) {
    if (fs.existsSync(path.join(pasta(id), 'auth', 'creds.json'))) iniciar(id).catch((e) => console.error(id, e.message));
  }
}

module.exports = { codigoPareamento, salvarConfig, lerConfig, iniciar, parar, apagar, info, religarTodos };
