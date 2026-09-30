import { EN } from "./i18n-en.js";

/* =================================================================
   CONFIGURACIÓN — se lee de las variables de entorno (.env en local,
   panel de Hostinger en producción). Ver .env.example.
   ================================================================= */
const env = import.meta.env || {};
const CONFIG = {
  webhookUrl: env.VITE_NEXURA_WEBHOOK_URL || "",
  audioField: env.VITE_NEXURA_AUDIO_FIELD || "data",
  formEndpoint: env.VITE_CONTACT_FORM_ENDPOINT || "",
  calendlyUrl: env.VITE_CALENDLY_URL || "",
  githubUrl: env.VITE_GITHUB_URL || "",
  labsUrl: env.VITE_LABS_URL || "",
  contactEmail: "contacto@nexuraia.com",
  maxRecordSeconds: 60
};

/* -----------------------------------------------------------------
   Contrato con el webhook (n8n)
   Texto → JSON { sessionId, lang:"es"|"en", type:"text", message }
   Voz   → multipart/form-data: [audioField] (archivo), sessionId, lang, type:"audio"
   Respuesta → a) audio/* (cabecera opcional X-Nexura-Text con el texto)
               b) JSON { output|text|reply|message, audio?(base64), audioMime?, transcript? }
   Si la entrada fue voz y no llega audio, el navegador lee la respuesta en voz alta.
   Usa "lang" en n8n para indicar al agente en qué idioma responder.
   ----------------------------------------------------------------- */


/* Textos del chat y del formulario */
const T = {
  es:{ready:"Disponible",think:"Pensando…",talk:"Hablando…",rec:"Escuchando… pulsa de nuevo para enviar",
      hello:"Hola, soy Nexura. Puedes hablarme o escribirme. Cuéntame qué proceso te gustaría automatizar o qué sistemas no se entienden entre sí.",
      demo:"Modo demostración: el agente real se activa al conectar el webhook.",
      noRec:"Este navegador no permite grabar audio. Escríbeme tu consulta.",
      noMic:"No tengo acceso al micrófono. Permítelo en el navegador o escríbeme tu consulta.",
      short:"La grabación ha sido demasiado corta. Pulsa el micrófono, habla y vuelve a pulsar para enviar.",
      voiceMsg:s=>`Mensaje de voz, ${s} s`, err:e=>`No he podido conectar con el agente. Inténtalo de nuevo o escribe a ${e}.`,
      micStart:"Empezar a grabar", micStop:"Detener y enviar",
      fMissing:"Completa nombre, un email válido y qué quieres resolver.", fSending:"Enviando…",
      fOk:"Solicitud enviada. Te responderemos personalmente.", fErr:e=>`No se ha podido enviar. Escríbenos a ${e}.`,
      fMail:e=>`Se ha abierto tu correo con la solicitud preparada. Si no se abre, escríbenos a ${e}.`,
      subject:"Solicitud de proyecto", bodyLabels:["Nombre","Empresa","Email"], speech:"es-ES"},
  en:{ready:"Available",think:"Thinking…",talk:"Speaking…",rec:"Listening… tap again to send",
      hello:"Hi, I’m Nexura. You can talk or type to me. Tell me which process you’d like to automate or which systems don’t talk to each other.",
      demo:"Demo mode: the live agent switches on once the webhook is connected.",
      noRec:"This browser can’t record audio. Type your question instead.",
      noMic:"I don’t have access to the microphone. Allow it in your browser or type your question.",
      short:"That recording was too short. Tap the microphone, speak, then tap again to send.",
      voiceMsg:s=>`Voice message, ${s} s`, err:e=>`I couldn’t reach the agent. Try again or write to ${e}.`,
      micStart:"Start recording", micStop:"Stop and send",
      fMissing:"Please fill in your name, a valid email and what you want to solve.", fSending:"Sending…",
      fOk:"Request sent. We’ll get back to you personally.", fErr:e=>`It couldn’t be sent. Write to us at ${e}.`,
      fMail:e=>`Your email app has opened with the request ready. If it didn’t, write to us at ${e}.`,
      subject:"Project request", bodyLabels:["Name","Company","Email"], speech:"en-GB"}
};

