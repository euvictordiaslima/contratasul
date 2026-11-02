# CONTRATA SUL — Painel administrativo: navegação corrigida

## Erro corrigido

Os botões do menu apontavam para seções dentro de `.admin-workspace`, mas o JavaScript antigo procurava filhos diretos de `#admin-panel`. O seletor não encontrava nenhuma seção, e por isso a página continuava na **Visão geral**.

A nova navegação está dentro de `admin.html` e funciona independentemente do carregamento dos módulos Firebase. A versão atual também adiciona ícones, espaçamento melhorado, barra de localização da seção, atalhos de gestão, suporte a teclado e navegação horizontal em celular.

## E o erro 404?

O recurso ausente não foi identificado na mensagem enviada (somente `Failed to load resource: 404`). Nesta versão foram adicionados `favicon.svg` e `favicon.ico` e a lista de recursos locais das páginas foi verificada: os arquivos referenciados existem no ZIP.

Se continuar aparecendo 404 após publicar, abra o Console > Rede (Network), clique no erro e confira o **Request URL**. O 404 pode ocorrer por arquivo não enviado ou caminho com letra maiúscula/minúscula diferente no GitHub Pages.

## Como atualizar (GitHub Pages)

1. Faça uma cópia de segurança do site publicado.
2. Extraia o ZIP e **substitua todos os arquivos** da pasta publicada. Não copie só `index.html`; `admin.html`, `admin.css`, scripts e assets devem permanecer na mesma estrutura de pastas.
3. Confirme que o `admin.html` publicado é a nova versão (título **Painel administrativo**, menu com 9 seções).
4. No navegador, abra `admin.html` e pressione `Ctrl + Shift + R` (atualização sem cache).
5. Faça login e teste as abas **Vagas, Candidatos, Empresas, Entrevistas, Conteúdo, Backup, Histórico e Recuperação**.

## Firebase / Firestore Rules

**NÃO PRECISA ATUALIZAR O `firestore.rules` nesta versão.** O arquivo foi preservado exatamente como no ZIP anterior. Nenhuma coleção, permissão ou estrutura de dados foi alterada por esta correção.

## Testes realizados

- Sintaxe de todos os arquivos JS locais e da navegação embutida.
- Verificação dos 9 pares botão/seção.
- Teste automatizado em Chromium, em 1440px e 390px, de abertura das 9 seções, ocultação das demais, atalhos, URL fragmentada e ausência de rolagem lateral (DOM de teste sem autenticação).
- Verificação das referências de recursos locais nas 3 páginas HTML.

**Ainda não testado:** autenticação, consultas e gravações no Firebase da sua conta, nem os caminhos publicados no GitHub Pages. Se algum 404 persistir, a URL exata da requisição é necessária para identificar o arquivo ausente.
