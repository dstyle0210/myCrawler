import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import {chromium} from "playwright";
import type {Page} from "playwright";
import TelegramBot from "node-telegram-bot-api";
import {initializeApp} from "firebase/app";
import { getDatabase, set, get, ref, goOffline } from "firebase/database";
import getMARKETs from './functions/getMARKETs';
import {type T_MARKETs} from './functions/getMARKETs';
import getSPREADs from './functions/getSPREADs';
dotenv.config();
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA,FIREBASE_DB} = process.env; // ENV
const RIMs = [];
let page:Page = null;
let MARKETs:T_MARKETs = {};
let SPREADs = {spread:0};

(async () => {
    // playwright browser open
    const browser = await chromium.launch({headless:true});
    page = await browser.newPage();
    
    MARKETs = await getMARKETs(page);
    SPREADs = await getSPREADs(page);

    const app = initializeApp({databaseURL: FIREBASE_DB});
    const db = getDatabase(app);

    // 현재 리스트
    // const nowRef = ref(db, `nowList`);
    const stockList = [];
    const stockListData = await fs.readFile('stocks.txt', 'utf-8');
    const stockListLines = stockListData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    stockList.push(...stockListLines);
    /*
    await get(nowRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            snapshot.val().forEach((item) => {
                (/[0-9]{6}/).test(item.stockCode) && stockList.push(item.stockCode);
            });
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
    console.log(stockList);
    */
    
    // 시장지표 등록
    const indexRef = ref(db, `dailyIndex`);
    await set(indexRef,null);
    await set(indexRef,MARKETs);

    // 기대수익률 등록
    const rateRef = ref(db, `dailyRate`);
    await set(rateRef,null);
    await set(rateRef,SPREADs);

    // 주식정보 등록
    await set( ref(db, `dailyStock`) ,null);
    let count = 1;
    for await(let code of stockList){
        const stockData = await getDataRIM(code);
        console.log(`[${count++} / ${stockList.length}] ${stockData.name} : ${stockData.price}`);
        if(stockData.roe!=0){
            const dbRef = ref(db, `dailyStock/${stockData.code}`);
            await set(dbRef, stockData);
        }
    };

    // 텔레그램봇 시작
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
    const sendMessage = `
        [STOCK]\n 
        달러:${MARKETs.usd}(${MARKETs.usdchange})\n
        유가:$${MARKETs.wti}(${MARKETs.wtichange})\n
        골드:$${MARKETs.gold}(${MARKETs.goldchange}, ${MARKETs.kor}원)\n
        https://dstyle-stocks.web.app
    `;
    bot.sendMessage(TG_CHATID_MABONGPAPA, sendMessage);

    // Firebase unconnect
    goOffline(db);

    // playwright 종료
    await browser.close();
})();


interface RIM {
    code: string,
    name: string,
    stocks:number,
    foreigner:number,
    foreignerY:number,
    price:number,
    profit:number,
    equity:number,
    dividend:number,
    roe:number,
    rim:number,
    cap:number
};

function getDataRIM(stockCode:string):Promise<RIM>{
    return new Promise(async function(resolve,reject){
        await page.goto("https://navercomp.wisereport.co.kr/v2/company/c1010001.aspx?cmp_cd="+stockCode);
        
        var reportData = await page.evaluate(function(){
            $("#cns_Tab22").click(); // 분기탭으로 변경

            const toNum = ($element) => +$element.text().replace(/[\n\s\t\,]/gi,"");
            const $ifrs = $("table").eq(12);
            const $ifrsRows = $ifrs.find("tr");
            const price = toNum($(document.querySelector("#cTB11 .num strong")));
            
            // 예상 지배주주 순이익 구하기
            let profit = (() => {
                const values = $ifrsRows.eq(7).find("td");
                const isConsensus = toNum(values.eq(5)); // 컨센이 없다면, 0 이 떨어짐.
                const range = (isConsensus) ? values.slice(2,6) : values.slice(1,5);
                const sum = range.toArray().reduce((accValue,current)=>{
                    let v = current.innerText.replace(/[\,\s]/gi,"");
                    return accValue+(+v);
                },0);
                const test = range.toArray().map((current)=>{
                    return current.innerText.replace(/[\,\s]/gi,"");
                },0);
                return sum*100000000; // 억원
            })();

            // 최근 지배주주 지분 구하기(마지막 공시)
            let equity = (() => {
                const values = $ifrsRows.eq(12).find("td");
                return toNum(values.eq(4))*100000000; // 억원
            })();

            // 예상 배당금 구하기
            let dividend = (() => {
                const values = $ifrsRows.eq(31).find("td");
                const isConsensus = toNum(values.eq(5)); // 컨센이 없다면, 0 이 떨어짐.
                const range = (isConsensus) ? values.slice(2,6) : values.slice(1,5);
                const sum = range.toArray().reduce((accValue,current)=>{
                    let v = current.innerText.replace(/[\,\s]/gi,"");
                    return accValue+(+v);
                },0);
                const test = range.toArray().map((current)=>{
                    return current.innerText.replace(/[\,\s]/gi,"");
                },0);
                return sum; // 억원
            })();

            return {
                price,
                profit,
                equity,
                dividend
            };
        });
        
        // 네이버 https://finance.naver.com/item/main.naver?code=023160
        await page.goto("https://finance.naver.com/item/main.naver?code="+stockCode);
        var naverData = await page.evaluate(function(){
            const toNum = (element:HTMLElement) => +element.innerText.replace(/[\n\s\t\,]/gi,"");
            const name = document.querySelector<HTMLElement>(".wrap_company h2").innerText;
            const stocks = toNum( document.querySelector("#tab_con1").getElementsByTagName("em")[2] );

            // 외인수급확인
            const foreignerTable = Array.from(document.querySelectorAll(".area_tab_type")).length ? document.getElementsByTagName("table")[3] : document.getElementsByTagName("table")[2];
            const foreignerRows = Array.from(foreignerTable.getElementsByTagName("tr")).slice(2,8);
            let foreignerY = 0;
            const foreigner = foreignerRows.reduce((accValue,current:any) => {
                let v = current.getElementsByTagName("td")[2].innerText.replace(/[\,\s]/gi,"")*1;
                if(foreignerY==0) foreignerY = v;
                return accValue+(+v);
            },0);
            return {name,stocks,foreigner,foreignerY}
        });
        
        // 현재 지배주주 ROE 구하기
        const spread = SPREADs.spread;
        var data:any = Object.assign({
            code:stockCode, // 종목코드 저장
        },naverData,reportData);

        data.profit = reportData.profit - (naverData.stocks*reportData.dividend); // 순이익(배당금을 뺀)
        if(data.profit){
            data.roe = +((data.profit/data.equity).toFixed(4));
            data.rim = +((data.roe - spread)/spread).toFixed(4); // RIM 구하기
            data.cap = Math.floor( data.equity + (data.equity*data.rim) ); // 적정주가
        }else{
            data.roe = 0;
            data.rim = 0;
            data.cap = 0;
        };

        // console.log(data);
        RIMs.push(data);

        await new Promise((res)=>{ setTimeout(res,1000); });
        resolve(data);
    });
};