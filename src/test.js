const assert = require('assert');
const cfg = require('../config.example.json');
const { criarMotor } = require('./engine');

const { responder, pausar } = criarMotor(cfg);
const j = 'x@s.whatsapp.net';
assert.match(responder(j, 'qualquer coisa')[0], /Escolha uma opção/);
assert.match(responder(j, '2')[0], /Rua Exemplo/);
assert.match(responder(j, 'qual o PREÇO?')[0], /tabela de preços/);
assert.match(responder(j, 'xyz')[0], /Não entendi/);
assert.match(responder(j, '3')[0], /atendente/);
assert.deepStrictEqual(responder(j, 'oi'), []); // pausado
assert.match(responder(j, 'bot')[0], /Escolha/);   // reativado
pausar(j);
assert.deepStrictEqual(responder(j, 'menu'), []);

const fora = criarMotor({ ...cfg, horario: { ...cfg.horario, ativo: true } }).responder;
const domingo = new Date('2026-11-01T12:00:00');
assert.match(fora(j, 'oi', domingo)[0], /fora do horário/);
assert.deepStrictEqual(fora(j, 'oi', domingo), []);
console.log('✅ Todos os testes passaram');
