# Backup e restauração

A opção **Exportar dados das vagas** gera um arquivo JSON somente das oportunidades. O botão **Baixar backup de todas as coleções** exporta vagas, empresas (incluindo informações opcionais de CNPJ), candidaturas, entrevistas, histórico e configurações.

A aba **Recuperação** restaura as coleções suportadas (vagas, empresas, candidaturas, entrevistas e configurações) sem apagar registros que não estejam no arquivo. A operação pode ser parcial se a conexão cair. Guarde o arquivo em lugar seguro e teste a restauração com informações fictícias antes de usá-la em produção.

Usuários e senhas do Authentication, regras, arquivos enviados, configurações de hospedagem e auditoria do servidor **não** são incluídos nem recuperados. Não há backup periódico automático.

**Firestore Rules:** esta versão precisa de novas regras para os dados opcionais das empresas e entrevistas. Veja `INSTALE-ESTA-VERSAO.md`.
