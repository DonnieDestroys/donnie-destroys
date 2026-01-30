
const C=document.getElementById('c'),X=C.getContext('2d'),W=C.width,H=C.height;
const flash=document.getElementById('flash');
const isMobile=window.matchMedia('(pointer:coarse)').matches;
let st='title',sc=0,chaos=0,rIdx=0,combo=0,comboT=0,rage=0,rageOn=false,gt=0;
let hi=parseInt(localStorage.getItem('dd7hi'))||0,shake=0,pwr=null,pwrT=0;
let freezeFrames=0,multiplier=1,dashCD=0;

// Win screen GIF element (HTML img for animation)
const winGifEl=document.getElementById('winGif');

// Win music - preloaded on first interaction for iOS
let winMusic=new Audio('winsong.mp3');
winMusic.volume=0.7;winMusic.loop=true;winMusic.load();
let winMusicReady=false;
function prepWinMusic(){if(winMusicReady)return;winMusic.volume=0;winMusic.play().then(()=>{winMusic.pause();winMusic.currentTime=0;winMusic.volume=0.7;winMusicReady=true;}).catch(()=>{});}
function playWinMusic(){winMusic.currentTime=0;winMusic.play().catch(()=>{});}
function stopWinMusic(){winMusic.pause();winMusic.currentTime=0;}

// Game over sounds
const gameOverSources=['gameover1.mp3','gameover2.mp3'];
function playGameOver(){
const src=gameOverSources[Math.floor(Math.random()*gameOverSources.length)];
const audio=new Audio(src);
audio.volume=0.7;
audio.play().catch(()=>{});
}

// Screen flash effect
function doFlash(color,duration){
flash.style.background=color;
flash.style.opacity='0.4';
setTimeout(()=>{flash.style.opacity='0';},duration);
}

const rooms=[
{name:'OVAL OFFICE',w1:'#1e3d5a',w2:'#0a1a2a',f1:'#2a1a0a',acc:'#d4af37',acc2:'#fff8dc',
 boss:{name:'NANCY PELOSI',hp:50,color:'#8B4789',attack:'papers'}},
{name:'PRESS ROOM',w1:'#1a2540',w2:'#0a1020',f1:'#1a1a24',acc:'#4a90d9',acc2:'#a0d0ff',
 boss:{name:'JIM ACOSTA',hp:60,color:'#2244aa',attack:'microphone'}},
{name:'STATE DINING',w1:'#5a1a1a',w2:'#2a0a0a',f1:'#2a1010',acc:'#ffd700',acc2:'#fff8e0',
 boss:{name:'BARACK OBAMA',hp:55,color:'#1a3a6e',attack:'hope'}},
{name:'EAST ROOM',w1:'#f0e8d0',w2:'#d0c8b0',f1:'#c0956a',acc:'#c9a227',acc2:'#f0d860',
 boss:{name:'ROBERT MUELLER',hp:80,color:'#333366',attack:'subpoena'}},
{name:'SITUATION ROOM',w1:'#0a0c12',w2:'#050608',f1:'#12141a',acc:'#00ff88',acc2:'#80ffc0',
 boss:{name:'LIZ CHENEY',hp:70,color:'#8B0000',attack:'jan6'}},
{name:'LINCOLN BEDROOM',w1:'#2a4a2a',w2:'#1a2a1a',f1:'#3a2a1a',acc:'#ff6b6b',acc2:'#ffaaaa',
 boss:{name:'JOE BIDEN',hp:60,color:'#1a3a6e',attack:'icecream'}},
{name:'WEST WING',w1:'#3a3a4a',w2:'#2a2a3a',f1:'#2a2020',acc:'#c0c0c0',acc2:'#e0e0e0',
 boss:{name:'HILLARY CLINTON',hp:70,color:'#9B59B6',attack:'gavel'}},
{name:'CABINET ROOM',w1:'#4a3a2a',w2:'#2a1a0a',f1:'#1a1008',acc:'#8B4513',acc2:'#DEB887',
 boss:{name:'DARK ELON',hp:65,color:'#884422',attack:'backstab'}},
{name:'TREATY ROOM',w1:'#e8e8f0',w2:'#c8c8d8',f1:'#4169E1',acc:'#FFD700',acc2:'#ffffff',
 boss:{name:'CNN NEWS',hp:75,color:'#cc0000',attack:'cameras'}},
{name:'FAMILY THEATER',w1:'#FFD700',w2:'#DAA520',f1:'#8B4513',acc:'#FF69B4',acc2:'#FFB6C1',
 boss:{name:'THE EPSTEIN LIST',hp:100,color:'#ff0000',attack:'documents'}}
];

// Boss state
let boss=null;
let bossPhase='none'; // 'none', 'warning', 'fighting', 'defeated'
let bossTimer=0;
let bossAttacks=[];

const P={x:80,y:284,vx:0,vy:0,w:42,h:54,face:1,fr:0,ground:true,atk:false,atkT:0,atkType:'punch',
tCD:0,gCD:0,dashCD:0,lives:5,inv:0,charge:0,super:false,trail:[]};
const cam={x:0,len:2800};
let furn=[],items=[],enemies=[],parts=[],txts=[],projs=[];
const keys={};

function init(idx){
rIdx=idx;furn=[];items=[];enemies=[];parts=[];txts=[];projs=[];bossAttacks=[];
boss=null;bossPhase='none';bossTimer=0;
document.getElementById('rm').textContent=rooms[idx].name;
const types=[
['resoluteDesk','ovalChair','usFlag','globe','couch','tiffanyLamp','portrait','bookcase','eagleStatue','plant'],
['podium','tvCamera','foldChair','monitor','boomMic','whLogo','stageLight','teleprompter'],
['diningTable','formalChair','chinaCase','candelabra','crystalVase','chandelier','oilPaint','wineRack'],
['grandPiano','gildedHarp','marbleBust','gildedMirror','velvetBench','tallColumn','sconce'],
['cmdStation','tacScreen','leatherChair','redPhone','serverRack','shredder','wallClock'],
['roseBush','fountain','benchSeat','birdBath','trellis','potPlant','gardenFlag','gazeboPart'],
['waterCooler','fileCabinet','deskLamp','officeChair','printer','trashCan','coatRack','bulletin'],
['longTable','leatherChair','usFlag','portrait','pitcher','notepad','namePlate','wallMap'],
['luxurySeat','miniBar','tvScreen','magazine','pillow','trayTable','curtain','overhead'],
['golfTrophy','palmTree','velvetRope','chandelierBig','marbleFloor','goldStatue','poolFloat','barStool']
][idx]||['desk','chair','plant','lamp','cabinet'];

for(let s=0;s<16;s++){
const sx=80+s*170,cnt=3+Math.floor(Math.random()*2);
for(let i=0;i<cnt;i++){
const t=types[Math.floor(Math.random()*types.length)];
const isW=['portrait','whLogo','chandelier','oilPaint','gildedMirror','tacScreen','sconce','wallClock','bulletin','wallMap','overhead'].includes(t);
const big=['resoluteDesk','diningTable','grandPiano','cmdStation','serverRack','bookcase','chinaCase','longTable','chandelierBig','fountain'].includes(t);
furn.push({x:sx+Math.random()*100,y:isW?115+Math.random()*50:280,type:t,
hp:big?5:3,maxHp:big?5:3,w:big?100:50,h:big?72:56,pts:big?800:300,shake:0,isWall:isW,glow:Math.random()*6.28});
}}

const itypes=['burger','energyDrink','goldStack','phone','golfBall','rageStar'];
for(let i=0;i<40;i++)items.push({x:150+Math.random()*(cam.len-300),y:140+Math.random()*120,
type:itypes[Math.floor(Math.random()*itypes.length)],got:false,bob:Math.random()*6.28});

const etypes=['reporter','cameraman','secretService'];
for(let i=0;i<5+idx*2;i++){
const et=etypes[Math.floor(Math.random()*etypes.length)];
enemies.push({x:500+i*200+Math.random()*150,y:et==='secretService'?276:284,
w:et==='secretService'?44:38,h:et==='secretService'?60:56,
vx:(Math.random()>.5?1:-1)*.5,hp:et==='secretService'?5:3,maxHp:et==='secretService'?5:3,
stun:0,type:et,fr:0});
}}

function spawnP(x,y,cols,n){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*10,vy:(Math.random()-1)*10,
col:cols[Math.floor(Math.random()*cols.length)],sz:4+Math.random()*6,life:40+Math.random()*30})}
function spawnT(x,y,txt,col){txts.push({x,y,txt,col,life:60,vy:-2.5})}
function spawnTweets(){for(let i=0;i<6;i++)setTimeout(()=>projs.push({x:P.x+(P.face>0?44:-24),y:P.y+6+i*9,
vx:P.face*(10+Math.random()*5),vy:(Math.random()-.5)*5,w:26,h:12,type:'tweet',life:120}),i*50)}
function spawnGolf(){projs.push({x:P.x+(P.face>0?44:-12),y:P.y+20,vx:P.face*16,vy:-10,w:14,h:14,type:'golf',life:180,bnc:4})}

// BOSS SYSTEM - Better implementation
function spawnBoss(){
const bd=rooms[rIdx].boss;
boss={
x:W+100+cam.x,y:275,
w:60,h:70,vx:0,
hp:bd.hp,maxHp:bd.hp,
name:bd.name,color:bd.color,attack:bd.attack,
phase:'entering',timer:0,
attackCD:0,stunTimer:0,hitFlash:0,face:-1,fr:0,
attackNum:0
};
bossPhase='fighting';
enemies=[];
}

function updateBoss(){
if(!boss||bossPhase!=='fighting')return;
boss.fr++;

// Entering phase - walk in from right
if(boss.phase==='entering'){
boss.x-=3;
if(boss.x<=cam.x+W-120){
boss.phase='idle';
boss.timer=60;
}
return;
}

// Stunned - knocked back
if(boss.stunTimer>0){
boss.stunTimer--;
boss.x+=boss.vx;
boss.vx*=0.92;
boss.x=Math.max(cam.x+80,Math.min(cam.x+W-80,boss.x));
if(boss.stunTimer<=0){boss.phase='idle';boss.timer=40;}
return;
}

// Face the player
boss.face=P.x<boss.x?-1:1;

// State machine
boss.timer--;
boss.attackCD--;

if(boss.phase==='idle'){
// Slowly move toward player
if(Math.abs(P.x-boss.x)>150){
boss.vx+=(P.x<boss.x?-0.15:0.15);
}
boss.vx*=0.95;
boss.x+=boss.vx;
boss.x=Math.max(cam.x+80,Math.min(cam.x+W-80,boss.x));

// Start attack when timer runs out
if(boss.timer<=0&&boss.attackCD<=0){
boss.phase='windup';
boss.timer=30;
}
}
else if(boss.phase==='windup'){
// Windup animation
if(boss.timer<=0){
boss.phase='attacking';
boss.timer=40;
doBossAttack();
}
}
else if(boss.phase==='attacking'){
if(boss.timer<=0){
boss.phase='idle';
boss.timer=60+Math.random()*40;
boss.attackCD=30;
}
}

// Player collision with boss body
if(P.inv<=0&&Math.abs(P.x+20-boss.x)<45&&Math.abs(P.y+30-boss.y-20)<50){
if(rageOn){
// Rage mode damages boss on contact
boss.hp-=2;boss.stunTimer=30;boss.vx=P.face*6;boss.hitFlash=20;
shake=10;spawnP(boss.x,boss.y,['#ff0','#f80'],15);
playSound('punch');sc+=200;
}else{
// Player takes damage
P.inv=100;P.lives--;P.vy=-10;P.vx=-P.face*8;
shake=15;spawnP(P.x,P.y,['#f00','#f60'],20);
doFlash('#f00',120);playSound('hurt');
if(P.lives<=0){st='over';stopMusic();playGameOver();if(sc>hi){hi=sc;localStorage.setItem('dd7hi',hi)}}
}
}

// Player attack hits boss
if(P.atk&&P.atkT>8&&boss.stunTimer<=0){
const rng=(P.atkType==='golf'?55:42)*(P.super?1.4:1);
const ax=P.x+(P.face>0?38:-rng+10);
if(ax<boss.x+30&&ax+rng>boss.x-30&&Math.abs(P.y-boss.y)<60){
const dmg=(P.super?4:1)*(rageOn?2:1);
boss.hp-=dmg;
boss.stunTimer=25+dmg*5;
boss.vx=P.face*4;
boss.hitFlash=15;
shake=8+dmg*2;
spawnP(boss.x,boss.y-20,['#ff0','#fff','#f80'],12+dmg*3);
spawnT(boss.x,boss.y-60,'-'+dmg,'#ff0');
playSound(P.super?'superPunch':'punch');
sc+=50*dmg;
combo++;comboT=100;multiplier=Math.min(10,1+Math.floor(combo/3));
if(boss.hp<=0)defeatBoss();
}
}

// Boss projectiles
bossAttacks=bossAttacks.filter(a=>{
a.x+=a.vx;a.y+=a.vy;
if(a.gravity)a.vy+=0.35;
a.life--;

// Hit player check
if(P.inv<=0&&Math.abs(P.x+20-a.x)<25&&Math.abs(P.y+30-a.y)<30){
P.inv=80;P.lives--;P.vy=-8;P.vx=(P.x<a.x?-1:1)*5;
shake=12;spawnP(P.x,P.y,['#f00','#ff0'],12);
doFlash('#f00',80);playSound('hurt');
if(a.type!=='shockwave')a.life=0;
if(P.lives<=0){st='over';stopMusic();playGameOver();if(sc>hi){hi=sc;localStorage.setItem('dd7hi',hi)}}
}
return a.life>0&&a.x>cam.x-100&&a.x<cam.x+W+100&&a.y<400;
});

if(boss&&boss.hitFlash>0)boss.hitFlash--;
}

function doBossAttack(){
if(!boss)return;
const bx=boss.x,by=boss.y;
const toPlayer=P.x<bx?-1:1;
boss.attackNum++;

switch(boss.attack){
case'papers':
// Pelosi throws papers in an arc
for(let i=0;i<4;i++){
setTimeout(()=>{
if(!boss)return;
bossAttacks.push({
x:bx+toPlayer*20,y:by-20,
vx:toPlayer*(5+i),vy:-7+i*0.5,
w:18,h:14,life:100,gravity:true,
type:'paper',color:'#fff'
});
playSound('tweet');
},i*80);
}
break;

case'microphone':
// Acosta throws mic and charges
bossAttacks.push({
x:bx,y:by+20,vx:toPlayer*11,vy:0.5,
w:22,h:10,life:80,gravity:false,
type:'mic',color:'#444'
});
boss.vx=toPlayer*6;
playSound('golf');
break;

case'hope':
// Obama throws hope posters - aimed at player
for(let i=0;i<3;i++){
const spread=-0.2+i*0.2;
bossAttacks.push({
x:bx,y:by+10,
vx:toPlayer*6,
vy:spread*3+1,
w:20,h:24,life:100,gravity:false,
type:'hope'
});
}
playSound('destroy');
break;

case'subpoena':
// Mueller - slow homing documents
for(let i=0;i<2;i++){
setTimeout(()=>{
if(!boss)return;
bossAttacks.push({
x:bx,y:by-30+i*40,vx:toPlayer*4,vy:0,
w:20,h:26,life:150,gravity:false,
type:'subpoena',color:'#ffc'
});
},i*300);
}
break;

case'jan6':
// Liz Cheney throws Jan 6 report documents
for(let i=0;i<2;i++){
const spread=-0.15+i*0.3;
bossAttacks.push({
x:bx,y:by+15,
vx:toPlayer*7,
vy:spread*2,
w:18,h:22,life:90,gravity:false,
type:'jan6'
});
}
playSound('destroy');
break;

case'icecream':
// Biden throws ice cream cones
for(let i=0;i<3;i++){
const spread=-0.2+i*0.2;
bossAttacks.push({
x:bx,y:by+10,
vx:toPlayer*5,
vy:spread*2,
w:16,h:20,life:100,gravity:false,
type:'icecream'
});
}
playSound('destroy');
break;

case'gavel':
// Nancy 2 - gavel shockwaves
shake=18;doFlash('#fff',60);playSound('superPunch');
setTimeout(()=>{
for(let i=0;i<2;i++){
bossAttacks.push({x:bx-60-i*70,y:320,vx:-5,vy:0,w:35,h:25,life:50,gravity:false,type:'shockwave',color:'#ff0'});
bossAttacks.push({x:bx+60+i*70,y:320,vx:5,vy:0,w:35,h:25,life:50,gravity:false,type:'shockwave',color:'#ff0'});
}
},200);
break;

case'backstab':
// Betrayer teleports behind player
boss.x=P.x+(P.face>0?-80:80);
boss.x=Math.max(cam.x+80,Math.min(cam.x+W-80,boss.x));
boss.face=P.x>boss.x?1:-1;
doFlash('#808',60);
setTimeout(()=>{
if(!boss)return;
bossAttacks.push({
x:boss.x+boss.face*30,y:boss.y+35,vx:boss.face*12,vy:0,
w:24,h:16,life:50,gravity:false,
type:'knife',color:'#ccc'
});
playSound('golf');
},250);
break;

case'cameras':
// Media - flash then projectiles
doFlash('#fff',150);
setTimeout(()=>{
if(!boss)return;
for(let i=0;i<5;i++){
const ang=(i/5)*Math.PI*2;
bossAttacks.push({
x:bx,y:by-20,vx:Math.cos(ang)*6,vy:Math.sin(ang)*6,
w:12,h:12,life:70,gravity:false,
type:'flash',color:'#ff0'
});
}
},100);
break;

case'ultimate':
// Final boss - random powerful attacks
const phase=boss.attackNum%4;
if(phase===0){
// Missile barrage
for(let i=0;i<4;i++){
setTimeout(()=>{
if(!boss)return;
bossAttacks.push({
x:bx,y:by-40+i*20,vx:toPlayer*12,vy:0,
w:24,h:8,life:120,gravity:false,
type:'missile',color:'#f00'
});
playSound('golf');
},i*120);
}
}else if(phase===1){
// Ground pound
shake=25;doFlash('#f80',100);playSound('superPunch');
setTimeout(()=>{
for(let i=0;i<3;i++){
bossAttacks.push({x:bx-80-i*90,y:320,vx:-7,vy:0,w:45,h:30,life:60,gravity:false,type:'shockwave',color:'#f80'});
bossAttacks.push({x:bx+80+i*90,y:320,vx:7,vy:0,w:45,h:30,life:60,gravity:false,type:'shockwave',color:'#f80'});
}
},150);
}else if(phase===2){
// Spawn minions
for(let i=0;i<2;i++){
enemies.push({
x:bx+toPlayer*(100+i*60),y:284,w:36,h:52,
vx:toPlayer*-1,hp:2,maxHp:2,stun:0,type:'reporter',fr:0
});
}
spawnT(bx,by-80,'MINIONS!','#f00');
}else{
// Charge
boss.vx=toPlayer*12;
shake=15;
}
break;

case'documents':
// THE EPSTEIN LIST - paper storm attacks
const docPhase=boss.attackNum%4;
if(docPhase===0){
// Paper storm - multiple papers flying
for(let i=0;i<6;i++){
setTimeout(()=>{
if(!boss)return;
bossAttacks.push({
x:bx,y:by-30+i*15,vx:toPlayer*(8+Math.random()*4),vy:-3+Math.random()*6,
w:18,h:14,life:100,gravity:true,
type:'paper',color:'#fff'
});
},i*80);
}
}else if(docPhase===1){
// Redacted beam - horizontal line attack
shake=20;doFlash('#000',80);
setTimeout(()=>{
for(let i=0;i<4;i++){
bossAttacks.push({x:bx-60-i*100,y:by+20,vx:-10,vy:0,w:50,h:8,life:70,gravity:false,type:'redacted',color:'#111'});
bossAttacks.push({x:bx+60+i*100,y:by+20,vx:10,vy:0,w:50,h:8,life:70,gravity:false,type:'redacted',color:'#111'});
}
},100);
}else if(docPhase===2){
// Spawn lawyer minions
for(let i=0;i<2;i++){
enemies.push({
x:bx+toPlayer*(80+i*70),y:284,w:36,h:52,
vx:toPlayer*-1,hp:3,maxHp:3,stun:0,type:'suit',fr:0
});
}
spawnT(bx,by-80,'LAWYERS!','#800');
}else{
// Document slam - ground pound
shake=30;doFlash('#444',120);playSound('superPunch');
setTimeout(()=>{
bossAttacks.push({x:bx-100,y:320,vx:-8,vy:0,w:60,h:35,life:50,gravity:false,type:'shockwave',color:'#333'});
bossAttacks.push({x:bx+100,y:320,vx:8,vy:0,w:60,h:35,life:50,gravity:false,type:'shockwave',color:'#333'});
},120);
}
break;
}
}

