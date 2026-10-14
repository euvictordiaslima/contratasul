# ATENÇÃO — PUBLICAR AS NOVAS RULES

Esta versão exige atualização de `firestore.rules`. Acesse Firebase Console → Cloud Firestore → Regras, substitua o conteúdo pelo arquivo `firestore.rules` deste ZIP e clique em Publicar. Faça isso antes de testar candidaturas e o painel novo.

Novas coleções: `candidaturas`, `empresas`, `entrevistas`, `configuracoes`, `historico`. Não crie manualmente: os primeiros documentos são criados pelos formulários quando houver autorização. A coleção `admins` e o login existente continuam necessários.

O formulário público permite enviar candidatura sem conta. O banco restringe a criação a vagas publicadas, campos específicos e consentimento. Leituras de dados pessoais são exclusivas de administradores. Para produção, considere App Check, proteção anti-spam e uma política de privacidade/LGPD; regras sozinhas não impedem abuso ou excesso de submissões.

## Backup

O backup anterior de vagas permanece disponível. O botão "Exportar backup completo" exporta vagas, empresas, candidaturas, entrevistas, histórico e configurações. **O backup completo ainda não oferece restauração integral automática** nesta versão. A restauração automática da aba cobre somente vagas. Contas do Authentication, permissões, regras e arquivos não são exportados.

## Hospedagem

Envie todos os arquivos para o GitHub Pages/Firebase Hosting e atualize sem cache. A página `candidatar.html` é pública. O Firebase deve estar configurado para o mesmo projeto. Nunca publique chaves de serviço.

## Verificação

O código foi validado quanto à sintaxe JavaScript. As operações com Firestore, regras, telas e fluxo de candidaturas exigem teste com o projeto Firebase real antes de produção.
