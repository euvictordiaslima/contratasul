# Contrata Sul — Suite v2

## Atualização obrigatória das Rules
**SIM: publicar o novo `firestore.rules`** no Firebase Console do projeto `contrata-sul`. As regras acrescentam `lixeira` e permitem a restauração administrativa de candidatos e entrevistas. Faça backup antes de atualizar.

## Funcionalidades
- Gestão de vagas, empresas, candidatos, Kanban, entrevistas, conteúdo público e histórico.
- Lixeira recuperável de vagas, protegida por reautenticação para remoção e recuperação.
- Backup manual das vagas e exportação das coleções de dados pela aba Backup.
- Restauração manual do backup completo pela aba Recuperação, sem excluir registros ausentes.
- Honeypot básico no formulário de candidatura; **não é uma proteção anti-spam robusta**.

## Como publicar
1. Faça backup dos dados existentes.
2. Publique `firestore.rules` no Firestore `(default)` do projeto `contrata-sul`.
3. Substitua os arquivos do site hospedado pelos deste ZIP; mantenha a configuração de Authentication existente.
4. Recarregue o navegador com Ctrl+Shift+R.
5. Entre no painel, teste uma vaga fictícia: criar, mover à lixeira, restaurar, exportar backup, importar.
6. Teste também uma candidatura fictícia e o Kanban.

## Limitações importantes
- **Não há backup automático no servidor.** Para isso é necessário um serviço agendado confiável, permissões de conta de serviço e, conforme arquitetura, pode haver custos.
- A exportação completa contém dados pessoais de candidatos. Guarde o arquivo criptografado em local privado e restrinja o acesso conforme a LGPD.
- A restauração completa não restaura `historico` (registros anteriores), usuários do Authentication, regras, configurações do Firebase ou arquivos enviados. Pode ser parcial se houver erro de rede.
- O histórico escrito pelo cliente não é um registro de auditoria imutável e confiável. Auditoria robusta exige backend confiável.
- O honeypot não substitui App Check, CAPTCHA/Turnstile, limitação de taxa no servidor ou monitoramento de abuso.
- O projeto não foi testado contra o Firebase real; validação sintática não garante o funcionamento de todas as regras.
- As senhas não são armazenadas no código. Se a senha do administrador foi compartilhada, redefina-a.
