// Lógica pura do bot (sem WhatsApp) — decide qual resposta enviar.
const normalizar = (t) =>
  String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const preencher = (texto, cfg) =>
  String(texto).replace(/\{empresa\}/g, cfg.nomeEmpresa || '').replace(/\{bot\}/g, cfg.nomeBot || '');

function textoMenu(cfg) {
  const linhas = (cfg.menu || []).map((m) => `*${m.opcao}* - ${m.titulo}`);
  return `${preencher(cfg.boasVindas, cfg)}\n\nEscolha uma opção:\n${linhas.join('\n')}`;
}

function dentroDoHorario(cfg, agora = new Date()) {
  const h = cfg.horario;
  if (!h || !h.ativo) return true;
  if (!h.dias.includes(agora.getDay())) return false;
  const min = agora.getHours() * 60 + agora.getMinutes();
  const [hi, mi] = h.inicio.split(':').map(Number);
  const [hf, mf] = h.fim.split(':').map(Number);
  return min >= hi * 60 + mi && min < hf * 60 + mf;
}

function criarMotor(cfg) {
  const conversas = new Map(); // jid -> { visto: bool, pausadoAte: number }

  function pausar(jid, agora = new Date()) {
    const estado = conversas.get(jid) || { visto: true, pausadoAte: 0 };
    estado.pausadoAte = agora.getTime() + (cfg.pausaMinutos || 60) * 60000;
    conversas.set(jid, estado);
  }

  function responder(jid, texto, agora = new Date()) {
    const estado = conversas.get(jid) || { visto: false, pausadoAte: 0 };
    conversas.set(jid, estado);
    const msg = normalizar(texto);

    if (['bot', '#bot', 'voltar'].includes(msg)) {
      estado.pausadoAte = 0;
      return [textoMenu(cfg)];
    }
    if (estado.pausadoAte > agora.getTime()) return [];

    if (!dentroDoHorario(cfg, agora)) {
      if (estado.foraAvisado) return [];
      estado.foraAvisado = true;
      return [preencher(cfg.horario.mensagemFora, cfg)];
    }
    estado.foraAvisado = false;

    if (!estado.visto || ['menu', 'oi', 'ola', 'inicio', '0'].includes(msg)) {
      estado.visto = true;
      return [textoMenu(cfg)];
    }

    const item = (cfg.menu || []).find((m) => normalizar(m.opcao) === msg);
    if (item) {
      if (item.pausarBot) estado.pausadoAte = agora.getTime() + (cfg.pausaMinutos || 60) * 60000;
      return [preencher(item.resposta, cfg)];
    }

    const chave = (cfg.palavrasChave || []).find((k) =>
      k.contem.some((p) => msg.includes(normalizar(p)))
    );
    if (chave) return [preencher(chave.resposta, cfg)];

    return [preencher(cfg.naoEntendi, cfg)];
  }

  return { responder, pausar };
}

module.exports = { criarMotor, textoMenu, dentroDoHorario, normalizar };
