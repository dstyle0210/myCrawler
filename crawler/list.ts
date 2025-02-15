import dotenv from 'dotenv';
import request from 'request';
import {initializeApp} from "firebase/app";
import { getDatabase, set, get, ref, goOffline } from "firebase/database";

dotenv.config();
const {LIST_URL,FIREBASE_DB} = process.env; // ENV
(async () => {
    const app = initializeApp({databaseURL: FIREBASE_DB});
    const db = getDatabase(app);
    const nowRef = ref(db, `nowList`);
    const prevRef = ref(db, `prevList`);

    await get(nowRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            await set(prevRef,snapshot.val());
            console.log(snapshot.val().length);
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
    await set(nowRef,null);

    request.get({
        url: LIST_URL
    }, function (error, response, body) {
        const data = JSON.parse(body);
        set(nowRef,data.stockTable);
    });

    setTimeout(()=>{
        goOffline(db);
    },5000);
})();