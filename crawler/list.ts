import dotenv from 'dotenv';
import request from 'request';
import {initializeApp} from "firebase/app";
import { getDatabase, set, get, ref, goOffline } from "firebase/database";

dotenv.config();
const {FIREBASE_URL,LIST_URL,FIREBASE_DB} = process.env; // ENV
const firebaseConfig = {
    databaseURL: FIREBASE_URL,
};
(async () => {
    const app = initializeApp({databaseURL: FIREBASE_DB});
    const db = getDatabase(app);
    const nowRef = ref(db, `nowList`);
    const prevRef = ref(db, `prevList`);
    console.log("v2");
    await set(nowRef,null);

    console.log("step3");
    request.get({
        url: LIST_URL
    }, function (error, response, body) {
        const data = JSON.parse(body);
        console.log("step4");
        set(nowRef,data.stockTable);
    });

    setTimeout(()=>{
        console.log("step5");
        goOffline(db);
    },5000);
})();