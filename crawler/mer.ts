import dotenv from 'dotenv';
import request from 'request';
const {TG_TOKEN_DSTYLESTOCK,TG_CHATID_DSTYLESTOCK} = process.env; // ENV
if (!TG_TOKEN_DSTYLESTOCK || !TG_CHATID_DSTYLESTOCK) {
    dotenv.config();
};

const setMM = (mm:number) => ((mm<10) ? "0"+mm : ""+mm);
const nowDate = new Date();nowDate.setHours(nowDate.getHours() + 9); // github action UTC+0
const today = nowDate.getFullYear() + setMM(nowDate.getMonth()+1) + setMM(nowDate.getDate());
const convertDate = (date:string) => date.replace(/[^0-9]/g,"");
// const today2 = "20250203";
request.get({
    url: "https://api.orangeboard.co.kr/v2/portfolio/@merXob/realtime"
}, function (error, response, body) {
    let text = "";
    if (!error && response.statusCode == 200) {
        const data = JSON.parse(body);
        const result = data.stockTable.find((stock) => {
            return today == convertDate(stock.startTrdDd);
        });
        // console.log(corpName , avgPrc);
        if(result){
            const {corpName , avgPrc} = result;
            text = corpName+" "+avgPrc+"원";
        }else{
            text = "신규종목없음";
        };
    } else {
        // console.log('error = ' + response.statusCode);
        text = "에러" + response.statusCode;
        
    };
    const post = `https://api.telegram.org/bot${TG_TOKEN_DSTYLESTOCK}/sendmessage?chat_id=${TG_CHATID_DSTYLESTOCK}&text=[메르] ${text}`;
    // console.log(text);
    request.get(post);
});