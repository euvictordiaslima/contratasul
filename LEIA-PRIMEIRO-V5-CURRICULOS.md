> **Atualização V7:** este documento é histórico. Siga `LEIA-PRIMEIRO-V7-CORRECOES.md` para os procedimentos atuais.

# Contrata Sul V5 — Novo visual + candidatura com currículo obrigatório

## 1. O que mudou

- Página pública redesenhada com visual editorial, cores de maior contraste, melhor hierarquia e versões desktop/mobile.
- Painel administrativo, página de candidatura e portal da empresa com componentes mais consistentes.
- Ao se candidatar a uma vaga publicada, a pessoa **precisa anexar currículo PDF ou DOCX de até 5 MB**. Nome e telefone com DDD continuam obrigatórios; e-mail continua opcional, exceto quando o contato preferido é por e-mail.
- O currículo é enviado ao **Firebase Storage**, em um caminho privado, e a candidatura é registrada no **Firestore** com metadados do arquivo. O público não recebe links para baixar currículos.
- O painel Admin > Candidatos mostra o botão **Baixar currículo** (apenas para registros que têm currículo).
- Admin > Candidatos também oferece **Exportar currículos (ZIP)**, respeitando a pesquisa atual, até 100 arquivos/150 MB por lote. O backup JSON continua separado.
- A exclusão administrativa de uma candidatura tenta excluir também o currículo no Storage; se falhar, mostra aviso para limpeza manual.
- Os carrosséis e mídias por URL, pesquisas em listas, RH/CRM, empresas, backup e outras funções anteriores foram preservados.

## 2. ATENÇÃO: Firestore Rules e Storage Rules DEVEM ser publicadas

**Esta versão não funciona corretamente com as regras anteriores.** O novo upload exige dois conjuntos de regras:

1. Firebase Console > Firestore Database > **Regras**: copie todo o conteúdo de `firestore.rules` e clique em **Publicar**.
2. Firebase Console > Storage > **Regras**: copie todo o conteúdo de `storage.rules` e clique em **Publicar**.
3. As regras do Storage restringem leitura dos currículos a administradores ativos em `admins/{uid}` e impedem listagem pública.
4. O administrador continua com o mesmo login; não troque suas credenciais.

**Se o projeto já utiliza o Firebase Storage para outros arquivos**, revise e mescle as regras em vez de substituí-las sem verificar. O `storage.rules` fornecido bloqueia outros caminhos por padrão.

## 3. Ative o login anônimo (obrigatório)

Firebase Console > Authentication > Sign-in method > **Anonymous / Anônimo** > Ativar > Salvar.

O site utiliza uma instância de autenticação **separada** para o candidato, de modo que um envio anônimo não derrube a sessão do painel administrativo. O candidato **não precisa criar conta** nem fornecer e-mail.

## 4. Configure o Firebase Storage (obrigatório)

1. Firebase Console > Storage: confirme que existe um bucket configurado para o projeto.
2. O `firebase-config.js` atual aponta para `contrata-sul.firebasestorage.app`. Confira o nome exato do bucket no Console.
3. Se o Storage ainda não estiver disponível, ative-o seguindo as instruções do Firebase. A criação/uso de buckets pode exigir plano Blaze e gerar cobrança conforme o consumo. **Verifique custos e limites antes de liberar o formulário ao público.**
4. Publique `storage.rules`.
5. Se o **download privado no admin** mostrar erro de CORS, configure o CORS do bucket para o domínio do GitHub Pages com o arquivo `storage-cors.json`. Exemplo com Google Cloud CLI:

```bash
gcloud storage buckets update gs://contrata-sul.firebasestorage.app --cors-file=storage-cors.json
```

Esse comando requer acesso ao projeto Google Cloud e pode precisar ser executado por um administrador da conta. Se o nome do bucket for diferente, ajuste-o.

## 5. Publicar o site no GitHub Pages