function defeatBoss(){
bossPhase='defeated';
shake=35;freezeFrames=40;doFlash('#fff',400);
playSound('ko');playSound('rage');

// Massive explosion
for(let i=0;i<60;i++){
setTimeout(()=>{
if(boss)spawnP(boss.x+Math.random()*80-40,boss.y+Math.random()*60-30,
['#ff0','#f80','#f00','#fff','#ffd700'],8);
},i*30);
}

const bonus=2000*(rIdx+1);
sc+=bonus;
setTimeout(()=>{spawnT(boss.x,boss.y-70,'BOSS DEFEATED!','#ff0');},200);
setTimeout(()=>{spawnT(boss.x,boss.y-90,'+'+bonus,'#0f0');},400);

bossAttacks=[];

setTimeout(()=>{
boss=null;
if(rIdx<rooms.length-1){
rIdx++;chaos=0;P.x=80;P.y=284;cam.x=0;
P.lives=Math.min(7,P.lives+1);
init(rIdx);
spawnT(W/2,180,'STAGE '+(rIdx+1),'#0f0');
spawnT(W/2,210,rooms[rIdx].name,'#fff');
doFlash('#0f0',250);
}else{
st='win';stopMusic();playWinMusic();
if(sc>hi){hi=sc;localStorage.setItem('dd7hi',hi)}
doFlash('#ff0',500);
}
},2500);
}

function drawBoss(){
if(!boss||bossPhase!=='fighting')return;
const bx=boss.x-cam.x,by=boss.y;

// Boss health bar at top of screen
X.fillStyle='#200';
X.fillRect(W/2-152,12,304,24);
X.fillStyle='#400';
X.fillRect(W/2-150,14,300,20);

const hpPct=boss.hp/boss.maxHp;
const hpGrad=X.createLinearGradient(W/2-148,0,W/2-148+hpPct*296,0);
hpGrad.addColorStop(0,'#f00');hpGrad.addColorStop(1,'#ff0');
X.fillStyle=hpGrad;
X.fillRect(W/2-148,16,hpPct*296,16);

X.strokeStyle='#fff';X.lineWidth=2;
X.strokeRect(W/2-152,12,304,24);

X.fillStyle='#fff';X.font='bold 10px "Press Start 2P"';X.textAlign='center';
X.fillText(boss.name,W/2,28);
X.textAlign='left';

// Draw boss sprite based on type
X.save();
X.translate(bx,by);
if(boss.face===-1)X.scale(-1,1);

const bob=Math.sin(boss.fr*0.08)*3;
const windup=boss.phase==='windup'?Math.sin(boss.timer*0.3)*5:0;

drawBossSprite(boss.attack,bob,windup,boss.face);

X.restore();

// Draw boss projectiles
bossAttacks.forEach(a=>{
const ax=a.x-cam.x;
X.save();

if(a.type==='paper'){
X.fillStyle='#fff';
X.translate(ax,a.y);
X.rotate(a.life*0.2);
X.fillRect(-9,-7,18,14);
X.fillStyle='#aaa';
for(let i=0;i<3;i++)X.fillRect(-6,-4+i*4,12,2);
}
else if(a.type==='mic'){
X.fillStyle='#333';
X.fillRect(ax-11,a.y-5,22,10);
X.fillStyle='#666';
X.beginPath();X.arc(ax+8,a.y,7,0,Math.PI*2);X.fill();
}
else if(a.type==='hope'){
// Hope poster projectile
X.fillStyle='#e8d4b8';
X.fillRect(ax-10,a.y-12,20,24);
X.fillStyle='#c41e3a';
X.fillRect(ax-8,a.y-10,16,8);
X.fillStyle='#1a3a6e';
X.fillRect(ax-8,a.y+2,16,8);
X.fillStyle='#fff';
X.font='bold 6px sans-serif';
X.textAlign='center';
X.fillText('HOPE',ax,a.y);
}
else if(a.type==='subpoena'){
X.fillStyle='#ffe';
X.fillRect(ax-10,a.y-13,20,26);
X.fillStyle='#333';
X.font='6px sans-serif';
X.fillText('Â§',ax-3,a.y+2);
}
else if(a.type==='jan6'){
// Jan 6 Committee report document
X.fillStyle='#f5f5dc';
X.fillRect(ax-9,a.y-11,18,22);
X.fillStyle='#1a3a6e';
X.fillRect(ax-7,a.y-9,14,6);
X.fillStyle='#8B0000';
X.font='bold 5px sans-serif';
X.textAlign='center';
X.fillText('JAN 6',ax,a.y+2);
X.fillStyle='#333';
X.fillRect(ax-6,a.y+5,12,2);
X.fillRect(ax-5,a.y+8,10,1);
}
else if(a.type==='icecream'){
// Ice cream cone projectile
X.fillStyle='#d4a574';
X.beginPath();X.moveTo(ax-6,a.y-2);X.lineTo(ax+6,a.y-2);X.lineTo(ax,a.y+10);X.closePath();X.fill();
// Waffle pattern
X.strokeStyle='#b8956a';
X.lineWidth=1;
X.beginPath();X.moveTo(ax-4,a.y);X.lineTo(ax+4,a.y+6);X.stroke();
X.beginPath();X.moveTo(ax+4,a.y);X.lineTo(ax-4,a.y+6);X.stroke();
// Ice cream scoops
X.fillStyle='#f5e6d3';
X.beginPath();X.arc(ax,a.y-6,7,0,Math.PI*2);X.fill();
X.fillStyle='#8B4513';
X.beginPath();X.arc(ax-2,a.y-10,5,0,Math.PI*2);X.fill();
// Cherry on top
X.fillStyle='#c00';
X.beginPath();X.arc(ax,a.y-14,3,0,Math.PI*2);X.fill();
}
else if(a.type==='shockwave'){
X.globalAlpha=a.life/50;
X.fillStyle=a.color;
X.fillRect(ax-a.w/2,a.y-a.h,a.w,a.h);
X.globalAlpha=1;
}
else if(a.type==='knife'){
X.fillStyle='#ccc';
X.fillRect(ax-12,a.y-4,24,8);
X.fillStyle='#864';
X.fillRect(ax-12,a.y-3,8,6);
}
else if(a.type==='flash'){
X.globalAlpha=a.life/70;
X.fillStyle='#ff0';
X.beginPath();X.arc(ax,a.y,6+Math.sin(a.life*0.5)*3,0,Math.PI*2);X.fill();
X.globalAlpha=1;
}
else{
X.fillStyle=a.color||'#f00';
X.fillRect(ax-a.w/2,a.y-a.h/2,a.w,a.h);
}

X.restore();
});
}

function drawBossSprite(type,bob,windup,face){
face=face||1; // default to facing right
// DETAILED BOSS SPRITES - same quality as enemies
const wk=Math.sin(gt*0.08)*2; // walk cycle

switch(type){
case'papers':
// PELOSI - Detailed woman in purple power suit
// Shadow
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,58+bob,35,12,0,0,Math.PI*2);X.fill();

// Legs with heels
X.fillStyle='#1a1a2a';
X.fillRect(-14,38+bob+wk,12,22);X.fillRect(2,38+bob-wk,12,22);
X.fillStyle='#0a0a1a';
X.fillRect(-16,56+bob+wk,16,8);X.fillRect(0,56+bob-wk,16,8); // heels
X.fillStyle='#2a2a3a';
X.fillRect(-12,40+bob+wk,8,18);X.fillRect(4,40+bob-wk,8,18);

// Body - purple power suit with gradient
const suitGrad=X.createLinearGradient(-28,-20,28,40);
suitGrad.addColorStop(0,'#5a2a6a');
suitGrad.addColorStop(0.5,'#7a3a8a');
suitGrad.addColorStop(1,'#4a1a5a');
X.fillStyle=suitGrad;
X.fillRect(-28,-20+bob+windup,56,62);

// Jacket lapels
X.fillStyle='#8a4a9a';
X.beginPath();X.moveTo(-28,-20+bob);X.lineTo(-8,30+bob);X.lineTo(-28,30+bob);X.fill();
X.beginPath();X.moveTo(28,-20+bob);X.lineTo(8,30+bob);X.lineTo(28,30+bob);X.fill();

// Blouse underneath
X.fillStyle='#f0e8e0';
X.fillRect(-12,-15+bob+windup,24,35);
X.fillStyle='#e8e0d8';
X.fillRect(-10,-12+bob+windup,20,30);

// Pearl necklace - detailed
X.fillStyle='#fff';
for(let i=0;i<7;i++){
X.beginPath();X.arc(-12+i*4,-12+bob+Math.sin(i*0.5)*2,3,0,Math.PI*2);X.fill();
X.fillStyle='#e8e8e8';X.beginPath();X.arc(-13+i*4,-13+bob+Math.sin(i*0.5)*2,1,0,Math.PI*2);X.fill();
X.fillStyle='#fff';}

// Neck
X.fillStyle='#e8c8a8';
X.fillRect(-8,-28+bob,16,14);
X.fillStyle='#d8b898';
X.fillRect(-6,-26+bob,4,10);

// Head - more detailed face shape
X.fillStyle='#e8c8a8';
X.fillRect(-18,-58+bob,36,32);
X.fillStyle='#f0d0b0';
X.fillRect(-16,-56+bob,32,28);

// Styled hair - brown with grey highlights
X.fillStyle='#5a4030';
X.fillRect(-22,-72+bob,44,24);
X.fillRect(-24,-65+bob,10,22);X.fillRect(14,-65+bob,10,22);
X.fillStyle='#6a5040';
X.fillRect(-20,-70+bob,40,18);
X.fillStyle='#7a6050';
X.fillRect(-18,-68+bob,20,12);
// Grey streaks
X.fillStyle='#9a8a7a';
X.fillRect(-16,-66+bob,4,8);X.fillRect(8,-66+bob,4,8);

// Eyes with makeup
X.fillStyle='#fff';
X.fillRect(-12,-48+bob,8,6);X.fillRect(4,-48+bob,8,6);
X.fillStyle='#4a6080';
X.fillRect(-10,-47+bob,5,5);X.fillRect(6,-47+bob,5,5);
X.fillStyle='#2a3040';
X.fillRect(-9,-46+bob,3,3);X.fillRect(7,-46+bob,3,3);
// Eye makeup
X.fillStyle='#8060a0';
X.fillRect(-13,-50+bob,10,2);X.fillRect(3,-50+bob,10,2);

// Eyebrows
X.fillStyle='#5a4030';
X.fillRect(-12,-52+bob,8,2);X.fillRect(4,-52+bob,8,2);

// Nose
X.fillStyle='#d8b898';
X.fillRect(-2,-44+bob,4,8);

// Mouth with lipstick
X.fillStyle='#c04040';
X.fillRect(-6,-36+bob,12,4);
X.fillStyle='#e05050';
X.fillRect(-5,-35+bob,10,2);

// Earrings
X.fillStyle='#ffd700';
X.beginPath();X.arc(-18,-45+bob,3,0,Math.PI*2);X.fill();
X.beginPath();X.arc(18,-45+bob,3,0,Math.PI*2);X.fill();

// Arms
X.fillStyle='#7a3a8a';
X.fillRect(-36,-15+bob+windup,12,38);X.fillRect(24,-15+bob+windup,12,38);
X.fillStyle='#8a4a9a';
X.fillRect(-34,-13+bob+windup,8,34);X.fillRect(26,-13+bob+windup,8,34);

// Hands
X.fillStyle='#e8c8a8';
X.fillRect(-38,20+bob,12,12);X.fillRect(26,20+bob,12,12);
X.fillStyle='#d8b898';
X.fillRect(-36,28+bob,8,4);X.fillRect(28,28+bob,8,4);

// Papers in hand
X.fillStyle='#fff';
X.fillRect(30,10+bob+windup,20,28);
X.fillStyle='#eee';
X.fillRect(32,12+bob+windup,16,24);
X.fillStyle='#333';
for(let i=0;i<5;i++)X.fillRect(34,15+i*5+bob+windup,12,1);
break;

case'gavel':
// HILLARY CLINTON - Blonde woman in blue pantsuit
// Shadow
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,58+bob,35,12,0,0,Math.PI*2);X.fill();

// Legs - blue pantsuit pants
X.fillStyle='#2a4a7a';
X.fillRect(-14,38+bob+wk,12,22);X.fillRect(2,38+bob-wk,12,22);
X.fillStyle='#1a3a6a';
X.fillRect(-16,56+bob+wk,16,8);X.fillRect(0,56+bob-wk,16,8);
X.fillStyle='#3a5a8a';
X.fillRect(-12,40+bob+wk,8,18);X.fillRect(4,40+bob-wk,8,18);

// Body - blue pantsuit jacket
const hillaryGrad=X.createLinearGradient(-28,-20,28,40);
hillaryGrad.addColorStop(0,'#3a6a9a');
hillaryGrad.addColorStop(0.5,'#4a7aaa');
hillaryGrad.addColorStop(1,'#2a5a8a');
X.fillStyle=hillaryGrad;
X.fillRect(-28,-20+bob+windup,56,62);

// Jacket lapels
X.fillStyle='#5a8aba';
X.beginPath();X.moveTo(-28,-20+bob);X.lineTo(-8,30+bob);X.lineTo(-28,30+bob);X.fill();
X.beginPath();X.moveTo(28,-20+bob);X.lineTo(8,30+bob);X.lineTo(28,30+bob);X.fill();

// Blouse underneath - white
X.fillStyle='#f8f8f8';
X.fillRect(-12,-15+bob+windup,24,35);
X.fillStyle='#f0f0f0';
X.fillRect(-10,-12+bob+windup,20,30);

// Neck
X.fillStyle='#e8c8a8';
X.fillRect(-8,-28+bob,16,14);
X.fillStyle='#d8b898';
X.fillRect(-6,-26+bob,4,10);

// Head
X.fillStyle='#e8c8a8';
X.fillRect(-18,-58+bob,36,32);
X.fillStyle='#f0d0b0';
X.fillRect(-16,-56+bob,32,28);

// Blonde hair - short styled bob
X.fillStyle='#d4a850';
X.fillRect(-22,-68+bob,44,20);
X.fillRect(-24,-60+bob,10,18);X.fillRect(14,-60+bob,10,18);
X.fillStyle='#e0b860';
X.fillRect(-20,-66+bob,40,16);
X.fillStyle='#ecc870';
X.fillRect(-18,-64+bob,36,12);
// Highlights
X.fillStyle='#f8d888';
X.fillRect(-14,-62+bob,12,8);X.fillRect(6,-63+bob,8,6);

// Eyes with makeup
X.fillStyle='#fff';
X.fillRect(-12,-48+bob,8,6);X.fillRect(4,-48+bob,8,6);
X.fillStyle='#5a7090';
X.fillRect(-10,-47+bob,5,5);X.fillRect(6,-47+bob,5,5);
X.fillStyle='#2a3040';
X.fillRect(-9,-46+bob,3,3);X.fillRect(7,-46+bob,3,3);
// Eye makeup - blue eyeshadow
X.fillStyle='#6080b0';
X.fillRect(-13,-50+bob,10,2);X.fillRect(3,-50+bob,10,2);

// Eyebrows - blonde
X.fillStyle='#c09040';
X.fillRect(-12,-52+bob,8,2);X.fillRect(4,-52+bob,8,2);

// Nose
X.fillStyle='#d8b898';
X.fillRect(-2,-44+bob,4,8);

// Mouth with red lipstick - wide smile
X.fillStyle='#c03030';
X.fillRect(-8,-36+bob,16,5);
X.fillStyle='#e04040';
X.fillRect(-6,-35+bob,12,3);
X.fillStyle='#fff';
X.fillRect(-5,-35+bob,10,2);

// Earrings - pearl
X.fillStyle='#fff';
X.beginPath();X.arc(-18,-45+bob,4,0,Math.PI*2);X.fill();
X.beginPath();X.arc(18,-45+bob,4,0,Math.PI*2);X.fill();

// Arms - blue suit
X.fillStyle='#3a6a9a';
X.fillRect(-36,-15+bob+windup,12,38);X.fillRect(24,-15+bob+windup,12,38);
X.fillStyle='#4a7aaa';
X.fillRect(-34,-13+bob+windup,8,34);X.fillRect(26,-13+bob+windup,8,34);

// Hands
X.fillStyle='#e8c8a8';
X.fillRect(-38,20+bob,12,12);X.fillRect(26,20+bob,12,12);
X.fillStyle='#d8b898';
X.fillRect(-36,28+bob,8,4);X.fillRect(28,28+bob,8,4);

// Gavel in hand
X.fillStyle='#4a2a1a';
X.fillRect(34,0+bob-windup*3,10,35);
X.fillStyle='#5a3a2a';
X.fillRect(36,2+bob-windup*3,6,31);
X.fillStyle='#6a3a2a';
X.fillRect(30,-15+bob-windup*3,18,18);
X.fillStyle='#8a5a4a';
X.fillRect(32,-13+bob-windup*3,14,14);
X.fillStyle='#ffd700';
X.fillRect(32,-10+bob-windup*3,14,3);
break;

case'microphone':
// JIM ACOSTA - Aggressive reporter with mic
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,58+bob,30,10,0,0,Math.PI*2);X.fill();

// Legs
X.fillStyle='#1a1a28';
X.fillRect(-12,36+bob+wk,10,24);X.fillRect(2,36+bob-wk,10,24);
X.fillStyle='#0a0a18';
X.fillRect(-14,56+bob+wk,14,8);X.fillRect(0,56+bob-wk,14,8);

// Suit - dark blue/grey
const acostaGrad=X.createLinearGradient(-25,-18,25,38);
acostaGrad.addColorStop(0,'#2a3040');acostaGrad.addColorStop(1,'#1a2030');
X.fillStyle=acostaGrad;
X.fillRect(-25,-18+bob+windup,50,58);

// Lapels
X.fillStyle='#3a4050';
X.beginPath();X.moveTo(-25,-18+bob);X.lineTo(-6,25+bob);X.lineTo(-25,25+bob);X.fill();
X.beginPath();X.moveTo(25,-18+bob);X.lineTo(6,25+bob);X.lineTo(25,25+bob);X.fill();

