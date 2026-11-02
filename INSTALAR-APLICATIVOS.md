# Contrata Sul — Aplicativos de celular e computador

Esta edição é uma **PWA (Progressive Web App)**: instalável no celular (Android/iPhone) e no PC (Windows/Mac/Linux), usando o mesmo sistema e banco de dados. Não é um APK ou EXE nativo e não precisa da Play Store ou Microsoft Store.

## Publicação

1. Faça backup do seu site atual e dos dados do Firestore.
2. Publique **todos** os arquivos deste ZIP no MESMO endereço HTTPS do site atual (GitHub Pages ou Firebase Hosting). Preserve a estrutura da pasta `icons/` e `assets/`.
3. Não abra com `file://`: o aplicativo precisa de HTTPS (ou `http://localhost` para desenvolvimento).
4. Atualize a página (Ctrl+Shift+R). Caso já tenha instalado uma versão antiga, feche e reabra o aplicativo. Os aplicativos são atualizados com o site.
5. No Firebase Authentication, confirme que o domínio HTTPS hospedado está na lista de domínios autorizados, quando aplicável. Não mude a conta administrativa.

## Instalação no celular

**Android (Chrome):** entre no endereço HTTPS do site, toque em `Instalar` na página ou abra ⋮ → `Instalar aplicativo` / `Adicionar à tela inicial`.

**iPhone/iPad:** abra a página no Safari, toque em **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**. Alguns outros navegadores atualizados também suportam esta opção.

## Instalação no Windows, macOS e Linux

Abra o endereço HTTPS no Chrome ou Edge, clique em `Instalar` no site, ou use o ícone de instalação na barra de endereços / menu → `Instalar aplicativo`. O programa aparece como janela independente e atalho no sistema.

## Três aplicativos diferentes

- **Contrata Sul** (público): abra `index.html`, instale. Vagas e serviços.
- **Admin RH** (restrito): abra `admin.html`, instale. Requer login autorizado pelo Firebase; **não** armazena senhas nem dados privados para acesso offline.
- **Portal Empresa** (restrito): abra `portal-empresa.html`, instale. Acesso conforme permissões existentes.

Navegadores podem oferecer instalação de aplicativos separados de um mesmo site dependendo de suporte à propriedade `id` dos manifests.

## Offline e privacidade

A página pública e parte dos arquivos estáticos podem ser exibidos com conexão indisponível, mas **vagas atualizadas, candidaturas, login, CRM, entrevistas e backups exigem internet**. O Service Worker não armazena respostas do Firebase, e não intercepta HTML de administração, candidatura ou portal empresarial. Candidaturas **não** ficam em fila offline para envio posterior.

## Firestore Rules

**NÃO PRECISA ALTERAR `firestore.rules`** por causa da instalação como app. O arquivo foi mantido igual ao da versão RH V3. Só publique as Rules se ainda não tiver aplicado as regras exigidas pela RH V3.

## Diagnóstico

- Botão instalar não aparece: instalação depende do navegador; use o menu ou Compartilhar. Confirme HTTPS, manifesto e ícones (no DevTools > Application).
- Erro 404: confira se arquivos `sw.js`, `manifest.webmanifest`, `manifest-admin.webmanifest`, `icons/*.png` foram publicados mantendo os caminhos relativos.
- Erro no login: verifique Firebase Authentication, URL e acesso da conta. Instalação PWA não altera as credenciais.
- Tela mostra conteúdo antigo: recarregue online; Service Worker substitui caches públicos ao instalar nova versão.

## Testes e limites

Os arquivos e os fluxos de instalação são verificados em um navegador local, mas o usuário deve testar a instalação no seu celular e computador com HTTPS real. Não há APK, EXE, publicações em lojas, push notifications ou acesso administrativo offline nesta entrega.
