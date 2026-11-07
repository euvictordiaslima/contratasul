# Contrata Sul V6 — Comece aqui

Esta versão NÃO usa Firebase Storage. Os currículos pequenos (PDF/DOCX, até 350 KB) são gravados em uma coleção privada do Firestore Spark.

1. Faça backup do site, das Rules e dos dados atuais.
2. Leia **LEIA-PRIMEIRO-V6.md** antes de publicar.
3. Publique **firestore.rules** em Firebase Console → Firestore Database → Regras.
4. No Firebase Authentication → Sign-in method, habilite o provedor **Anônimo**.
5. Publique o conteúdo desta pasta no GitHub Pages da Contrata Sul.
6. Teste com uma vaga publicada e um currículo PDF pequeno fictício. Verifique no Admin → Candidatos → Visualizar PDF / Baixar currículo.

O arquivo `storage.rules` NÃO existe mais: não é preciso criar bucket ou ativar faturamento para este recurso. Firestore Spark possui cotas gratuitas e pode limitar envios ao esgotá-las.
