# Login Beto — Contrata Sul

O erro “Usuário inválido” foi corrigido no formulário. **O login Beto só pode funcionar se estiver vinculado ao e-mail real da conta no Firebase Authentication.** O código não tem acesso privilegiado à sua conta Firebase, então não pode criar ou alterar usuários remotamente sozinho.

## Teste imediato (sem configuração adicional)

1. Publique os arquivos deste ZIP no mesmo endereço em que abre o painel. Não misture com versões anteriores.
2. Abra `admin.html` com HTTPS ou Live Server, e atualize com Ctrl+Shift+R.
3. No campo de usuário, digite **o e-mail da conta Beto no Firebase Authentication** (em vez de Beto). Digite a senha cadastrada. Se a conta estiver autorizada na coleção `admins`, o painel abrirá.
4. Se funcionar com e-mail, o problema é só o mapeamento do apelido. Para usar `Beto` sem digitar e-mail, execute a configuração abaixo.

## Configurar Beto automaticamente (uma única vez)

- A conta Beto deve existir em Firebase Authentication, com UID `0RJfc0qBd1VlT1ObDHsuIgH7Edo1`.
- Ative Firestore `(default)` e Authentication E-mail/Senha.
- Gere a chave da conta de serviço em Firebase Console > Configurações do projeto > Contas de serviço. **Guarde-a fora da pasta do site e nunca compartilhe a chave**.
- Abra terminal na pasta do site e execute `npm install`.
- No PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\privado\chave.json"` (substitua pelo caminho real).
- Execute `npm run setup`. Isso verifica o UID, cria `admins/UID` com `active: true` e gera `admin-login-config.js` com o e-mail real, sem senha.
- Publique `firestore.rules` e os arquivos atualizados usando `npx firebase login` e `npm run deploy`, ou publique o site no GitHub Pages e as regras pelo Firebase Console.

O arquivo `admin-login-config.js` contém o e-mail de login e não a senha. **Não coloque senhas no HTML/JS ou Firestore**.

Se receber `auth/invalid-credential`, redefina a senha da conta no Firebase Authentication; regras do Firestore não corrigem esse erro.

## Domínio autorizado

Se utilizar métodos OAuth, adicione seu domínio GitHub Pages em Firebase Authentication > Settings > Authorized domains. Para login simples por e-mail/senha, o aviso sobre popup OAuth não é necessariamente a causa do problema.
