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
        headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET }
    }, function (error, response, body) {
        let message = "";
        if (!error && response.statusCode == 200) {
            const data = JSON.parse(body);
            if(data.items.length === 0){
                message = `[nShop] ${item} 검색 결과가 없습니다.`;
            }else{
                const { title, lprice, link } = data.items[0];
                message = "[nShop]\n"+title.replace(/<[^>]*>?/g, '')+"\n"+lprice + "원";
            };
        } else {
            message = "[nShop] "+'error = ' + response.statusCode;
        };
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);
    });
});