// White shirt
X.fillStyle='#f8f8f8';
X.fillRect(-10,-14+bob+windup,20,32);
X.fillStyle='#eee';
for(let i=0;i<4;i++)X.fillRect(-2,-10+i*7+bob,4,3);

// Red tie
X.fillStyle='#c02020';
X.fillRect(-4,-12+bob+windup,8,30);
X.fillStyle='#a01818';
X.fillRect(-3,-10+bob+windup,6,26);
X.fillStyle='#e03030';
X.fillRect(-2,-8+bob+windup,2,22);

// Neck
X.fillStyle='#d8b090';
X.fillRect(-7,-26+bob,14,12);

// Head
X.fillStyle='#d8b090';
X.fillRect(-16,-56+bob,32,32);
X.fillStyle='#e8c0a0';
X.fillRect(-14,-54+bob,28,28);

// Dark hair - styled
X.fillStyle='#1a1a1a';
X.fillRect(-18,-68+bob,36,20);
X.fillRect(-20,-60+bob,8,16);X.fillRect(12,-60+bob,8,16);
X.fillStyle='#2a2a2a';
X.fillRect(-16,-66+bob,32,14);

// Angry eyes
X.fillStyle='#fff';
X.fillRect(-11,-46+bob,8,6);X.fillRect(3,-46+bob,8,6);
X.fillStyle='#4a3020';
X.fillRect(-9,-45+bob,5,5);X.fillRect(5,-45+bob,5,5);
X.fillStyle='#1a1010';
X.fillRect(-8,-44+bob,3,3);X.fillRect(6,-44+bob,3,3);

// Angry eyebrows - furrowed
X.fillStyle='#1a1a1a';
X.save();X.translate(-7,-50+bob);X.rotate(-0.2);X.fillRect(0,0,8,3);X.restore();
X.save();X.translate(7,-50+bob);X.rotate(0.2);X.fillRect(-8,0,8,3);X.restore();

// Nose
X.fillStyle='#c8a080';
X.fillRect(-2,-42+bob,4,10);

// Shouting mouth
X.fillStyle='#2a1a1a';
X.fillRect(-6,-32+bob,12,8);
X.fillStyle='#fff';
X.fillRect(-5,-31+bob,10,3);

// Arms
X.fillStyle='#2a3040';
X.fillRect(-32,-14+bob+windup,10,36);X.fillRect(22,-14+bob+windup,10,36);
X.fillStyle='#d8b090';
X.fillRect(-34,18+bob,10,10);X.fillRect(24,18+bob,10,10);

// Microphone - detailed
X.fillStyle='#333';
X.fillRect(30,5+bob+windup,8,28);
X.fillStyle='#444';
X.fillRect(32,7+bob+windup,4,24);
// Mic head
X.fillStyle='#555';
X.beginPath();X.arc(34,-2+bob+windup,12,0,Math.PI*2);X.fill();
X.fillStyle='#666';
X.beginPath();X.arc(34,-2+bob+windup,9,0,Math.PI*2);X.fill();
// Mesh pattern
X.fillStyle='#444';
for(let i=0;i<3;i++)for(let j=0;j<3;j++)X.fillRect(28+i*4,-8+j*4+bob+windup,2,2);
// CNN logo on mic
X.fillStyle='#c00';
X.fillRect(30,15+bob+windup,8,8);
X.fillStyle='#fff';
X.font='5px sans-serif';
X.fillText('CNN',31,21+bob+windup);
break;

case'hope':
// BARACK OBAMA - Tall, slim, distinguished
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,62+bob,28,10,0,0,Math.PI*2);X.fill();

// Legs - dark suit pants
X.fillStyle='#1a1a2a';
X.fillRect(-10,38+bob+wk,9,26);X.fillRect(1,38+bob-wk,9,26);
X.fillStyle='#0a0a1a';
X.fillRect(-12,60+bob+wk,13,8);X.fillRect(0,60+bob-wk,13,8);

// Body - sharp navy blue suit
X.fillStyle='#1a3a6e';
X.fillRect(-22,-20+bob+windup,44,62);
X.fillStyle='#152d5a';
X.fillRect(-20,-18+bob+windup,40,58);

// Suit lapels
X.fillStyle='#1a3a6e';
X.beginPath();X.moveTo(-20,-18+bob);X.lineTo(-8,5+bob);X.lineTo(-12,5+bob);X.lineTo(-22,-15+bob);X.fill();
X.beginPath();X.moveTo(20,-18+bob);X.lineTo(8,5+bob);X.lineTo(12,5+bob);X.lineTo(22,-15+bob);X.fill();

// White shirt
X.fillStyle='#fff';
X.fillRect(-8,-18+bob,16,30);

// Red tie
X.fillStyle='#c41e3a';
X.beginPath();X.moveTo(0,-18+bob);X.lineTo(-5,-8+bob);X.lineTo(0,15+bob);X.lineTo(5,-8+bob);X.closePath();X.fill();
X.fillStyle='#a01830';
X.beginPath();X.moveTo(0,-8+bob);X.lineTo(-4,0+bob);X.lineTo(0,15+bob);X.lineTo(4,0+bob);X.closePath();X.fill();

// Tie knot
X.fillStyle='#c41e3a';
X.fillRect(-4,-20+bob,8,5);

// Neck
X.fillStyle='#8B6914';
X.fillRect(-6,-28+bob,12,12);

// Head - distinctive oval shape
X.fillStyle='#8B6914';
X.beginPath();X.ellipse(0,-48+bob,18,22,0,0,Math.PI*2);X.fill();
X.fillStyle='#9a7824';
X.beginPath();X.ellipse(0,-48+bob,16,20,0,0,Math.PI*2);X.fill();

// Ears - prominent
X.fillStyle='#8B6914';
X.beginPath();X.ellipse(-18,-48+bob,5,8,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(18,-48+bob,5,8,0,0,Math.PI*2);X.fill();
X.fillStyle='#7a5910';
X.beginPath();X.ellipse(-18,-48+bob,3,5,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(18,-48+bob,3,5,0,0,Math.PI*2);X.fill();

// Hair - short, black, graying at temples
X.fillStyle='#1a1a1a';
X.beginPath();X.ellipse(0,-66+bob,14,10,0,0,Math.PI*2);X.fill();
X.fillRect(-14,-66+bob,28,12);
// Gray temples
X.fillStyle='#666';
X.fillRect(-16,-58+bob,4,8);X.fillRect(12,-58+bob,4,8);

// Eyes - calm, confident
X.fillStyle='#fff';
X.fillRect(-11,-52+bob,8,6);X.fillRect(3,-52+bob,8,6);
X.fillStyle='#3a2a1a';
X.fillRect(-9,-51+bob,5,5);X.fillRect(5,-51+bob,5,5);
X.fillStyle='#1a1a1a';
X.fillRect(-8,-50+bob,3,3);X.fillRect(6,-50+bob,3,3);

// Eyebrows - arched
X.fillStyle='#1a1a1a';
X.fillRect(-12,-56+bob,10,2);X.fillRect(2,-56+bob,10,2);

// Nose - distinctive
X.fillStyle='#7a5910';
X.fillRect(-2,-46+bob,4,10);
X.fillStyle='#8B6914';
X.beginPath();X.arc(0,-36+bob,4,0,Math.PI);X.fill();

// Confident smile
X.fillStyle='#4a2a1a';
X.fillRect(-8,-33+bob,16,4);
X.fillStyle='#fff';
X.fillRect(-6,-32+bob,12,2);

// Arms - suit sleeves
X.fillStyle='#1a3a6e';
X.fillRect(-34,-15+bob+windup,14,45);X.fillRect(20,-15+bob+windup,14,45);
X.fillStyle='#152d5a';
X.fillRect(-32,-13+bob+windup,10,41);X.fillRect(22,-13+bob+windup,10,41);
// Hands
X.fillStyle='#8B6914';
X.fillRect(-36,26+bob,14,10);X.fillRect(22,26+bob,14,10);

// Holding a "HOPE" poster
X.fillStyle='#e8d4b8';
X.fillRect(32,-25+bob-windup*2,28,36);
X.fillStyle='#c41e3a';
X.fillRect(34,-23+bob-windup*2,24,12);
X.fillStyle='#1a3a6e';
X.fillRect(34,-5+bob-windup*2,24,12);
X.fillStyle='#fff';
X.font='bold 8px sans-serif';
X.textAlign='center';
X.save();if(face===-1)X.scale(-1,1);
X.fillText('HOPE',face*46,-11+bob-windup*2);
X.restore();
break;

case'subpoena':
// ROBERT MUELLER - Stern FBI type
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,60+bob,32,11,0,0,Math.PI*2);X.fill();

// Legs
X.fillStyle='#1a1a28';
X.fillRect(-12,38+bob+wk,10,24);X.fillRect(2,38+bob-wk,10,24);
X.fillStyle='#0a0a18';
X.fillRect(-14,58+bob+wk,14,8);X.fillRect(0,58+bob-wk,14,8);

// Dark suit - very formal
const muellerGrad=X.createLinearGradient(-26,-16,26,40);
muellerGrad.addColorStop(0,'#2a2a3a');muellerGrad.addColorStop(1,'#1a1a2a');
X.fillStyle=muellerGrad;
X.fillRect(-26,-16+bob,52,58);

// Suit details
X.fillStyle='#3a3a4a';
X.beginPath();X.moveTo(-26,-16+bob);X.lineTo(-8,28+bob);X.lineTo(-26,28+bob);X.fill();
X.beginPath();X.moveTo(26,-16+bob);X.lineTo(8,28+bob);X.lineTo(26,28+bob);X.fill();

// White shirt
X.fillStyle='#e8e8f0';
X.fillRect(-10,-12+bob,20,30);

// Conservative tie
X.fillStyle='#2a2a50';
X.fillRect(-4,-10+bob,8,28);
X.fillStyle='#3a3a60';
X.fillRect(-3,-8+bob,6,24);

// Neck
X.fillStyle='#d8b898';
X.fillRect(-6,-24+bob,12,12);

// Head - stern, square jaw
X.fillStyle='#d8b898';
X.fillRect(-16,-56+bob,32,34);
X.fillStyle='#e0c0a0';
X.fillRect(-14,-54+bob,28,30);

// Grey/white hair - military cut
X.fillStyle='#808080';
X.fillRect(-17,-66+bob,34,16);
X.fillStyle='#909090';
X.fillRect(-15,-64+bob,30,12);
X.fillStyle='#a0a0a0';
X.fillRect(-13,-62+bob,26,8);

// Stern eyes - piercing
X.fillStyle='#fff';
X.fillRect(-12,-48+bob,9,6);X.fillRect(3,-48+bob,9,6);
X.fillStyle='#4a5060';
X.fillRect(-10,-47+bob,6,5);X.fillRect(5,-47+bob,6,5);
X.fillStyle='#2a3040';
X.fillRect(-9,-46+bob,4,4);X.fillRect(6,-46+bob,4,4);

// Furrowed stern brow
X.fillStyle='#707070';
X.fillRect(-13,-52+bob,10,3);X.fillRect(3,-52+bob,10,3);

// Straight nose
X.fillStyle='#c8a888';
X.fillRect(-2,-44+bob,4,12);

// Tight-lipped frown
X.fillStyle='#a08070';
X.fillRect(-6,-32+bob,12,3);

// Arms - holding documents
X.fillStyle='#2a2a3a';
X.fillRect(-32,-12+bob,10,36);X.fillRect(22,-12+bob,10,36);
X.fillStyle='#d8b898';
X.fillRect(-34,20+bob,10,10);X.fillRect(24,20+bob,10,10);

// Subpoena documents - official looking
X.fillStyle='#f8f0e0';
X.fillRect(-20,8+bob+windup,40,32);
X.fillStyle='#333';
X.fillRect(-18,10+bob+windup,36,2);
X.fillStyle='#666';
for(let i=0;i<4;i++)X.fillRect(-16,16+i*6+bob+windup,32,1);
// Official seal
X.fillStyle='#c8a020';
X.beginPath();X.arc(10,32+bob+windup,8,0,Math.PI*2);X.fill();
X.fillStyle='#a08010';
X.beginPath();X.arc(10,32+bob+windup,5,0,Math.PI*2);X.fill();
break;

case'jan6':
// LIZ CHENEY - Professional congresswoman, stern expression
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,62+bob,28,10,0,0,Math.PI*2);X.fill();

// Legs - dark dress pants/skirt
X.fillStyle='#1a1a2a';
X.fillRect(-10,40+bob+wk,9,24);X.fillRect(1,40+bob-wk,9,24);
X.fillStyle='#0a0a1a';
X.fillRect(-12,60+bob+wk,12,8);X.fillRect(0,60+bob-wk,12,8);

// Body - professional dark red blazer
X.fillStyle='#8B0000';
X.fillRect(-24,-18+bob+windup,48,60);
X.fillStyle='#7a0000';
X.fillRect(-22,-16+bob+windup,44,56);

// Blazer lapels
X.fillStyle='#8B0000';
X.beginPath();X.moveTo(-22,-16+bob);X.lineTo(-8,8+bob);X.lineTo(-14,8+bob);X.lineTo(-24,-12+bob);X.fill();
X.beginPath();X.moveTo(22,-16+bob);X.lineTo(8,8+bob);X.lineTo(14,8+bob);X.lineTo(24,-12+bob);X.fill();

// White blouse underneath
X.fillStyle='#fff';
X.fillRect(-8,-16+bob,16,28);
X.fillStyle='#f0f0f0';
X.fillRect(-6,-14+bob,12,24);

// Pearl necklace
X.fillStyle='#f8f0e8';
for(let i=0;i<5;i++){
X.beginPath();X.arc(-8+i*4,-10+bob,3,0,Math.PI*2);X.fill();
}

// American flag pin
X.fillStyle='#c00';
X.fillRect(-20,0+bob,6,4);
X.fillStyle='#fff';
X.fillRect(-20,4+bob,6,2);
X.fillStyle='#00c';
X.fillRect(-20,6+bob,6,4);

// Neck
X.fillStyle='#e8c8a8';
X.fillRect(-6,-26+bob,12,12);

// Head - feminine oval shape
X.fillStyle='#e8c8a8';
X.beginPath();X.ellipse(0,-46+bob,16,20,0,0,Math.PI*2);X.fill();
X.fillStyle='#f0d0b0';
X.beginPath();X.ellipse(0,-46+bob,14,18,0,0,Math.PI*2);X.fill();

