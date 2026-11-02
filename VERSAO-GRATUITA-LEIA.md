# Contrata Sul — edição gratuita, novembro de 2026

## O que mudou nesta entrega
- Painel com menu lateral e busca de módulos (Ctrl+K), responsivo para desktop e celular.
- Vagas públicas com favoritos locais, ordenação e filtro de favoritas, sem nova coleção ou serviço pago.
- Mantidos os módulos existentes: vagas, empresas, candidatos, Kanban, entrevistas, conteúdo, histórico, backup e recuperação.
- Melhorias visuais e de acessibilidade nos controles.

## Firebase Rules — NÃO PRECISA ALTERAR
Esta entrega não adiciona novas coleções nem permissões. Mantenha as regras já publicadas **se forem as regras corrigidas da Suite V2**. Se você ainda usa regras antigas, revise o arquivo `firestore.rules` antes de publicar. Não substitua as regras de produção sem conferir as permissões.

## Custos e limites
- Firebase Spark oferece cotas gratuitas, não uso ilimitado. Confira limites oficiais no console antes de colocar o site em produção.
- Favoritos são armazenados no navegador; não sincronizam entre dispositivos.
- Backup do painel é manual. Backup automático no servidor, e-mail transacional e proteção anti-spam forte não estão implementados aqui e não podem ser prometidos sem custo em qualquer volume.
- Não envie currículos/dados pessoais reais antes de validar as regras de leitura, LGPD e segurança da aplicação.

## Instalação
1. Faça uma cópia de segurança da versão atual e dos dados.
2. Substitua **todos** os arquivos do site no GitHub Pages/Firebase Hosting.
3. Atualize com Ctrl+Shift+R e teste em celular e computador.
4. Teste os módulos do admin e uma candidatura fictícia; o teste de sintaxe não equivale a testes com seu Firebase real.
5. Para evitar alterações inesperadas, mantenha o mesmo projeto Firebase e a conta de administrador já autorizada.

## Escopo não implementado
Autenticação multifator, contas próprias de empresas/candidatos, e-mails automáticos, geração de PDF/Excel, auditoria imutável e backup automático completo exigem arquitetura adicional e testes; não estão incluídos nesta entrega.
