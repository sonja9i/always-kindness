
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * [중요] 원장님의 Firebase 콘솔에서 복사한 설정값으로 아래를 반드시 수정해야 합니다.
 * 수정하지 않으면 데이터 동기화가 작동하지 않습니다.
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