// Hair - grey/silver, shoulder length, layered
X.fillStyle='#a0a0a0';
X.beginPath();X.ellipse(0,-62+bob,17,12,0,0,Math.PI*2);X.fill();
X.fillRect(-17,-62+bob,34,8);
X.fillStyle='#b8b8b8';
X.beginPath();X.ellipse(0,-64+bob,15,10,0,0,Math.PI*2);X.fill();
// Shoulder-length sides
X.fillStyle='#a0a0a0';
X.beginPath();X.ellipse(-16,-42+bob,8,22,0.2,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(16,-42+bob,8,22,-0.2,0,Math.PI*2);X.fill();
// Lighter highlights
X.fillStyle='#c8c8c8';
X.beginPath();X.ellipse(-14,-48+bob,5,16,0.2,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(14,-48+bob,5,16,-0.2,0,Math.PI*2);X.fill();
// Top layer
X.fillStyle='#b0b0b0';
X.beginPath();X.ellipse(0,-66+bob,14,8,0,0,Math.PI*2);X.fill();

// Glasses - dark rectangular frames
X.strokeStyle='#2a2a2a';
X.lineWidth=2;
X.strokeRect(-12,-52+bob,11,9);X.strokeRect(1,-52+bob,11,9);
// Bridge of glasses
X.fillStyle='#2a2a2a';
X.fillRect(-1,-50+bob,2,3);
// Temple arms
X.fillRect(-14,-50+bob,3,2);X.fillRect(11,-50+bob,3,2);

// Eyes behind glasses - determined, focused
X.fillStyle='#fff';
X.fillRect(-10,-50+bob,7,5);X.fillRect(3,-50+bob,7,5);
X.fillStyle='#4a6080';
X.fillRect(-8,-49+bob,4,4);X.fillRect(5,-49+bob,4,4);
X.fillStyle='#2a3040';
X.fillRect(-7,-48+bob,2,2);X.fillRect(6,-48+bob,2,2);

// Eyebrows - serious, slightly furrowed (above glasses)
X.fillStyle='#8a7040';
X.fillRect(-11,-54+bob,9,2);X.fillRect(2,-54+bob,9,2);

// Nose
X.fillStyle='#d8b898';
X.fillRect(-2,-44+bob,4,8);
X.beginPath();X.arc(0,-36+bob,3,0,Math.PI);X.fill();

// Mouth - thin, determined
X.fillStyle='#b06060';
X.fillRect(-5,-32+bob,10,3);
X.fillStyle='#903040';
X.fillRect(-4,-31+bob,8,1);

// Ears (behind hair)
X.fillStyle='#e8c8a8';
X.beginPath();X.ellipse(-15,-46+bob,3,5,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(15,-46+bob,3,5,0,0,Math.PI*2);X.fill();

// Arms - blazer sleeves
X.fillStyle='#8B0000';
X.fillRect(-34,-14+bob+windup,12,42);X.fillRect(22,-14+bob+windup,12,42);
X.fillStyle='#7a0000';
X.fillRect(-32,-12+bob+windup,8,38);X.fillRect(24,-12+bob+windup,8,38);
// Hands
X.fillStyle='#e8c8a8';
X.fillRect(-36,24+bob,12,10);X.fillRect(24,24+bob,12,10);

// Holding Jan 6 Committee folder
X.fillStyle='#1a3a6e';
X.fillRect(32,-20+bob-windup*2,26,32);
X.fillStyle='#f5f5dc';
X.fillRect(34,-18+bob-windup*2,22,28);
X.fillStyle='#8B0000';
X.font='bold 6px sans-serif';
X.textAlign='center';
X.save();if(face===-1)X.scale(-1,1);
X.fillText('JAN 6',face*45,-8+bob-windup*2);
X.fillText('REPORT',face*45,0+bob-windup*2);
X.restore();
break;

case'icecream':
// JOE BIDEN - Elderly president with ice cream
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,62+bob,28,10,0,0,Math.PI*2);X.fill();

// Legs - dark suit pants
X.fillStyle='#1a1a2a';
X.fillRect(-10,38+bob+wk,9,26);X.fillRect(1,38+bob-wk,9,26);
X.fillStyle='#0a0a1a';
X.fillRect(-12,60+bob+wk,12,8);X.fillRect(0,60+bob-wk,12,8);

// Body - navy blue suit
X.fillStyle='#1a3a6e';
X.fillRect(-24,-18+bob+windup,48,60);
X.fillStyle='#152d5a';
X.fillRect(-22,-16+bob+windup,44,56);

// Suit lapels
X.fillStyle='#1a3a6e';
X.beginPath();X.moveTo(-22,-16+bob);X.lineTo(-8,8+bob);X.lineTo(-14,8+bob);X.lineTo(-24,-12+bob);X.fill();
X.beginPath();X.moveTo(22,-16+bob);X.lineTo(8,8+bob);X.lineTo(14,8+bob);X.lineTo(24,-12+bob);X.fill();

// White shirt
X.fillStyle='#fff';
X.fillRect(-8,-16+bob,16,28);

// Blue tie
X.fillStyle='#1a3a6e';
X.beginPath();X.moveTo(0,-16+bob);X.lineTo(-4,-6+bob);X.lineTo(0,14+bob);X.lineTo(4,-6+bob);X.closePath();X.fill();
X.fillStyle='#0f2850';
X.beginPath();X.moveTo(0,-6+bob);X.lineTo(-3,2+bob);X.lineTo(0,14+bob);X.lineTo(3,2+bob);X.closePath();X.fill();

// Flag pin
X.fillStyle='#c00';
X.fillRect(-18,2+bob,5,3);
X.fillStyle='#fff';
X.fillRect(-18,5+bob,5,2);
X.fillStyle='#00c';
X.fillRect(-18,7+bob,5,3);

// Neck
X.fillStyle='#e8c8a8';
X.fillRect(-6,-26+bob,12,12);

// Head - older, distinguished
X.fillStyle='#e8c8a8';
X.beginPath();X.ellipse(0,-46+bob,17,20,0,0,Math.PI*2);X.fill();
X.fillStyle='#f0d0b0';
X.beginPath();X.ellipse(0,-46+bob,15,18,0,0,Math.PI*2);X.fill();

// Ears
X.fillStyle='#e8c8a8';
X.beginPath();X.ellipse(-16,-46+bob,4,7,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(16,-46+bob,4,7,0,0,Math.PI*2);X.fill();

// Hair - white/silver, receding
X.fillStyle='#e8e8e8';
X.beginPath();X.ellipse(0,-62+bob,14,8,0,0,Math.PI*2);X.fill();
X.fillRect(-14,-62+bob,28,6);
// Receding hairline - more forehead showing
X.fillStyle='#f0d0b0';
X.beginPath();X.ellipse(0,-58+bob,10,6,0,0,Math.PI*2);X.fill();
// Side hair
X.fillStyle='#e8e8e8';
X.fillRect(-16,-56+bob,5,10);X.fillRect(11,-56+bob,5,10);

// Eyes - squinting, friendly
X.fillStyle='#fff';
X.fillRect(-10,-50+bob,7,5);X.fillRect(3,-50+bob,7,5);
X.fillStyle='#5080a0';
X.fillRect(-8,-49+bob,4,4);X.fillRect(5,-49+bob,4,4);
X.fillStyle='#2a4060';
X.fillRect(-7,-48+bob,2,2);X.fillRect(6,-48+bob,2,2);

// Bushy eyebrows - white
X.fillStyle='#e0e0e0';
X.fillRect(-11,-54+bob,9,3);X.fillRect(2,-54+bob,9,3);

// Nose
X.fillStyle='#d8b898';
X.fillRect(-2,-44+bob,4,10);
X.beginPath();X.arc(0,-34+bob,4,0,Math.PI);X.fill();

// Friendly smile
X.fillStyle='#c09080';
X.fillRect(-7,-30+bob,14,5);
X.fillStyle='#fff';
X.fillRect(-5,-29+bob,10,3);

// Wrinkles/age lines
X.strokeStyle='rgba(180,140,120,0.4)';
X.lineWidth=1;
X.beginPath();X.moveTo(-12,-42+bob);X.lineTo(-8,-40+bob);X.stroke();
X.beginPath();X.moveTo(12,-42+bob);X.lineTo(8,-40+bob);X.stroke();

// Arms - suit sleeves
X.fillStyle='#1a3a6e';
X.fillRect(-34,-14+bob+windup,12,44);X.fillRect(22,-14+bob+windup,12,44);
X.fillStyle='#152d5a';
X.fillRect(-32,-12+bob+windup,8,40);X.fillRect(24,-12+bob+windup,8,40);
// Hands
X.fillStyle='#e8c8a8';
X.fillRect(-36,26+bob,12,10);X.fillRect(24,26+bob,12,10);

// Holding ice cream cone
// Cone
X.fillStyle='#d4a574';
X.beginPath();X.moveTo(32,-5+bob-windup*2);X.lineTo(44,-5+bob-windup*2);X.lineTo(38,18+bob-windup*2);X.closePath();X.fill();
// Waffle pattern
X.strokeStyle='#b8956a';
X.lineWidth=1;
X.beginPath();X.moveTo(34,-2+bob-windup*2);X.lineTo(42,12+bob-windup*2);X.stroke();
X.beginPath();X.moveTo(42,-2+bob-windup*2);X.lineTo(34,12+bob-windup*2);X.stroke();
// Ice cream scoops - vanilla and chocolate
X.fillStyle='#f5e6d3';
X.beginPath();X.arc(38,-12+bob-windup*2,10,0,Math.PI*2);X.fill();
X.fillStyle='#8B4513';
X.beginPath();X.arc(36,-22+bob-windup*2,8,0,Math.PI*2);X.fill();
X.fillStyle='#ffc0cb';
X.beginPath();X.arc(40,-30+bob-windup*2,7,0,Math.PI*2);X.fill();
// Cherry
X.fillStyle='#c00';
X.beginPath();X.arc(40,-36+bob-windup*2,4,0,Math.PI*2);X.fill();
X.fillStyle='#0a0';
X.fillRect(39,-40+bob-windup*2,2,4);
break;

case'backstab':
// THE BETRAYER - Shadowy cabinet member
// Dark aura
X.globalAlpha=0.4;
X.fillStyle='#000';
X.beginPath();X.ellipse(0,0+bob,50,70,0,0,Math.PI*2);X.fill();
X.globalAlpha=1;

X.fillStyle='rgba(0,0,0,0.4)';
X.beginPath();X.ellipse(0,60+bob,32,11,0,0,Math.PI*2);X.fill();

// Legs
X.fillStyle='#1a1a1a';
X.fillRect(-12,38+bob+wk,10,24);X.fillRect(2,38+bob-wk,10,24);
X.fillStyle='#0a0a0a';
X.fillRect(-14,58+bob+wk,14,8);X.fillRect(0,58+bob-wk,14,8);

// Dark suit
X.fillStyle='#2a2020';
X.fillRect(-26,-16+bob+windup,52,58);
X.fillStyle='#3a2828';
X.fillRect(-24,-14+bob+windup,48,54);

// Dark shirt
X.fillStyle='#1a1010';
X.fillRect(-10,-12+bob+windup,20,30);

// Neck
X.fillStyle='#c0a080';
X.fillRect(-6,-24+bob,12,12);

// Head - half in shadow
X.fillStyle='#c0a080';
X.fillRect(-16,-56+bob,32,34);
// Shadow on half the face
X.fillStyle='rgba(0,0,0,0.4)';
X.fillRect(-16,-56+bob,16,34);

// Dark slicked hair
X.fillStyle='#0a0a0a';
X.fillRect(-18,-66+bob,36,16);
X.fillStyle='#1a1a1a';
X.fillRect(-16,-64+bob,32,12);

// Shifty eyes - one in shadow
X.fillStyle='#fff';
X.fillRect(4,-48+bob,9,6);
X.fillStyle='#4a4030';
X.fillRect(6,-47+bob,6,5);
X.fillStyle='#1a1a10';
X.fillRect(7,-46+bob,4,4);
// Eye in shadow - just a glint
X.fillStyle='#fff';
X.fillRect(-8,-46+bob,2,2);

// Sinister smirk
X.fillStyle='#604040';
X.fillRect(-4,-34+bob,12,4);
X.fillStyle='#805050';
X.fillRect(2,-33+bob,4,2);

// Arms
X.fillStyle='#2a2020';
X.fillRect(-32,-12+bob,10,36);X.fillRect(22,-12+bob,10,36);
X.fillStyle='#c0a080';
X.fillRect(-34,20+bob,10,10);X.fillRect(24,20+bob,10,10);

// Hidden knife behind back
X.fillStyle='#c0c0c0';
X.fillRect(-45,10+bob-windup,22,4);
X.fillStyle='#e0e0e0';
X.fillRect(-45,11+bob-windup,18,2);
// Handle
X.fillStyle='#4a3020';
X.fillRect(-48,8+bob-windup,8,8);
X.fillStyle='#6a4030';
X.fillRect(-46,10+bob-windup,4,4);
break;

case'cameras':
// CNN NEWS - Floating CNN Logo with white stripe through letters
X.fillStyle='rgba(0,0,0,0.3)';
X.beginPath();X.ellipse(0,58+bob,45,14,0,0,Math.PI*2);X.fill();

// Wrap all CNN content in flip fix
X.save();
if(face===-1)X.scale(-1,1);

const cnnRed='#cc0000';
const ly=-5+bob;

// Helper function to draw a letter stroke with white center line
function drawCNNStroke(drawPath,thickness){
// Draw outer red stroke
X.strokeStyle=cnnRed;
X.lineWidth=thickness;
X.lineCap='butt';
drawPath();
X.stroke();
// Draw inner white stripe
X.strokeStyle='#fff';
X.lineWidth=thickness*0.22;
drawPath();
X.stroke();
}

// C - curved arc
drawCNNStroke(()=>{
X.beginPath();
X.arc(-30,ly,18,0.55,-0.55);
},16);

// First N - left vertical
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(0,-26+bob);
X.lineTo(0,20+bob);
},12);

// First N - diagonal
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(0,-24+bob);
X.lineTo(22,18+bob);
},11);

// First N - right vertical
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(22,-26+bob);
X.lineTo(22,20+bob);
},12);

// Second N - left vertical
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(32,-26+bob);
X.lineTo(32,20+bob);
},12);

// Second N - diagonal
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(32,-24+bob);
X.lineTo(54,18+bob);
},11);

// Second N - right vertical
drawCNNStroke(()=>{
X.beginPath();
X.moveTo(54,-26+bob);
X.lineTo(54,20+bob);
},12);

X.restore(); // End flip fix

// Attack flash effect - camera flashes
if(boss.phase==='attacking'||boss.phase==='windup'){
X.globalAlpha=0.6+Math.sin(gt*0.8)*0.3;
X.fillStyle='#fff';
for(let i=0;i<8;i++){
const a=i*Math.PI/4+gt*0.25;
const r=50+Math.sin(gt*0.4)*8;
X.beginPath();
X.arc(Math.cos(a)*r,Math.sin(a)*r+ly,6,0,Math.PI*2);
X.fill();
}
X.globalAlpha=1;
}
break;

case'ultimate':
// FINAL BOSS - Epic imposing figure
// Power aura
X.globalAlpha=0.15+Math.sin(gt*0.08)*0.1;
const auraGrad=X.createRadialGradient(0,0+bob,0,0,0+bob,80);
auraGrad.addColorStop(0,'#ff0');auraGrad.addColorStop(0.5,'#f80');auraGrad.addColorStop(1,'rgba(255,0,0,0)');
X.fillStyle=auraGrad;
X.beginPath();X.arc(0,0+bob,80,0,Math.PI*2);X.fill();
X.globalAlpha=1;

X.fillStyle='rgba(0,0,0,0.4)';
X.beginPath();X.ellipse(0,65+bob,40,14,0,0,Math.PI*2);X.fill();

// Legs
X.fillStyle='#3a1010';
X.fillRect(-14,42+bob+wk,12,26);X.fillRect(2,42+bob-wk,12,26);
X.fillStyle='#2a0808';
X.fillRect(-16,64+bob+wk,16,8);X.fillRect(0,64+bob-wk,16,8);

// Majestic robe/suit
const robeGrad=X.createLinearGradient(-35,-25,35,50);
robeGrad.addColorStop(0,'#8a2020');robeGrad.addColorStop(0.5,'#6a1010');robeGrad.addColorStop(1,'#4a0808');
X.fillStyle=robeGrad;
X.fillRect(-35,-25+bob+windup,70,72);

// Gold trim
X.fillStyle='#ffd700';
X.fillRect(-35,-25+bob+windup,5,72);
X.fillRect(30,-25+bob+windup,5,72);
X.fillRect(-35,-25+bob+windup,70,5);
X.fillRect(-35,42+bob+windup,70,5);

// Inner suit
X.fillStyle='#5a1818';
X.fillRect(-28,-18+bob+windup,56,55);

// Gold chain/medallion
X.fillStyle='#ffd700';
X.fillRect(-20,-10+bob,40,4);
X.beginPath();X.arc(0,5+bob,12,0,Math.PI*2);X.fill();
X.fillStyle='#c9a020';
X.beginPath();X.arc(0,5+bob,8,0,Math.PI*2);X.fill();
X.fillStyle='#fff';
X.font='bold 10px sans-serif';
X.textAlign='center';
X.fillText('$',0,9+bob);
X.textAlign='left';

// Neck
X.fillStyle='#e8c0a0';
X.fillRect(-8,-35+bob,16,14);

// Head
X.fillStyle='#e8c0a0';
X.fillRect(-20,-70+bob,40,38);
X.fillStyle='#f0c8a8';
X.fillRect(-18,-68+bob,36,34);

// Iconic golden hair
X.fillStyle='#da8800';
X.fillRect(-24,-92+bob,48,28);
X.fillRect(-28,-82+bob,12,24);X.fillRect(16,-82+bob,12,24);
X.fillStyle='#e8a000';
X.fillRect(-22,-90+bob,44,22);
X.fillStyle='#f0b800';
X.fillRect(-20,-88+bob,40,16);
// Hair swoosh
X.fillStyle='#ffc820';
X.fillRect(-18,-86+bob,20,10);
X.fillStyle='#ffd840';
X.fillRect(-14,-84+bob,12,6);

// Intense eyes
X.fillStyle='#fff';
X.fillRect(-14,-58+bob,11,8);X.fillRect(3,-58+bob,11,8);
X.fillStyle='#4a7090';
X.fillRect(-12,-57+bob,8,7);X.fillRect(5,-57+bob,8,7);
X.fillStyle='#2a4060';
X.fillRect(-10,-55+bob,5,5);X.fillRect(7,-55+bob,5,5);

// Furrowed golden brows
X.fillStyle='#c08000';
X.save();X.translate(-8,-62+bob);X.rotate(-0.15);X.fillRect(0,0,12,4);X.restore();
X.save();X.translate(8,-62+bob);X.rotate(0.15);X.fillRect(-12,0,12,4);X.restore();

// Nose
X.fillStyle='#d8a888';
X.fillRect(-3,-52+bob,6,12);

// Mouth - pursed/frowning
X.fillStyle='#c08060';
X.fillRect(-6,-40+bob,12,5);

// Arms
X.fillStyle='#6a1010';
X.fillRect(-44,-20+bob+windup,14,48);X.fillRect(30,-20+bob+windup,14,48);
X.fillStyle='#8a2020';
X.fillRect(-42,-18+bob+windup,10,44);X.fillRect(32,-18+bob+windup,10,44);
// Hands
X.fillStyle='#e8c0a0';
X.fillRect(-46,24+bob,14,14);X.fillRect(32,24+bob,14,14);

// Power effects
for(let i=0;i<6;i++){
const a=gt*0.1+i*1.05;
const d=55+Math.sin(gt*0.15+i)*10;
X.fillStyle=`rgba(255,${150+i*20},0,${0.5+Math.sin(gt*0.2+i)*0.3})`;
X.beginPath();X.arc(Math.cos(a)*d,Math.sin(a)*d+bob,6,0,Math.PI*2);X.fill();
}
break;

case'documents':
// THE EPSTEIN LIST - Large menacing stack of documents
// Ominous shadow
X.fillStyle='rgba(0,0,0,0.5)';
X.beginPath();X.ellipse(0,65+bob,50,16,0,0,Math.PI*2);X.fill();

// Dark aura effect
X.globalAlpha=0.2+Math.sin(gt*0.1)*0.1;
const docAura=X.createRadialGradient(0,0+bob,0,0,0+bob,90);
docAura.addColorStop(0,'#400');docAura.addColorStop(0.5,'#200');docAura.addColorStop(1,'rgba(0,0,0,0)');
X.fillStyle=docAura;
X.beginPath();X.arc(0,0+bob,90,0,Math.PI*2);X.fill();
X.globalAlpha=1;

// Large stack of papers - base
X.fillStyle='#d8d0c0';
X.fillRect(-45,-30+bob,90,95);
X.fillStyle='#c8c0b0';
X.fillRect(-42,-27+bob,84,89);

// Paper layers effect
for(let i=0;i<12;i++){
X.fillStyle=i%2===0?'#e8e0d0':'#d0c8b8';
X.fillRect(-43+i*0.5,-28+bob+i*7,86-i,6);
}

// "CLASSIFIED" stamp - red diagonal
X.save();
X.translate(0,20+bob);
X.rotate(-0.3*face);
if(face===-1)X.scale(-1,1);
X.fillStyle='#cc0000';
X.fillRect(-40,-12,80,24);
X.fillStyle='#ff2020';
X.fillRect(-38,-10,76,20);
X.fillStyle='#fff';
X.font='bold 12px "Press Start 2P"';
X.textAlign='center';
X.fillText('CLASSIFIED',0,5);
X.restore();

// Creepy redacted lines
X.fillStyle='#111';
for(let i=0;i<8;i++){
const w=30+Math.sin(i*2)*15;
X.fillRect(-w/2,-25+bob+i*10,w,4);
}

// Floating loose pages around it
for(let i=0;i<5;i++){
const a=gt*0.08+i*1.25;
const d=50+Math.sin(gt*0.12+i)*8;
const px=Math.cos(a)*d;
const py=Math.sin(a)*d*0.5+bob;
X.save();
X.translate(px,py);
X.rotate(Math.sin(gt*0.15+i)*0.4);
X.fillStyle='#f0e8d8';
X.fillRect(-8,-10,16,20);
X.fillStyle='#333';
X.fillRect(-5,-6,10,2);
X.fillRect(-5,-2,8,2);
X.fillRect(-5,2,10,2);
X.restore();
}

// Sinister eyes peeking from behind
X.fillStyle='#ff0000';
X.globalAlpha=0.6+Math.sin(gt*0.2)*0.3;
X.beginPath();X.arc(-15,-50+bob,6,0,Math.PI*2);X.fill();
X.beginPath();X.arc(15,-50+bob,6,0,Math.PI*2);X.fill();
X.fillStyle='#fff';
X.beginPath();X.arc(-15,-50+bob,2,0,Math.PI*2);X.fill();
X.beginPath();X.arc(15,-50+bob,2,0,Math.PI*2);X.fill();
X.globalAlpha=1;

// "TOP SECRET" at top
X.fillStyle='#800';
X.fillRect(-35,-48+bob,70,14);
X.fillStyle='#ff4040';
X.font='bold 8px "Press Start 2P"';
X.textAlign='center';
X.save();if(face===-1)X.scale(-1,1);
X.fillText('TOP SECRET',0,-38+bob);
X.restore();
X.textAlign='left';
break;
}
}

