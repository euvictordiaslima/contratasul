# Correção do login

O erro `permission-denied` ocorre **antes** da autenticação porque a consulta `loginAliases/beto` foi bloqueada. Esta versão oferece um caminho alternativo: digite **o e-mail real cadastrado no Firebase Authentication no mesmo campo Usuário ou e-mail**, com a senha da conta. Assim, a autenticação não depende de `loginAliases`.

Após autenticar, a conta ainda precisa estar autorizada no Firestore: `admins/0RJfc0qBd1VlT1ObDHsuIgH7Edo1` com `active` booleano `true`. Sem esse documento o acesso continuará bloqueado. As regras do Firestore não podem criar esse documento sozinhas.

Para voltar a entrar só com **Beto**, execute a configuração administrativa de `loginAliases/beto` e publique as regras adequadas. O login por e-mail é a alternativa para diagnosticar sem essa dependência.

O aviso de domínio OAuth no GitHub Pages se refere a login com redirecionamento/popup; não é a causa direta do erro `permission-denied` nem necessariamente do login por e-mail/senha. Para usar provedores OAuth, autorize o domínio em Authentication > Settings > Authorized domains.

**Não publique chaves de serviço.** Esta versão não concede privilégios automaticamente ao abrir a página, pois isso permitiria a qualquer visitante tornar-se administrador.
