# Rodar no celular Android (grátis, sem PC)

1. Instale o **Termux** pelo F-Droid: https://f-droid.org/packages/com.termux/ (a versão da Play Store é antiga e dá erro).
2. Abra o Termux e cole, um por vez:
```
pkg update -y && pkg install -y nodejs git
git clone -b claude/whatsapp-bot-creator-3w1yat https://github.com/otavianobitencourt2011-eng/creatorzap
cd creatorzap
npm install
npm start
```
3. Abra o Chrome em **http://localhost:3000**, monte o bot e toque em **Criar meu bot**.
4. Em "Conecte por código", digite o número do WhatsApp do bot (ex: 5511999998888) e toque em **Gerar código**.
5. No WhatsApp: **Aparelhos conectados → Conectar aparelho → Conectar com número de telefone** e digite o código.

Pronto! Para testar, mande mensagem de **outro número** para o número do bot.

Dicas:
- Deixe o Termux aberto. Na notificação do Termux, toque em **Acquire wakelock** para o Android não matar o bot.
- Para ligar de novo depois: abra o Termux, `cd creatorzap` e `npm start`.
