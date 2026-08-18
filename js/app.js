const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

// Toast
function toast(msg, emoji="✨"){
  let t = $("#toast");
  if(!t){
    t=document.createElement("div");
    t.id="toast"; t.className="toast";
    document.body.appendChild(t);
  }
  t.innerHTML=`<span>${emoji}</span><span>${msg}</span>`;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm=setTimeout(()=>t.classList.remove("show"), 2200);
}

// Confetti
function confettiBurst(){
  const cvs = $("#confetti");
  if(!cvs) return;
  const ctx = cvs.getContext("2d");
  const W = cvs.width = innerWidth;
  const H = cvs.height = innerHeight;
  const colors = ["#E8A0BF","#FFDAB9","#C9A86A","#FF5A7A","#9A6DFF","#5BC0A8","#FFC93A"];
  const parts = Array.from({length: 160}, ()=>({
    x: W*0.5 + (Math.random()-0.5)*240,
    y: H*0.32 + (Math.random()-0.5)*40,
    vx: (Math.random()-0.5)*12,
    vy: -Math.random()*9 - 2,
    r: Math.random()*7+4,
    rot: Math.random()*Math.PI,
    vr: (Math.random()-0.5)*0.3,
    col: colors[Math.floor(Math.random()*colors.length)],
    shape: Math.random()>0.5 ? "rect" : "circle",
    life: 1
  }));
  let raf;
  let t=0;
  (function frame(){
    t++;
    ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.28; p.vx*=0.999; p.rot+=p.vr; p.life-=0.004;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle=p.col;
      if(p.shape==="rect") ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6);
      else { ctx.beginPath(); ctx.arc(0,0,p.r/2,0,Math.PI*2); ctx.fill(); }
      // ribbon
      if(Math.random()>0.97) { ctx.fillRect(-1,-p.r,2,p.r*1.8); }
      ctx.restore();
    });
    if(t<220) raf=requestAnimationFrame(frame);
    else ctx.clearRect(0,0,W,H);
  })();
  // haptics
  if(navigator.vibrate) navigator.vibrate(30);
}

// Reveal on scroll
function initReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("in"); });
  }, {threshold:0.12});
  $$(".reveal").forEach(el=>io.observe(el));
}

// Music toggle (uses WebAudio beep fallback if no audio file)
let audio, playing=false;
function initMusic(){
  audio = $("#bgAudio");
  const btn = $("#musicBtn");
  if(!btn) return;
  btn.addEventListener("click", async ()=>{
    try{
      if(!playing){
        if(audio){
          audio.volume=0.55;
          await audio.play();
        } else {
          // fallback: tiny birthday chime using WebAudio
          const ctx = new (window.AudioContext||window.webkitAudioContext)();
          const notes=[261.63,293.66,329.63,349.23,392,440,493.88];
          notes.forEach((f,i)=>{
            const o=ctx.createOscillator(), g=ctx.createGain();
            o.type="sine"; o.frequency.value=f;
            g.gain.value=0.0;
            o.connect(g).connect(ctx.destination);
            const t=ctx.currentTime + i*0.18;
            g.gain.linearRampToValueAtTime(0.18, t+0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t+0.3);
            o.start(t); o.stop(t+0.32);
          });
        }
        playing=true;
        btn.innerHTML="🔊";
        btn.classList.add("gold");
        toast("Music on — Happy Birthday tune!","🎶");
      } else {
        if(audio) audio.pause();
        playing=false;
        btn.innerHTML="🔇";
        btn.classList.remove("gold");
        toast("Music paused","🤫");
      }
    }catch(e){
      toast("Tap again to allow audio","🎵");
    }
  });
}

// Countdown to today (celebration day) or next birthday if passed midnight? Use today 00:00 as celebration
function initCountdown(){
  const el = $("#countdown");
  if(!el) return;
  function tick(){
    const now=new Date();
    const target=new Date();
    target.setHours(23,59,59,999);
    let diff = target - now;
    if(diff<0) diff=0;
    const h=Math.floor(diff/36e5).toString().padStart(2,"0");
    const m=Math.floor(diff%36e5/6e4).toString().padStart(2,"0");
    const s=Math.floor(diff%6e4/1000).toString().padStart(2,"0");
    const d=document.getElementById("cd-h"), mm=document.getElementById("cd-m"), ss=document.getElementById("cd-s"), dd=document.getElementById("cd-d");
    if(dd) dd.textContent="00";
    if(d) d.textContent=h;
    if(mm) mm.textContent=m;
    if(ss) ss.textContent=s;
  }
  tick(); setInterval(tick,1000);
}

