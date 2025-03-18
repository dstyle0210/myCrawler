import dotenv from 'dotenv';
import request from 'request';
import TelegramBot from "node-telegram-bot-api";
import {initializeApp} from "firebase/app";
import { getDatabase, set, get, ref, goOffline } from "firebase/database";
dotenv.config();

const {LIST_URL,FIREBASE_DB,TG_TOKEN_DSTYLESTOCK,TG_CHATID_DSTYLESTOCK} = process.env; // ENV
(async () => {
    const app = initializeApp({databaseURL: FIREBASE_DB});
    const db = getDatabase(app);
    const nowRef = ref(db, `nowList`);
    const prevRef = ref(db, `prevList`);
    let dbList = {}; // 통합배열

    await get(nowRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            await set(prevRef,snapshot.val());
            // console.log(snapshot.val().length);
            snapshot.val().forEach((item) => {
                const {stockCode,corpName,curVol} = item;
                dbList[stockCode] = {stockCode,corpName,prevVol:+curVol};
            });
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

        data.stockTable.forEach((item) => {
            const {stockCode,corpName,curVol} = item;
            if(dbList[stockCode]){
                dbList[stockCode].curVol = curVol;
            }else{
                dbList[stockCode] = {stockCode,corpName,curVol,prevVol:0};
            };
        });

        const updateList = [];
        for (const key in dbList) {
            if (dbList.hasOwnProperty(key)) {
                const {corpName,prevVol,curVol} = dbList[key];
                const sType = prevVol==0 ? "신규" : (curVol==prevVol) ? "청산" : "변경";
                if(prevVol !== curVol){
                    updateList.push(`[${sType}] ${corpName}(${curVol - prevVol})`);
                };
            }
        };
        const result = updateList.join("\n");
        const text = result == "" ? "변경없음" : result;
        if(!TG_TOKEN_DSTYLESTOCK || !TG_CHATID_DSTYLESTOCK){ return; };
        const bot = new TelegramBot(TG_TOKEN_DSTYLESTOCK, {polling: false});
        const message = text+"\nhttps://dstyle-stocks.web.app/goat.html";
        bot.sendMessage(TG_CHATID_DSTYLESTOCK, message);
    });

    setTimeout(()=>{
        goOffline(db);
    },5000);
})();