// OBESE ULTIMATE DONNIE (scaled to match enemies)
function drawD(x,y,face,fr,atk,atkType){
X.save();
const scale=0.55; // Scale down to match enemy size
X.translate(x+20,y+25);X.scale(face*scale,scale);X.translate(-35,-40);
const bob=Math.abs(P.vx)>.5?Math.sin(fr*.3)*3:0;
const breathe=Math.sin(gt*.06)*2; // breathing belly movement
const jiggle=Math.abs(P.vx)>1?Math.sin(fr*.5)*4:0; // fat jiggle
const waddle=Math.abs(P.vx)>1?Math.sin(fr*.35)*3:0; // side to side waddle

// RAGE AURA - huge for obese donnie
if(rageOn){
const rg=X.createRadialGradient(35,50,0,35,50,90);
rg.addColorStop(0,'rgba(255,100,0,0.6)');rg.addColorStop(.4,'rgba(255,50,0,0.3)');rg.addColorStop(1,'rgba(255,0,0,0)');
X.fillStyle=rg;X.fillRect(-60,-30,190,150);
for(let i=0;i<16;i++){const a=gt*.1+i*.393,d=50+Math.sin(gt*.2+i)*20;
X.fillStyle=`hsl(${20+Math.random()*30},100%,${50+Math.random()*20}%)`;
X.fillRect(35+Math.cos(a)*d-5,50+Math.sin(a)*d-5,10,10)}}

// POWER CHARGE GLOW - circular, not boxy
if(P.charge>20){
X.save();
const cg=X.createRadialGradient(35,50,0,35,50,50+P.charge*0.8);
cg.addColorStop(0,`rgba(255,255,0,${Math.min(P.charge/80,0.6)})`);
cg.addColorStop(0.5,`rgba(255,200,0,${Math.min(P.charge/120,0.3)})`);
cg.addColorStop(1,'rgba(255,150,0,0)');
X.fillStyle=cg;
X.beginPath();
X.arc(35,50,50+P.charge*0.8,0,Math.PI*2);
X.fill();
X.restore();}

// Shadow - much bigger for obese body
const sh=X.createRadialGradient(35,95,0,35,95,50);sh.addColorStop(0,'rgba(0,0,0,0.6)');sh.addColorStop(1,'rgba(0,0,0,0)');
X.fillStyle=sh;X.fillRect(-20,82,110,30);

// Afterimage trail - ONLY during dash, not regular movement
if(P.dashCD>30){
for(let i=1;i<=4;i++){
X.globalAlpha=(5-i)*.12;X.fillStyle='#0ff';
X.fillRect(-P.vx*i*2-15,-15,90,110);}
X.globalAlpha=1;}

const lo=Math.abs(P.vx)>.5?Math.sin(fr*.25)*6:0;

// LEGS - short and thick, spread apart to support weight
X.fillStyle='#06061a';
X.fillRect(8+waddle,68+bob,18,22+lo);X.fillRect(44-waddle,68+bob,18,22-lo);
// Inner thigh fat
X.fillStyle='#0a0a24';
X.fillRect(16+waddle,70+bob,12,18+lo);X.fillRect(44-waddle,70+bob,12,18-lo);
// Shoes - wide, flat
X.fillStyle='#030303';
X.fillRect(4+waddle,88+bob+lo,24,10);X.fillRect(42-waddle,88+bob-lo,24,10);
X.fillStyle='#1a1a1a';
X.fillRect(8+waddle,88+bob+lo,8,5);X.fillRect(46-waddle,88+bob-lo,8,5);

// MASSIVE GUT - the centerpiece
// Back fat rolls visible from side
X.fillStyle='#000048';
X.fillRect(-8,30+bob+breathe,12,45);X.fillRect(66,30+bob+breathe,12,45);

// Main belly - HUGE, hanging over belt
const bellyY=35+bob+breathe+jiggle;
// Belly gradient for roundness
const bg=X.createRadialGradient(35,55+breathe,5,35,55+breathe,50);
bg.addColorStop(0,'#000070');bg.addColorStop(.6,'#000058');bg.addColorStop(1,'#000045');
X.fillStyle=bg;
// The massive gut shape
X.beginPath();
X.ellipse(35,58+bob+breathe+jiggle,42,38,0,0,Math.PI*2);
X.fill();

// Belly overhang/apron
X.fillStyle='#000050';
X.beginPath();
X.ellipse(35,78+bob+breathe+jiggle,38,18,0,0,Math.PI);
X.fill();

// Upper body/chest - smaller than belly (pear shaped)
X.fillStyle='#000060';
X.fillRect(8,22+bob,54,30);
// Man boobs
X.fillStyle='#000055';
X.beginPath();X.ellipse(22,38+bob+breathe,12,10,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(48,38+bob+breathe,12,10,0,0,Math.PI*2);X.fill();

// Jacket struggling to contain everything
X.fillStyle='#000078';
X.fillRect(2,24+bob,14,35);X.fillRect(54,24+bob,14,35); // jacket sides
// Jacket can't close - just hangs open
X.strokeStyle='#000080';X.lineWidth=2;
X.beginPath();X.moveTo(16,24+bob);X.lineTo(8,65+bob);X.stroke();
X.beginPath();X.moveTo(54,24+bob);X.lineTo(62,65+bob);X.stroke();

// SHIRT - white, stretched tight, buttons straining
X.fillStyle='#f0f0f8';
X.fillRect(16,24+bob,38,25);
// Button gaps showing skin/undershirt
X.fillStyle='#ffddcc';
for(let i=0;i<4;i++){
X.fillRect(32,28+bob+i*8+breathe,6,4);
}
// Buttons barely holding on
X.fillStyle='#c0c0c0';
for(let i=0;i<4;i++){
X.fillRect(30,29+bob+i*8,3,3);
X.fillRect(37,29+bob+i*8,3,3);
}

// BELLY visible below shirt - shirt riding up
X.fillStyle='#ffcc99';
X.beginPath();
X.ellipse(35,70+bob+breathe+jiggle,30,15,0,0,Math.PI);
X.fill();
// Belly button
X.fillStyle='#dd9977';
X.beginPath();X.ellipse(35,68+bob+breathe+jiggle,4,6,0,0,Math.PI*2);X.fill();
X.fillStyle='#cc8866';
X.beginPath();X.ellipse(35,69+bob+breathe+jiggle,2,4,0,0,Math.PI*2);X.fill();

// Belt UNDER the gut (barely visible)
X.fillStyle='#222';
X.fillRect(12,78+bob+jiggle,46,5);
X.fillStyle='#c9a227';
X.fillRect(30,78+bob+jiggle,10,5);

// TIE - short, resting on the gut, can't hang straight
X.fillStyle='#cc0000';X.fillRect(30,22+bob,10,6);
X.fillStyle='#ee0000';X.fillRect(32,22+bob,4,5);
const tg=X.createLinearGradient(30,28,40,55);
tg.addColorStop(0,'#cc0000');tg.addColorStop(.5,'#aa0000');tg.addColorStop(1,'#880000');
X.fillStyle=tg;
X.fillRect(29,28+bob,12,22);
// Tie end splayed on belly
X.fillStyle='#880000';
X.beginPath();
X.moveTo(29,50+bob);X.lineTo(35,62+bob+breathe);X.lineTo(41,50+bob);
X.fill();

// ARMS - fat, short
if(atk){
if(atkType==='golf'){
// Golf swing - shoulder stays fixed, forearm/club rotates
const swingProgress = (24 - P.atkT) / 24; // 0 to 1
const swingAngle = 1.5 - swingProgress * 2.8; // backswing to follow-through

// Upper arm (fixed to body)
X.fillStyle='#000058';X.fillRect(54,32+bob,18,26);
X.fillStyle='#000068';X.fillRect(56,32+bob,8,24);

// Forearm + club (rotating from elbow)
X.save();
X.translate(63,54+bob); // elbow position
X.rotate(swingAngle);

// Forearm
X.fillStyle='#000050';X.fillRect(-6,-8,24,16);
// Hand gripping club
X.fillStyle='#ffcc99';X.fillRect(14,-8,16,16);
X.fillStyle='#eebb88';X.fillRect(14,4,16,4);
// Club shaft (extends from hand)
X.fillStyle='#d4af37';X.fillRect(18,-55,4,50);
X.fillStyle='#b8960f';X.fillRect(20,-55,2,48);
// Club grip
X.fillStyle='#2a2a2a';X.fillRect(16,-8,8,16);
// Club head
X.fillStyle='#c0c0c0';X.fillRect(12,-65,16,12);
X.fillStyle='#e0e0e0';X.fillRect(14,-63,12,6);

X.restore();
}else{
// FAT PUNCH
const pw=P.super||rageOn?1.4:1;
// Wind up glow (subtle)
if(P.atkT>15)X.fillStyle='rgba(255,200,100,0.3)';
else X.fillStyle='rgba(255,200,100,0.5)';
X.fillRect(50,30+bob,25,28);
// Fat arm
X.fillStyle='#000058';X.fillRect(54,34+bob,38*pw,24);
X.fillStyle='#000068';X.fillRect(54,34+bob,38*pw,10);
// Pudgy fist
X.fillStyle='#ffcc99';X.fillRect(88*pw,30+bob,28,32);
X.fillStyle='#eebb88';X.fillRect(88*pw,54+bob,28,8);
X.fillStyle='#ffddaa';X.fillRect(92*pw,34+bob,10,10);
// Fat knuckles
X.fillStyle='#eebb88';
for(let i=0;i<4;i++)X.fillRect(90*pw+i*6,30+bob,5,6);

// IMPACT - only show during the actual punch swing (atkT between 8-18), not while holding
if(P.atkT>8&&P.atkT<18&&P.atkType==='punch'){
X.fillStyle=rageOn?'#ff4400':'#fff';
const px=116*pw,py=46+bob;
const rays=rageOn?18:12;
for(let i=0;i<rays;i++){const a=i*(6.28/rays)+gt*.3,l=(rageOn?25:18)+Math.sin(gt*.5)*10;
X.fillRect(px+Math.cos(a)*l-4,py+Math.sin(a)*l-4,8,8);}
X.strokeStyle=rageOn?'rgba(255,100,0,0.9)':'rgba(255,255,255,0.8)';X.lineWidth=5;
for(let i=0;i<10;i++){X.beginPath();X.moveTo(88*pw+i*3,26+bob+i*3);X.lineTo(120*pw+i*4,24+bob+i*3);X.stroke();}}
// Super punch glow
if(P.super){
const px=116*pw,py=46+bob;
X.strokeStyle='rgba(255,255,0,0.5)';X.lineWidth=4;
X.beginPath();X.arc(px,py,25+gt%25,0,Math.PI*2);X.stroke();
X.beginPath();X.arc(px,py,45+gt%25,0,Math.PI*2);X.stroke();}
}
// Back arm
X.fillStyle='#000045';X.fillRect(-6,35+bob,16,30);
X.fillStyle='#ffcc99';X.fillRect(-8,60+bob,18,18);
}else{
// Idle - fat arms hanging
const as=Math.abs(P.vx)>.5?Math.sin(fr*.2)*8:0;
// Left arm
X.fillStyle='#000048';X.fillRect(-6,32+bob-as,16,32);
X.fillStyle='#000058';X.fillRect(-4,32+bob-as,8,28);
X.fillStyle='#ffcc99';X.fillRect(-8,60+bob-as,18,18);X.fillStyle='#eebb88';X.fillRect(-8,74+bob-as,18,4);
// Right arm  
X.fillStyle='#000058';X.fillRect(60,32+bob+as,16,32);
X.fillStyle='#000068';X.fillRect(62,32+bob+as,8,28);
X.fillStyle='#ffcc99';X.fillRect(60,60+bob+as,18,18);X.fillStyle='#eebb88';X.fillRect(60,74+bob+as,18,4);
}

// NECK - very thick with fat rolls
X.fillStyle='#ffcc99';X.fillRect(22,12,26,14);
// Neck fat rolls
X.fillStyle='#eebb99';X.fillRect(20,18,30,4);
X.fillStyle='#ddaa88';X.fillRect(18,22,34,4);
// Back of neck fat
X.fillStyle='#eebb88';X.fillRect(18,14,8,10);X.fillRect(44,14,8,10);

// HEAD - round, puffy face
X.fillStyle='#ffcc99';
X.beginPath();X.ellipse(35,0,26,22,0,0,Math.PI*2);X.fill();
// Jowls
X.fillStyle='#ffbb99';
X.beginPath();X.ellipse(12,8,10,12,-.3,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(58,8,10,12,.3,0,Math.PI*2);X.fill();
// Double chin
X.fillStyle='#ffccaa';
X.beginPath();X.ellipse(35,18,18,10,0,0,Math.PI);X.fill();
// Triple chin
X.fillStyle='#ffbb99';
X.beginPath();X.ellipse(35,24,15,6,0,0,Math.PI);X.fill();

// Chubby cheeks
X.fillStyle='#ffbbaa';
X.beginPath();X.ellipse(14,2,9,10,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(56,2,9,10,0,0,Math.PI*2);X.fill();

// HAIR - THE LEGENDARY MANE
X.fillStyle='#bb7700';X.fillRect(8,-22,54,24);X.fillRect(2,-12,14,26);X.fillRect(54,-12,14,30);
X.fillStyle='#cc8800';X.fillRect(10,-21,50,22);X.fillRect(4,-10,12,24);X.fillRect(54,-10,12,28);
X.fillStyle='#dd9900';X.fillRect(12,-20,46,20);X.fillRect(6,-8,10,22);X.fillRect(54,-8,10,26);
X.fillStyle='#eeaa00';X.fillRect(14,-19,42,18);X.fillRect(8,-6,8,20);X.fillRect(54,-6,8,24);
X.fillStyle='#ffbb11';X.fillRect(16,-18,38,16);X.fillRect(10,-4,6,18);X.fillRect(54,-4,6,22);
X.fillStyle='#ffcc22';X.fillRect(18,-17,24,14);X.fillRect(12,-2,5,16);X.fillRect(54,0,5,18);
X.fillStyle='#ffdd44';X.fillRect(20,-18,18,10);X.fillRect(40,-16,20,9);
X.fillStyle='#ffee66';X.fillRect(22,-18,14,8);
// Hair texture
X.fillStyle='#aa6600';
X.fillRect(28,-14,1,12);X.fillRect(38,-12,1,11);X.fillRect(50,-8,1,10);X.fillRect(14,-2,1,14);
// Front swoop
X.fillStyle='#ffcc00';X.fillRect(4,-2,14,20);
X.fillStyle='#ffdd22';X.fillRect(6,0,10,16);
X.fillStyle='#ffee44';X.fillRect(8,2,7,12);
X.fillStyle='#fff8aa';X.fillRect(9,4,4,8);

// FACE
// Eyebrows - angry
X.fillStyle='#aa6600';X.fillRect(16,-6,14,5);X.fillRect(40,-6,14,5);
X.fillStyle='#996600';X.fillRect(14,-5,5,4);X.fillRect(51,-5,5,4);
// Small eyes (fat face makes them look smaller)
X.fillStyle='#fff';X.fillRect(18,-2,10,7);X.fillRect(42,-2,10,7);
X.fillStyle='#5a9fd4';X.fillRect(21,-1,6,6);X.fillRect(44,-1,6,6);
X.fillStyle='#4a8fc4';X.fillRect(22,0,4,4);X.fillRect(45,0,4,4);
X.fillStyle='#1a3a5a';X.fillRect(23,1,2,3);X.fillRect(46,1,2,3);
X.fillStyle='#fff';X.fillRect(21,-1,2,2);X.fillRect(44,-1,2,2);
// Puffy under-eyes
X.fillStyle='rgba(200,150,150,0.4)';
X.beginPath();X.ellipse(23,6,6,3,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(47,6,6,3,0,0,Math.PI*2);X.fill();

// Nose - bulbous
X.fillStyle='#eebb99';
X.beginPath();X.ellipse(35,6,6,8,0,0,Math.PI*2);X.fill();
X.fillStyle='#ddaa88';X.fillRect(39,4,3,8);
// Nostrils
X.fillStyle='#cc9977';
X.beginPath();X.ellipse(32,12,3,2,0,0,Math.PI*2);X.fill();
X.beginPath();X.ellipse(38,12,3,2,0,0,Math.PI*2);X.fill();

// Mouth - small on fat face, pursed
X.fillStyle='#cc9999';
X.beginPath();X.ellipse(35,17,8,4,0,0,Math.PI*2);X.fill();
X.fillStyle='#bb8888';
X.beginPath();X.ellipse(35,18,6,2,0,0,Math.PI);X.fill();

// Power glow
if(pwr||rageOn){X.globalAlpha=.35+Math.sin(gt*.15)*.2;X.fillStyle=rageOn?'#ff4400':(pwr==='speed'?'#0ff':'#ff0');X.fillRect(-15,-25,100,130);X.globalAlpha=1;}

// Dash effect
if(P.dashCD>30){X.globalAlpha=.5;X.fillStyle='#0ff';
for(let i=0;i<3;i++){X.fillRect(-15-i*18,-20,85,115);}X.globalAlpha=1;}

X.restore();
}

// FURNITURE
function drawF(f){
const sx=f.shake>0?(Math.random()-.5)*10:0,sy=f.shake>0?(Math.random()-.5)*5:0;
const x=f.x-cam.x+sx,y=f.y+sy,R=rooms[rIdx];
X.save();

if(!f.isWall){const sh=X.createRadialGradient(x+f.w/2,y+f.h,0,x+f.w/2,y+f.h,f.w*.6);
sh.addColorStop(0,'rgba(0,0,0,0.4)');sh.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=sh;X.fillRect(x-15,y+f.h-10,f.w+30,24)}

if(['tiffanyLamp','chandelier','sconce','stageLight'].includes(f.type)){
const lg=X.createRadialGradient(x+f.w/2,y+f.h/2,0,x+f.w/2,y+f.h/2,f.w);
lg.addColorStop(0,'rgba(255,250,220,0.35)');lg.addColorStop(1,'rgba(255,250,220,0)');X.fillStyle=lg;X.fillRect(x-f.w/2,y-f.h/2,f.w*2,f.h*2)}

switch(f.type){
case'resoluteDesk':
X.fillStyle='#5c3d2e';X.fillRect(x,y+14,f.w,50);
const dg=X.createLinearGradient(x,y+14,x,y+64);dg.addColorStop(0,'#6a4a3a');dg.addColorStop(.5,'#5c3d2e');dg.addColorStop(1,'#4a2f20');
X.fillStyle=dg;X.fillRect(x+5,y+18,f.w-10,42);
X.fillStyle='rgba(0,0,0,0.1)';for(let i=0;i<9;i++)X.fillRect(x+10+i*10,y+22,1,34);
X.fillStyle='#4a2f20';X.fillRect(x+18,y+25,f.w-36,32);X.fillStyle='#3a1f10';X.fillRect(x+22,y+28,f.w-44,26);
X.fillStyle=R.acc;X.beginPath();X.arc(x+f.w/2,y+42,14,0,Math.PI*2);X.fill();
X.fillStyle=R.acc2;X.beginPath();X.arc(x+f.w/2,y+42,9,0,Math.PI*2);X.fill();
X.fillStyle=R.acc;X.beginPath();X.arc(x+f.w/2,y+42,5,0,Math.PI*2);X.fill();
X.fillStyle=R.acc;X.fillRect(x,y+12,f.w,5);X.fillRect(x+3,y+60,f.w-6,5);
X.fillStyle=R.acc2;X.fillRect(x+3,y+12,f.w/3,2);
X.fillStyle='#3a1f10';X.fillRect(x+10,y+26,30,26);X.fillRect(x+f.w-40,y+26,30,26);
X.fillStyle='#d4af37';X.fillRect(x+18,y+36,14,5);X.fillRect(x+f.w-32,y+36,14,5);
X.fillStyle='#f5f5f5';X.fillRect(x+45,y+4,20,16);X.fillStyle='#333';X.fillRect(x+47,y+6,16,12);
X.fillStyle='#0a0';X.fillRect(x+49,y+8,12,8);
X.fillStyle='#3a2518';X.fillRect(x+10,y+62,16,14);X.fillRect(x+f.w-26,y+62,16,14);
X.fillStyle=R.acc;X.fillRect(x+10,y+72,16,4);X.fillRect(x+f.w-26,y+72,16,4);
break;

case'grandPiano':
X.fillStyle='#050505';X.fillRect(x,y+22,f.w,48);
const pg=X.createLinearGradient(x,y+22,x+f.w,y+70);pg.addColorStop(0,'#1a1a1a');pg.addColorStop(.5,'#0a0a0a');pg.addColorStop(1,'#050505');
X.fillStyle=pg;X.fillRect(x+5,y+26,f.w-10,40);
X.fillStyle='#0a0a0a';X.fillRect(x+58,y,44,26);X.fillStyle='#1a1a1a';X.fillRect(x+60,y+2,12,22);
X.fillStyle='#c9a227';X.fillRect(x+56,y+10,3,20);
X.fillStyle='#f8f8f8';X.fillRect(x+8,y+48,90,18);
X.fillStyle='#eee';for(let i=0;i<16;i++)X.fillRect(x+8+i*5.6,y+48,5,17);
X.fillStyle='#111';for(let i=0;i<15;i++)if(i%7!==2&&i%7!==6)X.fillRect(x+11+i*5.6,y+48,4,11);
X.fillStyle='#0a0a0a';X.fillRect(x+32,y+30,38,16);X.fillStyle='#f5f5dc';X.fillRect(x+34,y+32,34,12);
X.fillStyle='#333';for(let i=0;i<6;i++)X.fillRect(x+36,y+34+i*2,30,1);
X.fillStyle=R.acc;X.fillRect(x,y+20,f.w,4);X.fillRect(x,y+66,f.w,4);
X.fillStyle='#050505';X.fillRect(x+14,y+68,18,14);X.fillRect(x+f.w-32,y+68,18,14);
X.fillStyle=R.acc;X.fillRect(x+44,y+78,8,6);X.fillRect(x+56,y+78,8,6);
break;

case'chandelier':
X.fillStyle=R.acc;X.fillRect(x+f.w/2-3,y-44,6,48);X.fillStyle=R.acc2;X.fillRect(x+f.w/2-1,y-44,2,46);
X.fillStyle=R.acc;X.fillRect(x+f.w/2-22,y,44,12);X.fillRect(x+f.w/2-28,y+10,56,8);
X.fillStyle=R.acc2;X.fillRect(x+f.w/2-16,y+2,32,6);
for(let i=0;i<7;i++){
const ax=x+6+i*(f.w-12)/6,ay=y+16;
X.fillStyle=R.acc;X.fillRect(ax-2,ay,4,30);X.fillStyle=R.acc2;X.fillRect(ax-1,ay,2,28);
X.fillRect(ax-5,ay+28,10,4);
X.fillStyle='#e8e8ff';X.fillRect(ax-4,ay+32,8,18);X.fillStyle='#fff';X.fillRect(ax-3,ay+34,3,14);
X.fillStyle='#c8c8e8';X.fillRect(ax+1,ay+32,3,16);
X.fillStyle='#d8d8f8';X.fillRect(ax-3,ay+48,6,5);X.fillRect(ax-2,ay+51,4,4);
const cg=X.createRadialGradient(ax,ay+38,0,ax,ay+38,18);cg.addColorStop(0,'rgba(255,255,220,0.5)');cg.addColorStop(1,'rgba(255,255,220,0)');
X.fillStyle=cg;X.fillRect(ax-18,ay+20,36,36)}
break;

case'cmdStation':
X.fillStyle='#1a1c24';X.fillRect(x,y+26,f.w,44);X.fillStyle='#22242c';X.fillRect(x+5,y+30,f.w-10,36);
for(let i=0;i<3;i++){
const mx=x+10+i*32;
X.fillStyle='#0a0c12';X.fillRect(mx,y,30,30);X.fillStyle='#12141a';X.fillRect(mx+2,y+2,26,24);
X.fillStyle='#0a1a2a';X.fillRect(mx+4,y+4,22,20);
X.fillStyle=R.acc;for(let j=0;j<5;j++){const bw=10+Math.sin(gt*.1+i+j)*8;X.fillRect(mx+6,y+6+j*4,bw,2)}
X.fillStyle=(Math.sin(gt*0.1+i*2)>0)?'#0f0':'#f00';X.fillRect(mx+24,y+22,4,4)}
X.fillStyle='#1a1a22';X.fillRect(x+12,y+40,84,16);
X.fillStyle='#2a2a32';for(let i=0;i<22;i++)for(let j=0;j<3;j++)X.fillRect(x+14+i*4,y+42+j*5,3,4);
X.fillStyle='#8b0000';X.fillRect(x+f.w-28,y+36,22,22);X.fillStyle='#aa0000';X.fillRect(x+f.w-26,y+38,18,14);
break;

case'tacScreen':
X.fillStyle='#0a0c12';X.fillRect(x,y,f.w,f.h);X.fillStyle='#12141a';X.fillRect(x+4,y+4,f.w-8,f.h-8);
X.fillStyle='#0a1a1a';X.fillRect(x+8,y+8,f.w-16,f.h-16);
X.fillStyle='#0a3a2a';X.fillRect(x+12,y+12,f.w-24,f.h-24);
X.fillStyle='rgba(0,255,136,0.2)';
for(let i=0;i<8;i++){X.fillRect(x+12+i*10,y+12,1,f.h-24);if(i<6)X.fillRect(x+12,y+12+i*8,f.w-24,1)}
[[22,18,'#f00'],[52,28,'#f00'],[38,38,'#ff0'],[62,22,'#0f0']].forEach(([tx,ty,tc])=>{
const pl=Math.sin(gt*.15+tx)*.5+.5;X.fillStyle=tc;X.globalAlpha=.5+pl*.5;
X.beginPath();X.arc(x+12+tx,y+12+ty,5+pl*3,0,Math.PI*2);X.fill();X.globalAlpha=1});
X.fillStyle='#0a0c12';X.fillRect(x+8,y+f.h-20,f.w-16,14);
X.fillStyle=R.acc;X.fillRect(x+12,y+f.h-17,44,8);
break;

default:
const gg=X.createLinearGradient(x,y,x+f.w,y+f.h);gg.addColorStop(0,'#6a5a4a');gg.addColorStop(1,'#4a3a2a');
X.fillStyle=gg;X.fillRect(x,y,f.w,f.h);
X.fillStyle=R.acc;X.fillRect(x,y,f.w,3);X.fillRect(x,y+f.h-3,f.w,3)}

const dmg=1-f.hp/f.maxHp;
if(dmg>0){
X.fillStyle=`rgba(0,0,0,${dmg*.5})`;X.fillRect(x,y,f.w,f.h);
X.strokeStyle='#111';X.lineWidth=2;
// Use deterministic positions based on furniture position to avoid flickering
const seed=f.x*7+f.y*13;
for(let i=0;i<Math.floor(dmg*8);i++){
const cx=x+f.w*.15+((seed+i*17)%100)/100*f.w*.7;
const cy=y+f.h*.15+((seed+i*23)%100)/100*f.h*.7;
X.beginPath();X.moveTo(cx,cy);
for(let j=0;j<3;j++){
const ox=((seed+i*31+j*41)%100-50)/100*24;
const oy=((seed+i*37+j*47)%100-50)/100*24;
X.lineTo(cx+ox,cy+oy);}X.stroke();}
X.fillStyle='#3a2a1a';
for(let i=0;i<Math.floor(dmg*6);i++){
const dx=x+f.w*.1+((seed+i*19)%80)/100*f.w*.8;
const dy=y+f.h*.1+((seed+i*29)%80)/100*f.h*.8;
const dr=((seed+i*13)%628)/100;
X.save();X.translate(dx,dy);X.rotate(dr);X.fillRect(-4,-2,8,4);X.restore();}}
X.restore()}

// ENEMIES
function drawE(e){
const x=e.x-cam.x,y=e.y,fc=e.vx>0?1:-1;
X.save();X.translate(x+e.w/2,y+e.h/2);X.scale(fc,1);X.translate(-e.w/2,-e.h/2);
const sh=X.createRadialGradient(e.w/2,e.h+5,0,e.w/2,e.h+5,e.w/2);
sh.addColorStop(0,'rgba(0,0,0,0.4)');sh.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=sh;X.fillRect(-6,e.h-5,e.w+12,18);

if(e.stun>0){X.globalAlpha=.4+Math.sin(e.stun*.4)*.4;X.fillStyle='#ff0';
for(let i=0;i<4;i++){const a=gt*.15+i*1.57,d=20+Math.sin(gt*.2+i)*5;
X.fillRect(e.w/2+Math.cos(a)*d-3,Math.sin(a)*d*.5-10,6,3);X.fillRect(e.w/2+Math.cos(a)*d,Math.sin(a)*d*.5-12,2,7)}}

e.fr+=.12;const wk=Math.sin(e.fr)*3;

if(e.type==='secretService'){
X.fillStyle='#0a0a0a';X.fillRect(14,50+wk,11,16);X.fillRect(30,50-wk,11,16);
X.fillStyle='#050505';X.fillRect(12,64+wk,15,6);X.fillRect(28,64-wk,15,6);
const sg=X.createLinearGradient(10,20,46,54);sg.addColorStop(0,'#1a1a1a');sg.addColorStop(1,'#0a0a0a');
X.fillStyle=sg;X.fillRect(10,20,36,36);X.fillStyle='#222';X.fillRect(12,22,14,32);
X.fillStyle='#f0f0f0';X.fillRect(20,22,16,16);X.fillStyle='#0a0a0a';X.fillRect(24,22,6,22);X.fillRect(23,42,8,6);
X.fillStyle='#222';X.fillRect(4,12,5,14);X.fillStyle='#0a0a0a';X.fillRect(3,10,4,7);X.fillStyle='#333';X.fillRect(5,22,2,10);
X.fillStyle='#e8c8a8';X.fillRect(12,0,26,22);X.fillStyle='#d8b898';X.fillRect(34,4,4,14);
X.fillStyle='#2a2a2a';X.fillRect(12,-3,26,8);
X.fillStyle='#0a0a0a';X.fillRect(12,9,12,7);X.fillRect(28,9,12,7);X.fillRect(24,10,4,3);
X.fillStyle='#1a3a4a';X.fillRect(13,10,10,5);X.fillRect(29,10,10,5);
X.fillStyle='#c8a888';X.fillRect(20,16,10,4);X.fillStyle='#b89878';X.fillRect(21,17,8,3);
X.fillStyle='#1a1a1a';X.fillRect(2,24,10,22);X.fillRect(44,24,10,22);
X.fillStyle='#e8c8a8';X.fillRect(0,44,12,12);X.fillRect(44,44,12,12);
}else if(e.type==='cameraman'){
X.fillStyle='#1a1a2a';X.fillRect(12,48+wk,9,14);X.fillRect(26,48-wk,9,14);
X.fillStyle='#0a0a0a';X.fillRect(10,60+wk,13,5);X.fillRect(24,60-wk,13,5);
X.fillStyle='#2a2a3a';X.fillRect(8,18,30,36);X.fillStyle='#3a3a4a';X.fillRect(10,20,14,32);
X.fillStyle='#cc0000';X.fillRect(8,22,30,10);X.fillStyle='#fff';X.font='6px sans-serif';X.fillText('PRESS',11,30);
X.fillStyle='#ffcc99';X.fillRect(10,0,26,20);X.fillStyle='#eebb88';X.fillRect(32,4,4,14);
X.fillStyle='#1a1a2a';X.fillRect(8,-5,30,12);X.fillRect(6,3,7,8);
X.fillStyle='#cc0000';X.fillRect(10,-3,12,5);
X.fillStyle='#fff';X.fillRect(14,7,7,5);X.fillRect(26,7,7,5);
X.fillStyle='#333';X.fillRect(16,8,4,4);X.fillRect(28,8,4,4);
X.fillStyle='#cc9988';X.fillRect(19,12,8,6);X.fillStyle='#bb8877';X.fillRect(17,18,12,3);
X.fillStyle='#1a1a22';X.fillRect(34,5,28,24);X.fillStyle='#2a2a32';X.fillRect(36,7,24,20);
X.fillStyle='#3a5a7a';X.beginPath();X.arc(48,17,11,0,Math.PI*2);X.fill();
X.fillStyle='#2a4a6a';X.beginPath();X.arc(48,17,8,0,Math.PI*2);X.fill();
X.fillStyle='#1a3a5a';X.beginPath();X.arc(48,17,5,0,Math.PI*2);X.fill();
X.fillStyle='rgba(255,255,255,0.3)';X.beginPath();X.arc(44,13,4,0,Math.PI*2);X.fill();
X.fillStyle=Math.floor(gt*.2)%2?'#f00':'#800';X.fillRect(58,7,6,6);
}else if(e.type==='suit'){
// LAWYER - suit with briefcase
X.fillStyle='#1a1a1a';X.fillRect(12,46+wk,8,14);X.fillRect(26,46-wk,8,14);
X.fillStyle='#0a0a0a';X.fillRect(10,58+wk,12,5);X.fillRect(24,58-wk,12,5);
// Dark suit
X.fillStyle='#1a1a2a';X.fillRect(8,16,30,36);X.fillStyle='#2a2a3a';X.fillRect(10,18,26,32);
// White shirt and tie
X.fillStyle='#f0f0f0';X.fillRect(18,18,10,20);X.fillStyle='#800';X.fillRect(21,18,4,18);
// Head
X.fillStyle='#e8c8a8';X.fillRect(12,0,22,18);X.fillStyle='#d8b898';X.fillRect(10,4,4,10);X.fillRect(32,4,4,10);
// Slicked back dark hair
X.fillStyle='#1a1a1a';X.fillRect(10,-4,26,8);X.fillRect(8,0,6,6);X.fillRect(32,0,6,6);
// Eyes with glasses
X.fillStyle='#fff';X.fillRect(14,6,7,5);X.fillRect(25,6,7,5);
X.fillStyle='#333';X.fillRect(16,7,3,3);X.fillRect(27,7,3,3);
X.strokeStyle='#444';X.lineWidth=1;X.strokeRect(13,5,9,7);X.strokeRect(24,5,9,7);
X.fillStyle='#444';X.fillRect(22,7,2,2); // nose bridge
// Frown
X.fillStyle='#a08080';X.fillRect(17,13,12,3);
// Briefcase
X.fillStyle='#4a3020';X.fillRect(-4,28,16,14);X.fillStyle='#6a4a30';X.fillRect(-2,30,12,10);
X.fillStyle='#ffd700';X.fillRect(4,34,4,3);
}else{
X.fillStyle='#1a1a28';X.fillRect(12,46+wk,8,14);X.fillRect(26,46-wk,8,14);
X.fillStyle='#0a0a0a';X.fillRect(10,58+wk,12,5);X.fillRect(24,58-wk,12,5);
X.fillStyle='#2a3a4a';X.fillRect(8,16,28,36);X.fillStyle='#3a4a5a';X.fillRect(10,18,12,32);
X.fillStyle='#e8e8f0';X.fillRect(16,18,12,20);X.fillStyle='#cc0000';X.fillRect(19,18,6,18);X.fillRect(18,34,8,6);
X.fillStyle='#ffcc99';X.fillRect(10,0,24,18);X.fillStyle='#eebb88';X.fillRect(30,4,4,12);
X.fillStyle='#3a2a1a';X.fillRect(8,-4,26,10);X.fillRect(6,2,7,10);X.fillRect(30,2,7,12);
X.fillStyle='#4a3a2a';X.fillRect(10,-3,12,6);
X.fillStyle='#fff';X.fillRect(14,6,6,5);X.fillRect(26,6,6,5);
X.fillStyle='#4a8ac4';X.fillRect(16,7,4,4);X.fillRect(28,7,4,4);X.fillStyle='#fff';X.fillRect(16,7,1,1);X.fillRect(28,7,1,1);
X.fillStyle='#cc9999';X.fillRect(16,14,12,4);X.fillStyle='#fff';X.fillRect(17,14,10,2);
X.fillStyle='#222';X.fillRect(34,10,16,6);X.fillStyle='#444';X.fillRect(48,7,12,12);
X.fillStyle='#666';X.beginPath();X.arc(54,13,5,0,Math.PI*2);X.fill();
X.fillStyle='#f8f8f8';X.fillRect(2,26,14,18);X.fillStyle='#ccc';for(let i=0;i<5;i++)X.fillRect(4,28+i*3,10,1)}

X.fillStyle='#300';X.fillRect(e.w/2-16,-16,32,10);X.fillStyle='#500';X.fillRect(e.w/2-15,-15,30,8);
const hp=e.hp/e.maxHp,hg=X.createLinearGradient(e.w/2-14,-14,e.w/2-14,-8);
hg.addColorStop(0,hp>.6?'#0f0':(hp>.3?'#ff0':'#f00'));hg.addColorStop(1,hp>.6?'#080':(hp>.3?'#880':'#800'));
X.fillStyle=hg;X.fillRect(e.w/2-14,-14,28*hp,6);
X.fillStyle='rgba(255,255,255,0.3)';X.fillRect(e.w/2-14,-14,28*hp,2);
X.globalAlpha=1;X.restore()}

// ITEMS
function drawI(it){
if(it.got)return;
const bob=Math.sin(gt*.07+it.bob)*7,x=it.x-cam.x,y=it.y+bob,pl=Math.sin(gt*.12+it.bob);
const gs=30+pl*10,gc=it.type==='rageStar'?'255,100,0':(it.type==='energyDrink'?'0,255,255':'255,255,100');
const glow=X.createRadialGradient(x+16,y+16,0,x+16,y+16,gs);
glow.addColorStop(0,`rgba(${gc},0.5)`);glow.addColorStop(.5,`rgba(${gc},0.2)`);glow.addColorStop(1,`rgba(${gc},0)`);
X.fillStyle=glow;X.fillRect(x-20,y-20,72,72);
X.fillStyle='#fff';for(let i=0;i<6;i++){const a=gt*.1+i*1.05+it.bob,d=20+pl*5;
X.fillRect(x+16+Math.cos(a)*d-1,y+16+Math.sin(a)*d-1,3,3)}

switch(it.type){
case'burger':
X.fillStyle='#d49520';X.fillRect(x+2,y+2,28,10);X.fillRect(x+4,y,24,5);
X.fillStyle='#e8a830';X.fillRect(x+6,y+1,12,6);X.fillStyle='#c48510';X.fillRect(x+22,y+3,6,6);
X.fillStyle='#fff8e0';X.fillRect(x+9,y+2,4,2);X.fillRect(x+17,y+1,4,2);X.fillRect(x+23,y+4,3,2);
X.fillStyle='#22aa22';X.fillRect(x,y+10,32,7);X.fillStyle='#33cc33';for(let i=0;i<6;i++)X.fillRect(x+2+i*5,y+9,5,5);
X.fillStyle='#cc3333';X.fillRect(x+4,y+15,24,6);X.fillStyle='#ee5555';X.fillRect(x+6,y+16,10,4);
X.fillStyle='#ffcc00';X.fillRect(x+2,y+20,28,5);X.fillStyle='#ffdd33';X.fillRect(x+4,y+20,12,3);
X.fillStyle='#ffcc00';X.fillRect(x,y+22,4,7);X.fillRect(x+28,y+23,4,6);
X.fillStyle='#6a3a1a';X.fillRect(x+2,y+24,28,8);X.fillStyle='#7a4a2a';X.fillRect(x+4,y+25,14,5);
X.fillStyle='#6a3a1a';X.fillRect(x+2,y+31,28,8);X.fillStyle='#7a4a2a';X.fillRect(x+4,y+32,14,5);
X.fillStyle='#d49520';X.fillRect(x+2,y+38,28,9);X.fillStyle='#c48510';X.fillRect(x+2,y+45,28,2);
X.fillStyle='#e8a830';X.fillRect(x+4,y+38,12,5);break;
case'rageStar':
X.fillStyle='#ff4400';const cx=x+16,cy=y+18;
for(let i=0;i<5;i++){const a1=i*1.257-1.57,a2=a1+.628;
X.beginPath();X.moveTo(cx,cy);X.lineTo(cx+Math.cos(a1)*20,cy+Math.sin(a1)*20);X.lineTo(cx+Math.cos(a2)*10,cy+Math.sin(a2)*10);X.fill()}
X.fillStyle='#ff8844';X.beginPath();X.arc(cx,cy,10,0,Math.PI*2);X.fill();
X.fillStyle='#ffcc88';X.beginPath();X.arc(cx,cy,5,0,Math.PI*2);X.fill();
for(let i=0;i<5;i++){const fa=gt*.15+i*1.26;X.fillStyle=`hsl(${20+Math.random()*20},100%,55%)`;
X.fillRect(cx+Math.cos(fa)*15-3,cy+Math.sin(fa)*15-3,6,6)}break;
case'energyDrink':
X.fillStyle='#00cccc';X.fillRect(x+6,y+2,22,34);X.fillStyle='#00eeee';X.fillRect(x+8,y+4,8,30);
X.fillStyle='#00aaaa';X.fillRect(x+24,y+4,3,30);
X.fillStyle='#c0c0c0';X.fillRect(x+6,y,22,5);X.fillStyle='#e0e0e0';X.fillRect(x+8,y+1,10,3);
X.fillStyle='#888';X.fillRect(x+13,y-3,8,5);
X.fillStyle='#ff0';X.fillRect(x+15,y+10,8,5);X.fillRect(x+13,y+13,8,5);X.fillRect(x+15,y+16,8,5);X.fillRect(x+17,y+19,8,5);
X.fillStyle='#fff';X.font='5px sans-serif';X.fillText('ENERGY',x+8,y+32);break;
case'goldStack':
for(let i=0;i<3;i++){const gy=y+i*10,gx=x+i*3;
X.fillStyle='#ffd700';X.fillRect(gx+2,gy+10,28,12);
X.fillStyle='#ffec8b';X.fillRect(gx+4,gy+5,24,7);X.fillStyle='#fff8c0';X.fillRect(gx+6,gy+6,10,4);
X.fillStyle='#b8860b';X.fillRect(gx+24,gy+10,6,12);X.fillRect(gx+4,gy+18,26,4)}
X.fillStyle='#fff';X.fillRect(x+12,y+14,5,5);break;
case'phone':
X.fillStyle='#1a1a2a';X.fillRect(x+8,y,20,36);X.fillStyle='#2a2a3a';X.fillRect(x+9,y+1,7,34);
X.fillStyle='#4a90d9';X.fillRect(x+10,y+4,16,24);X.fillStyle='#6ab0ff';X.fillRect(x+11,y+5,7,12);
X.fillStyle='#1da1f2';X.fillRect(x+14,y+12,12,10);X.fillStyle='#fff';X.fillRect(x+16,y+14,8,6);X.fillRect(x+22,y+12,5,4);
X.fillStyle='#f00';X.beginPath();X.arc(x+24,y+8,5,0,Math.PI*2);X.fill();
X.fillStyle='#fff';X.font='6px sans-serif';X.fillText('99',x+21,y+10);
X.fillStyle='#333';X.fillRect(x+15,y+30,6,4);break;
case'golfBall':
const bx=x+18,by=y+16;
X.fillStyle='rgba(0,0,0,0.2)';X.beginPath();X.ellipse(bx,by+16,12,5,0,0,Math.PI*2);X.fill();
X.fillStyle='#f8f8f8';X.beginPath();X.arc(bx,by,14,0,Math.PI*2);X.fill();
X.fillStyle='#fff';X.beginPath();X.arc(bx-5,by-5,6,0,Math.PI*2);X.fill();
X.fillStyle='#e0e0e0';[[0,-10],[8,-6],[-8,-6],[10,0],[-10,0],[8,6],[-8,6],[0,10],[5,-3],[-5,-3],[5,5],[-5,5]].forEach(([dx,dy])=>{
X.beginPath();X.arc(bx+dx,by+dy,2,0,Math.PI*2);X.fill()});
X.fillStyle='#cc0000';X.fillRect(bx-10,by-2,20,4);X.fillStyle='#880000';X.fillRect(bx-8,by+1,16,1);break;
}}

// BACKGROUND
function drawBG(){
const R=rooms[rIdx];
const cg=X.createLinearGradient(0,0,W,82);cg.addColorStop(0,'#f0e8d8');cg.addColorStop(.5,'#e8e0d0');cg.addColorStop(1,'#f0e8d8');
X.fillStyle=cg;X.fillRect(0,0,W,82);
X.fillStyle=R.acc;X.fillRect(0,74,W,10);X.fillStyle=R.acc2;X.fillRect(0,75,W,3);
X.fillStyle='rgba(0,0,0,0.2)';X.fillRect(0,82,W,2);
for(let i=0;i<W;i+=44){X.fillStyle=R.acc2;X.fillRect(i-(cam.x*.3)%44+6,68,32,7);X.fillStyle=R.acc;X.fillRect(i-(cam.x*.3)%44+12,65,20,5)}
const wg=X.createLinearGradient(0,84,0,268);wg.addColorStop(0,R.w1);wg.addColorStop(.5,R.w2);wg.addColorStop(1,R.w1);
X.fillStyle=wg;X.fillRect(0,84,W,184);

if(rIdx===4){
X.strokeStyle='rgba(0,255,136,0.12)';X.lineWidth=1;
for(let i=0;i<W;i+=60){X.beginPath();X.moveTo(i-(cam.x*.2)%60,84);X.lineTo(i-(cam.x*.2)%60,268);X.stroke()}
for(let j=0;j<7;j++){X.beginPath();X.moveTo(0,98+j*26);X.lineTo(W,98+j*26);X.stroke()}
for(let i=0;i<W;i+=60)for(let j=0;j<7;j++){const nx=i-(cam.x*.2)%60;if(Math.sin(gt*.06+i*.05+j)>.6){X.fillStyle=R.acc;X.fillRect(nx-3,95+j*26,6,6)}}
const scanY=84+(gt*2)%184;X.fillStyle='rgba(0,255,136,0.12)';X.fillRect(0,scanY,W,4);
}else{for(let i=0;i<W+32;i+=32){const wx=i-(cam.x*.4)%32;X.fillStyle='rgba(255,255,255,0.03)';X.fillRect(wx,84,16,184);X.fillStyle='rgba(0,0,0,0.02)';X.fillRect(wx+16,84,16,184)}}

for(let i=0;i<12;i++){
const wx=55+i*260-cam.x;if(wx<-130||wx>W+130)continue;
if(rIdx!==4){
X.fillStyle=rIdx===2?'#6a1a1a':'#2a3a5a';X.fillRect(wx-18,88,24,176);X.fillRect(wx+100,88,24,176);
X.fillStyle=rIdx===2?'#5a0a0a':'#1a2a4a';for(let f=0;f<4;f++){X.fillRect(wx-16+f*7,88,3,176);X.fillRect(wx+102+f*7,88,3,176)}
X.fillStyle=R.acc;X.fillRect(wx-14,145,20,12);X.fillRect(wx+102,145,20,12);
X.fillStyle=R.acc2;X.fillRect(wx-10,155,12,20);X.fillRect(wx+106,155,12,20);
X.fillStyle='#f8f8f8';X.fillRect(wx,94,106,124);
const wgg=X.createLinearGradient(wx+6,100,wx+100,215);wgg.addColorStop(0,'#a8d0f0');wgg.addColorStop(.3,'#90c0e0');wgg.addColorStop(1,'#80b0d0');
X.fillStyle=wgg;X.fillRect(wx+6,100,46,112);X.fillRect(wx+56,100,46,112);
X.fillStyle='rgba(255,255,255,0.4)';X.fillRect(wx+8,102,18,55);X.fillRect(wx+58,102,18,55);
X.fillStyle='#e8e8e8';X.fillRect(wx+52,94,6,124);X.fillRect(wx+6,153,96,7);
X.fillStyle=R.acc;X.fillRect(wx-10,88,126,10);X.fillStyle=R.acc2;X.fillRect(wx,89,106,4);
X.fillStyle='#f0f0f0';X.fillRect(wx-12,216,130,12);X.fillStyle=R.acc;X.fillRect(wx-12,214,130,5);
}else{
X.fillStyle='#08090c';X.fillRect(wx,94,106,112);X.fillStyle='#10121a';X.fillRect(wx+5,98,96,104);
X.fillStyle='#0a1520';X.fillRect(wx+10,102,86,96);
const hg=X.createLinearGradient(wx+12,104,wx+12,194);hg.addColorStop(0,'rgba(0,255,136,0.1)');hg.addColorStop(.5,'rgba(0,255,136,0.2)');hg.addColorStop(1,'rgba(0,255,136,0.1)');
X.fillStyle=hg;X.fillRect(wx+12,104,82,92);
X.fillStyle=R.acc;for(let d=0;d<12;d++){const dw=22+Math.sin(gt*.08+d*.7)*32;X.fillRect(wx+16,110+d*7,dw,4)}
X.fillStyle=Math.sin(gt*.1)>0?'#0f0':'#080';X.fillRect(wx+84,108,10,10);
X.fillStyle=Math.sin(gt*.15)>0?'#f00':'#800';X.fillRect(wx+84,124,10,10)}}

for(let i=0;i<12;i++){
const cx=180+i*260-cam.x;if(cx<-45||cx>W+45)continue;
if(rIdx!==4){
X.fillStyle='#f5f0e8';X.fillRect(cx+10,84,26,184);X.fillStyle='#e8e4dc';X.fillRect(cx+32,84,4,184);
X.fillStyle='#fcf8f0';X.fillRect(cx+12,84,10,184);
X.fillStyle='rgba(0,0,0,0.04)';for(let fl=0;fl<5;fl++)X.fillRect(cx+13+fl*5,102,2,158);
X.fillStyle=R.acc;X.fillRect(cx+6,80,34,12);X.fillRect(cx+2,76,42,7);
X.fillStyle=R.acc2;X.fillRect(cx+8,77,14,5);
X.fillStyle=R.acc;X.beginPath();X.arc(cx+8,82,7,0,Math.PI*2);X.fill();X.beginPath();X.arc(cx+38,82,7,0,Math.PI*2);X.fill();
X.fillStyle=R.acc2;X.beginPath();X.arc(cx+8,82,4,0,Math.PI*2);X.fill();X.beginPath();X.arc(cx+38,82,4,0,Math.PI*2);X.fill();
X.fillStyle=R.acc;X.fillRect(cx+6,262,34,10);X.fillRect(cx+2,268,42,8);
}else{
X.fillStyle='#12141a';X.fillRect(cx+12,84,22,184);X.fillStyle='#1a1c24';X.fillRect(cx+14,86,18,180);
for(let l=0;l<15;l++){const on=Math.sin(gt*.08+l*.4)>.2;X.fillStyle=on?R.acc:'rgba(0,255,136,0.15)';X.fillRect(cx+16,94+l*12,14,9);
if(on){X.fillStyle='rgba(0,255,136,0.3)';X.fillRect(cx+12,92+l*12,22,13)}}}}

X.fillStyle='#d0c0a0';X.fillRect(0,268,W,30);
for(let i=0;i<W+105;i+=105){const px=i-(cam.x*.5)%105;X.fillStyle='#e0d0b0';X.fillRect(px+10,271,85,24);X.fillStyle='#c0b090';X.fillRect(px+80,271,15,24);
X.strokeStyle=R.acc;X.lineWidth=1;X.strokeRect(px+14,274,77,18)}
X.fillStyle=R.acc;X.fillRect(0,265,W,7);X.fillStyle=R.acc2;X.fillRect(0,266,W,3);
X.fillStyle=R.acc;X.fillRect(0,294,W,5);

const fg=X.createLinearGradient(0,298,0,H);fg.addColorStop(0,R.f1);fg.addColorStop(1,'#0a0a12');X.fillStyle=fg;X.fillRect(0,298,W,H-298);
if(rIdx!==4){for(let i=-1;i<W/85+2;i++){const fx=i*85-(cam.x%85);X.fillStyle='rgba(0,0,0,0.08)';X.fillRect(fx,298,42,H-298);X.fillStyle='rgba(255,255,255,0.03)';X.fillRect(fx+42,298,43,H-298)}
X.fillStyle=R.acc;X.fillRect(0,298,W,4);}else{
X.strokeStyle='rgba(0,255,136,0.1)';X.lineWidth=1;for(let i=0;i<W;i+=45){X.beginPath();X.moveTo(i-(cam.x%45),298);X.lineTo(i-(cam.x%45),H);X.stroke()}
for(let j=0;j<6;j++){X.beginPath();X.moveTo(0,308+j*25);X.lineTo(W,308+j*25);X.stroke()}}

if(rIdx===0){const sx=480-(cam.x%950);
X.fillStyle='rgba(212,175,55,0.25)';X.beginPath();X.arc(sx,365,60,0,Math.PI*2);X.fill();
X.fillStyle='rgba(212,175,55,0.35)';X.beginPath();X.arc(sx,365,45,0,Math.PI*2);X.fill();
X.fillStyle='rgba(212,175,55,0.45)';X.beginPath();X.arc(sx,365,30,0,Math.PI*2);X.fill();
X.fillStyle='rgba(212,175,55,0.6)';X.fillRect(sx-14,354,28,18);X.fillRect(sx-10,348,20,10);X.fillRect(sx-22,358,10,8);X.fillRect(sx+12,358,10,8)}
}

function drawProj(p){
const x=p.x-cam.x;
if(p.type==='tweet'){
X.fillStyle='#1da1f2';X.fillRect(x,p.y,p.w,p.h);X.fillStyle='#fff';X.fillRect(x+4,p.y+3,16,3);X.fillRect(x+4,p.y+8,12,3);
X.fillStyle='rgba(29,161,242,0.4)';X.fillRect(x-8,p.y-2,12,p.h+4);}
else{X.fillStyle='rgba(255,255,255,0.4)';X.beginPath();X.arc(x-p.vx*.4+7,p.y-p.vy*.4+7,5,0,Math.PI*2);X.fill();
X.fillStyle='#fff';X.beginPath();X.arc(x+7,p.y+7,7,0,Math.PI*2);X.fill();
X.fillStyle='#eee';X.beginPath();X.arc(x+5,p.y+5,3,0,Math.PI*2);X.fill();}}

function update(){
if(st!=='playing')return;
checkSoundByte();
if(freezeFrames>0){freezeFrames--;return;}
const spd=5.5*(pwr==='speed'?1.6:1)*(rageOn?1.25:1);
if(keys['ArrowLeft']||keys['KeyA']){P.vx=-spd;P.face=-1}
else if(keys['ArrowRight']||keys['KeyD']){P.vx=spd;P.face=1}
else P.vx*=.85;
if((keys['Space']||keys['ArrowUp']||keys['KeyW'])&&P.ground){P.vy=-15;P.ground=false;spawnP(P.x+22,P.y+56,['#fff','#ccc'],6);playSound('jump');}

// Dash with Shift
if((keys['ShiftLeft']||keys['ShiftRight'])&&P.dashCD<=0&&P.ground){
P.dashCD=40;P.vx=P.face*18;P.inv=15;shake=6;
spawnP(P.x+22,P.y+30,['#0ff','#08f','#fff'],12);doFlash('#0ff',50);playSound('dash');}

if(keys['KeyZ']){P.charge++;if(P.charge>40)P.super=true;if(!P.atk){P.atk=true;P.atkType='punch';P.atkT=20}}
else{if(P.charge>0&&P.super){shake=18;freezeFrames=6;spawnP(P.x+22,P.y+30,['#ff0','#f80','#fff'],30);doFlash('#ff0',100);playSound('superPunch');}P.charge=0;P.super=false}

if(keys['KeyX']&&P.tCD<=0){P.tCD=70;spawnTweets();shake=8;doFlash('#1da1f2',60);playSound('tweet');}
if(keys['KeyC']&&P.gCD<=0){P.gCD=50;P.atk=true;P.atkType='golf';P.atkT=24;setTimeout(spawnGolf,140);doFlash('#fff',40);playSound('golf');}

P.vy+=.52;P.x+=P.vx;P.y+=P.vy;
if(P.y>284){P.y=284;P.vy=0;P.ground=true}
P.x=Math.max(12,Math.min(cam.len-55,P.x));
cam.x+=(P.x-260-cam.x)*.09;cam.x=Math.max(0,Math.min(cam.len-W,cam.x));
if(Math.abs(P.vx)>.5)P.fr++;
if(P.atk){P.atkT--;if(P.atkT<=0)P.atk=false}
if(P.tCD>0)P.tCD--;if(P.gCD>0)P.gCD--;if(P.inv>0)P.inv--;if(P.dashCD>0)P.dashCD--;
if(pwr){pwrT--;if(pwrT<=0)pwr=null}
if(comboT>0){comboT--;if(comboT<=0){combo=0;multiplier=1;}}
if(rage>0&&!rageOn)rage-=.15;
if(rage>=100&&!rageOn){rageOn=true;shake=20;freezeFrames=10;doFlash('#f80',150);spawnT(P.x,P.y-50,'RAGE MODE!','#f40');playSound('rage');playSound('trump');}
if(rageOn){rage-=.3;if(rage<=0){rageOn=false;rage=0}}

if(P.atk&&P.atkT>8){
const rng=(P.atkType==='golf'?48:38)*(P.super?1.5:1)*(rageOn?1.3:1),ax=P.x+(P.face>0?36:-rng);
const dmg=(P.super?4:1)*(rageOn?2:1);
furn.forEach(f=>{if(f.hp<=0)return;
if(ax<f.x+f.w&&ax+rng>f.x&&P.y<f.y+f.h&&P.y+P.h>f.y-22){
f.hp-=dmg;f.shake=14;shake=Math.max(shake,6+dmg*2);combo++;comboT=100;multiplier=Math.min(10,1+Math.floor(combo/3));
if(f.hp<=0){const pts=Math.floor(f.pts*multiplier*(rageOn?1.5:1));sc+=pts;chaos=Math.min(100,chaos+2.5);
spawnP(f.x+f.w/2,f.y,['#8b4513','#654321','#d4af37','#fff'],25);spawnT(f.x,f.y-24,'+'+pts,multiplier>3?'#ff0':'#fff');
if(multiplier>2)spawnT(f.x,f.y-50,multiplier+'X!','#f0f');
rage=Math.min(100,rage+6);doFlash('#fa0',70);freezeFrames=P.super?5:2;playSound('destroy');if(multiplier>3)playSound('combo');}
else spawnP(f.x+f.w/2,f.y+f.h/2,['#fff','#ddd'],10);playSound('punch');}});
}
furn.forEach(f=>{if(f.shake>0)f.shake--});

projs=projs.filter(p=>{
p.x+=p.vx;p.y+=p.vy;p.life--;
if(p.type==='golf'){p.vy+=.42;if(p.y>340&&p.bnc>0){p.y=340;p.vy=-p.vy*.72;p.bnc--;spawnP(p.x,p.y,['#fff','#0f0'],5);}}

// Hit boss with projectiles
if(boss&&bossPhase==='fighting'&&boss.stunTimer<=0){
if(p.x<boss.x+35&&p.x+p.w>boss.x-35&&p.y<boss.y+30&&p.y+p.h>boss.y-50){
const dmg=p.type==='golf'?3:1;
boss.hp-=dmg;boss.stunTimer=15;boss.hitFlash=10;
shake=5;spawnP(boss.x,boss.y-20,['#ff0','#fff'],8);
spawnT(boss.x,boss.y-60,'-'+dmg,'#ff0');
playSound('punch');sc+=50*dmg;
if(boss.hp<=0)defeatBoss();
p.life=0;}}

enemies.forEach(e=>{if(e.hp<=0||e.stun>0)return;
if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
e.hp-=p.type==='golf'?3:1;e.stun=90;
const pts=e.hp<=0?400:120;sc+=pts;rage=Math.min(100,rage+5);
spawnP(e.x,e.y,['#ff0','#f80','#fff'],16);spawnT(e.x,e.y-24,'+'+pts+(e.hp<=0?' KO!':''),'#0ff');
if(e.hp<=0){freezeFrames=4;doFlash('#0ff',60);}
p.life=0}});
furn.forEach(f=>{if(f.hp<=0)return;
if(p.x<f.x+f.w&&p.x+p.w>f.x&&p.y<f.y+f.h&&p.y+p.h>f.y){
f.hp-=p.type==='golf'?4:1;f.shake=14;
if(f.hp<=0){sc+=f.pts;chaos=Math.min(100,chaos+2.5);spawnP(f.x,f.y,['#8b4513','#d4af37'],16);spawnT(f.x,f.y-24,'+'+f.pts,'#ff0');rage=Math.min(100,rage+4);}
if(p.type!=='golf')p.life=0}});
return p.life>0&&p.x>cam.x-60&&p.x<cam.x+W+60});

enemies.forEach(e=>{
if(e.hp<=0)return;if(e.stun>0){e.stun--;e.x+=e.vx*.9;e.vx*=.95;return}
// Smarter AI - chase player
const dx=P.x-e.x;
if(Math.abs(dx)>100)e.vx+=(dx>0?1:-1)*0.08;
e.vx=Math.max(-1.2,Math.min(1.2,e.vx));
e.x+=e.vx;if(e.x<60||e.x>cam.len-90)e.vx*=-1;
if(P.inv<=0&&P.x+12<e.x+e.w-12&&P.x+P.w-12>e.x+12&&P.y<e.y+e.h&&P.y+P.h>e.y){
if(rageOn){e.hp-=2;e.stun=100;e.vx=P.face*8;sc+=e.hp<=0?400:150;shake=10;spawnP(e.x,e.y,['#ff0','#f80'],18);spawnT(e.x,e.y-24,e.hp<=0?'+400 KO!':'+150','#0ff');freezeFrames=3;}
else{P.inv=110;P.lives--;P.vy=-10;P.vx=-P.face*8;shake=18;combo=0;multiplier=1;spawnP(P.x,P.y,['#f00','#f60'],20);doFlash('#f00',120);freezeFrames=8;playSound('hurt');
if(P.lives<=0){st='over';stopMusic();playGameOver();if(sc>hi){hi=sc;localStorage.setItem('dd7hi',hi)}}}}
if(P.atk&&P.atkT>8){const ax=P.x+(P.face>0?36:-38);
if(ax<e.x+e.w&&ax+38>e.x&&P.y<e.y+e.h&&P.y+P.h>e.y){
const dmg=(P.super?4:1)*(rageOn?2:1);e.hp-=dmg;e.stun=90;e.vx=P.face*6;
const pts=e.hp<=0?500:180;sc+=pts;shake=Math.max(shake,8+dmg*2);
spawnP(e.x,e.y,['#ff0','#f80'],18);spawnT(e.x,e.y-24,e.hp<=0?'+500 KO!':'+'+pts,'#0ff');
rage=Math.min(100,rage+10);if(e.hp<=0){freezeFrames=5;doFlash('#ff0',80);playSound('ko');}}}})

items.forEach(it=>{if(it.got)return;
if(P.x<it.x+28&&P.x+36>it.x&&P.y<it.y+28&&P.y+P.h>it.y){
it.got=true;spawnP(it.x+14,it.y+14,['#ffd700','#fff'],15);
if(it.type==='burger'){P.lives=Math.min(7,P.lives+1);sc+=120;spawnT(it.x,it.y-12,'+LIFE!','#0f0');doFlash('#0f0',60);playSound('powerup');}
else if(it.type==='energyDrink'){pwr='speed';pwrT=300;sc+=180;spawnT(it.x,it.y-12,'SPEED UP!','#0ff');doFlash('#0ff',60);P.dashCD=0;}
else if(it.type==='goldStack'){const gpts=600*multiplier;sc+=gpts;spawnT(it.x,it.y-12,'+'+gpts,'#ff0');doFlash('#ff0',50);}
else if(it.type==='phone'){P.tCD=0;sc+=240;spawnT(it.x,it.y-12,'TWEETS!','#1da1f2');}
else if(it.type==='golfBall'){P.gCD=0;sc+=90;spawnT(it.x,it.y-12,'GOLF!','#fff');}
else if(it.type==='rageStar'){rage=100;rageOn=true;sc+=350;spawnT(it.x,it.y-12,'RAGE MODE!','#f40');doFlash('#f80',120);freezeFrames=8;shake=15;playSound('rage');playSound('trump');}}});

parts=parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.28;p.life--;p.sz*=.95;return p.life>0&&p.sz>.5});
txts=txts.filter(t=>{t.y+=t.vy;t.vy*=.95;t.life--;return t.life>0});
if(shake>0)shake*=.9;
document.getElementById('sc').textContent=sc.toLocaleString();document.getElementById('ch').textContent=Math.floor(chaos);

// Boss logic
if(chaos>=100&&bossPhase==='none'){
bossPhase='warning';bossTimer=120;
spawnT(W/2+cam.x,150,'WARNING!','#f00');
spawnT(W/2+cam.x,190,'BOSS INCOMING!','#ff0');
doFlash('#f00',200);shake=20;
// Move camera to right side of level for boss
cam.x=cam.len-W;P.x=cam.x+100;
}
if(bossPhase==='warning'){
bossTimer--;
if(bossTimer<=0)spawnBoss();
}
if(bossPhase==='fighting'){
updateBoss();
}}

function draw(){
gt++; // Always increment for animations
X.save();if(shake>.5)X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
X.fillStyle='#000';X.fillRect(0,0,W,H);
if(st==='title')drawTitle();
else{
drawBG();
furn.forEach(f=>{if(f.hp>0){const fx=f.x-cam.x;if(fx>-120&&fx<W+120)drawF(f)}});
items.forEach(it=>{const ix=it.x-cam.x;if(ix>-40&&ix<W+40)drawI(it)});
enemies.forEach(e=>{if(e.hp>0){const ex=e.x-cam.x;if(ex>-60&&ex<W+60)drawE(e)}});
projs.forEach(drawProj);
if(P.inv<=0||Math.floor(P.inv/5)%2===0)drawD(P.x-cam.x,P.y,P.face,P.fr,P.atk,P.atkType);
drawBoss();
parts.forEach(p=>{X.globalAlpha=p.life/40;X.fillStyle=p.col;X.fillRect(p.x-cam.x,p.y,p.sz,p.sz)});X.globalAlpha=1;
X.font='12px "Press Start 2P"';X.textAlign='center';txts.forEach(t=>{X.globalAlpha=t.life/60;X.fillStyle=t.col;X.fillText(t.txt,t.x-cam.x,t.y)});X.globalAlpha=1;X.textAlign='left';

// HUD - fixed layout
X.fillStyle='rgba(0,0,20,0.7)';X.fillRect(0,388,W,52); // HUD background

X.font='9px "Press Start 2P"';X.fillStyle='#f08';X.fillText('LIVES',10,405);
for(let i=0;i<P.lives;i++){X.fillStyle='#f00';X.fillRect(70+i*16,394,12,12);X.fillStyle='#f66';X.fillRect(72+i*16,396,4,4)}

X.font='8px "Press Start 2P"';
X.fillStyle='#fff';X.fillText('Z:SMASH',180,405);
if(P.charge>0){X.fillStyle='#ff0';X.fillRect(260,396,P.charge*1.2,8);X.fillStyle='#f80';X.fillRect(260,396,P.charge*1.2,3)}

X.fillStyle=P.tCD<=0?'#1da1f2':'#555';X.fillText('X:TWEET'+(P.tCD<=0?'*':''),290,405);
X.fillStyle=P.gCD<=0?'#0f0':'#555';X.fillText('C:GOLF'+(P.gCD<=0?'*':''),390,405);
X.fillStyle=P.dashCD<=0?'#0ff':'#555';X.fillText('SHIFT:DASH',480,405);

// RAGE METER - moved and resized
X.fillStyle='#400';X.fillRect(590,393,90,16);
X.fillStyle='#600';X.fillRect(592,395,86,12);
const rgGrad=X.createLinearGradient(592,395,592,407);rgGrad.addColorStop(0,'#f80');rgGrad.addColorStop(1,'#f40');
X.fillStyle=rgGrad;X.fillRect(592,395,rage*0.86,12);
if(rageOn){X.fillStyle='rgba(255,200,0,'+(0.5+Math.sin(gt*.2)*.3)+')';X.fillRect(590,393,90,16)}
X.fillStyle='#fff';X.font='7px "Press Start 2P"';X.fillText('RAGE',615,405);

// Combo display - bottom right
if(combo>1){
X.fillStyle='#f08';X.font='12px "Press Start 2P"';X.fillText(combo+'HIT',695,405);
if(multiplier>1){X.fillStyle='#ff0';X.font='14px "Press Start 2P"';X.fillText(multiplier+'X',695,422)}}

// Stage indicator
X.fillStyle='#fff';X.font='8px "Press Start 2P"';
X.fillText('STAGE '+(rIdx+1)+'/10',10,422);

if(st==='over'||st==='win'){
X.textAlign='center';
if(st==='win'){
// Show the HTML img element for animated GIF - clear canvas so GIF shows through
winGifEl.style.display='block';
X.clearRect(0,0,W,H);
// Semi-transparent overlay for text readability at top and bottom
X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,70);X.fillRect(0,H-90,W,90);
// Rainbow cycling "TOTAL DESTRUCTION!" text
const hue=(gt*3)%360;
X.fillStyle='#000';X.font='28px "Press Start 2P"';X.fillText('TOTAL DESTRUCTION!',W/2+3,48);
X.fillStyle=`hsl(${hue},100%,50%)`;X.fillText('TOTAL DESTRUCTION!',W/2,45);
// Score and info at bottom
X.fillStyle='#0ff';X.font='12px "Press Start 2P"';X.fillText('FINAL SCORE: '+sc.toLocaleString(),W/2,H-65);
X.fillText('HIGH SCORE: '+hi.toLocaleString(),W/2,H-40);
// Flashing play again prompt
if(Math.floor(gt*0.08)%2){X.fillStyle='#ff0';X.font='10px "Press Start 2P"';X.fillText(isMobile?'TAP TO PLAY AGAIN':'PRESS SPACE TO PLAY AGAIN',W/2,H-15);}
}else{
X.fillStyle='rgba(0,0,0,0.85)';X.fillRect(0,0,W,H);
X.fillStyle='#f08';X.font='28px "Press Start 2P"';X.fillText('GAME OVER',W/2,145);
X.fillStyle='#0ff';X.font='12px "Press Start 2P"';X.fillText('FINAL SCORE: '+sc.toLocaleString(),W/2,220);
X.fillText('STAGES: '+rIdx+'/10',W/2,250);X.fillText('HIGH SCORE: '+hi.toLocaleString(),W/2,280);
X.fillStyle='#ff0';X.font='10px "Press Start 2P"';X.fillText(isMobile?'TAP TO PLAY AGAIN':'PRESS SPACE TO PLAY AGAIN',W/2,340);
}
X.textAlign='left'}}
X.restore()}

