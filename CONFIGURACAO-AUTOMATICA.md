# Autorizar Beto automaticamente

O script `autorizar-beto.mjs` verifica a conta já criada no Firebase Authentication e cria ou atualiza o documento `admins/0RJfc0qBd1VlT1ObDHsuIgH7Edo1` com `active: true` e `username: beto`. Ele não altera a senha nem cria uma nova conta.

## Executar uma única vez

1. No Firebase Console do projeto **contrata-sul**, vá em Configurações do projeto > Contas de serviço > Gerar nova chave privada. Guarde o arquivo JSON fora da pasta do site. Não envie nem publique a chave.
2. Ative Cloud Firestore (banco `(default)`) e Authentication se ainda não estiverem ativados.
3. Abra o terminal na pasta `contrata_sul_site` e execute `npm install`.
4. No PowerShell, configure `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\\caminho\\seguro\\chave.json"` substituindo pelo caminho real.
5. Execute `npm run autorizar-beto`.

O resultado será a coleção `admins` com o documento do UID. **A criação só ocorre quando você executa o script com a chave de serviço**; abrir o site no navegador não pode conceder privilégios administrativos com segurança.

## Atenção ao login por nome de usuário

O `admin.js` atual converte `Beto` em `beto@admin.contrata-sul.invalid`. Isso só funciona se o e-mail da conta criada no Authentication for exatamente esse. Se você criou Beto com outro e-mail, o login não funcionará até corrigir esse mapeamento. Não coloque senha no JavaScript.

## Regras

Publique `firestore.rules` no Console do Firebase antes de usar o site. O script usa o SDK administrativo, portanto não depende das regras do navegador.
