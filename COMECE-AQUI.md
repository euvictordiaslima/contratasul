# Contrata Sul — Central RH e CRM integrada (02/11/2026)

Esta edição usa **o projeto Firebase `contrata-sul`**, mantém o site público e o painel administrativo anteriores e cria uma **seção própria: CRM de empresas**. Não contém senha administrativa nem credenciais privadas. Não cria contas ou publica regras sem autorização de administrador da sua conta.

## 1. O que existe no painel

- **Visão geral:** indicadores de vagas, candidatos, entrevistas, atividades e acesso direto ao CRM.
- **Vagas:** cadastro, CNPJ opcional, pesquisa, filtros, duplicação, publicação, lixeira e recuperação.
- **Candidatos / Kanban:** pesquisa e acompanhamento por etapa, sem transformar automaticamente aprovação em contratação.
- **Empresas:** cadastro, busca, CNPJ sob demanda e botão **Abrir central da empresa** em cada ficha.
- **CRM de empresas (NOVO item no menu lateral):** seleção e pesquisa por empresa; situação comercial e responsável; resumo de vagas, candidaturas, entrevistas e atividades; vínculos de profissionais, contratações com data, desligados, solicitações, contatos, tarefas e histórico; funil por empresa; propostas, financeiro administrativo, controle de documentos (somente referências), avaliações e relatórios.
- **Relatórios:** exportação CSV e impressão/salvar como PDF pelo navegador, com números derivados dos registros existentes no Firestore.
- **Portal da empresa (NOVO `portal-empresa.html`):** acesso limitado por UID de uma conta existente no Authentication, permitindo consultar somente solicitações da empresa e vagas publicadas. **Não exibe dados pessoais de candidatos.**
- **Backups:** exportação de vagas e coleções-base pelo painel existente e **backup integral das coleções CRM** na seção CRM, em arquivos JSON. Importações em lotes; uma falha de rede pode deixar restauração parcial.

## 2. Como instalar

1. Faça backup da versão hospedada e dos dados existentes **antes** de publicar novas regras.
2. No projeto `contrata-sul`, vá em Cloud Firestore > **Regras**. Substitua todas as regras antigas pelo arquivo `firestore.rules` deste ZIP e clique em **Publicar**.
3. Envie **todos os arquivos** deste projeto para seu GitHub Pages (ou para Firebase Hosting), mantendo os caminhos relativos. Não envie apenas `admin.html`.
4. Atualize com `Ctrl + Shift + R`; se houver cache de hospedagem, aguarde a publicação estar disponível.
5. Abra `/admin.html`, entre com uma conta autorizada e clique no item **CRM de empresas** no menu lateral.
6. Cadastre uma empresa em **Empresas** caso ainda não exista. Depois clique em **Abrir central da empresa** ou selecione a empresa pela busca do CRM.
7. Teste com registros de exemplo: profissional em análise, contratação confirmada, contato, tarefa, solicitação, proposta, financeiro, impressão de relatório e exportação de backup. Não utilize dados reais até concluir os testes.

### É obrigatório atualizar as Rules?

**SIM.** O novo `firestore.rules` permite as coleções `crm_propostas`, `crm_financeiro`, `crm_documentos`, `crm_avaliacoes` e `portal_empresas` e restringe o acesso empresarial a registros da empresa autorizada. Não publique o site novo com Rules antigas.

## 3. Portal de empresas

O portal usa autenticação por e-mail e senha do Firebase, não permite criação de contas sem autorização e não entrega dados pessoais do RH.

Para habilitar um cliente:

1. Um administrador autorizado da sua conta Firebase cria uma conta própria para a empresa em **Authentication > Usuários** (senha forte, nunca salve no código) e copia o UID dessa conta.
2. No CRM, selecione a empresa, abra **Acesso da empresa**, cole o UID e salve a vinculação.
3. O cliente entra pela página `/portal-empresa.html` usando suas próprias credenciais.
4. Se necessário, suspenda o acesso pelo CRM. Não reutilize o login do administrador para clientes.

**Observação:** o painel não consegue criar usuários no Firebase Authentication usando apenas seu JavaScript público, pois isso exigiria credenciais privilegiadas no navegador.

## 4. Backup e recuperação

- No **CRM de empresas**, clique em **Baixar backup integral (JSON)**. Ele exporta CRM: vínculos, solicitações, contatos, tarefas, atividades, relacionamento, propostas, financeiro, documentos (referências) e avaliações.
- Para vagas, candidaturas, entrevistas, empresas e configurações, use **Backup e restauração** já existente (backup das coleções-base).
- Guarde **os dois arquivos** para recuperar o conjunto de dados do site. Mantenha cópias privadas protegidas, pois podem conter dados pessoais.
- Para restaurar CRM, importe o arquivo JSON compatível e confirme com a senha atual do administrador. IDs iguais serão atualizados, ausentes serão criados; não é uma operação transacional única entre todas as coleções.
- Contas do Authentication, Rules, Hosting e arquivos não são restaurados por JSON.

## 5. Limitações que não são resolvidas apenas com HTML/JS

- **Envio automático de e-mails**: disponível somente a abertura manual de e-mail pelo usuário (mailto). Nenhum envio automático é executado.
- **Upload seguro de contratos e currículos**: esta edição mantém apenas referências textuais internas, sem armazenamento de arquivos; solução com Storage exige configuração e pode exigir cobrança.
- **Backup automático em segundo plano** e **auditoria inviolável**: requerem serviços de backend agendados/confiáveis. Esta edição tem backup manual.
- **Criação automática de contas no Authentication**: não pode ser exposta ao navegador público de modo seguro.
- **Custo**: o código não contrata serviços pagos, mas o Firebase Spark possui limites; não há garantia de gratuidade ilimitada.
- **Segurança**: a página de candidatura pública ainda depende de proteção anti-spam mais forte no servidor antes de um lançamento com dados reais.

## 6. Conferência

- JavaScript revisado com `node --check`.
- Navegação e CRM testados em navegador simulado (desktop, celular) com dados fictícios, incluindo troca de abas, seleção de empresa, exibição de vagas e candidatos e preenchimento de propostas.
- Não houve acesso à conta Firebase real. **Antes da produção, valide permissões de admin e cliente, regras, criação/edição e restauração com registros fictícios.**

Caso apareça `permission-denied`, confirme a publicação das regras e se a conta administrativa tem documento `admins/{UID}` com `active: true` (booleano). Nunca coloque senhas ou chaves de serviço nos arquivos do site.
