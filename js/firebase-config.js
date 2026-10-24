/*
 * Googleアカウントでメモを同期するための設定（Firebase）
 * ----------------------------------------------------------------
 * Firebase コンソール（https://console.firebase.google.com/）で作った
 * プロジェクトの「ウェブアプリ」の設定値を、下の null の代わりに貼り付けます。
 *
 *   const FIREBASE_CONFIG = {
 *     apiKey: "……",
 *     authDomain: "……firebaseapp.com",
 *     projectId: "……",
 *     storageBucket: "……",
 *     messagingSenderId: "……",
 *     appId: "……"
 *   };
 *
 * この値はウェブページから使うための公開用の識別子で、秘密の鍵ではありません。
 * メモを守るのは Firestore のセキュリティルール（README に記載）です。
 * null のままなら同期は使わず、メモはこの端末だけに保存されます。
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDoyuL0NHaEbVI147pUpxNs3HmEGzcMe8",
  authDomain: "theologians-notes.firebaseapp.com",
  projectId: "theologians-notes",
  storageBucket: "theologians-notes.firebasestorage.app",
  messagingSenderId: "719794477661",
  appId: "1:719794477661:web:b4333bba680c012dcccbb4"
};
