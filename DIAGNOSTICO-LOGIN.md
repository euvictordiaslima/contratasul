# Login Beto — verificação

O erro `pattern` não está no `admin.html` deste ZIP: o campo não possui atributo `pattern`. Se o navegador ainda mostrar esse erro, ele está carregando uma cópia antiga. Extraia o ZIP em pasta nova, reinicie o servidor e use Ctrl+Shift+R.

Erro HTTP 400 em `signInWithPassword` significa que o Firebase Authentication rejeitou a solicitação. **Regras do Firestore não resolvem esse erro.**

1. Confirme que o Authentication tem E-mail/Senha habilitado.
2. Confirme que o UID do usuário Beto é `0RJfc0qBd1VlT1ObDHsuIgH7Edo1`.
3. Execute `npm run setup` com uma credencial administrativa segura, conforme `CONFIGURAR.md`, para criar `loginAliases/beto` com o e-mail REAL da conta e `admins/UID` com `active: true`.
4. Se a conta já existe mas o login continua retornando `auth/invalid-credential`, redefina a senha no console Authentication; o script não define nem recupera senhas.
5. Abra `/admin.html` pelo servidor HTTP/HTTPS, nunca `file://`.

O painel agora mostra o código de erro para facilitar o diagnóstico. Não compartilhe senhas nem arquivos JSON de contas de serviço.
