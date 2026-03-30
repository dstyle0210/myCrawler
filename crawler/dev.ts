// 네이버 검색 API 예제 - 블로그 검색
import dotenv from 'dotenv'; dotenv.config();
import request from 'request';
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env; // ENV
const items = ['아디다스 KS2229', '아디다스 KS2231'];
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
        console.log(message);
        // bot.sendMessage(TG_CHATID_MABONGPAPA, message);
    });
});