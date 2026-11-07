# Backups e privacidade — Contrata Sul V6

- **Backup JSON**: exporta registros e metadados, mas NÃO os bytes dos currículos.
- **Admin → Candidatos → Exportar currículos (ZIP)**: exporta os arquivos privados em PDF/DOCX. Guarde esse ZIP em local restrito.
- **Restauração**: o JSON restaura metadados; a importação automática de arquivos ZIP ainda não está implementada. Não presuma que um JSON sozinho recupera currículos.
- **Exclusão protegida**: ao excluir uma candidatura V6 no admin, a candidatura e o documento privado do currículo são apagados juntos em um lote atômico.
- **Currículos antigos do Storage (V5)**: não são migrados nem excluídos automaticamente. Se já houver arquivos antigos, providencie migração/limpeza manual autorizada.
- Não compartilhe backups com dados pessoais. Considere a LGPD e estabeleça prazo de retenção e procedimento para pedidos de exclusão.
