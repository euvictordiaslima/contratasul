# Contrata Sul — Instalação Firebase

O ZIP inclui o site, painel `admin.html`, regras do Firestore e um script que configura automaticamente o administrador Beto **quando executado com uma credencial administrativa válida**.

**O que está pronto:** site e painel conectados ao projeto `contrata-sul`, coleção `vagas`, leitura pública apenas de vagas publicadas, autorização de administradores pelo UID, cadastro e edição no painel.

**O que não pode ser feito ao abrir o ZIP:** criar coleções protegidas, alterar Authentication ou publicar regras sem permissão na sua conta Firebase. O arquivo de configuração do Firebase no site não concede privilégios.

## Instalação inicial (uma vez)

1. No Firebase Console do projeto `contrata-sul`, ative Authentication > E-mail/Senha e Cloud Firestore `(default)`.
2. Confira que a conta Beto existe no Authentication com UID `0RJfc0qBd1VlT1ObDHsuIgH7Edo1` e que a senha é a mesma cadastrada lá. Não compartilhe sua senha.
3. Em Configurações do projeto > Contas de serviço, gere uma chave privada JSON, guardando-a **fora** desta pasta. Não envie nem publique essa chave.
4. Instale Node.js e abra o terminal na pasta do site. Execute `npm install`.
5. No PowerShell, defina `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\\caminho\\privado\\chave.json"` (substitua pelo caminho real).
6. Execute `npm run setup`. O script confere o UID no Authentication e cria/atualiza `admins/UID` e `loginAliases/beto`.
7. Execute `npx firebase login`, depois `npm run deploy` para publicar as regras e o site (Firebase CLI pode solicitar ativação do Hosting).

## Como entrar
Abra a URL HTTPS fornecida pelo Firebase Hosting e depois `/admin.html`. Use `Beto` e a senha cadastrada no Authentication. Não abra com `file://`.

## Diagnóstico
- `auth/invalid-credential`: confira o e-mail associado ao UID e a senha no Authentication.
- `permission-denied`: confira as regras publicadas e a coleção `admins`.
- `Usuário não configurado`: execute `npm run setup` e publique as regras.
- Se o navegador mostrar 400 no login, abra o console para ver o código do erro; 400 sozinho não identifica a causa.

## Segurança
`loginAliases/beto` expõe o e-mail técnico de login para permitir usuário+senha no cliente. Para privacidade maior, substitua esse fluxo por uma Cloud Function autenticada ou use e-mail+senha diretamente. Não publique o JSON da conta de serviço nem salve senhas no Firestore. O acesso de escrita é sempre validado por regras, não pelo botão da interface.
