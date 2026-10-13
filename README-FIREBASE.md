# Contrata Sul — instalação Firebase

O código está integrado ao projeto `contrata-sul`, mas **não ativa serviços nem publica regras automaticamente**.

1. No Firebase Console, projeto `contrata-sul`, ative **Firestore Database** em modo de produção.
2. Em **Authentication > Sign-in method**, ative **Email/Password**. Em **Users**, crie a conta administrativa com senha forte.
3. Copie o **UID** dessa conta em Authentication > Users.
4. Em Firestore > Data, crie a coleção `admins`, com um documento cujo **ID é o UID** copiado e o campo booleano `active` igual a `true`. Faça isso **somente pelo console**; a aplicação não pode criar administradores.
5. Em Firestore > Rules, publique o conteúdo de `firestore.rules`. **Não use regras abertas de teste.**
6. Em Authentication > Settings > Authorized domains, autorize o domínio do site (ou o domínio Firebase Hosting). Não exponha `admin.html` em `file://`; execute em um servidor HTTP/HTTPS.
7. Para publicar via Firebase CLI: `npm install -g firebase-tools`, `firebase login`, `firebase use contrata-sul`, `firebase deploy --only firestore:rules,hosting`. Antes, confira as regras e o projeto escolhido.
8. Acesse `/admin.html` e entre com o usuário autorizado. Cadastre vagas; somente as marcadas **Publicar no site** aparecem para visitantes.

**Segurança:** o arquivo `firebase-config.js` contém identificadores públicos normais do SDK web, não uma senha administrativa. A proteção real está no Authentication e nas regras do Firestore. Nunca publique chaves privadas de conta de serviço. O site não coleta currículos: o botão de candidatura abre o WhatsApp. O painel gerencia vagas, não o conteúdo geral do site. A primeira configuração requer acesso à conta Firebase. Teste o fluxo de permissões antes de publicar.


## Login por usuário e senha

O formulário administrativo agora solicita **usuário e senha**. O Firebase Authentication autentica internamente com e-mail/senha, usando um identificador técnico que o visitante não vê: `usuario@admin.contrata-sul.invalid`.

Para criar uma conta, no Firebase Console > Authentication > Users > Add user, use, por exemplo, `gestor@admin.contrata-sul.invalid` como e-mail e uma senha forte. No painel, digite somente `gestor` e a senha. Depois, copie o UID dessa conta e crie `admins/{UID}` no Firestore com `active: true`, conforme as instruções anteriores. Não é necessário criar um e-mail real ou caixa postal para esse identificador. O endereço técnico não recebe mensagens de recuperação; a redefinição de senha deve ser feita pelo administrador no Firebase Console.

Use nomes de usuário exclusivos de 3 a 32 caracteres com letras, números, ponto, sublinhado ou hífen. O formulário converte letras maiúsculas em minúsculas. Não coloque credenciais no código do site.


## Regras prontas para publicar

O arquivo `firestore.rules` deste pacote é a versão revisada. Ele permite que visitantes leiam apenas vagas publicadas e que somente contas com documento `admins/{UID}` e `active: true` criem ou editem vagas. Ninguém pode criar administradores ou excluir vagas pelo site.

**Para aplicar:** Firebase Console → Firestore Database → Rules → substitua todo o conteúdo pelo arquivo `firestore.rules` → Publish. Isso publica as regras, não cria o banco automaticamente.

**Antes de entrar:** ative Authentication → Email/Password, crie uma conta `seuusuario@admin.contrata-sul.invalid` e sua senha, copie o UID dessa conta, e no Firestore crie a coleção `admins`, documento com ID igual ao UID, campo `active` do tipo **boolean** com valor `true`. O painel recebe apenas `seuusuario` e a senha.

**Teste:** visitante pode ver vagas com `published: true`, mas não pode gravar nem ler rascunhos; administrador autorizado pode criar e editar vagas; administrador não autorizado não pode modificar nada. A consulta pública deve filtrar `published == true` (já implementado).

**Atenção:** as regras não são um substituto para ativar os serviços, configurar os domínios autorizados e hospedar o site. Não é possível publicar as regras na sua conta apenas gerando este ZIP.
