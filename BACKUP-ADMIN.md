# Painel administrativo — Backup e restauração

Abra `admin.html` por HTTPS ou Live Server, entre com a conta autorizada e selecione **Backup e restauração**.

- **Baixar backup**: exporta as vagas (inclusive rascunhos) do Firestore em JSON. O arquivo inclui ID, campos e datas das vagas.
- **Restaurar vagas**: selecione um JSON gerado pelo painel, confira o resumo e confirme. Os registros com o mesmo ID são atualizados e os ausentes são criados. Registros existentes que não estão no backup não são apagados.
- A restauração ocorre em lotes de até 200 documentos. Se a conexão falhar, pode haver uma restauração parcial; verifique o status e tente novamente.
- O arquivo não inclui contas de usuário, senhas, regras do Firebase, configuração do Hosting ou arquivos/imagens.
- A exportação exige conexão ativa com Firestore e permissão de administrador. Teste uma restauração em um ambiente de testes antes de depender do backup em produção.
- Guarde os arquivos JSON em local privado: descrições e outros dados das vagas podem ser sensíveis.

O site não precisa de novas regras se o `firestore.rules` atual já autoriza o administrador a ler e gravar a coleção `vagas`.
