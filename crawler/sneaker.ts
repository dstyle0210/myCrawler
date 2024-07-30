import fs from "fs";
import {chromium} from "playwright";
import dotenv from "dotenv"; dotenv.config();
import TelegramBot from "node-telegram-bot-api";
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA} = process.env; // ENV



(async () => {
    // playwright browser open
    const browser = await chromium.launch({headless:true});
    const page = await browser.newPage();

    await page.goto("https://www.nike.com/kr/launch?s=upcoming");
    const nikeLaunchList = await page.evaluate(() => {
        var prdList = document.querySelectorAll(".product-card");
        if(!prdList.length) return [{name:"발매일정을 못가져왔습니다.",link:""}];
        const todayLaunchList:{name:String,link:String}[] = [];
        prdList.forEach((productCard) => {
            const nowDate = new Date();nowDate.setHours(nowDate.getHours() + 9); // github action UTC+0
            const today = (nowDate.getMonth()+1)+"-"+nowDate.getDate();
            const caption = productCard.querySelector(".launch-caption") as HTMLElement;
            let dday:string;
            if(caption){
                dday = caption.innerText.replace(/\s+/gi,"").replace("월","-").replace("일","");
                if(today == dday){
                    const name = (productCard.querySelector(".copy-container") as HTMLElement)?.innerText;
                    const link = (productCard.querySelector(".card-link") as HTMLAnchorElement)?.href;
                    todayLaunchList.push({name,link});
                }
            };
        });
        if(!todayLaunchList.length) return [{name:"오늘 발매없음",link:""}];
        return todayLaunchList;
    });

    // 텔레그램 발송
    if(!TG_TOKEN_MABONGPAPA || !TG_CHATID_MABONGPAPA){ return; };
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
    for(let card of nikeLaunchList){
        const message = "[SNKRS] "+card.name+"\n"+card.link;
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);
        console.log(message);
    };

    await browser.close();
})();