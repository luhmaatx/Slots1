<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#090706">
<title>KIMIA PRIVÉ</title>

<script src="https://telegram.org/js/telegram-web-app.js"></script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap');

:root{
  --bg:#090706;
  --panel:#120e0c;
  --panel2:#18120f;
  --gold:#d6b169;
  --gold2:#f4dca5;
  --gold3:#8d6732;
  --cream:#f7eddb;
  --muted:#a99b88;
  --danger:#d47777;
  --green:#9bc995;
  --peach:#ff9e91;
  --peach2:#ffc4ae;
}

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  margin:0;
  min-height:100%;
  background:
    radial-gradient(circle at 50% -5%,rgba(214,177,105,.18),transparent 31%),
    radial-gradient(circle at 15% 35%,rgba(255,158,145,.045),transparent 25%),
    linear-gradient(180deg,#0c0908 0%,#050404 100%);
  color:var(--cream);
  font-family:Montserrat,sans-serif;
}

body{
  min-height:100vh;
  overflow-x:hidden;
}

button,input{
  font:inherit;
}

button{
  cursor:pointer;
}

#app{
  width:100%;
  max-width:520px;
  margin:auto;
  min-height:100vh;
  padding-bottom:100px;
}

/* =========================================================
   HEADER
========================================================= */

.topbar{
  position:sticky;
  top:0;
  z-index:50;
  padding:15px 16px 12px;
  background:rgba(9,7,6,.93);
  backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(214,177,105,.14);
}

.brand{
  text-align:center;
  font-family:"Cormorant Garamond",serif;
  font-size:30px;
  letter-spacing:5px;
  color:var(--gold2);
  font-weight:600;
  text-shadow:
    0 0 10px rgba(242,214,155,.14),
    0 2px 8px rgba(0,0,0,.8);
}

.subtitle{
  text-align:center;
  font-size:8px;
  letter-spacing:4px;
  color:var(--muted);
  margin-top:-2px;
}

/* =========================================================
   BALANCE
========================================================= */

.balance-card{
  margin:14px 16px 8px;
  padding:14px 16px;
  border:1px solid rgba(214,177,105,.32);
  border-radius:17px;
  background:
    radial-gradient(circle at 20% 0%,rgba(214,177,105,.11),transparent 45%),
    linear-gradient(145deg,rgba(214,177,105,.085),rgba(255,255,255,.012));
  box-shadow:
    0 14px 38px rgba(0,0,0,.34),
    inset 0 1px 0 rgba(255,255,255,.045);
}

.balance-label{
  font-size:9px;
  letter-spacing:2px;
  color:var(--muted);
}

.balance-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-top:3px;
}

.balance{
  font-family:"Cormorant Garamond",serif;
  font-size:34px;
  color:var(--gold2);
  text-shadow:
    0 0 15px rgba(214,177,105,.13),
    0 3px 8px rgba(0,0,0,.8);
}

.vip-pill{
  border:1px solid var(--gold);
  color:var(--gold2);
  border-radius:50px;
  padding:6px 10px;
  font-size:8px;
  letter-spacing:1.5px;
  background:rgba(214,177,105,.035);
}

/* =========================================================
   LOGIN OVERLAY
========================================================= */

.login-overlay{
  position:fixed;
  inset:0;
  z-index:500;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:22px;
  background:
    radial-gradient(circle at 50% 35%,rgba(214,177,105,.12),transparent 35%),
    rgba(3,2,2,.96);
  backdrop-filter:blur(16px);
}

.login-overlay.hidden{
  display:none;
}

