<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050302">
<title>KIMIA PRIVÉ</title>

<script src="https://telegram.org/js/telegram-web-app.js"></script>

<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
:root{
  --bg:#050302;
  --black:#080504;
  --black2:#120a06;
  --gold:#b97932;
  --gold2:#e5b96f;
  --gold3:#fff0c5;
  --gold4:#7b4b20;
  --pink:#ec5791;
  --pink2:#ffb4d2;
  --text:#f6dfb4;
  --muted:#967957;
  --green:#61d7a1;
}

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  margin:0;
  min-height:100%;
  background:#030201;
}

body{
  color:var(--text);
  font-family:Inter,Arial,sans-serif;
  overflow-x:hidden;

  background:
    radial-gradient(
      ellipse at 50% 7%,
      rgba(210,135,54,.20),
      transparent 30%
    ),
    radial-gradient(
      ellipse at 10% 50%,
      rgba(126,30,45,.13),
      transparent 28%
    ),
    radial-gradient(
      ellipse at 90% 50%,
      rgba(126,30,45,.13),
      transparent 28%
    ),
    linear-gradient(
      180deg,
      #130906 0%,
      #070403 45%,
      #020101 100%
    );
}

body:before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  opacity:.14;

  background:
    repeating-linear-gradient(
      125deg,
      transparent 0,
      transparent 75px,
      rgba(255,218,155,.035) 76px,
      transparent 77px
    );
}

/* =========================================================
   AMBIENT LIGHT
========================================================= */

.ambient{
  position:fixed;
  width:260px;
  height:260px;
  border-radius:50%;
  filter:blur(90px);
  pointer-events:none;
  opacity:.16;
}

.ambient.one{
  left:-130px;
  top:25%;
  background:#ca6b2e;
}

.ambient.two{
  right:-130px;
  top:55%;
  background:#9d174c;
}

/* =========================================================
   APP
========================================================= */

.app{
  width:min(100%,780px);
  margin:auto;
  padding:10px 12px 115px;
  position:relative;
}

/* =========================================================
   TOP
========================================================= */

.top{
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  gap:10px;
  margin:4px 2px 8px;
}

.profile-card{
  justify-self:start;
  display:flex;
  align-items:center;
  gap:9px;
  min-width:0;
}

.profile-photo{
  width:48px;
  height:48px;
  flex:none;

  display:grid;
  place-items:center;

  border-radius:50%;

  border:1px solid #f1cb82;

  background:
    radial-gradient(
      circle at 35% 25%,
      #754821,
      #251208 56%,
      #070302
    );

  box-shadow:
    0 0 0 3px #0b0603,
    0 0 0 4px #71471f,
    inset 0 2px 3px #fff4,
    0 0 22px rgba(223,157,72,.24);

  font-family:Cinzel,serif;
  color:var(--gold3);
}

.profile-info{
  min-width:0;
}

.profile-name{
  font-family:Cinzel,serif;
  font-size:12px;
  letter-spacing:1px;
  color:#f7dfb2;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.profile-level{
  margin-top:3px;
  font-size:9px;
  color:#b09268;
}

.vip-meter{
  width:105px;
  height:5px;
  margin-top:6px;

  overflow:hidden;

  border:1px solid #50351d;
  border-radius:20px;

  background:#100a06;
}

.vip-fill{
  height:100%;
  width:42%;

  background:
    linear-gradient(
      90deg,
      #8e5124,
      #f6d28d,
      #fff0c4
    );

  box-shadow:0 0 9px #e6ad59;
}

.top-brand{
  text-align:center;
}

.top-brand .tiny{
  font-size:7px;
  letter-spacing:3px;
  color:#9e815e;
}

.top-brand .crown{
  font-size:24px;
  color:#f4ce86;

  text-shadow:
    0 0 7px #f3bd65,
    0 0 25px #a85f25;
}

.money{
  justify-self:end;

  display:flex;
  align-items:center;
  gap:8px;

  min-width:142px;
  padding:8px 10px;

  border:1px solid #79512b;
  border-radius:30px;

  background:
    linear-gradient(
      145deg,
      #211309,
      #0b0604
    );

  box-shadow:
    inset 0 1px #fff2,
    inset 0 -5px 10px #000,
    0 6px 20px #0009;
}

.coin-stack{
  font-size:21px;
  filter:drop-shadow(0 0 7px #d89a3c);
}

.money-label{
  font-size:7px;
  letter-spacing:1.5px;
  color:#9e815d;
}

.money-value{
  margin-top:1px;
  font:600 17px "Cormorant Garamond",serif;
  color:#f8dfb0;
}

.plus{
  margin-left:auto;

  width:27px;
  height:27px;

  display:grid;
  place-items:center;

  border:1px solid #9d7041;
  border-radius:50%;

  color:#f2ce91;
  background:#140b06;

  font-size:18px;
}

/* =========================================================
   BRAND
========================================================= */

.brand{
  position:relative;
  text-align:center;
  padding:5px 0 14px;
}

.brand:before,
.brand:after{
  content:"";

  position:absolute;
  top:52%;

  width:20%;
  height:1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      #b57b3c
    );
}

.brand:before{
  left:0;
}

.brand:after{
  right:0;
  transform:rotate(180deg);
}

.brand-crown{
  font-size:28px;
  color:#f5d28e;

  text-shadow:
    0 0 8px #f5c76e,
    0 0 26px #b16d2e;
}

