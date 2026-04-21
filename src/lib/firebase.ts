/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(config);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId);

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

testConnection();
