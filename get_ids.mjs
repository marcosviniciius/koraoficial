const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "kora-af35c.firebaseapp.com",
  projectId: "kora-af35c",
  storageBucket: "kora-af35c.appspot.com",
  messagingSenderId: "360057404499",
  appId: "1:360057404499:web:cba2793ef1ef892cfc938d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getAffiliates() {
  const snapshot = await getDocs(collection(db, "affiliates"));
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data().name);
  });
  // Keep node open gracefully
  process.exit(0);
}

getAffiliates();