.brand h1{
  margin:2px 0 -1px;

  font-family:Cinzel,Georgia,serif;
  font-size:clamp(39px,11vw,68px);
  font-weight:500;
  letter-spacing:7px;
  line-height:.95;

  background:
    linear-gradient(
      180deg,
      #fff5d5 0%,
      #e8b76c 25%,
      #fff2c7 48%,
      #bc7c36 76%,
      #75471e 100%
    );

  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;

  filter:
    drop-shadow(0 4px 2px #000)
    drop-shadow(0 0 12px rgba(210,144,63,.14));
}

.brand h2{
  margin:0;

  font-family:Cinzel,Georgia,serif;
  font-size:21px;
  letter-spacing:11px;
  padding-left:11px;

  color:#f4d39b;

  text-shadow:
    0 2px 4px #000,
    0 0 12px rgba(230,174,91,.16);
}

.brand-sub{
  margin-top:8px;

  font-size:7px;
  letter-spacing:4px;

  color:#b38c60;
}

/* =========================================================
   BONUS
========================================================= */

.bonus{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;

  margin-bottom:10px;
}

.info-card{
  display:flex;
  align-items:center;
  gap:9px;

  min-height:55px;
  padding:9px 11px;

  border:1px solid #704a27;
  border-radius:15px;

  background:
    linear-gradient(
      145deg,
      #211208,
      #0b0604
    );

  box-shadow:
    inset 0 1px #fff2,
    inset 0 -8px 12px #000,
    0 6px 18px #0008;
}

.info-icon{
  width:34px;
  height:34px;
  flex:none;

  display:grid;
  place-items:center;

  border:1px solid #a77740;
  border-radius:50%;

  background:
    radial-gradient(
      circle,
      #70421e,
      #1c0d07
    );

  box-shadow:
    inset 0 2px #fff3,
    0 0 12px #c7893c33;
}

.info-copy{
  min-width:0;
}

.info-label{
  font-size:7px;
  letter-spacing:1.6px;
  color:#a68a63;
}

.info-value{
  margin-top:2px;
  font:500 15px "Cormorant Garamond",serif;
  color:#f5d9a8;
}

/* =========================================================
   MACHINE
========================================================= */

.cabinet{
  position:relative;

  margin-top:3px;
  padding:10px;

  border-radius:36px;

  background:
    linear-gradient(
      145deg,
      #f1c77e 0%,
      #8a5727 4%,
      #3d2412 7%,
      #120a06 11%,
      #050302 48%,
      #2d190c 90%,
      #b87831 96%,
      #f0c67a 100%
    );

  box-shadow:
    0 0 0 1px #ffe0a0,
    0 0 0 3px #2b180c,
    0 0 0 5px #8b592b,

    0 22px 50px #000f,

    inset 0 3px 4px #fff7,
    inset 0 -7px 14px #000,

    0 0 35px rgba(198,126,43,.10);

  transform:
    perspective(1200px)
    rotateX(.6deg);
}

.cabinet:before{
  content:"";

  position:absolute;

  left:6%;
  right:6%;
  top:1px;

  height:5px;

  border-radius:100%;

  background:
    linear-gradient(
      90deg,
      transparent,
      #ffe5aa,
      #fff,
      #ffe5aa,
      transparent
    );

  box-shadow:0 0 12px #ffd27b;

  opacity:.8;
}

.cabinet:after{
  content:"";

  position:absolute;
  inset:8px;

  border-radius:29px;

  pointer-events:none;

  border:1px solid rgba(255,224,161,.16);

  box-shadow:
    inset 0 0 35px #000,
    inset 0 1px rgba(255,255,255,.14);
}

.cabinet-inner{
  position:relative;
  z-index:2;

  border-radius:28px;

  padding:14px 11px 14px;

  background:
    radial-gradient(
      ellipse at 50% 0%,
      rgba(133,75,30,.34),
      transparent 31%
    ),
    linear-gradient(
      160deg,
      #211108,
      #080403 44%,
      #160b06
    );

  border:1px solid #80552c;

  box-shadow:
    inset 0 0 0 2px #100704,
    inset 0 0 45px #000,
    inset 0 2px #f8d29422;
}

.cabinet-label{
  text-align:center;

  margin:0 0 10px;

  font-family:Cinzel,serif;
  font-size:8px;
  letter-spacing:2.8px;

  color:#d7b174;
}

.cabinet-label:before,
.cabinet-label:after{
  content:"✦";
  color:#b47a38;
  padding:0 8px;
}

/* =========================================================
   REEL FRAME — DEEP 3D
========================================================= */

.reel-frame{
  position:relative;

  padding:11px;

  border-radius:22px;

  background:
    linear-gradient(
      145deg,
      #f2c77b 0%,
      #a36b31 4%,
      #4e3018 8%,
      #160c07 14%,
      #030202 50%,
      #4d2d16 86%,
      #a56b31 94%,
      #f0c176 100%
    );

  box-shadow:
    0 0 0 1px #ffe3a6,
    0 0 0 3px #28160b,
    0 0 0 4px #8d5c2c,

    inset 0 3px 4px #fff8,
    inset 0 -10px 16px #000,

    0 12px 30px #000e;
}

/* deep black tunnel behind reels */
.reel-frame:before{
  content:"";

  position:absolute;
  z-index:0;

  inset:7px;

  border-radius:17px;

  background:
    radial-gradient(
      ellipse at center,
      #241208 0%,
      #090403 48%,
      #000 100%
    );

  box-shadow:
    inset 0 0 35px #000,
    inset 0 8px 15px #000,
    inset 0 -8px 15px #000;
}

/* upper reflection */
.reel-frame:after{
  content:"";

  position:absolute;
  z-index:5;

  left:8%;
  right:8%;
  top:8px;

  height:24%;

  border-radius:20px 20px 50% 50%;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.14),
      rgba(255,255,255,.025),
      transparent
    );

  pointer-events:none;
}

.reel-glass{
  position:relative;
  z-index:2;

  overflow:hidden;

  padding:6px;

  border-radius:15px;

  background:
    linear-gradient(
      90deg,
      #020202,
      #120905 15%,
      #1a0c06 50%,
      #120905 85%,
      #020202
    );

  border:1px solid #b47b3b;

  box-shadow:
    inset 0 0 0 2px #070403,
    inset 0 0 35px #000,
    inset 0 2px #fff5,
    0 0 16px #000;
}

.reel-glass:before{
  content:"";

  position:absolute;
  z-index:50;

  top:-30%;
  left:-70%;

  width:28%;
  height:170%;

  transform:rotate(23deg);

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.20),
      rgba(255,255,255,.04),
      transparent
    );

  pointer-events:none;

  transition:left .8s ease;
}

.reel-glass.flash:before{
  left:130%;
}

/* =========================================================
   REELS
========================================================= */

.reels{
  position:relative;

  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:5px;

  perspective:1200px;
  transform-style:preserve-3d;
}

.reel{
  position:relative;

  display:grid;
  grid-template-rows:repeat(3,1fr);
  gap:5px;

  min-width:0;

  transform-style:preserve-3d;
}

/* outer reels curve toward player */
.reel:nth-child(1){
  transform:
    perspective(900px)
    rotateY(7deg)
    translateZ(-3px);
}

.reel:nth-child(2){
  transform:
    perspective(900px)
    rotateY(3deg);
}

.reel:nth-child(3){
  transform:
    perspective(900px)
    translateZ(4px);
}

.reel:nth-child(4){
  transform:
    perspective(900px)
    rotateY(-3deg);
}

.reel:nth-child(5){
  transform:
    perspective(900px)
    rotateY(-7deg)
    translateZ(-3px);
}

/* =========================================================
   SYMBOL TILE
========================================================= */