.login-card{
  width:100%;
  max-width:390px;
  padding:30px 24px;
  text-align:center;
  border:1px solid rgba(214,177,105,.42);
  border-radius:22px;
  background:
    radial-gradient(circle at 50% 0%,rgba(214,177,105,.12),transparent 50%),
    linear-gradient(145deg,#18110d,#0c0807);
  box-shadow:
    0 30px 90px rgba(0,0,0,.8),
    inset 0 1px 0 rgba(255,255,255,.05);
}

.login-logo{
  font-family:"Cormorant Garamond",serif;
  font-size:31px;
  letter-spacing:5px;
  color:var(--gold2);
}

.login-status{
  margin-top:8px;
  color:var(--muted);
  font-size:9px;
  line-height:1.7;
}

.login-retry{
  width:100%;
  margin-top:20px;
  padding:14px;
  border:1px solid var(--gold);
  border-radius:11px;
  background:linear-gradient(180deg,#e1c17a,#a77c38);
  color:#100b07;
  font-weight:700;
  letter-spacing:1.5px;
}

.login-retry:disabled{
  opacity:.55;
}

/* =========================================================
   SCREENS
========================================================= */

.screen{
  display:none;
  padding:0 16px;
}

.screen.active{
  display:block;
}

.section-title{
  margin:19px 0 5px;
  font-family:"Cormorant Garamond",serif;
  font-size:28px;
  color:var(--gold2);
}

.section-sub{
  font-size:10px;
  color:var(--muted);
  line-height:1.6;
  margin-bottom:17px;
}

/* =========================================================
   SLOT MACHINE
========================================================= */

.slot-machine{
  margin-top:14px;
  padding:14px;
  border:1px solid rgba(214,177,105,.35);
  border-radius:21px;
  background:
    radial-gradient(circle at 50% 0%,rgba(214,177,105,.08),transparent 45%),
    linear-gradient(145deg,#1a130f,#0a0807);
  box-shadow:
    0 22px 60px rgba(0,0,0,.58),
    inset 0 1px 0 rgba(255,255,255,.035),
    inset 0 -20px 30px rgba(0,0,0,.25);
}

.reels{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:6px;
  padding:8px;
  border-radius:15px;
  background:
    linear-gradient(145deg,#080706,#020202);
  border:1px solid rgba(214,177,105,.22);
  box-shadow:
    inset 0 0 25px rgba(0,0,0,.95),
    0 3px 15px rgba(0,0,0,.4);
}

.reel{
  position:relative;
  height:94px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:space-around;
  overflow:hidden;
  border-radius:10px;
  background:
    linear-gradient(180deg,#241a14,#0a0807);
  border:1px solid rgba(214,177,105,.13);
  box-shadow:
    inset 0 0 18px rgba(0,0,0,.9),
    inset 0 1px 0 rgba(255,255,255,.035);
}

.reel:after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(180deg,rgba(255,255,255,.035),transparent 25%,transparent 75%,rgba(0,0,0,.22));
}

.symbol{
  position:relative;
  z-index:2;
  width:38px;
  height:30px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:26px;
  line-height:1;
  font-weight:700;
  filter:
    drop-shadow(0 4px 3px rgba(0,0,0,.9))
    drop-shadow(0 0 7px rgba(255,215,150,.08));
  transition:transform .15s;
}

.symbol.small{
  transform:scale(.82);
}

/* ---------------------------------------------------------
   3D SYMBOLS
--------------------------------------------------------- */

.symbol.diamond{
  width:26px;
  height:26px;
  transform:rotate(45deg);
  border-radius:5px;
  background:
    linear-gradient(135deg,#ffffff 0%,#dff7ff 16%,#70dfff 42%,#2374b5 72%,#10253e 100%);
  box-shadow:
    inset -5px -5px 8px rgba(0,0,0,.42),
    inset 4px 4px 5px rgba(255,255,255,.8),
    0 0 10px rgba(90,210,255,.3);
}

.symbol.diamond:after{
  content:"";
  width:10px;
  height:10px;
  border-radius:50%;
  background:rgba(255,255,255,.55);
  filter:blur(2px);
}

.symbol.seven{
  font-family:"Cormorant Garamond",serif;
  font-size:35px;
  color:#f5d88f;
  text-shadow:
    1px 2px 0 #79572a,
    2px 4px 5px rgba(0,0,0,.9),
    0 0 12px rgba(242,214,155,.4);
}

.symbol.peach{
  width:31px;
  height:27px;
  border-radius:50% 50% 46% 46%;
  background:
    radial-gradient(circle at 35% 25%,#ffd6c8 0 8%,transparent 10%),
    linear-gradient(145deg,#ffc0ae 0%,#ff9588 45%,#d95058 100%);
  box-shadow:
    inset -6px -5px 7px rgba(112,25,25,.38),
    inset 5px 4px 7px rgba(255,255,255,.38),
    0 4px 8px rgba(0,0,0,.85),
    0 0 12px rgba(255,145,130,.2);
}

.symbol.peach:before{
  content:"";
  position:absolute;
  width:13px;
  height:7px;
  top:-5px;
  right:3px;
  border-radius:100% 0 100% 0;
  background:linear-gradient(135deg,#d9b86c,#7b6335);
  transform:rotate(-20deg);
  box-shadow:1px 2px 2px rgba(0,0,0,.5);
}

.symbol.peach:after{
  content:"";
  position:absolute;
  width:3px;
  height:18px;
  top:5px;
  left:14px;
  border-radius:50%;
  background:rgba(119,35,35,.28);
}

.symbol.heart{
  width:29px;
  height:26px;
  background:linear-gradient(145deg,#ff9eae,#bd344d 65%,#641928);
  transform:rotate(-45deg);
  border-radius:5px 0 5px 0;
  box-shadow:
    inset 4px 4px 5px rgba(255,255,255,.35),
    inset -5px -5px 8px rgba(65,0,12,.45),
    0 5px 8px rgba(0,0,0,.8),
    0 0 10px rgba(255,90,120,.25);
}

.symbol.heart:before,
.symbol.heart:after{
  content:"";
  position:absolute;
  width:29px;
  height:29px;
  border-radius:50%;
  background:inherit;
}

.symbol.heart:before{
  top:-14px;
  left:0;
}

.symbol.heart:after{
  left:14px;
  top:0;
}

.symbol.spade{
  width:28px;
  height:28px;
  background:linear-gradient(145deg,#484848,#080808);
  clip-path:polygon(50% 0,100% 60%,75% 75%,65% 75%,65% 100%,35% 100%,35% 75%,25% 75%,0 60%);
  box-shadow:0 4px 7px rgba(0,0,0,.9);
}

.symbol.sparkle{
  color:#f9e6ae;
  font-size:31px;
  text-shadow:
    0 0 4px #fff,
    0 0 9px rgba(242,214,155,.8),
    0 0 18px rgba(214,177,105,.4),
    2px 3px 4px rgba(0,0,0,.9);
}

.payline{
  margin:12px 0 4px;
  text-align:center;
  font-size:8px;
  letter-spacing:2px;
  color:var(--muted);
}

.spin-btn{
  width:100%;
  margin-top:12px;
  padding:16px;
  border:1px solid var(--gold);
  border-radius:12px;
  background:
    linear-gradient(180deg,#e5c47c,#aa7e3b 72%,#805d2c);
  color:#120d08;
  font-weight:700;
  letter-spacing:3px;
  box-shadow:
    0 9px 25px rgba(214,177,105,.18),
    inset 0 1px 0 rgba(255,255,255,.35);
}

.spin-btn:active{
  transform:scale(.98);
}

.spin-btn:disabled{
  opacity:.45;
}

.bet-row{
  display:flex;
  gap:8px;
  margin-top:9px;
}

.bet-btn{
  flex:1;
  padding:10px 5px;
  border:1px solid rgba(214,177,105,.25);
  background:#110c0a;
  color:var(--muted);
  border-radius:9px;
  font-size:9px;
}

.bet-btn.selected{
  border-color:var(--gold);
  color:var(--gold2);
  background:rgba(214,177,105,.06);
  box-shadow:inset 0 0 12px rgba(214,177,105,.04);
}

/* =========================================================
   ACTION BUTTONS
========================================================= */

.action-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:14px;
}

.action-btn{
  padding:15px 10px;
  border-radius:13px;
  border:1px solid rgba(214,177,105,.25);
  background:
    linear-gradient(145deg,#17100d,#0d0908);
  color:var(--cream);
  text-align:left;
  box-shadow:0 8px 20px rgba(0,0,0,.25);
}

.action-btn strong{
  display:block;
  font-size:11px;
  margin-bottom:4px;
  color:var(--gold2);
}

.action-btn span{
  font-size:8px;
  color:var(--muted);
}

/* =========================================================
   REWARDS
========================================================= */

.reward-card{
  position:relative;
  margin:10px 0;
  padding:17px;
  border:1px solid rgba(214,177,105,.24);
  border-radius:16px;
  background:
    radial-gradient(circle at 100% 0%,rgba(214,177,105,.06),transparent 40%),
    linear-gradient(145deg,#17100d,#0d0908);
  box-shadow:0 10px 28px rgba(0,0,0,.25);
}

.reward-top{
  display:flex;
  justify-content:space-between;
  gap:10px;
}

.reward-icon{
  width:38px;
  height:38px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid rgba(214,177,105,.28);
  border-radius:12px;
  color:var(--gold2);
  background:rgba(214,177,105,.045);
  box-shadow:inset 0 0 14px rgba(214,177,105,.04);
}

.reward-name{
  font-family:"Cormorant Garamond",serif;
  font-size:23px;
  color:var(--gold2);
}

.reward-desc{
  margin:6px 0 13px;
  color:var(--muted);
  font-size:9px;
  line-height:1.6;
}

.reward-cost{
  color:var(--gold);
  font-size:10px;
  letter-spacing:1px;
}

.redeem-btn{
  width:100%;
  margin-top:12px;
  padding:11px;
  border-radius:9px;
  border:1px solid var(--gold);
  background:transparent;
  color:var(--gold2);
  font-size:9px;
  letter-spacing:1px;
}

.redeem-btn:disabled{
  opacity:.35;
}

/* =========================================================
   WALLET
========================================================= */

.wallet-box{
  padding:20px;
  margin-top:12px;
  border:1px solid rgba(214,177,105,.3);
  border-radius:18px;
  background:
    radial-gradient(circle at 50% 0%,rgba(214,177,105,.08),transparent 55%),
    linear-gradient(145deg,#18120e,#0d0908);
  text-align:center;
  box-shadow:0 15px 35px rgba(0,0,0,.35);
}

.wallet-number{
  font-family:"Cormorant Garamond",serif;
  font-size:43px;
  color:var(--gold2);
  text-shadow:0 3px 9px rgba(0,0,0,.8);
}

.wallet-label{
  font-size:8px;
  letter-spacing:3px;
  color:var(--muted);
}

.history{
  margin-top:15px;
}

.history-item{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:13px 2px;
  border-bottom:1px solid rgba(214,177,105,.1);
}

.history-left strong{
  display:block;
  font-size:10px;
}

.history-left span{
  font-size:8px;
  color:var(--muted);
}

.plus{
  color:var(--green);
}

.minus{
  color:var(--danger);
}

/* =========================================================
   GIFT
========================================================= */

.form-box{
  margin-top:15px;
  padding:18px;
  border:1px solid rgba(214,177,105,.28);
  border-radius:17px;
  background:
    linear-gradient(145deg,#15100d,#0d0908);
  box-shadow:0 12px 30px rgba(0,0,0,.28);
}

.field-label{
  display:block;
  margin-bottom:7px;
  color:var(--muted);
  font-size:8px;
  letter-spacing:1.5px;
}

.text-input{
  width:100%;
  padding:13px;
  border-radius:9px;
  border:1px solid rgba(214,177,105,.25);
  background:#080606;
  color:var(--cream);
  outline:none;
}

.text-input:focus{
  border-color:var(--gold);
}

.amount-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:7px;
  margin-top:8px;
}

.amount-btn{
  padding:11px 5px;
  border:1px solid rgba(214,177,105,.2);
  border-radius:8px;
  background:#0d0908;
  color:var(--muted);
  font-size:9px;
}

.amount-btn.selected{
  border-color:var(--gold);
  color:var(--gold2);
}

.gift-btn{
  width:100%;
  margin-top:15px;
  padding:14px;
  border:1px solid var(--gold);
  border-radius:10px;
  background:linear-gradient(180deg,#d9b96f,#a77c38);
  color:#120d08;
  font-weight:700;
  letter-spacing:1.5px;
}

/* =========================================================
   VIP
========================================================= */

.vip-card{
  margin-top:15px;
  padding:22px;
  border-radius:18px;
  border:1px solid var(--gold);
  background:
    radial-gradient(circle at 50% 0%,rgba(214,177,105,.13),transparent 50%),
    #100b09;
  text-align:center;
  box-shadow:0 18px 45px rgba(0,0,0,.35);
}

.vip-crown{
  font-size:36px;
  color:var(--gold2);
  text-shadow:0 0 12px rgba(214,177,105,.3);
}

.vip-level{
  margin-top:5px;
  font-family:"Cormorant Garamond",serif;
  font-size:31px;
  color:var(--gold2);
}

.progress{
  height:5px;
  margin-top:18px;
  background:#261c15;
  border-radius:10px;
  overflow:hidden;
}

.progress-bar{
  width:62%;
  height:100%;
  background:linear-gradient(90deg,#9d7133,#f0d493);
}

/* =========================================================
   MODAL
========================================================= */

.modal{
  position:fixed;
  inset:0;
  z-index:100;
  display:none;
  align-items:center;
  justify-content:center;
  padding:20px;
  background:rgba(0,0,0,.78);
  backdrop-filter:blur(9px);
}

.modal.show{
  display:flex;
}

.modal-card{
  width:100%;
  max-width:390px;
  padding:23px;
  border:1px solid var(--gold);
  border-radius:18px;
  background:
    radial-gradient(circle at 50% 0%,rgba(214,177,105,.1),transparent 50%),
    #100c0a;
  box-shadow:0 25px 80px rgba(0,0,0,.7);
  text-align:center;
}

.modal-title{
  font-family:"Cormorant Garamond",serif;
  font-size:28px;
  color:var(--gold2);
}

.modal-text{
  margin:10px 0 18px;
  color:var(--muted);
  font-size:10px;
  line-height:1.7;
}

.modal-buttons{
  display:flex;
  gap:8px;
}

.modal-buttons button{
  flex:1;
  padding:12px;
  border-radius:9px;
}

.cancel{
  border:1px solid rgba(255,255,255,.15);
  background:#17110f;
  color:var(--muted);
}

.confirm{
  border:1px solid var(--gold);
  background:var(--gold);
  color:#100b08;
}

/* =========================================================
   NAV
========================================================= */

.bottom-nav{
  position:fixed;
  z-index:60;
  bottom:0;
  left:50%;
  transform:translateX(-50%);
  width:100%;
  max-width:520px;
  display:grid;
  grid-template-columns:repeat(5,1fr);
  padding:8px 7px calc(8px + env(safe-area-inset-bottom));
  background:rgba(9,7,6,.97);
  border-top:1px solid rgba(214,177,105,.18);
  backdrop-filter:blur(18px);
}

.nav-btn{
  border:0;
  background:none;
  color:#756b60;
  padding:6px 2px;
  font-size:8px;
}

.nav-icon{
  display:block;
  font-size:18px;
  margin-bottom:3px;
}

.nav-btn.active{
  color:var(--gold2);
}

/* =========================================================
   TOAST
========================================================= */

.toast{
  position:fixed;
  z-index:600;
  left:50%;
  bottom:85px;
  transform:translate(-50%,20px);
  width:calc(100% - 40px);
  max-width:420px;
  padding:13px 15px;
  border:1px solid var(--gold);
  border-radius:11px;
  background:#120d0a;
  color:var(--cream);
  text-align:center;
  font-size:9px;
  opacity:0;
  pointer-events:none;
  transition:.25s;
  box-shadow:0 10px 30px rgba(0,0,0,.5);
}

.toast.show{
  opacity:1;
  transform:translate(-50%,0);
}

.hidden{
  display:none!important;
}
</style>
</head>

<body>

<!-- =======================================================
     LOGIN
======================================================= -->

<div class="login-overlay" id="loginOverlay">

  <div class="login-card">

    <div class="login-logo">KIMIA PRIVÉ</div>

    <div class="login-status" id="loginStatus">
      Connecting to your PRIVÉ account…
    </div>

    <button
      class="login-retry"
      id="loginRetry"
      type="button"
      onclick="loginPlayer()"
    >
      RETRY LOGIN
    </button>

  </div>

</div>

<div id="app">

<header class="topbar">
  <div class="brand">KIMIA PRIVÉ</div>
  <div class="subtitle">PLAY • WIN • PRIVÉ</div>
</header>

<div class="balance-card">
  <div class="balance-label">PRIVÉ COINS</div>

  <div class="balance-row">

    <div class="balance" id="balance">—</div>

    <div class="vip-pill" id="vipStatus">
      VIP 0
    </div>

  </div>
</div>

<!-- =======================================================
     PLAY
======================================================= -->

<section class="screen active" id="screen-play">

  <div class="slot-machine">

    <div class="reels" id="reels">

      <div class="reel">
        <div class="symbol diamond"></div>
        <div class="symbol sparkle">✦</div>
        <div class="symbol peach"></div>
      </div>

      <div class="reel">
        <div class="symbol seven">7</div>
        <div class="symbol heart"></div>
        <div class="symbol sparkle">✦</div>
      </div>

      <div class="reel">
        <div class="symbol diamond"></div>
        <div class="symbol peach"></div>
        <div class="symbol heart"></div>
      </div>

      <div class="reel">
        <div class="symbol sparkle">✦</div>
        <div class="symbol spade"></div>
        <div class="symbol diamond"></div>
      </div>

      <div class="reel">
        <div class="symbol heart"></div>
        <div class="symbol seven">7</div>
        <div class="symbol sparkle">✦</div>
      </div>

    </div>

    <div class="payline">
      5 REELS • 3 ROWS • 5 PAYLINES
    </div>

    <!-- IMPORTANT:
         These values now exactly match server.js:
         300 / 600 / 1500 / 3000
    -->

    <div class="bet-row">

      <button class="bet-btn selected" data-bet="300">
        300
      </button>

      <button class="bet-btn" data-bet="600">
        600
      </button>

      <button class="bet-btn" data-bet="1500">
        1.5K
      </button>

      <button class="bet-btn" data-bet="3000">
        3K
      </button>

    </div>

    <button class="spin-btn" id="spinBtn">
      SPIN
    </button>

  </div>

  <div class="action-grid">

    <button class="action-btn" onclick="showScreen('rewards')">
      <strong>REWARDS</strong>
      <span>Redeem your PRIVÉ coins</span>
    </button>

    <button class="action-btn" onclick="showScreen('gift')">
      <strong>GIFT COINS</strong>
      <span>Send coins to another player</span>
    </button>

  </div>

</section>

<!-- =======================================================
     WALLET
======================================================= -->

<section class="screen" id="screen-wallet">

  <div class="section-title">
    Your Wallet
  </div>

  <div class="section-sub">
    Your balance is synchronized directly with your PRIVÉ account.
  </div>

  <div class="wallet-box">

    <div class="wallet-label">
      AVAILABLE COINS
    </div>

    <div class="wallet-number" id="walletBalance">
      —
    </div>

  </div>

  <div class="history">

    <div class="section-title" style="font-size:22px">
      Recent Activity
    </div>

    <div id="historyList">

      <div class="history-item">

        <div class="history-left">

          <strong>
            Account connected
          </strong>

          <span>
            Your current server balance is shown above.
          </span>

        </div>

        <div>—</div>

      </div>

    </div>

  </div>

</section>

<!-- =======================================================
     REWARDS
======================================================= -->

<section class="screen" id="screen-rewards">

  <div class="section-title">
    PRIVÉ Rewards
  </div>

  <div class="section-sub">
    Turn your PRIVÉ coins into exclusive perks, discounts and access.
  </div>

  <div class="reward-card">

    <div class="reward-top">

      <div>

        <div class="reward-name">
          10% OFF
        </div>

        <div class="reward-desc">
          Take 10% off an eligible PRIVÉ subscription.
        </div>

      </div>

      <div class="reward-icon">
        %
      </div>

    </div>

    <div class="reward-cost">
      5,000 COINS
    </div>

    <button
      class="redeem-btn"
      onclick="requestRedeem('10% OFF Subscription',5000)"
    >
      REDEEM
    </button>

  </div>

  <div class="reward-card">

    <div class="reward-top">

      <div>

        <div class="reward-name">
          24-HOUR ACCESS
        </div>

        <div class="reward-desc">
          Unlock a 24-hour promotional access reward.
        </div>

      </div>

      <div class="reward-icon">
        24
      </div>

    </div>

    <div class="reward-cost">
      10,000 COINS
    </div>

    <button
      class="redeem-btn"
      onclick="requestRedeem('24-Hour Access',10000)"
    >
      REDEEM
    </button>

  </div>

  <div class="reward-card">

    <div class="reward-top">

      <div>

        <div class="reward-name">
          25% OFF
        </div>

        <div class="reward-desc">
          Receive 25% off an eligible subscription or content purchase.
        </div>

      </div>

      <div class="reward-icon">
        ◆
      </div>

    </div>

    <div class="reward-cost">
      25,000 COINS
    </div>

    <button
      class="redeem-btn"
      onclick="requestRedeem('25% OFF Subscription',25000)"
    >
      REDEEM
    </button>

  </div>

  <div class="reward-card">

    <div class="reward-top">

      <div>

        <div class="reward-name">
          7-DAY PRIVÉ
        </div>

        <div class="reward-desc">
          Unlock a seven-day promotional access reward.
        </div>

      </div>

      <div class="reward-icon">
        7
      </div>

    </div>

    <div class="reward-cost">
      50,000 COINS
    </div>

    <button
      class="redeem-btn"
      onclick="requestRedeem('7-Day Privé Access',50000)"
    >
      REDEEM
    </button>

  </div>

  <div class="reward-card">

    <div class="reward-top">

      <div>

        <div class="reward-name">
          MYSTERY PRIVÉ
        </div>

        <div class="reward-desc">
          A surprise reward selected from the current PRIVÉ collection.
        </div>

      </div>

      <div class="reward-icon">
        ?
      </div>

    </div>

    <div class="reward-cost">
      75,000 COINS
    </div>

    <button
      class="redeem-btn"
      onclick="requestRedeem('Mystery Privé Reward',75000)"
    >
      REDEEM
    </button>

  </div>

</section>

<!-- =======================================================
     GIFT
======================================================= -->

<section class="screen" id="screen-gift">

  <div class="section-title">
    Gift Coins
  </div>

  <div class="section-sub">
    Send PRIVÉ coins to another player.
  </div>

  <div class="form-box">

    <label class="field-label">
      RECIPIENT TELEGRAM USERNAME
    </label>

    <input
      class="text-input"
      id="recipient"
      placeholder="@username"
      autocomplete="off"
      maxlength="64"
    >

    <label
      class="field-label"
      style="margin-top:18px"
    >
      GIFT AMOUNT
    </label>

    <div class="amount-grid">

      <button class="amount-btn" data-gift="1000">
        1,000
      </button>

      <button class="amount-btn" data-gift="5000">
        5,000
      </button>

      <button class="amount-btn" data-gift="10000">
        10,000
      </button>

      <button class="amount-btn" data-gift="25000">
        25,000
      </button>

      <button class="amount-btn" data-gift="50000">
        50,000
      </button>

      <button class="amount-btn" data-gift="100000">
        100,000
      </button>

    </div>

    <input
      class="text-input"
      id="customAmount"
      type="number"
      min="1"
      step="1"
      placeholder="Or enter custom amount"
      style="margin-top:9px"
    >

    <button
      class="gift-btn"
      onclick="prepareGift()"
    >
      SEND COINS
    </button>

  </div>

</section>

<!-- =======================================================
     VIP
======================================================= -->

<section class="screen" id="screen-vip">

  <div class="section-title">
    PRIVÉ VIP
  </div>

  <div class="section-sub">
    Higher status. Better perks. More PRIVÉ.
  </div>

  <div class="vip-card">

    <div class="vip-crown">
      ♛
    </div>

    <div
      class="vip-level"
      id="vipLevel"
    >
      PRIVÉ MEMBER
    </div>

    <div
      class="section-sub"
      style="margin:8px 0 0"
    >
      Your VIP benefits will appear here.
    </div>

    <div class="progress">
      <div
        class="progress-bar"
        id="vipProgress"
      ></div>
    </div>

    <div style="
      margin-top:10px;
      font-size:8px;
      color:var(--muted);
    ">
      VIP PROGRESS
    </div>

  </div>

  <div class="action-grid">

    <button class="action-btn">

      <strong>
        COIN BONUS
      </strong>

      <span>
        Higher VIP levels can receive boosted rewards.
      </span>

    </button>

    <button class="action-btn">

      <strong>
        VIP REWARDS
      </strong>

      <span>
        Special rewards can be limited to VIP players.
      </span>

    </button>

  </div>

</section>

</div>

<!-- =======================================================
     BOTTOM NAV
======================================================= -->

<nav class="bottom-nav">

  <button
    class="nav-btn active"
    data-screen="play"
  >
    <span class="nav-icon">♛</span>
    PLAY
  </button>

  <button
    class="nav-btn"
    data-screen="wallet"
  >
    <span class="nav-icon">◆</span>
    WALLET
  </button>

  <button
    class="nav-btn"
    data-screen="rewards"
  >
    <span class="nav-icon">✦</span>
    REWARDS
  </button>

  <button
    class="nav-btn"
    data-screen="gift"
  >
    <span class="nav-icon">♡</span>
    GIFT
  </button>

  <button
    class="nav-btn"
    data-screen="vip"
  >
    <span class="nav-icon">♛</span>
    VIP
  </button>

</nav>

<!-- =======================================================
     CONFIRMATION MODAL
======================================================= -->

<div
  class="modal"
  id="confirmModal"
>

  <div class="modal-card">

    <div
      class="modal-title"
      id="modalTitle"
    >
      Confirm
    </div>

    <div
      class="modal-text"
      id="modalText"
    >
      Are you sure?
    </div>

    <div class="modal-buttons">

      <button
        class="cancel"
        onclick="closeModal()"
      >
        CANCEL
      </button>

      <button
        class="confirm"
        id="confirmBtn"
      >
        CONFIRM
      </button>

    </div>

  </div>

</div>

<div
  class="toast"
  id="toast"
></div>

<script>
/* =========================================================
   KIMIA PRIVÉ
   FRONTEND / SERVER-SYNCED VERSION
========================================================= */

const tg =
  window.Telegram &&
  window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;

if(tg){
  tg.ready();
  tg.expand();
}

/* =========================================================
   STATE
========================================================= */

let balance = 0;
let selectedBet = 300;
let selectedGift = 0;
let spinning = false;
let loggedIn = false;

let pendingReward = null;
let pendingGift = null;

/*
  IMPORTANT:
  These are EXACTLY the values accepted by server.js.
*/
const BET_OPTIONS = [
  300,
  600,
  1500,
  3000
];

/*
  server.js returns these exact symbol strings.
  We convert them into visual CSS symbols so
  the user does not see emoji artwork.
*/
const SERVER_SYMBOL_MAP = {

  "💎":{
    className:"diamond",
    text:""
  },

  "7️⃣":{
    className:"seven",
    text:"7"
  },

  "💗":{
    className:"heart",
    text:""
  },

  "🌹":{
    className:"peach",
    text:""
  },

  "♠️":{
    className:"spade",
    text:""
  },

  "✨":{
    className:"sparkle",
    text:"✦"
  }

};

/* =========================================================
   HELPERS
========================================================= */

const $ = id =>
  document.getElementById(id);

function formatCoins(value){

  return Number(value || 0)
    .toLocaleString();

}

function showToast(message){

  const toast = $("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(()=>{
    toast.classList.remove("show");
  },2800);

}

function setBalance(value){

  const numeric =
    Number(value);

  if(!Number.isFinite(numeric)){
    return;
  }

  balance = numeric;

  $("balance").textContent =
    formatCoins(balance);

  $("walletBalance").textContent =
    formatCoins(balance);

}

function setVip(value){

  if(
    value === undefined ||
    value === null
  ){
    return;
  }

  const text =
    "VIP " + String(value);

  $("vipStatus").textContent =
    text;

  $("vipLevel").textContent =
    text;

}

/* =========================================================
   NAVIGATION
========================================================= */

function showScreen(name){

  document
    .querySelectorAll(".screen")
    .forEach(screen=>{
      screen.classList.remove("active");
    });

  const target =
    $("screen-" + name);

  if(target){
    target.classList.add("active");
  }

  document
    .querySelectorAll(".nav-btn")
    .forEach(btn=>{
      btn.classList.toggle(
        "active",
        btn.dataset.screen === name
      );
    });

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}

document
  .querySelectorAll(".nav-btn")
  .forEach(btn=>{

    btn.addEventListener("click",()=>{

      showScreen(
        btn.dataset.screen
      );

    });

  });

/* =========================================================
   BET SELECTION
========================================================= */

document
  .querySelectorAll(".bet-btn")
  .forEach(btn=>{

    btn.addEventListener("click",()=>{

      const bet =
        Number(btn.dataset.bet);

      if(!BET_OPTIONS.includes(bet)){
        return;
      }

      document
        .querySelectorAll(".bet-btn")
        .forEach(x=>{
          x.classList.remove("selected");
        });

      btn.classList.add("selected");

      selectedBet = bet;

    });

  });

/* =========================================================
   GIFT AMOUNTS
========================================================= */

document
  .querySelectorAll(".amount-btn")
  .forEach(btn=>{

    btn.addEventListener("click",()=>{

      document
        .querySelectorAll(".amount-btn")
        .forEach(x=>{
          x.classList.remove("selected");
        });

      btn.classList.add("selected");

      selectedGift =
        Number(btn.dataset.gift);

      $("customAmount").value = "";

    });

  });

/* =========================================================
   API
========================================================= */

async function api(path,options={}){

  /*
    YOUR SERVER.JS EXPECTS:

      req.body.initData

    Therefore we MUST put Telegram initData
    inside the JSON request body.

    The old frontend only put it in a header,
    which caused verifyTelegram() to receive
    undefined and login to fail.
  */

  if(!tg || !tg.initData){

    throw new Error(
      "Open KIMIA PRIVÉ from Telegram to log in."
    );

  }

  const body =
    options.body
      ? JSON.parse(options.body)
      : {};

  body.initData =
    tg.initData;

  const response =
    await fetch(path,{

      ...options,

      method:
        options.method || "POST",

      headers:{
        "Content-Type":
          "application/json",

        ...(options.headers || {})
      },

      body:
        JSON.stringify(body)

    });

  const text =
    await response.text();

  let data;

  try{

    data =
      JSON.parse(text);

  }catch{

    throw new Error(
      "Server returned an invalid response."
    );

  }

  if(!response.ok){

    throw new Error(
      data.error ||
      data.message ||
      "Server request failed."
    );

  }

  return data;

}

/* =========================================================
   LOGIN
========================================================= */

async function loginPlayer(){

  const overlay =
    $("loginOverlay");

  const status =
    $("loginStatus");

  const retry =
    $("loginRetry");

  retry.disabled = true;

  retry.textContent =
    "CONNECTING…";

  status.textContent =
    "Connecting to your PRIVÉ account…";

  try{

    /*
      Exact endpoint from server.js.
    */

    const data =
      await api("/api/me",{
        method:"POST",
        body:JSON.stringify({})
      });

    /*
      Exact response fields from server.js:

        id
        username
        balance
        vipLevel
    */

    if(
      !data ||
      data.balance === undefined
    ){

      throw new Error(
        "Your account balance could not be loaded."
      );

    }

    setBalance(
      data.balance
    );

    setVip(
      data.vipLevel
    );

    loggedIn = true;

    overlay.classList.add("hidden");

    showToast(
      "WELCOME TO KIMIA PRIVÉ"
    );

  }catch(error){

    loggedIn = false;

    status.innerHTML =
      "<strong style='color:var(--cream)'>" +
      "LOGIN FAILED" +
      "</strong><br>" +
      error.message;

    retry.disabled = false;

    retry.textContent =
      "RETRY LOGIN";

  }

}

/* =========================================================
   SERVER SYMBOL RENDERING
========================================================= */

function renderServerSymbol(element,value){

  const info =
    SERVER_SYMBOL_MAP[value];

  /*
    If server returns an unexpected symbol,
    use a neutral luxury fallback.
  */

  if(!info){

    element.className =
      "symbol sparkle";

    element.textContent =
      "✦";

    return;

  }

  element.className =
    "symbol " + info.className;

  element.textContent =
    info.text;

}

/* =========================================================
   REEL ANIMATION
========================================================= */

const animationSymbols = [
  "💎",
  "7️⃣",
  "💗",
  "🌹",
  "♠️",
  "✨"
];

function randomServerSymbol(){

  return animationSymbols[
    Math.floor(
      Math.random() *
      animationSymbols.length
    )
  ];

}

function animateReels(){

  const reels =
    document.querySelectorAll(".reel");

  reels.forEach((reel,index)=>{

    let count = 0;

    const timer =
      setInterval(()=>{

        const children =
          reel.querySelectorAll(".symbol");

        children.forEach(symbol=>{

          renderServerSymbol(
            symbol,
            randomServerSymbol()
          );

        });

        count++;

        if(
          count >
          12 + index * 4
        ){

          clearInterval(timer);

        }

      },55);

  });

}

/* =========================================================
   SPIN
========================================================= */

async function spin(){

  if(spinning){
    return;
  }

  if(!loggedIn){

    showToast(
      "PLEASE LOG IN FIRST"
    );

    return;

  }

  if(balance < selectedBet){

    showToast(
      "NOT ENOUGH PRIVÉ COINS"
    );

    return;

  }

  spinning = true;

  const button =
    $("spinBtn");

  button.disabled = true;

  button.textContent =
    "SPINNING…";

  animateReels();

  try{

    /*
      Exact server endpoint:
        POST /api/spin

      Exact server input:
        initData
        bet
    */

    const data =
      await api("/api/spin",{

        method:"POST",

        body:JSON.stringify({

          bet:selectedBet

        })

      });

    /*
      The server is authoritative.
      Never calculate the new balance
      on the frontend.
    */

    if(
      data.balance !== undefined
    ){

      setBalance(
        data.balance
      );

    }

    /*
      Display the actual server-generated
      15-symbol result.
    */

    if(
      Array.isArray(data.symbols) &&
      data.symbols.length === 15
    ){

      const symbols =
        document.querySelectorAll(
          ".reel .symbol"
        );

      data.symbols.forEach(
        (symbol,index)=>{

          if(symbols[index]){

            renderServerSymbol(
              symbols[index],
              symbol
            );

          }

        }
      );

    }

    if(
      Number(data.win) > 0
    ){

      showToast(
        "✦ YOU WON " +
        formatCoins(data.win) +
        " COINS"
      );

    }else{

      showToast(
        "GOOD LUCK NEXT SPIN"
      );

    }

  }catch(error){

    showToast(
      error.message
    );

  }finally{

    setTimeout(()=>{

      spinning = false;

      button.disabled = false;

      button.textContent =
        "SPIN";

    },850);

  }

}

$("spinBtn")
  .addEventListener(
    "click",
    spin
  );

/* =========================================================
   REWARDS
========================================================= */

function requestRedeem(name,cost){

  if(!loggedIn){

    showToast(
      "PLEASE LOG IN FIRST"
    );

    return;

  }

  if(balance < cost){

    showToast(
      "YOU NEED MORE PRIVÉ COINS"
    );

    return;

  }

  pendingReward = {
    name,
    cost
  };

  $("modalTitle").textContent =
    "Redeem Reward";

  $("modalText").innerHTML =
    "Redeem <strong>" +
    name +
    "</strong> for <strong>" +
    formatCoins(cost) +
    " coins</strong>?";

  $("confirmBtn").textContent =
    "CONFIRM";

  $("confirmBtn").onclick =
    confirmRedeem;

  $("confirmModal")
    .classList.add("show");

}

async function confirmRedeem(){

  /*
    NOTE:
    Your current server.js does NOT yet contain
    /api/rewards/redeem.

    We therefore do NOT pretend a redemption
    happened or deduct coins locally.
  */

  if(!pendingReward){
    return;
  }

  closeModal();

  showToast(
    "REWARD SYSTEM READY FOR SERVER CONNECTION"
  );

}

/* =========================================================
   GIFT COINS
========================================================= */

function prepareGift(){

  if(!loggedIn){

    showToast(
      "PLEASE LOG IN FIRST"
    );

    return;

  }

  const recipient =
    $("recipient")
      .value
      .trim();

  const custom =
    Number(
      $("customAmount").value
    );

  const amount =
    custom > 0
      ? custom
      : selectedGift;

  if(!recipient){

    showToast(
      "ENTER A TELEGRAM USERNAME"
    );

    return;

  }

  if(!amount || amount <= 0){

    showToast(
      "SELECT A GIFT AMOUNT"
    );

    return;

  }

  if(!Number.isSafeInteger(amount)){

    showToast(
      "ENTER A WHOLE NUMBER OF COINS"
    );

    return;

  }

  if(balance < amount){

    showToast(
      "NOT ENOUGH PRIVÉ COINS"
    );

    return;

  }

  pendingGift = {
    recipient,
    amount
  };

  $("modalTitle").textContent =
    "Confirm Gift";

  $("modalText").innerHTML =
    "Send <strong>" +
    formatCoins(amount) +
    " coins</strong> to<br><br>" +
    "<strong>" +
    recipient +
    "</strong>?";

  $("confirmBtn").textContent =
    "SEND GIFT";

  $("confirmBtn").onclick =
    confirmGift;

  $("confirmModal")
    .classList.add("show");

}

async function confirmGift(){

  if(!pendingGift){
    return;
  }

  const gift =
    pendingGift;

  closeModal();

  /*
    NOTE:
    Your current server.js does NOT contain
    /api/gift yet.

    This prevents the frontend from falsely
    claiming coins were transferred.
  */

  showToast(
    "COIN GIFTING READY FOR SERVER CONNECTION"
  );

}

/* =========================================================
   MODAL
========================================================= */

function closeModal(){

  $("confirmModal")
    .classList.remove("show");

  pendingReward = null;
  pendingGift = null;

  $("confirmBtn").textContent =
    "CONFIRM";

}

$("confirmModal")
  .addEventListener(
    "click",
    event=>{

      if(
        event.target ===
        $("confirmModal")
      ){

        closeModal();

      }

    }
  );

/* =========================================================
   START
========================================================= */

window.addEventListener(
  "load",
  ()=>{

    /*
      Always attempt real server login.
      No fake/local balance is used.
    */

    loginPlayer();

  }
);

</script>

</body>
</html>
