import dotenv from "dotenv"; dotenv.config();
import TelegramBot from "node-telegram-bot-api";
import Parser from 'rss-parser';
const {TG_TOKEN_MABONGPAPA,TG_CHATID_MABONGPAPA} = process.env; // ENV

const parser = new Parser({
  headers: {
    // 1. 서버에 XML/RSS 형식을 수용하겠다고 명시
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    // 2. 일반적인 브라우저인 것처럼 보이게 User-Agent 추가 (매우 중요)
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

const today = new Date(); // 1. 현재 날짜 객체 생성
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 5); // 2. 현재 날짜에서 1일을 뺌
const yesterdayDate = yesterday.toDateString();
let feedList = [];
function analyzeRssFeed(url: string):Promise<void>{
    return new Promise(async (res,rej)=>{
        try{
            console.log(`📡 피드를 가져오는 중: ${url}`);
            const feed = await parser.parseURL( url );
            console.log(`📌 피드 제목: ${feed.title}`);
            feed.items.slice(0, 5).forEach((item, index) => {
              const writeDate = (new Date(item.pubDate)).toDateString();
              console.log(`${yesterdayDate} , ${writeDate}`);
              // console.log(`pubDate ${item.pubDate}`);
              console.log(yesterdayDate==writeDate);
                if(yesterdayDate == writeDate){
                    feedList.push({
                      name:`${index + 1}. [${item.pubDate}] ${item.title}`,
                      link:item.link
                    });
                    console.log(`${index + 1}. [${item.pubDate}] ${item.title}`);
                    console.log(`   👉 링크: ${item.link}`);
                    console.log("");
                }
            });
            console.log("-----------------------------------------");
            res();
        }catch(err){
            console.error("❌ 피드를 가져오는 중 오류 발생:", err.message);
            rej();
        }
    });
}

const FEEDS2 = ["https://spoqa.github.io/atom.xml",];
const FEEDS = [
    "https://ridicorp.com/story-category/tech-blog/feed/",  // Tech Blog Archives - 리디주식회사 RIDI Corporation
    "https://tech.socarcorp.kr/feed.xml", // SOCAR Tech Blog
    "https://techblog.lycorp.co.jp/ko/feed/index.xml",  // LY Corporation Tech Blog
    "https://spoqa.github.io/atom.xml",   // Spoqa tech blog
    "https://techblog.yogiyo.co.kr/feed", // YOGIYO Tech Blog - 요기요 기술블로그 - Medium
    "https://meetup.nhncloud.com/rss",    // NHN Cloud Meetup
    "https://blog.banksalad.com/rss.xml", // Banksalad RSS Feed (뱅크샐러드)
    "https://blog.kmong.com/feed",        // 크몽
    "https://tech.kakaoent.com/rss.xml",  // 카카오 테크
    "https://medium.com/feed/daangn",
    "https://medium.com/feed/29cm",
    "https://d2.naver.com/d2.atom",
    "https://tech.kakaoenterprise.com/feed/",
    "https://tech.kakao.com/feed/",
    "https://tech.kakaobank.com/index.xml",
    "https://tech.kakaopay.com/rss",
    "https://medium.com/feed/coupang-tech",
    "https://medium.com/feed/@nol.tech",
    "https://dev.gmarket.com/rss",
    "https://medium.com/feed/deliverytechkorea",
    "https://medium.com/feed/zigbang",
    "https://tech.devsisters.com/rss.xml",
    "https://helloworld.kurly.com/feed.xml",
    "https://medium.com/feed/watcha",
    "https://techblog.lycorp.co.jp/ko/feed/index.xml",
    "https://ridicorp.com/story-category/tech-blog/feed/",
    "https://oliveyoung.tech/rss.xml",
    "https://gsretail.tistory.com/xml",
];

(async () => {
  try {
    let count = 0;
    for(const rss of FEEDS){
        count++;
        console.log(count+"/"+FEEDS.length);
        await analyzeRssFeed(rss);
        // if(count==2) break;
    }
    console.log(feedList);

    // 텔레그램 발송
    if(!TG_TOKEN_MABONGPAPA || !TG_CHATID_MABONGPAPA){ return; };
    const bot = new TelegramBot(TG_TOKEN_MABONGPAPA, {polling: false});
    for(let card of feedList){
        const message = "[SNKRS] "+card.name+"\n"+card.link;
        bot.sendMessage(TG_CHATID_MABONGPAPA, message);
        console.log(message);
    };

  } catch (error) {
    console.error("에러 발생!", error);
  }
})();