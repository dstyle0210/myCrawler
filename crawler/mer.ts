import dotenv from 'dotenv';
import request from 'request';
import TelegramBot from "node-telegram-bot-api";
dotenv.config();

const {TG_TOKEN_DSTYLESTOCK,TG_CHATID_DSTYLESTOCK,LIST_URL} = process.env; // ENV
const setMM = (mm:number) => ((mm<10) ? "0"+mm : ""+mm);
const nowDate = new Date();nowDate.setHours(nowDate.getHours() + 9); // github action UTC+0
const today = nowDate.getFullYear() + setMM(nowDate.getMonth()+1) + setMM(nowDate.getDate());
const convertDate = (date:string) => date.replace(/[^0-9]/g,"");
// const today2 = "20250203";
request.get({
    url: LIST_URL
}, function (error, response, body) {
    let text = "";
    if (!error && response.statusCode == 200) {
        const data = JSON.parse(body);
        const result = data.stockTable.find((stock) => {
            return today == convertDate(stock.startTrdDd);
        });
        // console.log(corpName , avgPrc);
        if(result){
            const {corpName , avgPrc} = result;
            text = corpName+" "+avgPrc+"원";
        }else{
            text = "신규종목없음";
        };
    } else {
        // console.log('error = ' + response.statusCode);
        text = "에러" + response.statusCode;
    };

    if(!TG_TOKEN_DSTYLESTOCK || !TG_CHATID_DSTYLESTOCK){ return; };
    const bot = new TelegramBot(TG_TOKEN_DSTYLESTOCK, {polling: false});
    const message = text;
    bot.sendMessage(TG_CHATID_DSTYLESTOCK, message);
});