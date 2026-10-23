/* firebase.js: one shared Firebase app, Auth and Firestore. Needs config.js and the Firebase CDN scripts first. */
firebase.initializeApp(FIREBASE_CONFIG);
const fbAuth = firebase.auth();
const fdb = firebase.firestore();
// Keep a local copy of the data, so the next visit loads faster
fdb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