.tile{
  position:relative;

  display:grid;
  place-items:center;

  min-width:0;

  aspect-ratio:1/.93;

  overflow:hidden;

  border-radius:9px;

  background:
    radial-gradient(
      ellipse at 35% 17%,
      rgba(255,246,214,.16),
      transparent 31%
    ),
    linear-gradient(
      145deg,
      #2b170b 0%,
      #110804 45%,
      #050302 73%,
      #1a0b06 100%
    );

  border:1px solid #966331;

  box-shadow:
    inset 0 2px 2px rgba(255,236,189,.09),
    inset 0 -9px 15px #000,
    inset 0 0 14px #000,

    0 2px 0 #5b3419,
    0 5px 7px #000d;

  transform-style:preserve-3d;

  transition:
    transform .2s,
    border-color .2s,
    box-shadow .2s;
}

/* beveled inner edge */
.tile:before{
  content:"";

  position:absolute;
  inset:2px;

  border-radius:7px;

  border:1px solid rgba(255,221,159,.10);

  box-shadow:
    inset 0 1px rgba(255,255,255,.05);

  pointer-events:none;
}

/* diagonal glass shine */
.tile:after{
  content:"";

  position:absolute;

  z-index:4;

  top:-80%;
  left:-65%;

  width:55%;
  height:240%;

  transform:rotate(24deg);

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.075),
      transparent
    );

  pointer-events:none;
}

/* =========================================================
   SYMBOLS
========================================================= */

