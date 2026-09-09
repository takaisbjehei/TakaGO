const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'assets', 'static', 'chunks', 'game-session-CqbXFUI7.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. me=()=>
const oldMe = 'me=()=>({forward:window.__takaMobileMove?window.__takaMobileMove.forward:(Number(ne.has(`KeyW`))-Number(ne.has(`KeyS`))),right:window.__takaMobileMove?window.__takaMobileMove.right:(Number(ne.has(`KeyD`))-Number(ne.has(`KeyA`))),walk:window.__takaMobileWalk||ne.has(`ShiftLeft`)||ne.has(`ShiftRight`),duck:window.__takaMobileDuck||ne.has(`ControlLeft`)||ne.has(`ControlRight`)||ne.has(`KeyC`),jump:window.__takaMobileJump||ne.has(`Space`)})';
const newMe = 'me=()=>{let kF=Number(ne.has(`KeyW`))-Number(ne.has(`KeyS`)),kR=Number(ne.has(`KeyD`))-Number(ne.has(`KeyA`)),mF=(window.__takaMobileMove&&typeof window.__takaMobileMove.forward===`number`)?window.__takaMobileMove.forward:0,mR=(window.__takaMobileMove&&typeof window.__takaMobileMove.right===`number`)?window.__takaMobileMove.right:0;return{forward:Math.abs(mF)>0.01?mF:kF,right:Math.abs(mR)>0.01?mR:kR,walk:!!(window.__takaMobileWalk||ne.has(`ShiftLeft`)||ne.has(`ShiftRight`)),duck:!!(window.__takaMobileDuck||ne.has(`ControlLeft`)||ne.has(`ControlRight`)||ne.has(`KeyC`)),jump:!!(window.__takaMobileJump||ne.has(`Space`))}}';

console.log('1. oldMe found:', code.includes(oldMe));
if (!code.includes(oldMe)) throw new Error('oldMe not found');
code = code.replace(oldMe, newMe);

// 2. ge=()=>
const oldGe = 'ge=()=>{r=!0,i=!1,u++,document.pointerLockElement===V&&document.exitPointerLock(),T.current=!1,re(!1),ie(!1),n||te(!0),he()}';
const newGe = 'ge=()=>{r=!0,i=!1,u++,window.__takaActive=!1,document.pointerLockElement===V&&document.exitPointerLock(),T.current=!1,re(!1),ie(!1),n||te(!0),he()}';

console.log('2. oldGe found:', code.includes(oldGe));
if (!code.includes(oldGe)) throw new Error('oldGe not found');
code = code.replace(oldGe, newGe);

// 3. _e
const old_e = 'catch(e){if(!n())return;if(e instanceof Error&&e.name===`NotSupportedError`)try{await V.requestPointerLock(),n()&&le(`Standard mouse input · calibrate sensitivity`)}catch{n()&&(ie(!1),se(`Mouse capture unavailable. Click Enter to retry.`))}else ie(!1),se(`Mouse capture was blocked. Click Enter to retry.`)}finally{e===u&&(i=!1),a(),e===u&&document.pointerLockElement!==V&&(G.player.health>0||G.finished)&&K.pause()}';
const new_e = 'catch(e){let isT=(\"ontouchstart\" in window)||(navigator.maxTouchPoints>0)||(window.innerWidth<=1024);if(isT){window.__takaActive=!0,T.current=!0,re(!0),ie(!1),ae(!0),l=!1,g=performance.now(),ue.reset(g,G.targetTime);return;}if(!n())return;if(e instanceof Error&&e.name===`NotSupportedError`)try{await V.requestPointerLock(),n()&&le(`Standard mouse input · calibrate sensitivity`)}catch{n()&&(ie(!1),se(`Mouse capture unavailable. Click Enter to retry.`))}else ie(!1),se(`Mouse capture was blocked. Click Enter to retry.`)}finally{let isT=(\"ontouchstart\" in window)||(navigator.maxTouchPoints>0)||(window.innerWidth<=1024);if(isT&&window.__takaActive){T.current=!0,re(!0),ie(!1);}e===u&&(i=!1),a(),e===u&&!window.__takaActive&&document.pointerLockElement!==V&&(G.player.health>0||G.finished)&&K.pause()}';

console.log('3. old_e found:', code.includes(old_e));
if (!code.includes(old_e)) throw new Error('old_e not found');
code = code.replace(old_e, new_e);

// 4. takaEnqueue & takaLook
const oldTaka = 'window.__takaEnqueue=(act)=>{if(!n)return;let t=G.time;';
const newTaka = 'window.__takaEnqueue=(act)=>{if(!n)return;if(!T.current){window.__takaActive=!0,T.current=!0,re(!0),l=!1,g=performance.now(),ue.reset(g,G.targetTime),K.start(w.current.volume),ae(!0);}let t=G.time;';

console.log('4. oldTaka found:', code.includes(oldTaka));
if (!code.includes(oldTaka)) throw new Error('oldTaka not found');
code = code.replace(oldTaka, newTaka);

const oldLook = 'window.__takaLook=(dx,dy)=>{if(!n||G.player.health<=0)return;let r=w.current;';
const newLook = 'window.__takaLook=(dx,dy)=>{if(!n||G.player.health<=0)return;if(!T.current){window.__takaActive=!0,T.current=!0,re(!0),l=!1,g=performance.now(),ue.reset(g,G.targetTime),K.start(w.current.volume),ae(!0);}let r=w.current;';

console.log('5. oldLook found:', code.includes(oldLook));
if (!code.includes(oldLook)) throw new Error('oldLook not found');
code = code.replace(oldLook, newLook);

// 5. ke advance check
const oldAdv = 'n&&(T.current&&G.player.health>0||s)&&!G.finished&&(G.advance(a)';
const newAdv = 'n&&((T.current||window.__takaActive)&&G.player.health>0||s)&&!G.finished&&(G.advance(a)';

console.log('6. oldAdv found:', code.includes(oldAdv));
if (!code.includes(oldAdv)) throw new Error('oldAdv not found');
code = code.replace(oldAdv, newAdv);

// 6. Te keydown check
const oldTe = 'if(!T.current||G.player.health<=0)return;let r=fe(t);';
const newTe = 'if((!T.current&&!window.__takaActive)||G.player.health<=0)return;let r=fe(t);';

console.log('7. oldTe found:', code.includes(oldTe));
if (!code.includes(oldTe)) throw new Error('oldTe not found');
code = code.replace(oldTe, newTe);

// 7. q keyup check
const oldQ = 'q=e=>{if(!n||!T.current)return;let t=fe(e);';
const newQ = 'q=e=>{if(!n||(!T.current&&!window.__takaActive))return;let t=fe(e);';

console.log('8. oldQ found:', code.includes(oldQ));
if (!code.includes(oldQ)) throw new Error('oldQ not found');
code = code.replace(oldQ, newQ);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully patched game-session-CqbXFUI7.js!');
