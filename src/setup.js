// Assistente rápido: responde algumas perguntas e gera o config.json
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RAIZ = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.example.json'), 'utf8'));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const perguntar = (q, padrao) => new Promise((r) =>
  rl.question(`${q}${padrao ? ` [${padrao}]` : ''}: `, (a) => r(a.trim() || padrao || '')));

(async () => {
  console.log('\n🤖 CreatorZap — configuração rápida (Enter = usar o padrão)\n');
  cfg.nomeEmpresa = await perguntar('Nome da empresa', cfg.nomeEmpresa);
  cfg.nomeBot = await perguntar('Nome do bot', cfg.nomeBot);
  cfg.boasVindas = await perguntar('Mensagem de boas-vindas', cfg.boasVindas);

  if ((await perguntar('Criar seu próprio menu? (s/n)', 'n')).toLowerCase() === 's') {
    cfg.menu = [];
    for (let i = 1; ; i++) {
      const titulo = await perguntar(`Opção ${i} - título (vazio para terminar)`);
      if (!titulo) break;
      const resposta = await perguntar(`Opção ${i} - resposta`);
      const humano = (await perguntar('Essa opção chama um atendente humano? (s/n)', 'n')).toLowerCase() === 's';
      cfg.menu.push({ opcao: String(i), titulo, resposta, ...(humano && { pausarBot: true }) });
    }
  }

  if ((await perguntar('Ativar horário de atendimento? (s/n)', 'n')).toLowerCase() === 's') {
    cfg.horario.ativo = true;
    cfg.horario.inicio = await perguntar('Abre às (HH:MM)', cfg.horario.inicio);
    cfg.horario.fim = await perguntar('Fecha às (HH:MM)', cfg.horario.fim);
  }

  fs.writeFileSync(path.join(RAIZ, 'config.json'), JSON.stringify(cfg, null, 2));
  console.log('\n✅ config.json criado! Agora rode: npm start  (e escaneie o QR Code)\n');
  rl.close();
})();
