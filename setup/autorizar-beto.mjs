// Executar localmente com credenciais de serviço. Nunca hospede esta chave.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const UID = '0RJfc0qBd1VlT1ObDHsuIgH7Edo1';
const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!path) throw new Error('Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho do JSON da conta de serviço.');
const key = JSON.parse(readFileSync(path, 'utf8'));
if (key.project_id !== 'contrata-sul') throw new Error('A chave não pertence ao projeto contrata-sul.');
initializeApp({ credential: cert(key), projectId: 'contrata-sul' });
const user = await getAuth().getUser(UID); // Verifica que o UID existe no Authentication.
if (user.disabled) throw new Error('A conta está desativada no Authentication.');
if (!user.email) throw new Error('A conta não possui e-mail no Authentication.');
await getFirestore().doc(`admins/${UID}`).set({
  active: true,
  username: 'beto',
  updatedAt: FieldValue.serverTimestamp()
}, {merge:true});
await getFirestore().doc('loginAliases/beto').set({ email: user.email, uid: UID });
console.log('Administrador Beto autorizado com sucesso no Firestore. UID:', UID);
console.log('E-mail cadastrado no Authentication:', user.email || '(não definido)');
