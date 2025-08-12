import type {Page} from "playwright";
export interface T_MARKETs {
    usd?: number; // 달러환율
    usdchange?: number; // 달러환율 변화량
    wti?: number; // WTI
    wtichange?: number; // WTI 변화량
    gold?: number; // 금
    goldchange?: number; // 금 변화량
    kor?: number; // 원화환율
};
// 시장지표 구해오기
function getMARKETs(page:Page):Promise<T_MARKETs>{
    return new Promise(async (resolve, reject) => {
        await page.goto("https://finance.naver.com/marketindex/");
        const MARKETs = await page.evaluate(()=>{
            const once = 31.1034768;
            const $$ = (selector,idx=0) => document.querySelectorAll(selector)[idx];
            const toNum = (selector,idx=0) => +$$(selector,idx).innerText.replace(/[\n\s\t\,]/gi,"");
            const isMinus = (selector,idx=0) => +$$(selector,idx).classList.contains("point_dn");

            // 시장지표 기초데이터
            const result = {
                usd:toNum("#exchangeList .value"), usdchange:toNum("#exchangeList .change"), // 달러
                wti:toNum("#oilGoldList .value"), wtichange:toNum("#oilGoldList .change"), // WTI
                gold:toNum("#oilGoldList .value",2), goldchange:toNum("#oilGoldList .change",2), // 금
                kor:0
            }

            // 달러, WTI, 금의 상승/하락 여부
            result.usdchange = isMinus("#exchangeList .head_info") ? -result.usdchange : result.usdchange;
            result.wtichange = isMinus("#oilGoldList .head_info") ? -result.wtichange : result.wtichange;
            result.goldchange = isMinus("#oilGoldList .head_info",2) ? -result.goldchange : result.goldchange;
            result.kor = Number( (result.usd * (result.gold / once)).toFixed(0) );
            return result;
        });
        resolve(MARKETs);
    })
};
export default getMARKETs;