.symbol{
  position:relative;
  z-index:3;

  display:grid;
  place-items:center;

  font-family:Cinzel,Georgia,serif;
  font-weight:700;

  font-size:clamp(29px,7.3vw,55px);

  color:#f4cb83;

  transform:
    translateZ(25px)
    scale(1);

  text-shadow:
    0 2px 0 #4d2b11,
    0 4px 2px #000,
    0 0 8px rgba(245,183,82,.30);

  filter:
    drop-shadow(0 5px 3px #000);

  user-select:none;

  transition:
    transform .2s,
    filter .2s;
}

/* metallic KP */
.symbol.kp{
  font-size:clamp(22px,6vw,43px);

  color:#fff0c5;

  background:
    linear-gradient(
      180deg,
      #fff6dc,
      #e6b86c 42%,
      #8e5726 100%
    );

  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;

  filter:
    drop-shadow(0 4px 2px #000)
    drop-shadow(0 0 8px #d99a4b);
}

/* pink 7 */
.symbol.seven{
  font-family:Cinzel,serif;
  font-style:italic;
  font-weight:700;

  font-size:clamp(38px,9vw,63px);

  background:
    linear-gradient(
      180deg,
      #ffd7e6 0%,
      #ff80ae 28%,
      #df296d 57%,
      #721039 100%
    );

  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;

  -webkit-text-stroke:1px #ffd9e7;

  filter:
    drop-shadow(0 5px 2px #18030b)
    drop-shadow(0 0 9px #ff4d94)
    drop-shadow(0 0 20px #b71c5b);
}

.symbol.diamond{
  color:#ff7bab;

  text-shadow:
    0 2px 0 #671a36,
    0 4px 2px #000,
    0 0 7px #fff,
    0 0 15px #ff438c,
    0 0 25px #d3206a;
}

.symbol.heart{
  color:#ff70a8;

  text-shadow:
    0 2px 0 #67142f,
    0 4px 2px #000,
    0 0 6px #fff,
    0 0 15px #ff3f88,
    0 0 25px #b51e5b;
}

.symbol.crown{
  font-size:clamp(31px,7.5vw,50px);

  color:#f7c86f;

  text-shadow:
    0 2px 0 #61370f,
    0 4px 2px #000,
    0 0 10px #e29a38,
    0 0 18px #bd7225;
}

.symbol.bell{
  color:#f2bd68;

  text-shadow:
    0 2px 0 #5b310c,
    0 4px 2px #000,
    0 0 9px #d89236;
}

.symbol.cherry{
  color:#ed426f;

  text-shadow:
    0 2px 0 #651227,
    0 4px 2px #000,
    0 0 8px #ff376e,
    0 0 17px #c91f59;
}

/* =========================================================
   SPINNING
========================================================= */

.reels.spinning{
  animation:
    reelMachineShake .12s linear infinite;
}

.reels.spinning .tile{
  animation:
    tileSpin .075s linear infinite;
}

.reels.spinning .symbol{
  animation:
    symbolSpin .075s linear infinite;

  filter:
    blur(2.5px)
    drop-shadow(0 3px 3px #000);
}

@keyframes reelMachineShake{
  0%{
    transform:translateX(-1px);
  }

  50%{
    transform:translateX(1px);
  }

  100%{
    transform:translateX(-1px);
  }
}

@keyframes tileSpin{
  0%{
    transform:translateY(-7px) scaleY(.97);
  }

  50%{
    transform:translateY(7px) scaleY(1.03);
  }

  100%{
    transform:translateY(-7px) scaleY(.97);
  }
}

@keyframes symbolSpin{
  0%{
    transform:
      translateZ(15px)
      translateY(-13px)
      scale(.95);
  }

  50%{
    transform:
      translateZ(15px)
      translateY(13px)
      scale(1.05);
  }

  100%{
    transform:
      translateZ(15px)
      translateY(-13px)
      scale(.95);
  }
}

/* =========================================================
   PAYLINE
========================================================= */

.payline{
  position:absolute;
  z-index:40;

  left:3px;
  right:3px;
  top:50%;

  height:2px;

  transform:translateY(-50%);

  background:
    linear-gradient(
      90deg,
      transparent,
      #e5a64e 7%,
      #fff1c4 50%,
      #e5a64e 93%,
      transparent
    );

  box-shadow:
    0 0 3px #fff,
    0 0 9px #f0a344,
    0 0 17px #e98d32;

  opacity:.48;

  pointer-events:none;
}

/* =========================================================
   WIN
========================================================= */

.tile.win{
  z-index:20;

  border-color:#ffe8ad;

  background:
    radial-gradient(
      circle at center,
      rgba(255,217,139,.32),
      transparent 65%
    ),
    linear-gradient(
      145deg,
      #4b270f,
      #100704
    );

  box-shadow:
    inset 0 0 22px rgba(248,191,103,.65),

    0 0 0 2px #f9d28a,
    0 0 12px #ffc45e,
    0 0 28px #ed4c8d,

    0 8px 15px #000;
    
  animation:
    winningTile .55s ease-in-out infinite alternate;
}

.tile.win .symbol{
  animation:
    winningSymbol .55s ease-in-out infinite alternate;
}

@keyframes winningTile{
  from{
    transform:
      translateZ(20px)
      scale(1);
  }

  to{
    transform:
      translateZ(40px)
      scale(1.06);
  }
}

@keyframes winningSymbol{
  from{
    transform:
      translateZ(25px)
      scale(1);
  }

  to{
    transform:
      translateZ(45px)
      scale(1.12);
  }
}

/* =========================================================
   MACHINE CONTROLS
========================================================= */

.machine-controls{
  margin-top:10px;

  display:grid;
  grid-template-columns:1fr 1.05fr 1fr;
  gap:5px;
}

.control{
  min-height:58px;

  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;

  color:#e9c78e;

  background:
    linear-gradient(
      145deg,
      #251509,
      #090504
    );

  border:1px solid #704a27;

  box-shadow:
    inset 0 1px #fff2,
    inset 0 -7px 10px #000,
    0 4px 8px #0009;

  font-size:10px;
}

.control:first-child{
  border-radius:13px 5px 5px 13px;
}

.control:last-child{
  border-radius:5px 13px 13px 5px;
}

.control .arrow{
  font-size:19px;
  color:#d4a664;
}

.control-main{
  min-height:58px;
  text-align:center;
}

.control-label{
  font-size:7px;
  letter-spacing:2px;
  color:#9c815d;
}

.control-value{
  margin-top:3px;
  font:600 21px "Cormorant Garamond",serif;
  color:#f6d49a;
}

/* =========================================================
   SPIN AREA
========================================================= */

.spin-area{
  display:grid;
  grid-template-columns:82px minmax(0,1fr) 82px;

  gap:9px;

  align-items:center;

  margin-top:11px;
}

.round-button{
  min-height:76px;

  border-radius:22px;

  color:#e7c38a;

  background:
    radial-gradient(
      circle at 50% 18%,
      #43240f,
      #110704 64%
    );

  border:1px solid #986a37;

  box-shadow:
    inset 0 2px 2px #fff2,
    inset 0 -8px 12px #000,
    0 6px 12px #000c;

  font-family:Cinzel,serif;
  font-size:9px;
  letter-spacing:1px;
}

.round-button .icon{
  display:block;

  margin-bottom:5px;

  font-size:27px;

  color:#f0bf68;

  text-shadow:
    0 0 8px #db9234,
    0 0 17px #b15e1d;
}

.round-button.active{
  border-color:#ed87ad;

  color:#ffb1cf;

  box-shadow:
    inset 0 0 15px #d83e7440,
    0 0 16px #db528233;
}

/* =========================================================
   BIG SPIN BUTTON
========================================================= */

.spin-button{
  position:relative;

  min-height:84px;

  overflow:hidden;

  border-radius:28px;

  font-family:Cinzel,Georgia,serif;

  font-size:clamp(25px,7vw,42px);

  letter-spacing:6px;

  color:#1a0c04;

  background:
    linear-gradient(
      180deg,
      #fff4ce 0%,
      #e9bd75 22%,
      #fff0c1 43%,
      #d49a4f 70%,
      #8b5828 100%
    );

  border:2px solid #ffe4a5;

  box-shadow:
    inset 0 2px 3px #fff,
    inset 0 -9px 12px #704016aa,

    0 0 0 3px #3b2110,
    0 0 0 5px #9c682e,

    0 8px 0 #5c3518,
    0 14px 24px #000e,

    0 0 30px rgba(231,169,75,.30);

  text-shadow:
    0 1px #fff7,
    0 2px 1px #8d5927;

  transition:
    transform .08s,
    box-shadow .08s;
}

.spin-button:before{
  content:"";

  position:absolute;

  z-index:1;

  top:-100%;
  left:-55%;

  width:35%;
  height:300%;

  transform:rotate(25deg);

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.72),
      transparent
    );

  animation:
    spinReflection 3s linear infinite;
}

.spin-button:after{
  content:"";

  position:absolute;
  inset:4px;

  border-radius:22px;

  border:1px solid rgba(255,255,255,.35);

  pointer-events:none;
}

.spin-button > *{
  position:relative;
  z-index:3;
}

@keyframes spinReflection{
  from{
    left:-55%;
  }

  to{
    left:135%;
  }
}

.spin-button:active{
  transform:translateY(5px);

  box-shadow:
    inset 0 2px 3px #fff,
    inset 0 -5px 8px #6b3d16aa,

    0 0 0 3px #3b2110,
    0 0 0 5px #9c682e,

    0 3px 0 #5c3518,
    0 7px 14px #000d;
}

.spin-button:disabled{
  opacity:.65;
}

.spin-crown{
  display:block;

  margin-bottom:-2px;

  font-size:16px;
  letter-spacing:0;

  color:#4b2911;
}

/* =========================================================
   BET PANEL
========================================================= */

.bet-panel{
  margin-top:11px;

  padding:11px;

  border:1px solid #634321;
  border-radius:16px;

  background:
    linear-gradient(
      145deg,
      #1b0e08,
      #080403
    );

  box-shadow:
    inset 0 1px #fff1,
    inset 0 -8px 13px #000,
    0 6px 18px #0008;
}

.bet-title{
  display:flex;
  justify-content:space-between;
  align-items:center;

  margin-bottom:8px;

  font-size:8px;
  letter-spacing:1.5px;

  color:#a98b65;
}

.bet-buttons{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:6px;
}

.bet-button{
  min-height:41px;

  border-radius:9px;

  color:#d7bd91;

  background:
    linear-gradient(
      145deg,
      #1c1009,
      #090504
    );

  border:1px solid #5f3f22;

  box-shadow:
    inset 0 1px #fff1,
    inset 0 -5px 7px #000;
}

.bet-button.active{
  color:#211006;

  background:
    linear-gradient(
      180deg,
      #fff0c4,
      #e5b873 48%,
      #b97e3e
    );

  border-color:#ffe4a8;

  box-shadow:
    inset 0 2px #fff,
    0 0 14px #e5ae5d44;
}

.max-button{
  width:100%;

  margin-top:7px;

  min-height:38px;

  border-radius:9px;

  color:#e6c28b;

  background:
    linear-gradient(
      145deg,
      #160b06,
      #090403
    );

  border:1px solid #79512b;

  box-shadow:
    inset 0 1px #fff1;

  font-size:9px;
  letter-spacing:1.4px;
}

/* =========================================================
   STATUS
========================================================= */

.status{
  min-height:27px;

  display:flex;
  align-items:center;
  justify-content:center;

  padding:8px 2px 2px;

  text-align:center;

  color:#bd8fa1;

  font-size:9px;
  letter-spacing:1.5px;
}

.status.win{
  color:#ffd993;

  text-shadow:
    0 0 7px #ffb94e,
    0 0 15px #e27e2c;
}

.status.error{
  color:#ff829f;
}

/* =========================================================
   LOWER CARDS
========================================================= */

.lower-cards{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;

  margin-top:13px;
}

.lower-card{
  min-height:70px;

  padding:11px 9px;

  border:1px solid #654321;
  border-radius:14px;

  background:
    linear-gradient(
      145deg,
      #1d1009,
      #090504
    );

  box-shadow:
    inset 0 1px #fff1,
    inset 0 -7px 12px #000,
    0 6px 18px #0008;
}

.lower-icon{
  font-size:19px;
  color:#e5b86e;
}

.lower-title{
  margin-top:5px;

  font-family:Cinzel,serif;
  font-size:9px;
  letter-spacing:.8px;

  color:#e9c995;
}

.lower-copy{
  margin-top:3px;

  font-size:6.5px;
  letter-spacing:.6px;

  color:#927a5b;
}

/* =========================================================
   LEADERBOARD
========================================================= */

.leaderboard{
  margin-top:13px;

  padding:13px;

  border:1px solid #654321;
  border-radius:16px;

  background:
    linear-gradient(
      145deg,
      #1c1009,
      #090504
    );

  box-shadow:
    inset 0 1px #fff1,
    inset 0 -8px 13px #000,
    0 6px 20px #0008;
}

.leader-head{
  display:flex;
  justify-content:space-between;
  align-items:center;

  padding-bottom:8px;

  border-bottom:1px solid #4a301a;
}

.leader-title{
  font-family:Cinzel,serif;

  font-size:13px;
  letter-spacing:1px;

  color:#e9cb94;
}

.leader-view{
  font-size:7px;
  letter-spacing:1px;

  color:#b08e61;
}

.player{
  display:grid;
  grid-template-columns:31px 1fr auto;

  align-items:center;
  gap:8px;

  min-height:43px;

  border-bottom:1px solid #ffffff09;
}

.player:last-child{
  border-bottom:0;
}

.player-rank{
  width:27px;
  height:27px;

  display:grid;
  place-items:center;

  border-radius:50%;

  color:#f4ce8b;

  background:#180d07;

  border:1px solid #704923;

  font-family:Cinzel,serif;
  font-size:10px;
}

.player-name{
  font-size:10px;
  color:#d7bd93;

  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.player-balance{
  font:500 13px "Cormorant Garamond",serif;
  color:#e8c487;
}

/* =========================================================
   BOTTOM NAV
========================================================= */

.bottom-nav{
  position:fixed;
  z-index:100;

  left:0;
  right:0;
  bottom:0;

  display:grid;
  grid-template-columns:repeat(5,1fr);

  padding:
    8px 5px
    calc(8px + env(safe-area-inset-bottom));

  background:
    linear-gradient(
      180deg,
      rgba(14,8,5,.90),
      rgba(5,3,2,.99)
    );

  border-top:1px solid #6e4825;

  box-shadow:
    0 -10px 25px #000b;

  backdrop-filter:blur(15px);
}

.nav{
  text-align:center;

  color:#917452;

  font-size:7px;
  letter-spacing:1px;
}

.nav-icon{
  display:block;

  margin-bottom:3px;

  font-size:20px;

  color:#c69a5a;

  text-shadow:0 0 7px #c48439;
}

.nav.active{
  color:#f3d092;
}

.nav.active .nav-icon{
  color:#ffe2a2;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media(min-width:600px){

  .app{
    padding-left:20px;
    padding-right:20px;
  }

  .reels,
  .reel{
    gap:6px;
  }

  .tile{
    border-radius:10px;
  }

  .cabinet{
    padding:13px;
  }

  .cabinet-inner{
    padding:17px 14px;
  }
}

@media(min-width:900px){

  .app{
    width:820px;
  }

  .tile{
    aspect-ratio:1/.88;
  }
}

@media(max-width:370px){

  .app{
    padding-left:7px;
    padding-right:7px;
  }

  .profile-info{
    display:none;
  }

  .money{
    min-width:125px;
  }

  .brand h1{
    font-size:40px;
  }

  .brand h2{
    font-size:18px;
  }

  .cabinet{
    border-radius:26px;
    padding:7px;
  }

  .cabinet-inner{
    border-radius:21px;
    padding:9px 6px;
  }

  .reel-frame{
    padding:6px;
  }

  .reel-glass{
    padding:3px;
  }

  .reels,
  .reel{
    gap:3px;
  }

  .tile{
    border-radius:6px;
  }

  .spin-area{
    grid-template-columns:62px minmax(0,1fr) 62px;
    gap:5px;
  }

  .round-button{
    min-height:67px;
  }

  .spin-button{
    min-height:72px;
    letter-spacing:3px;
  }
}
</style>
</head>

<body>

<div class="ambient one"></div>
<div class="ambient two"></div>

<div class="app">

<header class="top">

  <div class="profile-card">

    <div class="profile-photo" id="avatar">K</div>

    <div class="profile-info">

      <div class="profile-name" id="username">
        KIMIA
      </div>

      <div class="profile-level">
        VIP LEVEL <span id="vipLevel">0</span>
      </div>

      <div class="vip-meter">
        <div class="vip-fill"></div>
      </div>

    </div>

  </div>

  <div class="top-brand">
    <div class="crown">♛</div>
    <div class="tiny">VIP</div>
  </div>

  <div class="money">

    <div class="coin-stack">🪙</div>

    <div>
      <div class="money-label">BALANCE</div>
      <div class="money-value" id="balance">—</div>
    </div>

    <div class="plus">+</div>

  </div>

</header>


<section class="brand">

  <div class="brand-crown">♛</div>

  <h1>KIMIA</h1>

  <h2>PRIVÉ</h2>

  <div class="brand-sub">
    PRIVATE FORTUNE CLUB
  </div>

</section>


<section class="bonus">

  <div class="info-card">

    <div class="info-icon">🎁</div>

    <div class="info-copy">
      <div class="info-label">DAILY BONUS</div>
      <div class="info-value">FREE COINS</div>
    </div>

  </div>


  <div class="info-card">

    <div class="info-icon">💎</div>

    <div class="info-copy">
      <div class="info-label">JACKPOT</div>
      <div class="info-value">1,248,730</div>
    </div>

  </div>

</section>


<!-- =======================================================
     3D SLOT MACHINE
======================================================= -->

<main class="cabinet">

  <div class="cabinet-inner">

    <div class="cabinet-label">
      PRIVÉ ROYALE · FIVE REELS
    </div>


    <div class="reel-frame">

      <div class="reel-glass" id="reelGlass">

        <div class="reels" id="reels">

          <div class="reel">

            <div class="tile">
              <div class="symbol kp">KP</div>
            </div>

            <div class="tile">
              <div class="symbol heart">♥</div>
            </div>

            <div class="tile">
              <div class="symbol cherry">🍒</div>
            </div>

          </div>


          <div class="reel">

            <div class="tile">
              <div class="symbol crown">♛</div>
            </div>

            <div class="tile">
              <div class="symbol seven">7</div>
            </div>

            <div class="tile">
              <div class="symbol bell">♧</div>
            </div>

          </div>


          <div class="reel">

            <div class="tile">
              <div class="symbol bell">♧</div>
            </div>

            <div class="tile">
              <div class="symbol kp">KP</div>
            </div>

            <div class="tile">
              <div class="symbol diamond">♦</div>
            </div>

          </div>


          <div class="reel">

            <div class="tile">
              <div class="symbol cherry">🍒</div>
            </div>

            <div class="tile">
              <div class="symbol diamond">♦</div>
            </div>

            <div class="tile">
              <div class="symbol heart">♥</div>
            </div>

          </div>


          <div class="reel">

            <div class="tile">
              <div class="symbol diamond">♦</div>
            </div>

            <div class="tile">
              <div class="symbol bell">♧</div>
            </div>

            <div class="tile">
              <div class="symbol seven">7</div>
            </div>

          </div>

        </div>

        <div class="payline"></div>

      </div>

    </div>


    <div class="machine-controls">

      <button class="control" id="lineDown">

        <span class="arrow">‹</span>

        <span>
          <small>LINES</small><br>
          <b id="lineCount">5</b>
        </span>

        <span class="arrow">›</span>

      </button>


      <div class="control control-main">

        <div>

          <div class="control-label">
            BET
          </div>

          <div class="control-value" id="controlBet">
            300
          </div>

        </div>

      </div>


      <div class="control">

        <span>
          <small>TOTAL BET</small><br>
          <b id="totalBetControl">300</b>
        </span>

      </div>

    </div>


    <div class="spin-area">

      <button class="round-button" id="autoBtn">

        <span class="icon">↻</span>

        AUTO

      </button>


      <button class="spin-button" id="spinBtn">

        <span class="spin-crown">♛</span>

        SPIN

      </button>


      <button class="round-button" id="turboBtn">

        <span class="icon">ϟ</span>

        TURBO

      </button>

    </div>


    <section class="bet-panel">

      <div class="bet-title">

        <span>SELECT YOUR BET</span>

        <span>CHIPS PER SPIN</span>

      </div>


      <div class="bet-buttons" id="betButtons">

        <button class="bet-button active" data-bet="300">
          300
        </button>

        <button class="bet-button" data-bet="600">
          600
        </button>

        <button class="bet-button" data-bet="1500">
          1,500
        </button>

        <button class="bet-button" data-bet="3000">
          3,000
        </button>

      </div>


      <button class="max-button" id="maxBet">
        ♛ MAX BET · 3,000 CHIPS
      </button>

    </section>


    <div class="status" id="status">
      YOUR PRIVATE FORTUNE AWAITS
    </div>

  </div>

</main>


<section class="lower-cards">

  <div class="lower-card">

    <div class="lower-icon">🎁</div>

    <div class="lower-title">
      DAILY BONUS
    </div>

    <div class="lower-copy">
      FREE COINS & REWARDS
    </div>

  </div>


  <div class="lower-card">

    <div class="lower-icon">💎</div>

    <div class="lower-title">
      JACKPOT
    </div>

    <div class="lower-copy">
      BIGGEST WINS
    </div>

  </div>


  <div class="lower-card">

    <div class="lower-icon">♛</div>

    <div class="lower-title">
      TOP WINS
    </div>

    <div class="lower-copy">
      SEE BIGGEST WINS
    </div>

  </div>

</section>


<section class="leaderboard">

  <div class="leader-head">

    <div class="leader-title">
      ♛ TOP PLAYERS
    </div>

    <div class="leader-view">
      VIEW ALL ›
    </div>

  </div>

  <div id="leaderboard">

    <div class="player">
      Loading leaderboard…
    </div>

  </div>

</section>

</div>


<nav class="bottom-nav">

  <div class="nav active">
    <span class="nav-icon">⌂</span>
    HOME
  </div>

  <div class="nav">
    <span class="nav-icon">♜</span>
    SLOTS
  </div>

  <div class="nav">
    <span class="nav-icon">♛</span>
    LEADERBOARD
  </div>

  <div class="nav">
    <span class="nav-icon">◇</span>
    WALLET
  </div>

  <div class="nav">
    <span class="nav-icon">♙</span>
    PROFILE
  </div>

</nav>


<script>
"use strict";

/* =========================================================
   KIMIA PRIVÉ
   VISUAL UPGRADE
   ========================================================= */

const API =
  "https://kimia-prive-api.onrender.com";

const tg =
  window.Telegram &&
  window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;

const $ =
  id => document.getElementById(id);


/* =========================================================
   STATE
========================================================= */

let currentBet = 300;
let currentLines = 5;

let spinning = false;
let autoMode = false;
let turboMode = false;

let autoTimer = null;


/* =========================================================
   SYMBOLS
========================================================= */

const SYMBOLS = [

  {
    type:"kp",
    html:"KP"
  },

  {
    type:"crown",
    html:"♛"
  },

  {
    type:"bell",
    html:"♧"
  },

  {
    type:"cherry",
    html:"🍒"
  },

  {
    type:"diamond",
    html:"♦"
  },

  {
    type:"heart",
    html:"♥"
  },

  {
    type:"seven",
    html:"7"
  }

];


/* =========================================================
   TELEGRAM
========================================================= */

if(tg){

  tg.ready();

  try{

    tg.expand();

    tg.setHeaderColor("#050302");
    tg.setBackgroundColor("#050302");

  }catch(e){}

}


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value){

  const number =
    Number(value);

  if(!Number.isFinite(number)){
    return "—";
  }

  return Math.floor(number)
    .toLocaleString("en-US");
}


function setStatus(text,type=""){

  const status =
    $("status");

  status.textContent =
    text;

  status.classList.remove(
    "win",
    "error"
  );

  if(type){
    status.classList.add(type);
  }

}


function telegramInitData(){

  if(
    !tg ||
    !tg.initData
  ){

    throw new Error(
      "Open KIMIA PRIVÉ from your Telegram bot so your account can be verified."
    );

  }

  return tg.initData;
}


/* =========================================================
   API
========================================================= */

async function api(
  path,
  options={}
){

  const response =
    await fetch(
      API + path,
      {
        ...options,

        headers:{
          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );


  let data;

  try{

    data =
      await response.json();

  }catch(e){

    throw new Error(
      "The server returned an invalid response."
    );

  }


  if(
    !response.ok ||
    data.error
  ){

    throw new Error(
      data.error ||
      data.message ||
      "Request failed."
    );

  }


  return data;

}


/* =========================================================
   PLAYER
========================================================= */

async function loadPlayer(){

  const initData =
    telegramInitData();


  const data =
    await api(
      "/api/me",
      {
        method:"POST",

        body:
          JSON.stringify({
            initData
          })
      }
    );


  $("balance")
    .textContent =
    formatNumber(
      data.balance
    );


  $("vipLevel")
    .textContent =
    data.vipLevel ?? 0;


  const username =
    data.username
      ? String(data.username)
      : "Player";


  $("username")
    .textContent =
    username.startsWith("@")
      ? username
      : "@" + username;


  $("avatar")
    .textContent =
    username
      .replace("@","")
      .slice(0,1)
      .toUpperCase() || "K";

}


/* =========================================================
   LEADERBOARD
========================================================= */

async function loadLeaderboard(){

  try{

    const data =
      await api(
        "/api/leaderboard"
      );


    const players =
      Array.isArray(data.players)
        ? data.players
        : [];


    const root =
      $("leaderboard");


    root.innerHTML =
      "";


    if(!players.length){

      root.innerHTML =
        `<div class="player">
          No players yet.
        </div>`;

      return;

    }


    players
      .slice(0,10)
      .forEach(
        (player,index)=>{

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "player";


          const rank =
            document.createElement(
              "div"
            );

          rank.className =
            "player-rank";

          rank.textContent =
            player.rank ??
            index + 1;


          const name =
            document.createElement(
              "div"
            );

          name.className =
            "player-name";


          const username =
            player.username
              ? String(player.username)
              : "Anonymous Player";


          name.textContent =
            username.startsWith("@")
              ? username
              : "@" + username;


          const balance =
            document.createElement(
              "div"
            );

          balance.className =
            "player-balance";

          balance.textContent =
            formatNumber(
              player.balance
            );


          row.appendChild(rank);
          row.appendChild(name);
          row.appendChild(balance);

          root.appendChild(row);

        }
      );


  }catch(error){

    console.error(
      "Leaderboard:",
      error
    );


    $("leaderboard")
      .innerHTML =
      `<div class="player">
        Leaderboard unavailable.
      </div>`;

  }

}


/* =========================================================
   BET
========================================================= */

function setBet(value){

  const allowed =
    [
      300,
      600,
      1500,
      3000
    ];


  value =
    Number(value);


  if(
    !allowed.includes(value)
  ){

    value = 300;

  }


  currentBet =
    value;


  $("controlBet")
    .textContent =
    formatNumber(
      currentBet
    );


  $("totalBetControl")
    .textContent =
    formatNumber(
      currentBet
    );


  document
    .querySelectorAll(
      ".bet-button"
    )
    .forEach(button=>{

      button.classList.toggle(
        "active",
        Number(
          button.dataset.bet
        ) === currentBet
      );

    });

}


/* =========================================================
   SYMBOL CREATION
========================================================= */

function makeSymbol(symbol){

  const element =
    document.createElement(
      "div"
    );

  element.className =
    "symbol " +
    symbol.type;

  element.textContent =
    symbol.html;

  return element;

}


function randomSymbol(){

  return SYMBOLS[
    Math.floor(
      Math.random() *
      SYMBOLS.length
    )
  ];

}


/* =========================================================
   BUILD REELS
========================================================= */

function buildReels(){

  const reels =
    $("reels");


  reels.innerHTML =
    "";


  for(
    let column=0;
    column<5;
    column++
  ){

    const reel =
      document.createElement(
        "div"
      );

    reel.className =
      "reel";


    for(
      let row=0;
      row<3;
      row++
    ){

      const tile =
        document.createElement(
          "div"
        );

      tile.className =
        "tile";


      tile.appendChild(
        makeSymbol(
          randomSymbol()
        )
      );


      reel.appendChild(
        tile
      );

    }


    reels.appendChild(
      reel
    );

  }

}


/* =========================================================
   NORMALIZE SERVER SYMBOL
========================================================= */

function normalizeSymbol(value){

  if(
    value === null ||
    value === undefined
  ){

    return randomSymbol();

  }


  const text =
    String(value)
      .toLowerCase()
      .trim();


  if(
    text === "kp" ||
    text.includes("private")
  ){

    return {
      type:"kp",
      html:"KP"
    };

  }


  if(
    text === "7" ||
    text.includes("7️⃣")
  ){

    return {
      type:"seven",
      html:"7"
    };

  }


  if(
    text.includes("diamond") ||
    text === "♦" ||
    text === "💎"
  ){

    return {
      type:"diamond",
      html:"♦"
    };

  }


  if(
    text.includes("heart") ||
    text === "♥" ||
    text === "💗"
  ){

    return {
      type:"heart",
      html:"♥"
    };

  }


  if(
    text.includes("cherry") ||
    text === "🍒"
  ){

    return {
      type:"cherry",
      html:"🍒"
    };

  }


  if(
    text.includes("bell") ||
    text === "🔔"
  ){

    return {
      type:"bell",
      html:"♧"
    };

  }


  if(
    text.includes("crown") ||
    text === "♛" ||
    text === "👑"
  ){

    return {
      type:"crown",
      html:"♛"
    };

  }


  return {
    type:"kp",
    html:
      text.slice(0,3)
  };

}


/* =========================================================
   DISPLAY RESULT
========================================================= */

function displayResult(
  symbols
){

  if(
    !Array.isArray(symbols) ||
    symbols.length < 15
  ){

    throw new Error(
      "The server returned fewer than 15 symbols."
    );

  }


  const tiles =
    document.querySelectorAll(
      ".tile"
    );


  symbols
    .slice(0,15)
    .forEach(
      (value,index)=>{

        const tile =
          tiles[index];


        if(!tile){
          return;
        }


        tile.innerHTML =
          "";


        tile.appendChild(
          makeSymbol(
            normalizeSymbol(
              value
            )
          )
        );

      }
    );

}


/* =========================================================
   WINNING LINES
========================================================= */

function highlightWinningLines(
  lines
){

  if(
    !Array.isArray(lines)
  ){

    return;

  }


  const tiles =
    document.querySelectorAll(
      ".tile"
    );


  lines.forEach(line=>{

    let row =
      Number(line);


    if(
      line &&
      typeof line === "object"
    ){

      row =
        Number(
          line.row ??
          line.line ??
          line.index
        );

    }


    if(
      !Number.isInteger(row)
    ){

      return;

    }


    /*
      Horizontal rows:
      0 = top
      1 = middle
      2 = bottom
    */

    if(
      row >= 0 &&
      row <= 2
    ){

      for(
        let column=0;
        column<5;
        column++
      ){

        const index =
          row * 5 + column;


        if(tiles[index]){

          tiles[index]
            .classList.add(
              "win"
            );

        }

      }

    }

  });

}


/* =========================================================
   SPIN ANIMATION
========================================================= */

function beginSpinAnimation(){

  const reels =
    $("reels");


  reels.classList.add(
    "spinning"
  );


  $("reelGlass")
    .classList.add(
      "flash"
    );


  const tiles =
    document.querySelectorAll(
      ".tile"
    );


  const interval =
    setInterval(()=>{

      if(!spinning){

        clearInterval(
          interval
        );

        return;

      }


      tiles.forEach(tile=>{

        tile.innerHTML =
          "";


        tile.appendChild(
          makeSymbol(
            randomSymbol()
          )
        );

      });

    },80);


  return interval;

}


/* =========================================================
   END SPIN
========================================================= */

function endSpinAnimation(){

  $("reels")
    .classList.remove(
      "spinning"
    );


  $("reelGlass")
    .classList.remove(
      "flash"
    );

}


/* =========================================================
   BALANCE
========================================================= */

function updateBalance(
  value
){

  if(
    value !== undefined &&
    value !== null
  ){

    $("balance")
      .textContent =
      formatNumber(
        value
      );

  }

}


/* =========================================================
   SPIN
========================================================= */

async function spin(){

  if(spinning){
    return;
  }


  spinning =
    true;


  $("spinBtn")
    .disabled =
    true;


  document
    .querySelectorAll(
      ".bet-button"
    )
    .forEach(button=>{
      button.disabled =
        true;
    });


  $("maxBet")
    .disabled =
    true;


  document
    .querySelectorAll(
      ".tile"
    )
    .forEach(tile=>{
      tile.classList.remove(
        "win"
      );
    });


  setStatus(
    "THE PRIVÉ REELS ARE TURNING…"
  );


  const animation =
    beginSpinAnimation();


  try{

    const initData =
      telegramInitData();


    const data =
      await api(
        "/api/spin",
        {
          method:"POST",

          body:
            JSON.stringify({
              initData,
              bet:currentBet
            })
        }
      );


    displayResult(
      data.symbols
    );


    updateBalance(
      data.balance
    );


    highlightWinningLines(
      data.winningLines
    );


    const win =
      Number(
        data.win || 0
      );


    if(win > 0){

      setStatus(
        "✦ WIN + " +
        formatNumber(win) +
        " VIRTUAL CHIPS ✦",
        "win"
      );


      if(
        tg?.HapticFeedback
      ){

        try{

          tg.HapticFeedback
            .notificationOccurred(
              "success"
            );

        }catch(e){}

      }

    }else{

      setStatus(
        "NO WIN THIS TIME · TRY YOUR LUCK"
      );


      if(
        tg?.HapticFeedback
      ){

        try{

          tg.HapticFeedback
            .impactOccurred(
              "light"
            );

        }catch(e){}

      }

    }


    await loadLeaderboard();


  }catch(error){

    console.error(
      "Spin failed:",
      error
    );


    setStatus(
      error.message ||
      "Spin failed. Please try again.",
      "error"
    );

  }finally{

    clearInterval(
      animation
    );


    endSpinAnimation();


    spinning =
      false;


    $("spinBtn")
      .disabled =
      false;


    document
      .querySelectorAll(
        ".bet-button"
      )
      .forEach(button=>{
        button.disabled =
          false;
      });


    $("maxBet")
      .disabled =
      false;


    if(
      autoMode &&
      !autoTimer
    ){

      autoTimer =
        setTimeout(()=>{

          autoTimer =
            null;

          if(autoMode){
            spin();
          }

        },
        turboMode
          ? 300
          : 1500
        );

    }

  }

}


/* =========================================================
   AUTO
========================================================= */

$("autoBtn")
  .addEventListener(
    "click",
    ()=>{

      autoMode =
        !autoMode;


      $("autoBtn")
        .classList.toggle(
          "active",
          autoMode
        );


      if(!autoMode){

        if(autoTimer){

          clearTimeout(
            autoTimer
          );

          autoTimer =
            null;

        }


        setStatus(
          "AUTO MODE STOPPED"
        );

        return;

      }


      setStatus(
        "AUTO MODE ENABLED"
      );


      if(!spinning){
        spin();
      }

    }
  );


/* =========================================================
   TURBO
========================================================= */

$("turboBtn")
  .addEventListener(
    "click",
    ()=>{

      turboMode =
        !turboMode;


      $("turboBtn")
        .classList.toggle(
          "active",
          turboMode
        );


      setStatus(
        turboMode
          ? "TURBO MODE ENABLED"
          : "TURBO MODE DISABLED"
      );

    }
  );


/* =========================================================
   MAX BET
========================================================= */

$("maxBet")
  .addEventListener(
    "click",
    ()=>{

      setBet(3000);

      setStatus(
        "MAX BET · 3,000 CHIPS"
      );

    }
  );


/* =========================================================
   BET BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".bet-button"
  )
  .forEach(button=>{

    button.addEventListener(
      "click",
      ()=>{

        setBet(
          button.dataset.bet
        );


        setStatus(
          "BET SET TO " +
          formatNumber(
            currentBet
          ) +
          " CHIPS"
        );

      }
    );

  });


/* =========================================================
   LINE CONTROL
========================================================= */

$("lineDown")
  .addEventListener(
    "click",
    ()=>{

      currentLines =
        currentLines === 5
          ? 3
          : 5;


      $("lineCount")
        .textContent =
        currentLines;


      setStatus(
        currentLines === 5
          ? "5 LINES SELECTED"
          : "3 LINES SELECTED"
      );

    }
  );


/* =========================================================
   SPIN BUTTON
========================================================= */

$("spinBtn")
  .addEventListener(
    "click",
    spin
  );


/* =========================================================
   INITIALIZE
========================================================= */

buildReels();

setBet(300);


(async()=>{

  try{

    await loadPlayer();

    setStatus(
      "YOUR PRIVATE FORTUNE AWAITS"
    );

  }catch(error){

    console.error(
      "Player:",
      error
    );


    setStatus(
      error.message ||
      "LOGIN FAILED · REOPEN GAME",
      "error"
    );

  }


  await loadLeaderboard();

})();
</script>

</body>
</html>
