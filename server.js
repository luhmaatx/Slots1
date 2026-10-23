// SPOILED ROTTEN — server-authoritative Fortune Coins gameplay
// Existing players table and balances are preserved.
"use strict";
const express=require("express"),cors=require("cors"),crypto=require("crypto"),path=require("path");
const {Pool}=require("pg");
const app=express(),PORT=process.env.PORT||3000;
const BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN,DATABASE_URL=process.env.DATABASE_URL;
app.use(cors());app.use(express.json({limit:"20kb"}));
const pool=new Pool({connectionString:DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:false,max:10,connectionTimeoutMillis:10000});
pool.on("error",e=>console.error("Postgres pool error",e));
async function initializeDatabase(){
 if(!DATABASE_URL)throw Error("DATABASE_URL missing");
 const c=await pool.connect();
 try{
  await c.query(`CREATE TABLE IF NOT EXISTS players (
    telegram_id BIGINT PRIMARY KEY,username TEXT,balance BIGINT NOT NULL DEFAULT 1000,
    vip_level INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  for(const sql of [
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS username TEXT",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS balance BIGINT NOT NULL DEFAULT 1000",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS vip_level INTEGER NOT NULL DEFAULT 0",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS free_spins INTEGER NOT NULL DEFAULT 0",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS last_wheel_at TIMESTAMPTZ",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS last_scratch_at TIMESTAMPTZ",
   "ALTER TABLE players ADD COLUMN IF NOT EXISTS last_velvet_at TIMESTAMPTZ"
  ])await c.query(sql);
 }finally{c.release()}
}
function verifyTelegramInitData(initData){
 if(typeof initData!=="string"||!initData||!BOT_TOKEN)throw Error("Telegram login data missing");
 const params=new URLSearchParams(initData),hash=params.get("hash");
 if(!hash||!/^[0-9a-f]{64}$/i.test(hash))throw Error("Invalid Telegram signature");
 params.delete("hash");
 const check=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");
 const secret=crypto.createHmac("sha256","WebAppData").update(BOT_TOKEN).digest();
 const expected=crypto.createHmac("sha256",secret).update(check).digest();
 if(!crypto.timingSafeEqual(Buffer.from(hash,"hex"),expected))throw Error("Telegram verification failed");
 const date=Number(params.get("auth_date")),age=Math.floor(Date.now()/1000)-date;
 if(!Number.isFinite(date)||age < -60||age>86400)throw Error("Telegram session expired");
 const user=JSON.parse(params.get("user")||"null");
 if(!user||!Number.isSafeInteger(Number(user.id)))throw Error("Invalid Telegram user");
 return user;
}
function auth(req,res,next){
 try{req.telegramUser=verifyTelegramInitData(req.body?.initData);next()}
 catch(e){res.status(401).json({error:e.message})}
}
function nameOf(u){return String(u.username||[u.first_name,u.last_name].filter(Boolean).join(" ")||`player_${u.id}`).slice(0,100)}
async function playerFor(u){
 const r=await pool.query(`INSERT INTO players(telegram_id,username) VALUES($1,$2)
 ON CONFLICT(telegram_id) DO UPDATE SET username=EXCLUDED.username,updated_at=NOW()
 RETURNING telegram_id,username,balance,vip_level,free_spins,last_wheel_at,last_scratch_at,last_velvet_at`,[String(u.id),nameOf(u)]);
 return r.rows[0];
}
function isAvailable(ts){return !ts||new Date(ts).toISOString().slice(0,10)!==new Date().toISOString().slice(0,10)}
function state(p){return {id:String(p.telegram_id),username:p.username,balance:Number(p.balance),vipLevel:Number(p.vip_level),freeSpins:Number(p.free_spins||0),wheelAvailable:isAvailable(p.last_wheel_at),scratchAvailable:isAvailable(p.last_scratch_at),velvetAvailable:isAvailable(p.last_velvet_at)}}
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.get("/api/health",async(req,res)=>{try{await pool.query("SELECT 1");res.json({status:"ok",database:"connected",game:"SPOILED ROTTEN",version:"4.0"})}catch(e){res.status(503).json({status:"error",database:"disconnected"})}});
app.post("/api/me",auth,async(req,res)=>{try{res.json({success:true,...state(await playerFor(req.telegramUser))})}catch(e){console.error("/api/me",e);res.status(500).json({error:"Unable to load account"})}});
app.get("/api/leaderboard",async(req,res)=>{try{const r=await pool.query("SELECT username,balance FROM players ORDER BY balance DESC LIMIT 100");res.json({players:r.rows.map((p,i)=>({rank:i+1,username:p.username,balance:Number(p.balance)}))})}catch(e){res.status(500).json({error:"Leaderboard unavailable"})}});
const BETS=[300,600,1500,3000];
const WEIGHTS=[["diamond",18],["seven",8],["heart",20],["rose",18],["spade",18],["star",10],["wild",5],["scatter",3]];
const LINES=[[0,3,6,9,12],[1,4,7,10,13],[2,5,8,11,14],[0,4,8,10,12],[2,4,6,10,14]];
function rand(n){return crypto.randomInt(n)}
function symbol(){const sum=WEIGHTS.reduce((a,x)=>a+x[1],0);let r=rand(sum);for(const [name,w] of WEIGHTS){r-=w;if(r<0)return name}return "star"}
function generate(){return Array.from({length:15},symbol)}
function evaluate(symbols,bet){
 let win=0;const winningLines=[];
 LINES.forEach((line,i)=>{
  const seq=line.map(n=>symbols[n]);
  const first=seq.find(x=>x!=="wild");
  if(!first||first==="scatter")return;
  let matches=0,wilds=0;
  for(const s of seq){if(s===first||s==="wild"){matches++;if(s==="wild")wilds++}else break}
  if(matches<3)return;
  const base=[0,0,0,2,5,12][matches]*(first==="seven"?2:1);
  const multiplier=wilds?([2,3,5][rand(3)]):1;
  const lineWin=bet*base*multiplier;
  win+=lineWin;winningLines.push({line:i+1,matches,symbol:first,wilds,multiplier,win:lineWin,indexes:line.slice(0,matches)});
 });
 return {win,winningLines};
}
async function withLockedPlayer(u,handler){
 const c=await pool.connect();
 try{
  await c.query("BEGIN");
  const r=await c.query("SELECT * FROM players WHERE telegram_id=$1 FOR UPDATE",[String(u.id)]);
  if(!r.rowCount){await c.query("ROLLBACK");return {status:404,data:{error:"Account not found. Reopen the game."}}}
  const out=await handler(c,r.rows[0]);
  if(out.status>=400){await c.query("ROLLBACK");return out}
  await c.query("COMMIT");return out;
 }catch(e){try{await c.query("ROLLBACK")}catch{}throw e}finally{c.release()}
}
app.post("/api/spin",auth,async(req,res)=>{
 const bet=Number(req.body?.bet);
 if(!Number.isSafeInteger(bet)||!BETS.includes(bet))return res.status(400).json({error:"Invalid bet"});
 try{
  const out=await withLockedPlayer(req.telegramUser,async(c,p)=>{
   const free=Number(p.free_spins)>0;
   const balance=Number(p.balance);
   if(!free&&balance<bet)return {status:400,data:{error:"Not enough Fortune Coins"}};
   const symbols=generate(),payout=evaluate(symbols,bet);
   const scatterCount=symbols.filter(x=>x==="scatter").length;
   const awardedFreeSpins=scatterCount>=3?5:0;
   const remaining=Math.max(0,Number(p.free_spins)-(free?1:0))+awardedFreeSpins;
   const next=balance-(free?0:bet)+payout.win;
   if(!Number.isSafeInteger(next)||next<0)return {status:500,data:{error:"Balance limit exceeded"}};
   await c.query("UPDATE players SET balance=$1,free_spins=$2,updated_at=NOW() WHERE telegram_id=$3",[next,remaining,String(p.telegram_id)]);
   return {status:200,data:{success:true,symbols,win:payout.win,winningLines:payout.winningLines,bet,balance:next,vipLevel:Number(p.vip_level),username:p.username,freeSpinUsed:free,freeSpins:remaining,awardedFreeSpins,scatterCount}};
  });
  res.status(out.status).json(out.data);
 }catch(e){console.error("/api/spin",e);res.status(500).json({error:"Spin failed. Transaction rolled back."})}
});
app.post("/api/wheel",auth,async(req,res)=>{
 try{
  const out=await withLockedPlayer(req.telegramUser,async(c,p)=>{
   const today=new Date().toISOString().slice(0,10);
   if(p.last_wheel_at&&new Date(p.last_wheel_at).toISOString().slice(0,10)===today)return {status:429,data:{error:"Today's wheel spin has already been used",wheelAvailable:false}};
   const prizes=[100,200,300,500,750,1000,1500,2500],weights=[24,22,18,14,10,7,4,1];
   let r=rand(weights.reduce((a,b)=>a+b,0)),prize=prizes[0];
   for(let i=0;i<prizes.length;i++){r-=weights[i];if(r<0){prize=prizes[i];break}}
   const balance=Number(p.balance)+prize;
   if(!Number.isSafeInteger(balance))return {status:500,data:{error:"Balance limit exceeded"}};
   await c.query("UPDATE players SET balance=$1,last_wheel_at=NOW(),updated_at=NOW() WHERE telegram_id=$2",[balance,String(p.telegram_id)]);
   return {status:200,data:{success:true,prize,balance,wheelAvailable:false}};
  });
  res.status(out.status).json(out.data);
 }catch(e){console.error("/api/wheel",e);res.status(500).json({error:"Wheel failed. Transaction rolled back."})}
});

// Two daily Fortune Coin mini-games. Both are authenticated, rate-limited by
// the persisted UTC-day claim timestamp and transactionally update balances.
async function claimDailyGame(req,res,kind){
 const scratch=kind==="scratch";
 const field=scratch?"last_scratch_at":"last_velvet_at";
 if(!scratch&&(!Number.isSafeInteger(req.body?.door)||req.body.door<1||req.body.door>5)){
  return res.status(400).json({error:"Choose one of the five doors."});
 }
 try{
  const result=await withLockedPlayer(req.telegramUser,async(c,p)=>{
   if(!isAvailable(p[field]))return {status:429,data:{error:"You have already played today. Come back tomorrow (UTC).",[scratch?"scratchAvailable":"velvetAvailable"]:false}};
   // Weighted Fortune Coin prizes; client never selects or calculates prizes.
   const prizes=scratch?[50,100,150,250,500,1000]:[75,125,200,350,600,1200];
   const weights=[30,27,20,13,8,2];
   let ticket=rand(weights.reduce((a,b)=>a+b,0)),prize=prizes[0];
   for(let i=0;i<weights.length;i++){ticket-=weights[i];if(ticket<0){prize=prizes[i];break}}
   const balance=Number(p.balance)+prize;
   if(!Number.isSafeInteger(balance))return {status:500,data:{error:"Balance limit exceeded."}};
   // Field is chosen from a fixed allowlist above, never user-supplied SQL.
   await c.query(`UPDATE players SET balance=$1,${field}=NOW(),updated_at=NOW() WHERE telegram_id=$2`,[balance,String(p.telegram_id)]);
   return {status:200,data:{success:true,game:kind,prize,balance,[scratch?"scratchAvailable":"velvetAvailable"]:false,...(!scratch?{door:req.body.door}:{})}};
  });
  return res.status(result.status).json(result.data);
 }catch(e){console.error(`/api/${kind}`,e);return res.status(500).json({error:"Prize could not be claimed. Transaction rolled back."})}
}
app.post("/api/scratch",auth,(req,res)=>claimDailyGame(req,res,"scratch"));
app.post("/api/velvet",auth,(req,res)=>claimDailyGame(req,res,"velvet"));

app.use("/api",(req,res)=>res.status(404).json({error:"API endpoint not found"}));
app.use(express.static(__dirname));
initializeDatabase().then(()=>app.listen(PORT,"0.0.0.0",()=>console.log(`SPOILED ROTTEN listening on ${PORT}`))).catch(e=>{console.error("Startup failed",e);process.exit(1)});