Acesse o repositório que publica `https://euvictordiaslima.github.io/contratasul/` e substitua os arquivos do site pelos arquivos desta pasta (na mesma raiz em que está `index.html`). Faça commit/publicação.

**Importante:** publicar no GitHub Pages **não publica as regras do Firebase**. Faça a etapa 2 no Firebase Console separadamente. O aplicativo Android anterior abre a URL do site; o novo visual será carregado após publicar e atualizar o cache.

Se usar Firebase CLI/Hosting em vez de GitHub Pages, `firebase.json` já referencia `firestore.rules` e `storage.rules`.

## 6. Teste antes de colocar no ar

1. Crie uma vaga de teste publicada.
2. Abra a vaga em uma janela anônima do navegador e clique em candidatar-se.
3. Preencha nome e celular; confirme que o e-mail pode ficar vazio quando o contato é por WhatsApp/ligação.
4. Tente enviar **sem currículo**: o formulário deve bloquear.
5. Tente um arquivo com extensão diferente, inválido ou maior que 5 MB: deve ser recusado.
6. Envie um PDF pequeno e válido; confirme o progresso de upload e a mensagem de sucesso.
7. No Firebase Console, confira `candidaturas/{id}` no Firestore e o arquivo privado `curriculos/{uid}/{id}/curriculo.pdf` no Storage.
8. No painel Admin > Candidatos, pesquise o candidato e use **Baixar currículo**. Teste o backup de currículos em ZIP.
9. Teste excluir um cadastro de teste (senha exigida) e confirme se o arquivo também saiu do Storage.
10. Faça um backup do JSON **e** um backup ZIP dos currículos. Teste a restauração em ambiente seguro.

## 7. Segurança e limitações

- Somente PDF/DOCX até 5 MB; validação simples de cabeçalho no navegador e tipo/tamanho nas regras do Storage. **Não há antivírus ou análise de malware no servidor**. Trate currículos recebidos como arquivos não confiáveis.
- Regras de Storage limitam tipos, tamanho, caminho e acesso. Porém, **regras por si só não impedem spam/abuso de uploads por contas anônimas**. Antes de uso público em escala, configure Firebase App Check e limites/monitoramento; uma função de upload com validação e rate limiting no servidor é a opção mais robusta.
- Não há transação atômica entre Storage e Firestore. Se a gravação do Firestore falhar após o upload, o site tenta remover o arquivo; falhas de rede podem deixar arquivos órfãos. Revise periodicamente o Storage.
- O backup JSON guarda os **metadados** dos currículos, mas não seus bytes. Faça o backup ZIP separado. Restaurar somente o JSON não recupera PDFs/DOCX apagados.
- O download privado do Admin usa a API do Firebase Storage, sem gerar link público permanente; CORS pode precisar ser configurado.
- Este pacote passou por testes de interface em desktop/mobile, checagem de sintaxe JavaScript, simulação do fluxo de candidatura e teste de ZIP. **Não foi testado no seu Firebase de produção nem publicado automaticamente.**

## 8. Arquivos novos/alterados mais importantes

- `v5-site.css` — site público.
- `v5-admin.css` — painel administrativo.
- `v5-forms.css` — candidatura e portal da empresa.
- `candidatar.html`, `candidatar.js` — currículo obrigatório e envio ao Storage.
- `suite-admin.js` — download privado do currículo.
- `admin-curriculos-backup.js` — backup ZIP dos currículos.
- `admin-record-delete.js` — limpeza do currículo ao excluir candidatura.
- `suite-recovery.js` — preserva metadados de currículos em restaurações.
- `firestore.rules` — exige metadados de currículo em candidaturas públicas.
- `storage.rules` — acesso restrito e validação do upload.
- `storage-cors.json` — configuração CORS opcional para download privado no navegador.
- `sw.js` — cache atualizado para CSS V5.

**Status das regras: FIRESTORE RULES — PUBLICAR NOVAS. STORAGE RULES — PUBLICAR NOVAS.**
