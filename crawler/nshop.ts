// 네이버 검색 API 예제 - 블로그 검색
import dotenv from 'dotenv';
import request from 'request';
import TelegramBot from "node-telegram-bot-api";
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env; // ENV
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA} = process.env; // ENV
if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    dotenv.config();
};

const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
const items = ['OUW23234', 'DXPD33041'];
items.forEach(item => {
    request.get({
        url: `https://openapi.naver.com/v1/search/shop.json?sort=asc&query=${encodeURI(item)}`,
        headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
    }, function (error, response, body) {
        let message = "";
        if (!error && response.statusCode == 200) {
            const data = JSON.parse(body);
            const { title, lprice, link } = data.items[0];
            // console.log(title+" "+lprice + "원");
            message = "[nShop] "+title+" "+lprice + "원";
        } else {
            // console.log('error = ' + response.statusCode);
            message = "[nShop] "+'error = ' + response.statusCode;
        };
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);
    });
});

/*
const asyncReqeust = async (item:string):Promise<string> => {
    return new Promise((resolve, reject) => {
        request.get({
            url: `https://openapi.naver.com/v1/search/shop.json?sort=asc&query=${encodeURI(item)}`,
            headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const data = JSON.parse(body);
                const { title, lprice, link } = data.items[0];
                console.log(title+" "+lprice + "원");
                resolve(title+" "+lprice + "원");
            } else {
                reject('error = ' + response.statusCode);
            };
        });
        
    });
};

(async function(){
    await Promise.all( items.map((item)=>asyncReqeust(item)) )
    .then((results) => {
        if(!TG_TOKEN_MABONGPAPA || !TG_CHATID_MABONGPAPA){ return; };
        const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
        const message = "[nShop] "+text;
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);

        console.log(results);
        return "Asd";
    });
})();
*/



/*
items.forEach(item => {
    request.get({
        url: `https://openapi.naver.com/v1/search/shop.json?sort=asc&query=${encodeURI(item)}`,
        headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const data = JSON.parse(body);
            const { title, lprice, link } = data.items[0];
            console.log(title, lprice + "원");
        } else {
            console.log('error = ' + response.statusCode);
        };

        if(!TG_TOKEN_MABONGPAPA || !TG_CHATID_MABONGPAPA){ return; };
        const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
        const message = "[메르] "+text;
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);

    });
});

*/