/* =================================================================
   IDIOMA
   ================================================================= */
const ES_META = {title:document.title, desc:document.querySelector('meta[name="description"]').content};
document.querySelectorAll('[data-i18n]').forEach(el => el.dataset.es = el.innerHTML);
document.querySelectorAll('[data-i18n-ph]').forEach(el => el.dataset.esPh = el.placeholder);
document.querySelectorAll('[data-i18n-aria]').forEach(el => el.dataset.esAria = el.getAttribute('aria-label'));

let lang = (() => {
  const q = new URLSearchParams(location.search).get('lang');
  if(q === 'es' || q === 'en') return q;
  try{ const s = localStorage.getItem('nexuraia_lang'); if(s === 'es' || s === 'en') return s; }catch(e){}
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
})();
const t = () => T[lang];

function applyLang(next, save){
  lang = next;
  const en = lang === 'en';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    el.innerHTML = en && EN[k] !== undefined ? EN[k] : el.dataset.es;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.dataset.i18nPh;
    el.placeholder = en && EN[k] ? EN[k] : el.dataset.esPh;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const k = el.dataset.i18nAria;
    el.setAttribute('aria-label', en && EN[k] ? EN[k] : el.dataset.esAria);
  });
  document.title = en ? EN['meta.title'] : ES_META.title;
  document.querySelector('meta[name="description"]').content = en ? EN['meta.desc'] : ES_META.desc;
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  if(typeof refreshChatLang === 'function') refreshChatLang();
  if(save){ try{ localStorage.setItem('nexuraia_lang', lang); }catch(e){} }
}
document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang, true)));

/* =================================================================
   UI GENERAL
   ================================================================= */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('solid', scrollY > 24);
addEventListener('scroll', onScroll, {passive:true}); onScroll();

document.querySelectorAll('.cap-btn').forEach(btn => btn.addEventListener('click', () => {
  const cap = btn.parentElement, open = !cap.classList.contains('open');
  cap.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
}));

// Enlaces opcionales
const setLink = (id, url) => { const a = document.getElementById(id); if(url){ a.href = url; a.hidden = false; } };
setLink('calendlyLink', CONFIG.calendlyUrl);
setLink('githubLink', CONFIG.githubUrl);
setLink('labsMore', CONFIG.labsUrl);

// El botón flotante se oculta cuando ya hay otro acceso al chat a la vista
const trigger = document.getElementById('trigger');
const zonesVisible = new Set();
let panelOpen = false;
function updateTrigger(){ trigger.classList.toggle('hide', panelOpen || zonesVisible.size > 0); }
const zoneObserver = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting ? zonesVisible.add(e.target) : zonesVisible.delete(e.target));
  updateTrigger();
}, {threshold:0});
document.querySelectorAll('[data-chat-zone]').forEach(z => zoneObserver.observe(z));

/* =================================================================
   SEÑAL DE AUDIO COMPARTIDA
   ================================================================= */
let audioCtx = null, analyser = null, timeData = null;
let recording = false, playingAudio = false, speakingSynth = false;
let level = 0;

