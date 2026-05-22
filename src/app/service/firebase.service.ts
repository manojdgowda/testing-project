import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private firebaseConfig = {
    // apiKey: 'YOUR_API_KEY',
    // authDomain: 'YOUR_PROJECT.firebaseapp.com',
    // projectId: 'YOUR_PROJECT_ID',
    // storageBucket: 'YOUR_PROJECT.appspot.com',
    // messagingSenderId: 'YOUR_SENDER_ID',
    // appId: 'YOUR_APP_ID'




    apiKey: "AIzaSyD3-A04MuRio6zw0hveFA3RbFIICFaVU3g",
    authDomain: "testing-project-d9cb9.firebaseapp.com",
    projectId: "testing-project-d9cb9",
    storageBucket: "testing-project-d9cb9.firebasestorage.app",
    messagingSenderId: "392138773075",
    appId: "1:392138773075:web:8865925f5dfafe068faca6",
    measurementId: "G-FTEMTF6425"
  };

  private app = initializeApp(this.firebaseConfig);
  private db = getFirestore(this.app);
  private docRef = doc(this.db, 'birthdaySurprise', 'mainUser');

  async initData() {
    const snap = await getDoc(this.docRef);

    if (!snap.exists()) {
      await setDoc(this.docRef, {
        totalUsedSeconds: 0,
        noClickCount: 0,
        isCompleted: false,
        responses: {},
        createdAt: serverTimestamp()
      });
    }
  }

  async getData(): Promise<any> {
    const snap = await getDoc(this.docRef);
    return snap.data();
  }

  async addUsage(seconds: number) {
    await updateDoc(this.docRef, {
      totalUsedSeconds: increment(seconds),
      lastActiveAt: serverTimestamp()
    });
  }

  async saveNoClick() {
    await updateDoc(this.docRef, {
      noClickCount: increment(1)
    });
  }

  async saveResponse(key: string, value: string) {
    await updateDoc(this.docRef, {
      [`responses.${key}`]: {
        answer: value,
        submittedAt: serverTimestamp()
      }
    });
  }

  async markCompleted() {
    await updateDoc(this.docRef, {
      isCompleted: true,
      completedAt: serverTimestamp()
    });
  }


}
