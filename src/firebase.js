import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCm0FDaNw8nOkXDHQuC9HKl01ZUtPSsBQg',
  authDomain: 'in-demand-delivery-app.firebaseapp.com',
  projectId: 'in-demand-delivery-app',
  storageBucket: 'in-demand-delivery-app.firebasestorage.app',
  messagingSenderId: '106637930808',
  appId: '1:106637930808:web:9974be84e3af08938091cd',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
