// Executar somente em ambiente administrativo confiável, nunca no navegador.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
const keyPath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
if(!keyPath) { console.error('Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho da chave de serviço privada.');process.exit(1); }
const credentials=JSON.parse(readFileSync(keyPath,'utf8'));
initializeApp({credential:cert(credentials)});
const email='beto@admin.contrata-sul.invalid';
const password=await rl.question('Digite uma senha forte para o usuário Beto (mínimo 6 caracteres): ');
rl.close();
if(password.length<6){console.error('Firebase Authentication exige no mínimo 6 caracteres.');process.exit(1)}
const auth=getAuth();
let user;
try {user=await auth.getUserByEmail(email);await auth.updateUser(user.uid,{password,disabled:false});}
catch(e){if(e.code!=='auth/user-not-found')throw e;user=await auth.createUser({email,password,displayName:'Beto'});}
await getFirestore().doc(`admins/${user.uid}`).set({active:true,username:'beto'},{merge:true});
console.log('Usuário Beto autorizado no Firebase. UID:',user.uid);