function drawTitle(){
const t=gt;
for(let i=0;i<28;i++){X.fillStyle=`hsla(${(t*.5+i*13)%360},100%,50%,0.28)`;X.fillRect(0,(i*17+t*.8)%(H+35)-18,W,14)}
X.fillStyle='rgba(0,0,0,0.88)';X.fillRect(0,0,W,H);
X.strokeStyle='#f08';X.lineWidth=1;
for(let i=0;i<17;i++){X.globalAlpha=1-i*.055;X.beginPath();X.moveTo(0,295+i*12);X.lineTo(W,295+i*12);X.stroke()}
for(let i=-10;i<18;i++){const x=W/2+i*55-(t*.45%55);X.beginPath();X.moveTo(x,295);X.lineTo(x+(i-5)*45,H);X.stroke()}
X.globalAlpha=1;X.textAlign='center';
X.fillStyle='#000';X.font='42px "Press Start 2P"';X.fillText('DONNIE',W/2+4,95);X.fillText('DESTROYS',W/2+4,145);
X.fillStyle='#f08';X.fillText('DONNIE',W/2,92);X.fillStyle='#0ff';X.fillText('DESTROYS',W/2,142);
X.fillStyle='#ff0';X.font='10px "Press Start 2P"';X.fillText('WHITE HOUSE RAMPAGE!',W/2,172);
drawD(W/2-20,195,1,Math.floor(t*.12)%14,false,'punch');
X.fillStyle='#fff';X.font='9px "Press Start 2P"';X.fillText('10 STAGES OF DESTRUCTION!',W/2,270);
X.fillStyle='#aaa';X.font='6px "Press Start 2P"';
for(let i=0;i<5;i++){X.fillText(rooms[i].name,W/2-100,288+i*12);X.fillText(rooms[i+5].name,W/2+100,288+i*12);}
X.fillStyle='#ffd700';X.font='10px "Press Start 2P"';X.fillText('HIGH SCORE: '+hi.toLocaleString(),W/2,385);
X.fillStyle='#888';X.font='8px "Press Start 2P"';X.fillText('← → MOVE | SPACE JUMP | Z SMASH (HOLD FOR RAGE) | X TWEET | C GOLF',W/2,410);
X.textAlign='left'}

