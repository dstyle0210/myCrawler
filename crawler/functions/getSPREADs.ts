import exp from "constants";
import type {Page} from "playwright";
interface SPREADs {
    spread: number; // 스프레드
    bondSpread3Y: number; // 3년물 스프레드
    date: string; // 날짜
};
function getSPREADs(page:Page):Promise<SPREADs>{
    return new Promise(async (resolve, reject) => {
        await page.goto("https://www.kisrating.com/ratingsStatistics/statics_spread.do");
        const SPREADs = await page.evaluate(()=>{
            const yyyymmdd = function(date) {
                let set = (num:number) => (num<10) ? "0"+num : ""+num;
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
        resolve(SPREADs);
    });
};
export default getSPREADs;