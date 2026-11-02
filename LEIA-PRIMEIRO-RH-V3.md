# Contrata Sul — RH V3: Candidatura por celular e pesquisa em todas as listas

## O que mudou nesta versão

- Candidatos podem se inscrever em `candidatar.html?vaga=<ID>` usando **nome e celular com DDD**, sem e-mail. Um e-mail é exigido apenas se a pessoa escolher **E-mail** como contato preferido.
- Contato preferido: WhatsApp, ligação telefônica ou e-mail. O sistema armazena a preferência no documento da candidatura, mas **não envia WhatsApp ou SMS automaticamente**.
- Administração: atalhos de ligação/WhatsApp nas fichas de candidatos e profissionais vinculados; contatos empresariais podem ser acessados por telefone/WhatsApp.
- Busca e filtros: candidaturas, entrevistas, vagas, empresas, 12 áreas CRM, listas de visão geral, funil, atividades recentes, lixeira e perguntas frequentes do site. As buscas nessas listas ocorrem no navegador, sem requisições novas a cada tecla.
- Filtro por etapa na gestão de candidatos e exportação de candidaturas para CSV (restrita a administradores).
- Formulário de candidatura com visual específico, adaptado a celular; ajustes de contraste e espaço no admin e no site.
- Backups completos de vagas/candidaturas passam a levar `contactPreference` e preservam compatibilidade com candidaturas antigas.

## FIRESTORE RULES — ATUALIZAÇÃO OBRIGATÓRIA

**SIM: publique o novo `firestore.rules`.** As regras precisam aceitar `contactPreference` e candidaturas com `email: ''` quando o celular é informado. Sem isso, o formulário poderá retornar `permission-denied`.

1. Exporte um backup antes da atualização.
2. No projeto `contrata-sul` do Firebase Console, abra **Firestore > Regras** do banco `(default)`.
3. Substitua o conteúdo anterior por `firestore.rules` deste ZIP e clique em **Publicar**.
4. Publique **todos os arquivos** do site atualizados na hospedagem (GitHub Pages ou Firebase Hosting). Não basta atualizar só o HTML.
5. Pressione Ctrl+Shift+R no navegador. Abra uma vaga publicada, candidate-se com um número de teste e sem e-mail; verifique a candidatura no painel.
6. Teste a busca por telefone no módulo de candidatos e no CRM, além das demais pesquisas.

## Segurança e privacidade

- As candidaturas não podem ser listadas publicamente: somente administradores autorizados podem lê-las.
- Os atalhos para ligação e WhatsApp **apenas abrem o aplicativo correspondente**; nunca enviam mensagens automaticamente.
- Os arquivos CSV contêm dados pessoais: guarde-os em pasta protegida e restrinja o compartilhamento.
- O campo invisível no formulário é só um obstáculo básico para bots. **Não substitui medidas de segurança no servidor** (App Check, limitações e análise de abuso).
- Esta entrega não cria usuários nem altera permissões de administradores.
- **Nenhum serviço novo pago foi adicionado**, mas continuam valendo os limites do plano Firebase utilizado.

## Limitações e testes

- Os scripts JavaScript foram verificados sintaticamente.
- Testes simulados de navegação/pesquisa e envio por telefone passaram nas larguras 1440, 390 e 320 pixels.
- Esses testes **não validam operações no seu banco Firebase real** nem asseguram ausência completa de bugs.
- A validação das novas Firestore Rules com as credenciais reais do projeto e o teste com uma candidatura fictícia devem ser realizados antes do uso em produção.
- Os backups de candidatos contêm dados pessoais; o sistema não faz backup automático de contas do Authentication nem de regras.
