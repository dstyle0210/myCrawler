import dotenv from 'dotenv';
import request from 'request';
import {initializeApp} from "firebase/app";
import { getDatabase, set, get, ref, goOffline } from "firebase/database";

dotenv.config();
const {FIREBASE_URL,LIST_URL} = process.env; // ENV
console.log(FIREBASE_URL);
console.log(LIST_URL);

const firebaseConfig = {
    databaseURL: FIREBASE_URL,
};
(async () => {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const nowRef = ref(db, `nowList`);
    const prevRef = ref(db, `prevList`);


    

    console.log("step1");
    await get(nowRef).then(async (snapshot) => {
        console.log(snapshot);
        if (snapshot.exists()) {
            console.log("여기용");
            await set(prevRef,snapshot.val());
            console.log("저기용");
            console.log(snapshot.val().length);
            console.log("저기용");
        } else {
            console.log("No data available");
            return "No data available";
        }
    }).catch((error) => {
        console.error(error);
        return error;
    });

    console.log("step2");
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