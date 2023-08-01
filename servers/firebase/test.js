/**
 * テスト用スクリプト。
 * 'foo' というコレクションを作成し、取り出すだけ。対象はエミュレータ。
 */
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore'


const EMULATOR_HOST = 'localhost'
const EMULATOR_PORT = 8080

// const firebaseConfig = {
//   apiKey: process.env.APP_FIREBASE_KEY,
//   authDomain: process.env.APP_FIREBASE_DOMAIN,
//   databaseURL: process.env.APP_FIREBASE_DATABASE,
//   projectId: process.env.APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.APP_FIREBASE_SENDER_ID,
//   appId: process.env.APP_FIREBASE_APP_ID,
// }
const firebaseConfig = {
  projectId: 'ma-platform-local'
}
const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);


(async () => {
  const docRefs = [
    doc(db, 'foo', '1'),
    doc(db, 'foo', '2'),
    doc(db, 'foo', '3'),
    doc(db, 'foo', '4'),
    doc(db, 'foo', '5'),
  ]

  docRefs.forEach((ref, idx) => {
    setDoc(ref, {
      message: `Doc - ${ idx }`,
      createdAt: Timestamp.fromDate(new Date())
    })
  })

  // 3秒ごとにFirestoreのドキュメントを取得しに行く。
  let currentIdx = 0
  setInterval(async () => {
    // foo/1, foo/2, ... で、末尾まで行ったら foo/1 に戻る
    const d = await getDoc(docRefs[currentIdx++ % docRefs.length])
    if (d.exists()) {
      console.log(`Document data: ${ JSON.stringify(d.data()) }`);
    } else {
      console.log(`No such document!`);
    }
  }, 3000)
})()
