'use strict';
// Uses the casino's authenticated player transaction for every purchase/edit.
module.exports = function install({app,pool,auth,withLockedPlayer,READ_PATHS}) {
  const owner = u => !u.guest && (process.env.OWNER_TELEGRAM_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(String(u.id));
  const ok = data => ({status:200,data});
  const fail = (error,status=400)=>({status,data:{error}});
  const reads=['/api/vault/state','/api/vault/download','/api/owner/catalog'];
  reads.forEach(p=>READ_PATHS.add(p));
  function route(url,fn,ownerOnly=false){app.post(url,auth,async(req,res)=>{
    if(ownerOnly&&!owner(req.telegramUser))return res.status(403).json({error:'Owner access required.'});
    try{const out=await withLockedPlayer(req.telegramUser,(c,p)=>fn(c,p,req.body,req.telegramUser));res.status(out.status).json(out.data);}
    catch(e){console.error(url,e.message);res.status(500).json({error:'Action could not complete. Retry with the same request.'});}
  });}
  async function initialize(c){
    await c.query(`CREATE TABLE IF NOT EXISTS killa_catalog (
      id TEXT PRIMARY KEY,title TEXT NOT NULL,kind TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),
      description TEXT NOT NULL DEFAULT '',active BOOLEAN NOT NULL DEFAULT false,payload TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ DEFAULT NOW())`);
    await c.query(`CREATE TABLE IF NOT EXISTS killa_entitlements (
      player_id BIGINT NOT NULL REFERENCES players(telegram_id),item_id TEXT NOT NULL REFERENCES killa_catalog(id),
      title TEXT NOT NULL,kind TEXT NOT NULL,price INTEGER NOT NULL,payload TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ DEFAULT NOW(),PRIMARY KEY(player_id,item_id))`);
    await c.query(`CREATE TABLE IF NOT EXISTS killa_codes (
      id BIGSERIAL PRIMARY KEY,item_id TEXT NOT NULL REFERENCES killa_catalog(id),code TEXT NOT NULL UNIQUE,
      claimed_by BIGINT REFERENCES players(telegram_id),created_at TIMESTAMPTZ DEFAULT NOW())`);
    await c.query(`CREATE TABLE IF NOT EXISTS killa_rooms (
      player_id BIGINT PRIMARY KEY REFERENCES players(telegram_id),decor TEXT NOT NULL DEFAULT 'classic')`);
    const seeds=[
      ['wallpaper-ruby','Ruby Royalty','wallpaper',5000,'Ruby, black and champagne-gold LUHMAATX phone wallpaper.',true,wallpaper('Ruby Royalty','#5d0825','#f1ce88')],
      ['wallpaper-lagoon','Neon Lagoon','wallpaper',5000,'A turquoise and pink poolside phone wallpaper.',true,wallpaper('Neon Lagoon','#063a51','#ff8cdb')],
      ['wallpaper-diamond','Midnight Diamonds','wallpaper',5000,'A violet and silver diamond phone wallpaper.',true,wallpaper('Midnight Diamonds','#211245','#e5e4ff')],
      ['decor-ruby','Ruby Penthouse','decor',2500,'Ruby velvet walls and champagne lighting.',true,'ruby'],
      ['decor-lagoon','Poolside Penthouse','decor',2500,'A neon pool view and aqua lighting.',true,'lagoon'],
      ['decor-diamond','Diamond Penthouse','decor',4000,'Violet velvet and platinum details.',true,'diamond'],
      ['merch-ten','10% Merch Discount','discount',30000,'Owner must add eligibility, expiry and a real code before activating.',false,'']
    ];
    for(const row of seeds) await c.query('INSERT INTO killa_catalog(id,title,kind,price,description,active,payload) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',row);
  }
  function wallpaper(title,bg,accent){
    const file={'Ruby Royalty':'wallpaper-ruby','Neon Lagoon':'wallpaper-lagoon','Midnight Diamonds':'wallpaper-diamond'}[title];
    return 'data:image/png;base64,'+require('fs').readFileSync(require('path').join(__dirname,'private-rewards',file+'.png')).toString('base64');
  }
  route('/api/vault/state',async(c,p,b,u)=>{
    const items=await c.query(`SELECT id,title,kind,price,description,active,
      CASE WHEN kind='discount' THEN (SELECT count(*)::int FROM killa_codes WHERE item_id=killa_catalog.id AND claimed_by IS NULL) ELSE 1 END AS stock
      FROM killa_catalog WHERE active ORDER BY kind,price,id`);
    const owned=await c.query('SELECT item_id,title,kind,price,created_at FROM killa_entitlements WHERE player_id=$1 ORDER BY created_at DESC',[String(p.telegram_id)]);
    const room=await c.query('SELECT decor FROM killa_rooms WHERE player_id=$1',[String(p.telegram_id)]);
    return ok({items:items.rows,owned:owned.rows,decor:room.rows[0]?.decor||'classic',balance:Number(p.balance),isOwner:owner(u),accountId:String(p.telegram_id)});
  });
  route('/api/vault/redeem',async(c,p,b)=>{
    const id=String(b.itemId||'');
    const r=await c.query('SELECT * FROM killa_catalog WHERE id=$1 FOR UPDATE',[id]);
    if(!r.rowCount||!r.rows[0].active)return fail('Reward is unavailable.');
    const item=r.rows[0];
    if(Number(b.expectedPrice)!==item.price)return fail('Price changed. Refresh the vault before redeeming.',409);
    const owned=await c.query('SELECT item_id FROM killa_entitlements WHERE player_id=$1 AND item_id=$2',[String(p.telegram_id),id]);
    if(owned.rowCount)return fail('Already in My Rewards. Open it again at no charge.',409);
    if(Number(p.balance)<item.price)return fail('Not enough KillaCoins.');
    let payload=item.payload;
    if(item.kind==='discount'){
      const codes=await c.query('SELECT id,code FROM killa_codes WHERE item_id=$1 AND claimed_by IS NULL ORDER BY id LIMIT 1 FOR UPDATE',[id]);
      if(!codes.rowCount)return fail('This discount is sold out. No coins deducted.');
      payload=codes.rows[0].code;
      await c.query('UPDATE killa_codes SET claimed_by=$1 WHERE id=$2',[String(p.telegram_id),codes.rows[0].id]);
    }
    if(!payload)return fail('Reward delivery is not configured.');
    await c.query('INSERT INTO killa_entitlements(player_id,item_id,title,kind,price,payload,description) VALUES($1,$2,$3,$4,$5,$6,$7)',[String(p.telegram_id),id,item.title,item.kind,item.price,payload,item.description]);
    const balance=Number(p.balance)-item.price;
    await c.query('UPDATE players SET balance=$1,updated_at=NOW() WHERE telegram_id=$2',[balance,String(p.telegram_id)]);
    return ok({success:true,balance,itemId:id,title:item.title,price:item.price});
  });
  route('/api/vault/download',async(c,p,b)=>{
    const r=await c.query('SELECT title,kind,payload,description FROM killa_entitlements WHERE player_id=$1 AND item_id=$2',[String(p.telegram_id),String(b.itemId||'')]);
    return r.rowCount?ok(r.rows[0]):fail('Reward not owned.',403);
  });
  route('/api/penthouse/equip',async(c,p,b)=>{
    let decor='classic';
    if(b.itemId!=='classic'){
      const r=await c.query("SELECT payload FROM killa_entitlements WHERE player_id=$1 AND item_id=$2 AND kind='decor'",[String(p.telegram_id),String(b.itemId||'')]);
      if(!r.rowCount)return fail('Unlock this room in the Vault first.');
      decor=r.rows[0].payload;
    }
    if(!['classic','ruby','lagoon','diamond'].includes(decor))return fail('Unknown room.');
    await c.query('INSERT INTO killa_rooms(player_id,decor) VALUES($1,$2) ON CONFLICT(player_id) DO UPDATE SET decor=EXCLUDED.decor',[String(p.telegram_id),decor]);
    return ok({decor,balance:Number(p.balance)});
  });
  route('/api/owner/catalog',async(c,p)=>{
    const items=await c.query(`SELECT id,title,kind,price,description,active,
      (SELECT count(*)::int FROM killa_codes WHERE item_id=killa_catalog.id AND claimed_by IS NULL) AS stock,
      (SELECT count(*)::int FROM killa_entitlements WHERE item_id=killa_catalog.id) AS claims FROM killa_catalog ORDER BY id`);
    return ok({items:items.rows});
  },true);
  route('/api/owner/save',async(c,p,b)=>{
    if(!/^[a-z0-9-]{3,60}$/.test(b.id||'')||typeof b.title!=='string'||!b.title.trim()||b.title.length>100||typeof b.description!=='string'||b.description.length>1500||!['wallpaper','discount'].includes(b.kind)||!Number.isSafeInteger(b.price)||b.price<1||b.price>10000000||typeof b.active!=='boolean')return fail('Check title, type, price, ID and description.');
    const prior=await c.query('SELECT * FROM killa_catalog WHERE id=$1 FOR UPDATE',[b.id]);
    if(prior.rowCount&&prior.rows[0].kind!==b.kind)return fail('Reward type cannot be changed.');
    let payload=prior.rows[0]?.payload||'';
    if(b.payload){
      if(b.kind!=='wallpaper'||typeof b.payload!=='string'||b.payload.length>2800000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.payload))return fail('Upload a PNG, JPEG or WebP under 2 MB.');
      payload=b.payload;
    }
    if(b.active&&b.kind==='wallpaper'&&!payload)return fail('Upload the wallpaper before activating.');
    if(b.active&&b.kind==='discount'&&b.description.trim().length<20)return fail('Add discount eligibility and expiry terms.');
    const codes=typeof b.codes==='string'?b.codes.split('\n').map(x=>x.trim()).filter(Boolean):[];
    if(codes.length>100||codes.some(x=>x.length>200))return fail('Add at most 100 codes, each under 200 characters.');
    await c.query(`INSERT INTO killa_catalog(id,title,kind,price,description,active,payload) VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,price=EXCLUDED.price,description=EXCLUDED.description,active=EXCLUDED.active,payload=EXCLUDED.payload,updated_at=NOW()`,[b.id,b.title.trim(),b.kind,b.price,b.description,b.active,payload]);
    if(b.kind==='discount')for(const code of codes)await c.query('INSERT INTO killa_codes(item_id,code) VALUES($1,$2) ON CONFLICT(code) DO NOTHING',[b.id,code]);
    return ok({success:true,balance:Number(p.balance)});
  },true);
  return {initialize};
};
