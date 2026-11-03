# 🤖 CreatorZap

Crie um bot de WhatsApp automático em **1 minuto**. Configura rapidinho e já era.

## Como usar

```bash
npm install
npm run setup   # responde umas perguntas e gera o config.json
npm start       # mostra um QR Code — escaneie no WhatsApp > Aparelhos conectados
```

Pronto, seu bot está no ar. A sessão fica salva na pasta `auth/`, então não precisa escanear de novo.

## O que o bot faz

- 👋 **Boas-vindas + menu** numerado na primeira mensagem (ou quando digitam `menu` / `oi`)
- 🔢 **Respostas por opção** (1, 2, 3…)
- 🔑 **Palavras-chave** (ex.: "preço", "pix") — ignora acentos e maiúsculas
- 🕘 **Horário de atendimento** com mensagem automática fora do horário
- 🙋 **Passa para humano**: opção com `"pausarBot": true` pausa o bot nessa conversa
- ✋ **Pausa automática** quando você responde manualmente pelo celular; digite `#bot` para reativar
- ⌨️ Simula "digitando..." antes de responder
- 👥 Ignora grupos (configurável)

## Configuração avançada

Edite o `config.json` direto (veja `config.example.json`). Use `{empresa}` e `{bot}` nos textos.

| Campo | Para quê |
|---|---|
| `menu` | Opções numeradas e suas respostas |
| `palavrasChave` | `contem`: lista de palavras → `resposta` |
| `horario` | `ativo`, `dias` (0=domingo), `inicio`, `fim`, `mensagemFora` |
| `pausaMinutos` | Quanto tempo o bot fica pausado após atendimento humano |
| `responderGrupos` | `true` para responder em grupos |

Após editar, reinicie com `npm start`.

> ⚠️ Usa o WhatsApp Web (biblioteca Baileys), não a API oficial. Use com bom senso — envio em massa/spam pode banir o número.