function loop(){update();draw();requestAnimationFrame(loop)}
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'){e.preventDefault();
if(st==='title'||st==='over'||st==='win'){winGifEl.style.display='none';stopWinMusic();initAudio();prepWinMusic();playMusic();st='playing';sc=0;chaos=0;rIdx=0;combo=0;multiplier=1;rage=0;rageOn=false;pwr=null;freezeFrames=0;
P.lives=5;P.x=80;P.y=284;P.vx=0;P.vy=0;P.tCD=0;P.gCD=0;P.charge=0;P.super=false;P.trail=[];cam.x=0;gt=0;init(0);
document.getElementById('coin').style.display='none'}}});
document.addEventListener('keyup',e=>keys[e.code]=false);

// Touch controls - angle-based d-pad with continuous tracking
const touchMap={jump:'Space',left:'ArrowLeft',right:'ArrowRight',down:'ArrowDown',punch:'KeyZ',tweet:'KeyX',golf:'KeyC',dash:'ShiftLeft'};
const dpad = document.getElementById('dpad');
let dpadTouch = null;

function getDpadDirection(touchX, touchY) {
  const rect = dpad.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = touchX - centerX;
  const dy = touchY - centerY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const deadzone = rect.width * 0.12;
  if (dist < deadzone) return {up:false, down:false, left:false, right:false};
  const angle = Math.atan2(dy, dx);
  // Angle: 0=right, PI/2=down, PI/-PI=left, -PI/2=up
  return {
    up: angle < -0.4 && angle > -2.7,
    down: angle > 0.4 && angle < 2.7,
    left: angle > 2.0 || angle < -2.0,
    right: angle > -1.2 && angle < 1.2
  };
}

