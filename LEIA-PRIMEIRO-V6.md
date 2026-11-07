> **Atualização V7:** este documento é histórico. Siga `LEIA-PRIMEIRO-V7-CORRECOES.md` para os procedimentos atuais.

# Contrata Sul V6 — Redesign + Currículos sem Firebase Storage

## O que mudou

- Site público com nova identidade visual em azul noturno e verde-menta, navegação e cartões redesenhados.
- Admin, candidatura e portal empresarial com interface atualizada, acessível e responsiva.
- Currículo PDF ou DOCX **obrigatório** para novas candidaturas, **até 350 KB**. E-mail continua opcional (exceto se escolher contato por e-mail); celular com DDD obrigatório.
- O currículo é codificado no navegador e gravado em **Firestore /curriculos/{idCandidatura}**, separado do registro `/candidaturas/{id}`. Os dois documentos são criados juntos em um **lote atômico**.
- O site público NÃO pode consultar os currículos; somente usuários ativos da coleção `admins` podem ler os arquivos.
- Admin → Candidatos: **Baixar currículo**, **Visualizar PDF** (DOCX apenas download) e **Exportar currículos ZIP**.
- Exclusão administrativa de candidatura V6 apaga registro e arquivo privado no mesmo lote, após confirmação de senha e checagem de dependências.
- Não há chamadas a Firebase Storage, não há bucket nem arquivo `storage.rules`.

## Publicação (obrigatória)

1. Faça backup do site e das regras antigas antes de substituir qualquer arquivo.
2. Firebase Console → Firestore Database → **Regras**: cole e **publique** o arquivo `firestore.rules` desta V6.
3. Firebase Console → Authentication → **Sign-in method**: habilite **Anônimo** para candidaturas sem conta. O login de administrador continua separado.
4. Publique todos os arquivos desta pasta no repositório do GitHub Pages (raiz do site `/contratasul/`).
5. Limpe o cache da página com Ctrl+Shift+R; o Service Worker público tem versão nova. O APK WebView existente deve refletir a atualização do site publicado.
6. Crie uma vaga de teste, envie um PDF fictício com menos de 350 KB e confirme o recebimento no Admin → Candidatos. Teste também baixar, visualizar, exportar ZIP e excluir com senha.
7. Se usar Firebase CLI, o comando `npm run deploy` publica Hosting e Rules e a isenção de índice. Para GitHub Pages, a publicação é feita no repositório; **as Rules são publicadas no Firebase Console separadamente**.

## Sem cartão de crédito: limitações

O Firestore no plano Spark tem cotas gratuitas de armazenamento, leituras e gravações. O envio de arquivos em base64 consome mais espaço que o PDF original. **Não há garantia de uso ilimitado nem de que o serviço continue disponível após atingir as cotas.** O limite de 350 KB por arquivo é intencional para respeitar o limite de 1 MiB por documento e reduzir o consumo.

O arquivo `firestore.indexes.json` inclui uma isenção de índice para `curriculos.contentBase64`, recomendada para economizar armazenamento de índices. É uma otimização opcional para o funcionamento básico e pode ser aplicada via Firebase CLI.

## Segurança e privacidade

- Somente administradores ativos podem ler os currículos; candidatos anônimos podem **criar**, mas não listar, ler, atualizar ou apagar os arquivos.
- As Rules exigem que os metadados de candidatura e currículo correspondam, com criação em lote.
- Verificação de PDF/DOCX no navegador é básica, **não substitui antivírus no servidor**. Não abra arquivos suspeitos e mantenha dispositivos atualizados.
- É possível ocorrer abuso de cadastros anônimos. Configure monitoramento de cotas, proteção contra abuso e, quando viável, Firebase App Check; não é possível prometer antispam total com um site estático.
- O PDF pode ser visualizado em janela privada no admin, mas o download/backup contém dados pessoais: controle acesso, retenção e pedidos de exclusão.
- Arquivos da V5 no Storage não são migrados automaticamente. O admin informa que esses currículos antigos exigem migração manual.

## Backups

O backup JSON não contém os arquivos dos currículos. Exporte os currículos separadamente no ZIP da aba Candidatos. **Restauração automática de arquivos ZIP não está incluída**; não trate um JSON como backup integral de currículos.

## Validação

O projeto foi testado com simulação de envio, codificação/decodificação de PDF, validação de limites, testes de navegação e responsividade. **Ainda não foi testado com o seu Firestore real nem com um dispositivo Android real.**
