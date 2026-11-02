# Contrata Sul — RH Profissional (edição gratuita)

## Alterações desta versão
- Painel com espaços maiores, formulários por seções, filtros e pesquisa em vagas, candidatos, empresas, entrevistas e histórico.
- Pesquisa de candidato em entrevistas por nome, e-mail e vaga, com seleção por teclado e até 20 sugestões visíveis.
- Entrevistas com edição, conclusão, cancelamento, reabertura, duração, modalidade e responsável opcionais. Aviso se já existe entrevista próxima para o mesmo candidato.
- Empresas com CNPJ opcional, consulta voluntária pela BrasilAPI e preenchimento de razão social, nome fantasia, situação cadastral, abertura, CNAE, natureza jurídica, porte, endereço, bairro, CEP, cidade, UF, e-mail, telefone e website. Campo de observações internas.
- Vagas: pesquisa no admin, filtro por situação, duplicar como rascunho e sugestões de empresas existentes.
- Site público: busca por vagas tolerante a acentos e botão de compartilhar oportunidade.
- Backups completos incluem os novos campos de empresas e entrevistas, mantendo suporte a registros antigos.
- Nenhum serviço pago novo foi adicionado. O Firebase Spark e a BrasilAPI têm limites de uso e disponibilidade.

## FIRESTORE RULES — ATUALIZAÇÃO OBRIGATÓRIA
**SIM, é necessário PUBLICAR o `firestore.rules` novo.**
Ele autoriza os campos adicionais das coleções `empresas` e `entrevistas` somente para administradores já autorizados.
Não é necessário criar coleções manualmente. As coleções existentes e os dados anteriores permanecem.

Acesse https://console.firebase.google.com/project/contrata-sul/firestore/rules
1. Antes de publicar, exporte um backup completo pelo admin.
2. Abra o arquivo `firestore.rules` deste ZIP, copie todo o conteúdo e substitua as regras do console.
3. Clique em **Publicar** e aguarde a confirmação.
4. Publique os arquivos atualizados no seu GitHub Pages (ou Firebase Hosting).
5. Recarregue o navegador com `Ctrl + Shift + R`.
6. Teste: pesquisar candidato em Entrevistas; cadastrar empresa SEM CNPJ; consultar um CNPJ real; salvar empresa; agendar e editar entrevista; exportar backup.

**Importante:** as regras dependem de `admins/{UID}` com `active: true` para autorizar o login administrativo. Não há senha no código do site. Não publique uma chave JSON de serviço.

## Consulta de CNPJ
- A consulta usa `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` via navegador e requer acesso à internet.
- Apenas o CNPJ consultado é enviado à BrasilAPI; nenhuma informação de candidatos ou senhas é enviada.
- Pode haver erro de conexão, restrição CORS, limite (429), indisponibilidade ou dados desatualizados.
- O formulário nunca exige a consulta externa: todos os campos podem ser preenchidos manualmente e o CNPJ é opcional.
- Atualmente o validador aceita CNPJs **numéricos** de 14 dígitos; formatos alfanuméricos futuros exigem atualização.
- Confira as informações antes de salvar. Evite armazenar dados pessoais desnecessários no campo de notas.

## Backup
- Use a aba **Backup e restauração** para baixar as vagas e o backup completo com as outras coleções.
- O backup completo contém informações pessoais de candidatos. Armazene em local privado e protegido.
- A recuperação não restaura usuários do Firebase Authentication, arquivos, regras nem a configuração do Hosting.
- Backups são **manuais**. Não foi implantado backup automático em servidor.

## Custos
A atualização usa HTML, CSS, JavaScript, Firestore e Firebase Authentication, sem adicionar assinaturas pagas.
O plano Spark do Firebase oferece limites gratuitos: se ultrapassados, algumas operações podem parar. A BrasilAPI é gratuita, mas sujeita a disponibilidade e limites.

## Testes e limites
Os arquivos JavaScript passaram em verificação de sintaxe. Foram feitos testes automatizados de interface usando Firebase **simulado** em tamanhos de 1440, 390 e 320 pixels, incluindo filtros, escolha de candidatos, salvamento de empresas e entrevistas com dados fictícios e CNPJ simulado. Não houve erros JavaScript nesses testes.
**Não** foram executados testes contra seu Firebase real nem publicado o arquivo `firestore.rules` na sua conta. Teste em ambiente seguro antes de lidar com dados reais de candidatos.
Auditoria imutável no servidor, prevenção robusta de spam e backups automáticos exigem backend/infraestrutura adicional e não são prometidos nesta edição gratuita.
