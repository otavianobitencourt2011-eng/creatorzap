const express = require('express');
const crypto = require('crypto');
const path = require('path');
const bots = require('./manager');

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// O id é longo e aleatório: funciona como a "senha" do painel do bot.
const ID_OK = /^[a-f0-9]{32}$/;
const comBot = (fn) => async (req, res) => {
  const { id } = req.params;
  if (!ID_OK.test(id) || !bots.lerConfig(id)) return res.status(404).json({ erro: 'Bot não encontrado' });
  try { await fn(req, res, id); } catch (e) { res.status(500).json({ erro: e.message }); }
};

function validar(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Configuração inválida');
  if (!String(cfg.nomeEmpresa || '').trim()) throw new Error('Informe o nome da empresa');
  if (!Array.isArray(cfg.menu)) cfg.menu = [];
  if (!Array.isArray(cfg.palavrasChave)) cfg.palavrasChave = [];
  return cfg;
}

app.post('/api/bots', async (req, res) => {
  try {
    const id = crypto.randomBytes(16).toString('hex');
    bots.salvarConfig(id, validar(req.body));
    await bots.iniciar(id);
    res.json({ id });
  } catch (e) { res.status(400).json({ erro: e.message }); }
});

app.get('/api/bots/:id', comBot((req, res, id) => res.json({ config: bots.lerConfig(id), ...bots.info(id) })));
app.put('/api/bots/:id', comBot((req, res, id) => { bots.salvarConfig(id, validar(req.body)); res.json({ ok: true }); }));
app.post('/api/bots/:id/ligar', comBot(async (req, res, id) => { await bots.iniciar(id); res.json({ ok: true }); }));
app.post('/api/bots/:id/codigo', comBot(async (req, res, id) => {
  try { res.json({ codigo: await bots.codigoPareamento(id, req.body.numero) }); }
  catch (e) { res.status(400).json({ erro: e.message }); }
}));
app.post('/api/bots/:id/desligar', comBot(async (req, res, id) => { await bots.parar(id); res.json({ ok: true }); }));
app.post('/api/bots/:id/sair', comBot(async (req, res, id) => { await bots.parar(id, true); res.json({ ok: true }); }));
app.delete('/api/bots/:id', comBot(async (req, res, id) => { await bots.apagar(id); res.json({ ok: true }); }));

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`🌐 CreatorZap rodando em http://localhost:${PORTA}`);
  bots.religarTodos();
});