function applyDpadDirection(dir) {
  keys['Space'] = dir.up;
  keys['ArrowDown'] = dir.down;
  keys['ArrowLeft'] = dir.left;
  keys['ArrowRight'] = dir.right;
}

function clearDpad() {
  keys['Space'] = false;
  keys['ArrowDown'] = false;
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
}

dpad.addEventListener('touchstart', e => {
  e.preventDefault();
  initAudio();prepWinMusic();
  if(st==='title'||st==='over'||st==='win'){
    winGifEl.style.display='none';stopWinMusic();playMusic();st='playing';sc=0;chaos=0;rIdx=0;combo=0;multiplier=1;rage=0;rageOn=false;pwr=null;freezeFrames=0;
    P.lives=5;P.x=80;P.y=284;P.vx=0;P.vy=0;P.tCD=0;P.gCD=0;P.charge=0;P.super=false;P.trail=[];cam.x=0;gt=0;init(0);
    document.getElementById('coin').style.display='none';
    return;
  }
  const t = e.changedTouches[0];
  dpadTouch = t.identifier;
  applyDpadDirection(getDpadDirection(t.clientX, t.clientY));
}, {passive:false});

dpad.addEventListener('touchmove', e => {
  e.preventDefault();
  for(let i=0; i<e.changedTouches.length; i++){
    const t = e.changedTouches[i];
    if(t.identifier === dpadTouch){
      applyDpadDirection(getDpadDirection(t.clientX, t.clientY));
      break;
    }
  }
}, {passive:false});

dpad.addEventListener('touchend', e => {
  for(let i=0; i<e.changedTouches.length; i++){
    if(e.changedTouches[i].identifier === dpadTouch){
      dpadTouch = null;
      clearDpad();
      break;
    }
  }
}, {passive:false});

dpad.addEventListener('touchcancel', () => {
  dpadTouch = null;
  clearDpad();
}, {passive:false});

// Handle action buttons
document.querySelectorAll('.action-btn').forEach(btn=>{
const key=btn.dataset.key;
if(!key)return;
const code=touchMap[key];
btn.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();initAudio();prepWinMusic();keys[code]=true;},{passive:false});
btn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();keys[code]=false;},{passive:false});
btn.addEventListener('touchcancel',e=>{keys[code]=false;});
});

// Tap canvas to start on mobile
C.addEventListener('touchstart',e=>{
if(st==='title'||st==='over'||st==='win'){
e.preventDefault();winGifEl.style.display='none';stopWinMusic();initAudio();prepWinMusic();playMusic();
st='playing';sc=0;chaos=0;rIdx=0;combo=0;multiplier=1;rage=0;rageOn=false;pwr=null;freezeFrames=0;
P.lives=5;P.x=80;P.y=284;P.vx=0;P.vy=0;P.tCD=0;P.gCD=0;P.charge=0;P.super=false;P.trail=[];cam.x=0;gt=0;init(0);
document.getElementById('coin').style.display='none';}},{passive:false});

// Prevent zoom on double tap
document.addEventListener('dblclick',e=>e.preventDefault());

// Register service worker for offline play
if('serviceWorker' in navigator){
navigator.serviceWorker.register('data:text/javascript,self.addEventListener("fetch",e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))))').catch(()=>{});
}

loop();

// 8-bit pixelated emoji action button icons
(function(){
function drawEmoji(id,emoji){
const c=document.getElementById(id);if(!c)return;
const x=c.getContext('2d');
// Draw emoji small on offscreen canvas, then scale up pixelated
const off=document.createElement('canvas');
off.width=12;off.height=12;
const ox=off.getContext('2d');
ox.font='10px sans-serif';
ox.textAlign='center';ox.textBaseline='middle';
ox.fillText(emoji,6,6);
x.imageSmoothingEnabled=false;
x.drawImage(off,0,0,12,12,0,0,32,32);
}
drawEmoji('ic-punch','👊');
drawEmoji('ic-dash','💨');
drawEmoji('ic-tweet','🐦');
drawEmoji('ic-golf','🏌️');
})();