function ensureAudio(){
  if(!audioCtx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    audioCtx = new AC();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024; analyser.smoothingTimeConstant = .6;
    timeData = new Uint8Array(analyser.fftSize);
  }
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function measure(time){
  let raw = 0;
  if((recording || playingAudio) && analyser){
    analyser.getByteTimeDomainData(timeData);
    let sum = 0;
    for(let i=0;i<timeData.length;i++){ const v=(timeData[i]-128)/128; sum+=v*v; }
    raw = Math.min(1, Math.sqrt(sum/timeData.length) * 4.5);
  } else if(speakingSynth){
    raw = .35 + .25*Math.sin(time*.012)*Math.sin(time*.0047);
  }
  level += (raw - level) * .18;
  root.style.setProperty('--lv', level.toFixed(3));
}

// Hero
const sig = document.getElementById('signal');
const sctx = sig.getContext('2d');
let sw=0, sh=0, mouseX=-9999, mouseT=0, heroVisible=true;
const introStart = performance.now() + 250;
function sizeSignal(){
  const dpr = Math.min(2, devicePixelRatio || 1);
  sw = sig.clientWidth; sh = sig.clientHeight;
  sig.width = sw*dpr; sig.height = sh*dpr;
  sctx.setTransform(dpr,0,0,dpr,0,0);
}
sizeSignal(); addEventListener('resize', sizeSignal);
document.querySelector('.hero').addEventListener('pointermove', e => {
  mouseX = e.clientX - sig.getBoundingClientRect().left; mouseT = performance.now();
});
new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(sig);

function drawSignal(time){
  sctx.clearRect(0,0,sw,sh);
  const mid = sh/2;
  sctx.fillStyle = 'rgba(0,0,0,.28)';
  for(let x=0; x<=sw; x+=24){ const tall = Math.round(x/24) % 5 === 0; sctx.fillRect(x, sh-(tall?10:5), 1, tall?10:5); }
  sctx.fillStyle = 'rgba(0,0,0,.14)'; sctx.fillRect(0, mid, sw, 1);
  const intro = reduceMotion ? 1 : Math.min(1, Math.max(0,(time-introStart)/1500));
  const endX = sw * (1 - Math.pow(1-intro, 3));
  const s = reduceMotion ? 0 : time/1000;
  const amp = sh*.07 + level*sh*.4;
  const mouseFade = Math.max(0, 1 - (time-mouseT)/1600);
  sctx.beginPath();
  let lastY = mid;
  for(let x=0; x<=endX; x+=2){
    const n = x/sw, env = Math.pow(Math.sin(Math.PI*n), 1.4);
    let y = amp*env*(Math.sin(n*15 + s*1.7)*.55 + Math.sin(n*41 - s*2.6)*.28 + Math.sin(n*4.3 + s*.6)*.17);
    const d = x - mouseX;
    y += Math.exp(-(d*d)/9800) * sh*.2 * mouseFade * Math.sin(n*70 - s*8);
    lastY = mid + y;
    x === 0 ? sctx.moveTo(x,lastY) : sctx.lineTo(x,lastY);
  }
  sctx.strokeStyle = '#2233FF'; sctx.lineWidth = 2.25; sctx.lineJoin = 'round'; sctx.stroke();
  sctx.fillStyle = '#2233FF'; sctx.beginPath(); sctx.arc(Math.max(4,endX), lastY, 5, 0, Math.PI*2); sctx.fill();
}

// Panel
const viz = document.getElementById('pViz');
const vctx = viz.getContext('2d');
function drawViz(time){
  const w = viz.clientWidth, h = viz.clientHeight, r = Math.min(2, devicePixelRatio||1);
  if(viz.width !== w*r){ viz.width = w*r; viz.height = h*r; }
  vctx.setTransform(r,0,0,r,0,0); vctx.clearRect(0,0,w,h);
  const bars = Math.floor(w/7), s = time/1000;
  for(let i=0;i<bars;i++){
    const n = i/bars, env = Math.sin(Math.PI*n);
    const idle = .08 + .05*Math.sin(n*20 + s*2);
    const v = Math.max(idle, level*env*(.55 + .45*Math.abs(Math.sin(n*31 + s*9))));
    const bh = Math.max(2, v*h*.9);
    vctx.fillStyle = recording ? '#FF4D4D' : (level > .05 ? '#6B77FF' : '#34363B');
    vctx.fillRect(i*7 + 2, (h-bh)/2, 3, bh);
  }
}
function loop(time){ measure(time); if(heroVisible) drawSignal(time); if(panelOpen) drawViz(time); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

/* =================================================================
   NEXURA — chat de voz y texto
   ================================================================= */
const panel = document.getElementById('panel');
const log = document.getElementById('pLog');
const input = document.getElementById('pInput');
const micBtn = document.getElementById('pMic');
const statusEl = document.getElementById('pStatus');
const chips = document.getElementById('chips');
let lastFocus = null, greeted = false, busy = false, statusKey = 'ready';

const sessionId = (() => {
  try{
    let id = sessionStorage.getItem('nexura_session');
    if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); sessionStorage.setItem('nexura_session', id); }
    return id;
  }catch(e){ return String(Date.now()); }
})();

