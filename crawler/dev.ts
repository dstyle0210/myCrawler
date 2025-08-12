import {chromium} from "playwright";
import type {Page} from "playwright";
import getMARKETs from './functions/getMARKETs_v2';
import {type T_MARKETs} from './functions/getMARKETs_v2';

let page:Page = null;
let MARKETs:T_MARKETs = {};

(async () => {
    // playwright browser open
    const browser = await chromium.launch({headless:true});
    page = await browser.newPage();
    
    MARKETs = await getMARKETs(page);
    
    const sendMessage = `
        [STOCK]
        달러:${MARKETs.usd}(${MARKETs.usdchange})
        유가:$${MARKETs.wti}(${MARKETs.wtichange})
        골드:$${MARKETs.gold}(${MARKETs.goldchange}, ${MARKETs.kor}원)
        https://dstyle-stocks.web.app
    `;
    console.log(sendMessage);

    // playwright 종료
    await browser.close();
})();