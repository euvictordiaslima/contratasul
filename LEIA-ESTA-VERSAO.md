# Contrata Sul — Painel integrado

## Problema corrigido
As versões anteriores continham `suite-admin.js` e `suite-recovery.js`, mas o `admin.html` não tinha as abas e os campos exigidos por esses módulos, nem carregava os dois scripts. Esta versão integra os arquivos e adiciona as seções: Visão geral, Vagas, Candidatos (Kanban), Empresas, Entrevistas, Conteúdo do site, Histórico, Backup e Recuperação.

## Regras do Firestore
**ATUALIZAR RULES: SIM, se você ainda não publicou as regras da Suite V2.** Use `firestore.rules` do ZIP. Se já publicou exatamente essas regras, não é preciso publicar novamente apenas por causa do novo menu.

## Implantação
Publique TODOS os arquivos juntos no GitHub Pages (não apenas `admin.html`). Atualize com Ctrl+Shift+R. A conta de administrador deve existir no Firebase Authentication e ter `admins/{UID}.active = true`.

## Limitações
A interface foi integrada e os scripts passaram por verificação de sintaxe, mas não foi possível realizar testes de integração no seu Firebase real. Backup automático, upload de currículos com Storage, rate limiting robusto e auditoria inviolável exigem backend adicional. A exportação completa pode incluir dados pessoais de candidatos; mantenha o JSON em local privado. Não confunda o histórico client-side com auditoria de segurança. A recuperação pode falhar parcialmente em caso de interrupção.