// Wishes
function initWishes(){
  const form=$("#wishForm"), list=$("#wishList");
  if(!form||!list) return;
  const defaults = JSON.parse(localStorage.getItem("naonica_wishes_v2")||"null");
  if(!defaults){
    // keep HTML defaults
  } else {
    list.innerHTML="";
    defaults.forEach(w=> list.prepend(renderWish(w.name,w.relation,w.text,w.emoji)));
  }
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name=$("#wName").value.trim()||"Someone who loves you";
    const relation=$("#wRelation").value;
    const text=$("#wText").value.trim();
    if(!text) return toast("Write a little wish first","💌");
    const emoji = relation==="Family"?"👨‍👩‍👧": relation==="Friends"?"💫":"🌸";
    const card=renderWish(name, relation, text, emoji);
    list.prepend(card);
    card.style.animation="pop .4s ease";
    // persist
    const all=[...$$(".wish-card",list)].map(c=>({
      name: c.dataset.name, relation:c.dataset.relation, text:c.dataset.text, emoji:c.dataset.emoji
    }));
    localStorage.setItem("naonica_wishes_v2", JSON.stringify(all));
    form.reset();
    confettiBurst();
    toast("Wish added to Didi's wall!","💖");
  });
}
function renderWish(name, relation, text, emoji){
  const div=document.createElement("div");
  div.className="wish-card reveal in";
  const colors=[["#7A2148","#E8A0BF"],["#0E7A6B","#A8E6CF"],["#7A4A00","#FFD27A"],["#4A2A8A","#C9A6FF"]];
  const col=colors[Math.floor(Math.random()*colors.length)];
  div.dataset.name=name; div.dataset.relation=relation; div.dataset.text=text; div.dataset.emoji=emoji;
  div.innerHTML=`
    <div class="wish-head">
      <div class="avatar" style="background: linear-gradient(135deg, ${col[0]}, ${col[1]});">${emoji}</div>
      <div>
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(relation)} • just now</span>
      </div>
    </div>
    <div class="wish-text">${escapeHtml(text)}</div>
    <div class="wish-meta"><span class="chip">💌 With love</span><span class="chip">✨ For Naonica</span></div>
  `;
  return div;
}
function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;", '"':"&quot;"}[c])); }

// Cake
function initCake(){
  const candles=$$(".candle");
  const btn=$("#blowBtn"), reset=$("#resetCandles");
  let blown=0;
  if(!candles.length) return;
  function checkAllOff(){
    if([...candles].every(c=>c.classList.contains("off"))){
      setTimeout(()=>{
        confettiBurst();
        toast("Yay! You blew all candles — Make a wish, Didi!","🎂");
        const msg=$("#cakeMsg");
        if(msg){ msg.innerHTML=`<div class="big-emoji">🎉</div><h3 style="font-family:'Playfair Display',serif;color:var(--plum);margin-top:8px">Happy Birthday, Naonica Didi!</h3><p class="muted" style="font-size:13px;margin-top:6px">May your year be as beautiful as your heart. We love you endlessly!</p>`; msg.style.display="block"; }
        if(navigator.vibrate) navigator.vibrate([40,30,80]);
      }, 220);
    }
  }
  candles.forEach(c=>{
    c.addEventListener("click", ()=>{
      if(c.classList.contains("off")) return;
      c.classList.add("off");
      blown++;
      // puff
      const puff=document.createElement("div");
      puff.textContent="💨";
      puff.style.cssText="position:absolute;top:-30px;left:50%;transform:translateX(-50%);font-size:14px;animation:puff .6s ease forwards;pointer-events:none";
      c.appendChild(puff);
      setTimeout(()=>puff.remove(),600);
      if(navigator.vibrate) navigator.vibrate(20);
      checkAllOff();
    });
  });
  if(btn) btn.addEventListener("click", ()=>{
    candles.forEach((c,i)=> setTimeout(()=>{ if(!c.classList.contains("off")) c.click(); }, i*180));
  });
  if(reset) reset.addEventListener("click", ()=>{
    candles.forEach(c=>c.classList.remove("off"));
    const msg=$("#cakeMsg"); if(msg) msg.style.display="none";
    toast("Candles relit — blow again!","🕯️");
  });
  // mic blow detection (optional)
  let micBtn=$("#micBlow");
  if(micBtn){
    micBtn.addEventListener("click", async ()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const ctx=new (window.AudioContext||window.webkitAudioContext)();
        const src=ctx.createMediaStreamSource(stream);
        const analyser=ctx.createAnalyser(); analyser.fftSize=2048; src.connect(analyser);
        const data=new Uint8Array(analyser.frequencyBinCount);
        toast("Blow into the mic!","🎤");
        let t=0, id=setInterval(()=>{
          analyser.getByteFrequencyData(data);
          const avg=data.reduce((a,b)=>a+b,0)/data.length;
          if(avg>28){
            candles.forEach(c=>c.classList.add("off"));
            checkAllOff();
            clearInterval(id);
            stream.getTracks().forEach(tr=>tr.stop());
            ctx.close();
          }
          if(++t>80){ clearInterval(id); stream.getTracks().forEach(tr=>tr.stop()); ctx.close(); toast("Try tapping candles instead","🕯️"); }
        },100);
      }catch{ toast("Mic permission needed — tap candles instead","🎂"); }
    });
  }
}

// Share
function initShare(){
  const btn=$("#shareBtn");
  if(!btn) return;
  btn.addEventListener("click", async ()=>{
    const data={title:"Happy Birthday Naonica Didi 🎂", text:"A special birthday surprise for the best didi in the world — Naonica! 💖", url:location.href};
    try{
      if(navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); toast("Link copied — send to Didi!","🔗"); confettiBurst(); }
    }catch{}
  });
}

// Init all
document.addEventListener("DOMContentLoaded", ()=>{
  initReveal();
  initMusic();
  initCountdown();
  initWishes();
  initCake();
  initShare();
  // global confetti buttons
  $$("[data-confetti]").forEach(b=> b.addEventListener("click", confettiBurst));
  // add style for pop
  const s=document.createElement("style");
  s.textContent=`@keyframes pop{0%{transform:scale(.92)}100%{transform:scale(1)}} @keyframes puff{0%{transform:translateX(-50%) translateY(0);opacity:1}100%{transform:translateX(-50%) translateY(-18px);opacity:0}}`;
  document.head.appendChild(s);
});
