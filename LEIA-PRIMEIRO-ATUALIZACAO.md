# Contrata Sul — Mídias administráveis, exclusões e app para celular

## O que foi implementado

- **Mídias do site:** nova aba no admin para inserir, editar, ocultar, reordenar e excluir imagens de publicidade e materiais institucionais, apenas por URL HTTPS. Não é necessário alterar HTML para trocar imagens.
- **Site público:** duas seções alimentadas em tempo real pela coleção `midia_site`: **Propagandas e destaques** e **Materiais da Contrata Sul**. Carrosséis automáticos a cada 3 segundos, com controles, swipe e suporte a movimento reduzido. Quando não há imagens cadastradas, aparece um estado vazio (não imagens fictícias).
- **Exclusões protegidas:** nova aba **Exclusões** com busca por coleção, confirmação pela senha atual do administrador, checagem de vínculos para empresas/candidaturas e histórico de operação. Também existem atalhos de exclusão próximos a diversos cadastros.
- **Vagas:** a exclusão preexistente continua encaminhando vagas para a lixeira, com recuperação e reautenticação.
- **Aplicativo apenas para celular:** o site público tem PWA com manifesto, ícones, serviço de cache apenas estático e instalação no Android e na Tela de Início do iPhone. Admin e portal de empresa permanecem páginas web e não têm instaladores separados.
- **Backup completo:** passa a incluir também `midia_site`, para exportar e restaurar os links e sua ordem. Contas, senhas e Rules não são exportadas.

## PUBLICAÇÃO — Firestore Rules: SIM, PRECISA ATUALIZAR

1. Faça um backup do site e dos dados atuais.
2. Abra Firebase Console > Firestore > banco `(default)` > **Regras**.
3. Substitua o conteúdo do editor pelo `firestore.rules` incluído nesta versão e clique em **Publicar**.
4. Publique **todos os arquivos** deste ZIP na mesma raiz do GitHub Pages ou Firebase Hosting. Não envie apenas `admin.html`.
5. Atualize a página com Ctrl+Shift+R. Abra o admin e verifique as abas **Mídias do site** e **Exclusões**.
6. Cadastre uma imagem HTTPS em cada categoria; confirme a aparição no site público. Use links diretos de imagens (JPG, PNG ou WebP), não links de páginas comuns.
7. Teste em ambiente de teste uma exclusão e a recuperação por backup. Antes de excluir empresas/candidatos reais, confira dependências.

## Como excluir com segurança

- Na aba **Exclusões**, escolha a coleção e pesquise por nome, telefone, CNPJ ou outro campo. Clique **Excluir**, insira a senha **atual** da conta Firebase e confirme.
- Para **empresas** ou **candidaturas**, o painel bloqueia a operação se encontrar vagas, vínculos, entrevistas ou outros documentos dependentes. Primeiro encerre/remova os vínculos pertinentes.
- **Vagas** usam lixeira, não exclusão definitiva por esta nova central.
- **Histórico de auditoria, contas administrativas, configuração essencial e usuários do Firebase Authentication** não podem ser excluídos por esta interface. Essa restrição é proposital.
- Excluir permanentemente os demais registros não permite desfazer com um botão; faça backup antes.
- A proteção de vínculos é uma verificação do painel e não substitui transações de backend para múltiplos usuários operando simultaneamente.

## Informações e limites importantes

- URLs HTTPS externas podem falhar, bloquear carregamento por hotlink ou monitorar visitantes. Prefira um serviço confiável e imagens para as quais tenha autorização.
- O PWA instala **via navegador** (HTTPS), não é APK nem aplicativo publicado em lojas. No Android, Chrome > Instalar aplicativo; no iPhone, Safari > Compartilhar > Adicionar à Tela de Início.
- O aplicativo pode exibir alguns elementos públicos sem internet depois de instalado, porém vagas, candidaturas, anúncios administráveis e login precisam de conexão.
- O Firebase continua sujeito às cotas gratuitas. Não foram adicionados serviços pagos obrigatórios.
- **Testes:** sintaxe JS, navegação e renderização com dados simulados em desktop e mobile. Não foi possível autenticar e gravar no seu Firebase real ou publicar as Rules por você.
- A senha do administrador nunca foi escrita nos arquivos do projeto. Se ela já foi compartilhada, é prudente redefini-la no Firebase Authentication.
