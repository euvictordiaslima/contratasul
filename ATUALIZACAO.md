# Contrata Sul — Atualização do painel

## Correção do erro “Data inválida”
A exportação aceita datas do Firestore e registros antigos sem datas. Valores de data inválidos são ignorados no backup em vez de bloquear toda a exportação.

## Restauração segura
Ao importar um backup, o painel consulta os documentos existentes e preserva o campo `createdAt` original, conforme exigido pelas regras atuais. Vagas ausentes são criadas, e vagas existentes são atualizadas. O processo não exclui vagas. As gravações são feitas em lotes e podem ser parciais se ocorrer uma falha de rede.

## Segurança
O backup é um JSON com dados de vagas, incluindo rascunhos. Não inclui senhas, usuários, regras ou configuração do Firebase. Guarde-o em local privado. Teste restauração primeiro em um ambiente de testes.

## Firestore Rules
**NÃO PRECISA ATUALIZAR AS RULES**, desde que você esteja usando as regras do projeto anterior, com administradores autorizados a ler e gravar `vagas`. Esta atualização não exige novas coleções nem permissões.

## Publicação
Substitua os arquivos no GitHub Pages ou hospedagem atual e faça uma atualização forçada (Ctrl+Shift+R). Não abra via file://. O login depende de Firebase Authentication e da coleção admins já configurados.

## Testes
O JavaScript passou na verificação de sintaxe. Exportação, restauração e responsividade precisam ser testadas no navegador conectado ao Firebase real.