function setStatus(kind, key){
  statusKey = key;
  statusEl.className = 'p-status' + (kind ? ' ' + kind : '');
  statusEl.querySelector('span').textContent = t()[key];
}
function refreshChatLang(){
  setStatus(statusEl.className.replace('p-status','').trim(), statusKey);
  micBtn.setAttribute('aria-label', recording ? t().micStop : t().micStart);
}
function addMsg(role, text){
  const el = document.createElement('div');
  el.className = 'msg ' + role; el.textContent = text;
  log.appendChild(el); log.scrollTop = log.scrollHeight;
  return el;
}
function openPanel(startRec){
  lastFocus = document.activeElement;
  panelOpen = true; updateTrigger();
  panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
  if(!greeted){
    greeted = true;
    addMsg('bot', t().hello);
    if(!CONFIG.webhookUrl) addMsg('sys', t().demo);
  }
  if(startRec) startRecording(); else setTimeout(() => input.focus(), 60);
}
function closePanel(){
  if(recording) stopRecording(true);
  panelOpen = false; updateTrigger();
  panel.classList.remove('open'); panel.setAttribute('aria-hidden','true');
  if(lastFocus) lastFocus.focus();
}
document.querySelectorAll('[data-open-voice]').forEach(b => b.addEventListener('click', () => openPanel(b.hasAttribute('data-start-rec'))));
document.getElementById('pClose').addEventListener('click', closePanel);
addEventListener('keydown', e => { if(e.key === 'Escape' && panelOpen) closePanel(); });
document.getElementById('pForm').addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text || busy) return;
  input.value = ''; sendText(text);
});
chips.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { if(!busy) sendText(c.textContent); }));

// Grabación
let mediaStream = null, recorder = null, chunks = [], micSource = null, recStart = 0, recTimer = null, discardRec = false;
function pickMime(){
  if(!window.MediaRecorder) return '';
  return ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m => MediaRecorder.isTypeSupported(m)) || '';
}
async function startRecording(){
  if(recording || busy) return;
  stopSpeaking();
  if(!navigator.mediaDevices || !window.MediaRecorder){ addMsg('sys', t().noRec); return; }
  try{ mediaStream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true}}); }
  catch(err){ addMsg('sys', t().noMic); return; }
  const ctx = ensureAudio();
  if(ctx){ micSource = ctx.createMediaStreamSource(mediaStream); micSource.connect(analyser); }
  const mime = pickMime();
  recorder = new MediaRecorder(mediaStream, mime ? {mimeType:mime} : undefined);
  chunks = []; discardRec = false;
  recorder.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = onRecordingStop;
  recorder.start();
  recording = true; recStart = performance.now();
  micBtn.classList.add('rec'); micBtn.setAttribute('aria-label', t().micStop);
  setStatus('rec','rec');
  recTimer = setTimeout(() => stopRecording(false), CONFIG.maxRecordSeconds*1000);
}
function stopRecording(discard){
  if(!recording) return;
  discardRec = !!discard; clearTimeout(recTimer); recording = false;
  micBtn.classList.remove('rec'); micBtn.setAttribute('aria-label', t().micStart);
  try{ recorder.stop(); }catch(e){}
}
function onRecordingStop(){
  if(micSource){ try{ micSource.disconnect(); }catch(e){} micSource = null; }
  if(mediaStream){ mediaStream.getTracks().forEach(tr => tr.stop()); mediaStream = null; }
  const secs = (performance.now() - recStart)/1000;
  setStatus('','ready');
  if(discardRec) return;
  const blob = new Blob(chunks, {type: recorder.mimeType || 'audio/webm'});
  if(secs < .6 || blob.size < 1200){ addMsg('sys', t().short); return; }
  sendAudio(blob, secs);
}
micBtn.addEventListener('click', () => recording ? stopRecording(false) : startRecording());

