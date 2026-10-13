# Criar administrador no Firebase

O login do painel aceita **Beto** como usuário. A senha deve ter no mínimo 6 caracteres. Por segurança, informe-a apenas no terminal durante a configuração; ela não é armazenada nos arquivos do site. Nenhuma senha é colocada no código público.

1. No Firebase Console, habilite **Authentication > Sign-in method > Email/Password** e crie o **Cloud Firestore**.
2. Publique as regras em `firestore.rules`.
3. Em **Configurações do projeto > Contas de serviço**, gere uma chave privada de conta de serviço e guarde-a fora da pasta pública do site. **Nunca envie essa chave nem faça upload dela para a hospedagem.**
4. Em um terminal na pasta do projeto, execute `npm install`.
5. Configure a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` com o caminho completo do JSON privado.
6. Execute `npm run criar-admin` e informe uma senha de pelo menos 6 caracteres. O script cria/atualiza o usuário de autenticação e a autorização em `admins/{uid}`.
7. Abra `admin.html` por HTTPS ou servidor local, não por `file://`, e entre com usuário `Beto` e a senha criada.

**Observação:** este arquivo é um script de provisionamento, não cria nada na sua conta até você executá-lo com credenciais autorizadas. Não publique `criar-admin.mjs`, `package.json`, `node_modules` nem a chave de serviço na hospedagem. Para produção, escolha uma senha longa e exclusiva.
