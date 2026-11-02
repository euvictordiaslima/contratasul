# Contrata Sul — CRM de Empresas

## O que foi acrescentado

Na seção **Empresas**, selecione uma empresa cadastrada em **Central da empresa** para abrir: situação comercial, contatos e responsáveis, solicitações de contratação, profissionais vinculados, histórico de admissões/desligamentos, tarefas, anotações, indicadores e relatório CSV. O registro de contratação exige confirmação explícita e data de admissão. Candidatos são vinculados à empresa pela vaga correspondente quando possível; isso não significa contratação.

## Instalação

1. **Faça backup do Firestore antes de publicar.**
2. Publique o arquivo `firestore.rules` deste pacote no projeto Firebase `contrata-sul` (Firestore `(default)`). **É obrigatório atualizar as Rules.**
3. Substitua todos os arquivos hospedados, incluindo `crm-empresas.js`, `admin.html` e `admin.css`.
4. Atualize o navegador com Ctrl+Shift+R e abra Admin → Empresas → Central da empresa.
5. Cadastre uma empresa de teste, um contato, uma solicitação, uma tarefa, uma anotação e um vínculo de candidato. Confira as gravações no Firestore.
6. Teste a exportação CSV e o backup/restauração CRM em ambiente de testes antes de utilizar dados reais.

## Novas coleções

`crm_relacionamentos`, `crm_contatos`, `crm_solicitacoes`, `crm_vinculos`, `crm_tarefas`, `crm_atividades`. Os documentos são criados automaticamente ao salvar o primeiro registro. Não é necessário criar as coleções manualmente.

## Segurança e limites

- Leitura e escrita das novas coleções são restritas a contas ativas da coleção `admins`. Os dados de candidatos não ficam públicos.
- As atividades não podem ser apagadas pelo cliente. Porém, **não são uma trilha de auditoria imutável no servidor**.
- O backup JSON do CRM inclui dados pessoais. Armazene-o de forma privada e protegida. A restauração pede novamente a senha do administrador, pode ser parcial se a conexão falhar e não apaga registros ausentes.
- O backup antigo da Suite não inclui as novas coleções CRM. Use também o botão **Backup CRM (JSON)**.
- O CRM não envia e-mails, não gera PDFs, não armazena documentos ou arquivos e não cria contas próprias de empresas. Essas funcionalidades exigem trabalho adicional e, dependendo do volume e do serviço escolhido, podem gerar custos.
- Não foi possível validar a publicação das Rules nem executar operações na sua conta Firebase real. Não há garantia de ausência de bugs sem testes de integração e segurança em produção.
- Não armazene dados sensíveis desnecessários e estabeleça prazos de retenção e procedimentos de acesso/exclusão conforme a LGPD.
