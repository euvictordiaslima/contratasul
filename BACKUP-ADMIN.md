# Backup da Contrata Sul V5

1. No painel Admin > Backup e restauração, exporte o JSON com os dados do Firestore.
2. Em Admin > Candidatos, use **Exportar currículos (ZIP)** para baixar os arquivos PDF/DOCX privados. O botão respeita a pesquisa de candidatos, com até 100 currículos ou 150 MB por lote.
3. Guarde JSON e ZIP em local protegido: ambos contêm dados pessoais.
4. A restauração JSON recupera os metadados de currículos, **mas não restaura os arquivos no Storage**. A recuperação dos arquivos exige envio/restauração separada para os mesmos caminhos.
5. Authentication, senhas, Rules, configurações de hospedagem e usuários administrativos não são restaurados pelo JSON.

**Firestore Rules: atualizar/publicar `firestore.rules`. Storage Rules: atualizar/publicar `storage.rules`.**