// Envío
async function sendText(text){ chips.hidden = true; addMsg('user', text); await exchange({kind:'text', text}); }
async function sendAudio(blob, secs){ chips.hidden = true; const bubble = addMsg('user', t().voiceMsg(Math.round(secs))); await exchange({kind:'audio', blob, bubble}); }

async function exchange(req){
  busy = true; setStatus('busy','think');
  const typing = addMsg('bot typing','…');
  try{
    const res = CONFIG.webhookUrl ? await callWebhook(req) : await demoReply(req);
    typing.remove();
    if(res.transcript && req.bubble) req.bubble.textContent = res.transcript;
    if(res.text) addMsg('bot', res.text);
    if(res.audio) await playAudio(res.audio);
    else if(req.kind === 'audio' && res.text) await speak(res.text);
  }catch(err){
    typing.remove(); addMsg('sys', t().err(CONFIG.contactEmail)); console.error('[Nexura]', err);
  }finally{ busy = false; setStatus('','ready'); }
}
async function callWebhook(req){
  let res;
  if(req.kind === 'audio'){
    const ext = req.blob.type.includes('mp4') ? 'm4a' : req.blob.type.includes('ogg') ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append(CONFIG.audioField, req.blob, 'voz.' + ext);
    fd.append('sessionId', sessionId); fd.append('lang', lang); fd.append('type', 'audio');
    res = await fetch(CONFIG.webhookUrl, {method:'POST', body:fd});
  } else {
    res = await fetch(CONFIG.webhookUrl, {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sessionId, lang, type:'text', message:req.text})});
  }
  if(!res.ok) throw new Error('HTTP ' + res.status);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if(ct.startsWith('audio/')){
    const hdr = res.headers.get('x-nexura-text');
    return {audio: await res.blob(), text: hdr ? decodeURIComponent(hdr) : ''};
  }
  if(ct.includes('json')){
    let data = await res.json();
    if(Array.isArray(data)) data = data[0] || {};
    if(data.json) data = data.json;
    const text = data.output || data.text || data.reply || data.message || data.response || '';
    let audio = null;
    const b64 = data.audio || data.audioBase64;
    if(b64){
      const bin = atob(b64.replace(/^data:[^,]+,/, ''));
      const bytes = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
      audio = new Blob([bytes], {type: data.audioMime || 'audio/mpeg'});
    }
    return {text, audio, transcript: data.transcript || ''};
  }
  return {text: await res.text()};
}

// Salida de voz
function playAudio(blob){
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    const ctx = ensureAudio();
    if(ctx){ try{ const src = ctx.createMediaElementSource(a); src.connect(analyser); src.connect(ctx.destination); }catch(e){} }
    playingAudio = true; setStatus('busy','talk');
    const done = () => { playingAudio = false; URL.revokeObjectURL(url); resolve(); };
    a.onended = done; a.onerror = done; a.play().catch(done);
  });
}
function speak(text){
  return new Promise(resolve => {
    if(!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = t().speech; u.rate = 1.02;
    const base = t().speech.slice(0,2);
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === t().speech) || voices.find(v => v.lang && v.lang.startsWith(base));
    if(v) u.voice = v;
    speakingSynth = true; setStatus('busy','talk');
    u.onend = u.onerror = () => { speakingSynth = false; resolve(); };
    speechSynthesis.speak(u);
  });
}
function stopSpeaking(){ if('speechSynthesis' in window) speechSynthesis.cancel(); speakingSynth = false; }

