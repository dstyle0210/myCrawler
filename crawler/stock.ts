import fs from "fs";
import {chromium} from "playwright";
import TelegramBot from "node-telegram-bot-api";
const {initializeApp} = require('firebase/app');
const { getDatabase , set , ref ,onValue, goOffline } = require('firebase/database');
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA,FIREBASE_DB} = process.env; // ENV

const RIMs = [];
let page = null;
let MARKETs = {};
let SPREADs = {spread:0};
(async () => {

    // playwright browser open
    const browser = await chromium.launch({headless:true});
    page = await browser.newPage();

    // 시장지표 구해오기
    await page.goto("https://finance.naver.com/marketindex/");
    MARKETs = await page.evaluate(()=>{
        const once = 31.1034768;
        const toNum = (selector,idx=0) => {
            const element = document.querySelectorAll(selector)[idx];
            return +element.innerText.replace(/[\n\s\t\,]/gi,"");
        };
        const isMinus = (selector,idx=0) => {
            const element = document.querySelectorAll(selector)[idx];
            return element.classList.contains("point_dn");
        }
        const result = {
            usd:toNum("#exchangeList .value"), usdchange:toNum("#exchangeList .change"), // 달러
            wti:toNum("#oilGoldList .value"), wtichange:toNum("#oilGoldList .change"), // WTI
            gold:toNum("#oilGoldList .value",2), goldchange:toNum("#oilGoldList .change",2), // 금
            kor:0
        };
        result.usdchange = isMinus("#exchangeList .head_info") ? -result.usdchange : result.usdchange;
        result.wtichange = isMinus("#oilGoldList .head_info") ? -result.wtichange : result.wtichange;
        result.goldchange = isMinus("#oilGoldList .head_info",2) ? -result.goldchange : result.goldchange;
        result.kor = Number( (result.usd * (result.gold / once)).toFixed(0) );
        return result;
    });

    // 기대수익률 구해오기
    await page.goto("https://www.kisrating.com/ratingsStatistics/statics_spread.do");
    SPREADs = await page.evaluate(()=>{
        const yyyymmdd = function(date) {
            let set = (num) => (num<10) ? "0"+num : ""+num;
            return `${date.getFullYear()}-${set(date.getMonth()+1)}-${set(date.getDate())} ${date.getHours()}:${date.getMinutes()}`;
        };
        const toNum = (element) => +element.innerText.replace(/[\n\s\t\,]/gi,"");
        const result = {
            spread:+((toNum( $(".table_ty1 table:eq(0) tr:last td:last").get(0) )/100).toFixed(4)), // 계산을 위해 소수점으로 표시
            bondSpread3Y:toNum( $(".table_ty1 table:eq(0) tr:eq(1) td:eq(7)").get(0) ), // 표시만 있어서 그대로 받음.
            date:yyyymmdd( new Date() )
        };
        return result;
    });

    
    
    // Firebase connect
    const app = initializeApp({databaseURL: FIREBASE_DB});
    const db = getDatabase(app);

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
    const codeListRaw = fs.readFileSync("./stocksCodeList.txt");
    const codeList = codeListRaw.toString().split("\n").map((code)=>code.replace("\r","")).filter(code => code);
    let count = 1;
    for await(let code of codeList){
        const stockData = await getDataRIM(code);
        console.log(`[${count++} / ${codeList.length}] ${stockData.name} : ${stockData.price}`);
        const dbRef = ref(db, `dailyStock/${stockData.code}`);
        await set(dbRef, stockData);
    };
    goOffline(db);

    // 텔레그램봇 시작
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
    bot.sendMessage(TG_CHATID_MABONGPAPA, `[STOCK] 파일생성 완료\nhttps://dstyle-stocks.web.app`);
    
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
        
        // 네이버
        await page.goto("https://finance.naver.com/item/main.naver?code="+stockCode);
        var naverData = await page.evaluate(function(){
            const toNum = (element:HTMLElement) => +element.innerText.replace(/[\n\s\t\,]/gi,"");
            const name = document.querySelector<HTMLElement>(".wrap_company h2").innerText;
            const stocks = toNum( document.querySelector("#tab_con1").getElementsByTagName("em")[2] );

            // 외인수급확인
            const foreignerTable = document.getElementsByTagName("table")[2];
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
        var data = Object.assign({
            code:stockCode, // 종목코드 저장
        },naverData,reportData);

        data.profit = reportData.profit - (naverData.stocks*reportData.dividend), // 순이익(배당금을 뺀)
        data.roe = +((data.profit/data.equity).toFixed(4));
        data.rim = +((data.roe - spread)/spread).toFixed(4); // RIM 구하기
        data.cap = Math.floor( data.equity + (data.equity*data.rim) ); // 적정주가

        // console.log(data);
        RIMs.push(data);

        await new Promise((res)=>{ setTimeout(res,1000); });
        resolve(data);
    });
};