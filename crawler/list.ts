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
const getStockTable = () => {
    return new Promise((res,rej)=>{
        request.get({
            url: LIST_URL
        }, function (error, response, body) {
            const data = JSON.parse(body);
            res(data.stockTable);
        });
    });
};

(async () => {
    const refData = await getStockTable();
    const app = initializeApp(firebaseConfig);
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
    await set(nowRef,refData);

    goOffline(db);
})();