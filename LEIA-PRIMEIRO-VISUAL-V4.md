# Contrata Sul — Atualização visual V4

## O que mudou

- Página inicial redesenhada em estilo editorial e profissional, com menos ornamentos e contraste melhor.
- Nova navegação com seção **Explorar**, reunindo páginas secundárias sem remover conteúdo.
- Menu responsivo, com fechamento ao escolher um destino e suporte a Escape.
- Painel de **vagas em aberto** na página inicial, preenchido exclusivamente com vagas publicadas no Firestore. **Não há vagas ou números fictícios no código do site.**
- Novo CSS de layout e legibilidade para vagas, formulários, cartões, banners e materiais por URL.
- Revisão visual do admin: menu, campos, espaçamento e indicadores.
- Versão do service worker atualizada para renovar o cache do aplicativo instalável.

## Instalação

1. Faça um backup da versão publicada e dos dados importantes antes de atualizar.
2. Envie **todos os arquivos e pastas** deste ZIP para a pasta `/contratasul` do seu repositório GitHub Pages, substituindo os arquivos anteriores. Não publique apenas `index.html`.
3. Aguarde a publicação em `https://euvictordiaslima.github.io/contratasul/`.
4. No computador, recarregue com `Ctrl + Shift + R`. No Android, feche e reabra o aplicativo instalado; se necessário, limpe o cache do site no navegador.
5. Confira a página inicial, o menu, o modo escuro, o painel de vagas e o admin.

## Firestore Rules

**Não é necessário alterar as regras nesta atualização.** O arquivo `firestore.rules` foi mantido idêntico à versão anterior; não houve criação de coleções ou mudança de permissões.

## O que foi preservado

- Firebase e Firestore, vagas, candidaturas por celular, CRM, empresas, entrevistas, exclusões, backup e portal empresarial.
- Propagandas e materiais administrados por URL.
- Carrosséis com intervalo de 3 segundos, com controle manual.
- PWA e ícones já existentes.

## Verificação e limites

- HTML, CSS, referências locais e sintaxe JavaScript foram conferidos.
- A navegação foi simulada em telas de 1440, 1024, 390 e 320 pixels, sem rolagem horizontal no topo da página.
- A imagem de prévia foi gerada com **vagas de exemplo apenas para visualização**; os exemplos não estão incluídos no site publicado.
- O Firebase real e a instalação em celulares físicos não foram testados. Faça uma checagem após publicar.
- Nenhuma atualização foi enviada automaticamente para seu GitHub ou Firebase.
