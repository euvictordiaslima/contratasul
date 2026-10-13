# Configuração do Beto — Contrata Sul

**Corrigido:** campo de usuário sem `pattern` inválido e login por usuário `Beto` vinculado ao e-mail real da conta Firebase Authentication. A senha permanece somente no Firebase Authentication.

## Uma única configuração com permissão de administrador

1. No Console Firebase do projeto `contrata-sul`, ative Authentication > E-mail/Senha e Firestore.
2. Em Configurações do projeto > Contas de serviço, gere a chave privada e guarde-a **fora da pasta pública** do site. Nunca publique ou envie essa chave.
3. Abra um terminal na pasta do projeto e execute `npm install`.
4. No PowerShell, configure `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\chave.json"` (ajuste o caminho).
5. Execute `npm run autorizar-beto`. O script confirma que o UID `0RJfc0qBd1VlT1ObDHsuIgH7Edo1` existe e cria `admins/<UID>` e `loginAliases/beto` com o e-mail da conta. Não cria ou troca senhas.
6. Publique as regras do arquivo `firestore.rules` na aba Firestore > Regras. Elas permitem consultar apenas o alias de login e impedem visitantes de modificá-lo.
7. Abra o site por HTTP(S), não `file://`, e entre no `admin.html` como **Beto** com a senha da conta no Authentication.

**Não é possível criar permissões administrativas apenas abrindo uma página web ou editando regras:** é preciso autorizar a operação com credenciais administrativas do projeto. Nenhuma alteração foi realizada diretamente na sua conta Firebase.
