import fs from "fs";
import {chromium} from "playwright";
import dotenv from "dotenv"; dotenv.config();
import TelegramBot from "node-telegram-bot-api";
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA} = process.env; // ENV

(async () => {
    // playwright browser open
    const browser = await chromium.launch({headless:true});
    const page = await browser.newPage();

    await page.goto("https://www.hankyung.com/tag/%EB%AA%A8%EB%8B%9D%EB%B8%8C%EB%A6%AC%ED%95%91");
    await new Promise((res) => setTimeout(res,1000));
    const hankyungNews = await page.evaluate(() => {
        return $(".news-tit a").eq(0).attr("href");
    });

    await page.goto("https://www.mk.co.kr/search?word=%EB%A7%A4-%EC%84%B8-%EC%A7%80");
    await new Promise((res) => setTimeout(res,1000));
    const mkNews = await page.evaluate(() => {
        const news = $(".news_item").filter((idx,item) => {
            return (/매경이 전하는 세상의 지식/).test( $(item).find(".news_ttl").text() );
        });
        return news.eq(0).attr("href");
    });

    /*
    await page.goto("https://www.bloomberg.co.kr/blog/");
    await new Promise((res) => setTimeout(res,1000));
    const bloombergNews = await page.evaluate(() => {
        return jQuery(".h3-regular-8 a").eq(0).attr("href");
    });
    */

    await page.goto("https://blog.naver.com/PostList.naver?blogId=ranto28");
    await new Promise((res) => setTimeout(res,1000));
    const mer = await page.evaluate(() => {
        const trs = [];
        (document.querySelectorAll(".blog2_categorylist tbody tr")).forEach((tr) => {
            trs.push(tr);
        });
        const targetTrs = trs.filter((tr) => {
            const src = (tr.querySelector(".date.pcol2").innerText).split(".").map((txt)=>txt.trim());

            if(!(/[0-9]{4}/gi).test(src[0])){
                return true;
            };

            const today = new Date();
            today.setHours( today.getHours()+9 );
            const prevDay = (today.getDay()==1) ? 3 : 1; // 월요일이면 3일뺀다, 아니면 어제 기준

            const guideDate = new Date();
            guideDate.setHours( guideDate.getHours()+9 );
            guideDate.setDate(guideDate.getDate()-prevDay);

            const postDate = new Date(src[0],(src[1]-1),src[2]);
            postDate.setHours(postDate.getHours()+9);

            return (guideDate < postDate);
        });

        const result = targetTrs.map((tr)=>tr.querySelector("a").href);
        return result;
    });

    // 텔레그램봇 시작
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});

     // 텔레그램 발송
     // const cardList = [hankyungNews,mkNews,bloombergNews , ...mer];
     const cardList = [hankyungNews,mkNews, ...mer];
     for(let card of cardList){
        bot.sendMessage(TG_CHATID_MABONGPAPA, "[NEWS] "+card);
    };

    await browser.close();
})();