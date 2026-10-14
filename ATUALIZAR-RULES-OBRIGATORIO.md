# ATENÇÃO — ATUALIZAR FIRESTORE RULES

**SIM, PRECISA ATUALIZAR AS RULES** para esta versão.

1. Abra o Console Firebase > Cloud Firestore > Regras, no projeto `contrata-sul`.
2. Substitua as regras pelo conteúdo de `firestore.rules` deste ZIP e publique.
3. Publique os arquivos do site e atualize com Ctrl+Shift+R.

## O que mudou
- CNPJ opcional (14 dígitos, com validação de dígitos verificadores no formulário).
- Exclusão definitiva de vagas somente por administradores com login recente. O painel solicita a senha da conta atual e usa `reauthenticateWithCredential` do Firebase.
- Senha **não está no JavaScript**, nem no Firestore. Não existe senha-mestra pública.
- A exclusão exige autenticação recente (5 minutos) nas regras.
- O backup agora inclui `cnpj`; backups antigos sem o campo continuam aceitos.

**Importante:** a reautenticação funciona com a senha atual da conta Firebase Authentication, não com uma senha arbitrária independente. Como a senha foi compartilhada na conversa, recomenda-se redefini-la.

Exclusões são irreversíveis sem um backup. Faça backup antes de excluir vagas.