// Respuestas de demostración (sin webhook)
const DEMO = {
  es:{audio:'Te he escuchado. En esta demostración no transcribo el audio, pero en producción tu voz se transcribe en nuestro servidor y te respondo de viva voz. Mientras tanto, cuéntame por escrito qué proceso quieres mejorar.',
      price:'Cada proyecto empieza con un diagnóstico: analizamos el proceso y los sistemas y te entregamos alcance, riesgos y coste antes de construir nada.',
      agent:'Construimos agentes de voz y chat que atienden, resuelven dudas frecuentes, agendan citas y registran cada conversación en tu CRM. Las consultas delicadas pasan a una persona. ¿Qué volumen de llamadas o mensajes recibís al día?',
      method:'En cuatro fases: diagnóstico, arquitectura, construcción y operación. La primera termina con un estudio de viabilidad para que decidas con datos. Puedes solicitarlo desde el formulario de contacto.',
      integ:'Conectamos ERPs, CRMs, bases de datos y hojas de cálculo para que la información fluya sola y con validación. ¿Qué herramientas usáis hoy y dónde se copian datos a mano?',
      about:'NexuraIA es un estudio de ingeniería: desarrollamos software a medida, integramos sistemas, automatizamos procesos y desplegamos agentes de IA cuando aportan una mejora medible. El código y la infraestructura son siempre del cliente.',
      other:'Entendido. Para orientarte bien necesito algo más de contexto: ¿qué tarea os consume más tiempo hoy y qué herramientas intervienen?'},
  en:{audio:'I heard you. In this demo I don’t transcribe audio, but in production your voice is transcribed on our server and I answer out loud. Meanwhile, type which process you’d like to improve.',
      price:'Every project starts with a diagnosis: we analyse the process and systems and give you scope, risks and cost before building anything.',
      agent:'We build voice and chat agents that answer, resolve frequent questions, book appointments and log every conversation in your CRM. Sensitive requests go to a person. How many calls or messages do you get per day?',
      method:'In four phases: diagnosis, architecture, build and operate. The first ends with a feasibility study so you can decide with data. You can request it from the contact form.',
      integ:'We connect ERPs, CRMs, databases and spreadsheets so information flows on its own, with validation. Which tools do you use today, and where is data copied by hand?',
      about:'NexuraIA is an engineering studio: we build custom software, integrate systems, automate processes and deploy AI agents when they bring a measurable improvement. The code and infrastructure always belong to the client.',
      other:'Got it. To point you in the right direction I need a bit more context: which task takes up the most time today, and which tools are involved?'}
};
function demoReply(req){
  const d = DEMO[lang], q = (req.text || '').toLowerCase();
  let text;
  if(req.kind === 'audio') text = d.audio;
  else if(/precio|coste|cuesta|presupuesto|tarifa|price|cost|budget/.test(q)) text = d.price;
  else if(/atenci|cliente|llamad|voz|agente|whatsapp|chat|customer|call|voice|agent/.test(q)) text = d.agent;
  else if(/empieza|método|metodo|pasos|trabaj|start|process|steps|method/.test(q)) text = d.method;
  else if(/erp|crm|integr|excel|datos|sap|odoo|holded|data/.test(q)) text = d.integ;
  else if(/qué hac|que hac|quién|quien|nexuraia|what .*do|who/.test(q)) text = d.about;
  else text = d.other;
  return new Promise(r => setTimeout(() => r({text}), 700));
}

/* =================================================================
   FORMULARIO
   ================================================================= */
const form = document.getElementById('contactForm');
const fStatus = document.getElementById('formStatus');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if(d.website){ form.reset(); fStatus.textContent = t().fOk; return; } // campo trampa anti-spam
  delete d.website;
  if(!d.nombre || !d.email || !d.mensaje || !/^\S+@\S+\.\S+$/.test(d.email)){ fStatus.textContent = t().fMissing; return; }
  if(CONFIG.formEndpoint){
    fStatus.textContent = t().fSending;
    try{
      const r = await fetch(CONFIG.formEndpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...d, lang})});
      if(!r.ok) throw new Error(r.status);
      form.reset(); fStatus.textContent = t().fOk;
    }catch(err){ fStatus.textContent = t().fErr(CONFIG.contactEmail); }
    return;
  }
  const L = t().bodyLabels;
  const subject = t().subject + (d.empresa ? ' — ' + d.empresa : '');
  const body = `${L[0]}: ${d.nombre}\n${L[1]}: ${d.empresa || '-'}\n${L[2]}: ${d.email}\n\n${d.mensaje}`;
  location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  fStatus.textContent = t().fMail(CONFIG.contactEmail);
});

/* Arranque */
applyLang(lang, false);
setStatus('','ready');
