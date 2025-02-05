import {chromium} from "playwright";
import TelegramBot from "node-telegram-bot-api";
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA} = process.env; // ENV

(async () => {
    // playwright browser open
    const browser = await chromium.launch({headless:true});
    const page = await browser.newPage();

    const setMM = (mm:number) => ((mm<10) ? "0"+mm : ""+mm);
    const convertDate = (date:string) => "20"+date.replace(/[^0-9]/g,"");
    const nowDate = new Date();nowDate.setHours(nowDate.getHours() + 9); // github action UTC+0
    // const today = nowDate.getFullYear() + setMM(nowDate.getMonth()+1) + setMM(nowDate.getDate());
    const today = "20250203";


    // 추가 목록
    await page.goto("https://orangeboard.co.kr/portfolios/%40merXob?tabKey=3");
    await new Promise((res) => setTimeout(res,5000));
    const addList = await page.evaluate(() => {
        return $("tr[class^='PortfolioTable__Primary'] td:last-child").map((idx,td)=> $(td).text() ).toArray();
    });
    const isAdd = addList.find((date) => (today == convertDate(date)));

    // 삭제 목록
    await page.goto("https://orangeboard.co.kr/portfolios/%40merXob?tabKey=4");
    await new Promise((res) => setTimeout(res,5000));
    const exitList = await page.evaluate(() => {
        return $("tr[class^='PortfolioTable__Primary'] td:last-child").map((idx,td)=> $(td).text() ).toArray();
    });
    const isExit = exitList.find((date) => (today == convertDate(date)));

    await browser.close();

    // 텔레그램 발송
    if(!TG_TOKEN_MABONGPAPA || !TG_CHATID_MABONGPAPA){ return; };
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
    const message = "[MER]\n추가:"+isAdd+"\n삭제:"+isExit;
    bot.sendMessage(TG_CHATID_MABONGPAPA, message);
})();