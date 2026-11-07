# Contrata Sul V7 — Correções de candidatura e pesquisa

## O que foi corrigido

1. **Candidatura não precisa de Firebase Authentication anônimo**. O erro `auth/admin-restricted-operation` vinha da tentativa de login anônimo desabilitado. O navegador grava a candidatura e o currículo em lote atômico no Firestore, sem criar conta.
2. **PDF/DOCX até 700 KB**. Validação do PDF aceita cabeçalho nos primeiros 1024 bytes; DOCX verifica a assinatura ZIP básica. Arquivos maiores precisam ser compactados; o limite de documento do Firestore é 1 MiB, e a codificação base64 aumenta o tamanho do arquivo.
3. **CRM: pesquisa de empresas agora mostra resultados clicáveis**, contagem e mensagem quando não encontra. Clique no resultado ou pressione Enter para abrir a ficha. A pesquisa ignora acentos e diferenças entre maiúsculas/minúsculas.
4. **Texto público profissional**, sem mencionar tecnologias de armazenamento.
5. **Instalação PWA**: não intercepta o banner nativo do navegador; inclui a meta tag mobile-web-app-capable.
6. O painel continua com **Baixar currículo**, **Visualizar PDF** e **Exportar ZIP**, e o backup JSON não inclui o conteúdo dos arquivos.

## Publicação — atenção

1. Faça backup do site, das Rules e dos dados antes de publicar.
2. Firebase Console → Firestore Database → **Regras**: substitua pelas regras do arquivo `firestore.rules` desta V7 e clique **Publicar**. **É obrigatório atualizar as Rules** para a candidatura pública funcionar.
3. Não é necessário habilitar login anônimo em Authentication. Você pode mantê-lo desabilitado.
4. Não é necessário usar Firebase Storage nem publicar Storage Rules.
5. No GitHub Pages, substitua **todos** os arquivos da pasta `contrata_sul_site` pelos novos, na raiz de `/contratasul/`. Não envie a pasta inteira como subpasta extra. Atualize o cache (Ctrl+Shift+R); o Service Worker usa uma nova versão.
6. Crie uma vaga fictícia publicada. Teste o envio de PDF e DOCX de até 700 KB, confira os registros em `candidaturas` e `curriculos`, e teste baixar e exportar pelo admin. Teste também a busca por empresa no CRM.
7. O arquivo `firestore.indexes.json` contém uma isenção de índice para `curriculos.contentBase64`; aplique-a se usar a Firebase CLI. Não é exigida para a criação dos documentos, mas reduz índices desnecessários.

## Privacidade, segurança e limites

- O acesso de leitura dos currículos continua **exclusivo a administradores ativos**. Visitantes podem apenas **criar** uma candidatura e seu currículo correspondente, nunca listar, ler, alterar ou excluir.
- Como a gravação pública dispensa login, ela pode sofrer **spam e esgotamento das cotas**. O site tem validações e um campo antirrobô simples, mas **isso não impede requisições automatizadas**. Recomenda-se configurar Firebase App Check e monitorar as cotas antes de receber candidaturas reais. Se você ativar App Check com enforcement, será necessário integrar a chave do provedor ao site antes de exigir essa verificação.
- Arquivos não passam por antivírus do servidor; não abra arquivos suspeitos.
- O Firestore no plano Spark tem limites gratuitos e não garante uso ilimitado. O envio pode falhar ao atingir a cota; **não exige habilitar o faturamento do Firebase Storage**.
- A implantação ainda requer teste com o seu projeto Firebase real. Testes locais usam simulações e não substituem a verificação após publicação.

## Arquivos

- `candidatar.js`, `resume-utils.js`, `candidatar.html`: candidatura.
- `crm-empresas.js`, `admin.html`, `v7-fixes.css`: pesquisa de empresas.
- `firestore.rules`: novas permissões públicas restritas de criação.
- `install-app.js`, `sw.js`: instalação e atualização do aplicativo web.
