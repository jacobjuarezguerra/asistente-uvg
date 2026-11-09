'use strict';

// No credentials are stored in source files. The knowledge bundle also works over file://.
const $ = id => document.getElementById(id);
const knowledge = window.UVG_KNOWLEDGE || {reviewed: '', documents: []};
const documents = Array.isArray(knowledge.documents) ? knowledge.documents : [];
const docById = id => documents.find(doc => doc.id === Number(id));
let conversationHistory = [];
let isSending = false;
let hasVisibleMessages = false;
let toastTimer;
let testController = null;
let keyRevision = 0;
function readSetting(name) { try { return localStorage.getItem(name); } catch { return null; } }
function writeSetting(name, value) {
  try { if (value === null) localStorage.removeItem(name); else localStorage.setItem(name, value); return true; } catch { return false; }
}
let selectedModel = '';
let service = {configured:false,requiresAccess:false,models:[],maxTokens:2048,temperature:0.2};
let generationSettings = {temperature:0.2,max_tokens:2048};
let accessToken = '';
try {accessToken=sessionStorage.getItem('uvg_access_token')||'';} catch {}
function sessionToken(value) {accessToken=value;try{if(value)sessionStorage.setItem('uvg_access_token',value);else sessionStorage.removeItem('uvg_access_token');}catch{}}
function officialURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (url.hostname === 'uvg.edu.gt' || url.hostname.endsWith('.uvg.edu.gt') || url.hostname === 'uvg.instructure.com') ? url.href : null;
  } catch { return null; }
}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function emphasis(text) { return escapeHTML(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>'); }
function inlineMarkdown(text) {
  const pattern = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|(https:\/\/[^\s<>]+)|\[(\d+)\]/g;
  let html = '', last = 0;
  for (const match of text.matchAll(pattern)) {
    html += emphasis(text.slice(last, match.index));
    if (match[4] && docById(match[4])) {
      html += `<a href="#fuentes" data-source="${Number(match[4])}" aria-label="Consultar fuente ${Number(match[4])}">[${Number(match[4])}]</a>`;
    } else if (match[2] || match[3]) {
      const raw = (match[2] || match[3]).replace(/[.,;!?]+$/, '');
      const trailing = (match[2] || match[3]).slice(raw.length);
      const url = officialURL(raw);
      html += url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(match[1] || raw)}</a>${escapeHTML(trailing)}` : escapeHTML(match[0]);
    } else { html += escapeHTML(match[0]); }
    last = match.index + match[0].length;
  }
  return html + emphasis(text.slice(last));
}
function renderMarkdown(text) {
  const lines = String(text).split(/\r?\n/);
  let html = '', list = '', paragraph = [];
  function flushParagraph() { if (paragraph.length) { html += '<p>' + paragraph.map(inlineMarkdown).join('<br>') + '</p>'; paragraph = []; } }
  function closeList() { if (list) { html += `</${list}>`; list = ''; } }
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.+)$/), numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph(); const type = bullet ? 'ul' : 'ol';
      if (list !== type) { closeList(); html += `<${type}>`; list = type; }
      html += '<li>' + inlineMarkdown((bullet || numbered)[1]) + '</li>';
    } else {
      closeList();
      if (!line.trim()) flushParagraph();
      else if (/^#{1,6}\s/.test(line)) { flushParagraph(); html += '<p><strong>' + inlineMarkdown(line.replace(/^#{1,6}\s+/,'')) + '</strong></p>'; }
      else paragraph.push(line);
    }
  }
  closeList(); flushParagraph(); return html;
}
function citedIds(text) { return [...new Set([...String(text).matchAll(/\[(\d+)\]/g)].map(m => Number(m[1])))].filter(docById); }
function renderSources(doc) {
  return doc.sources.filter(s => officialURL(s.url)).map(s => `<a class="source-link" href="${escapeHTML(officialURL(s.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a>`).join('');
}
function displayDate(value) { return value ? new Date(value + 'T12:00:00Z').toLocaleDateString('es-GT',{day:'numeric',month:'long',year:'numeric', timeZone:'America/Guatemala'}) : 'sin fecha'; }
function showToast(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}
function updateStatus() {
  $('connectionStatus').textContent=service.configured ? 'Conectado · '+selectedModel : 'Servicio pendiente de configuración institucional';
  $('newChatButton').disabled=isSending||!hasVisibleMessages;
  $('exportButton').disabled=isSending||!conversationHistory.length;
}
async function loadServiceConfig() {
  if(window.location.protocol==='file:'){updateStatus();return;}
  try{
    const response=await fetch('/api/config',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('No se pudo leer la configuración del servidor.');
    service=await response.json();
    selectedModel=service.models.includes(selectedModel)?selectedModel:service.defaultModel;
    generationSettings={temperature:service.temperature,max_tokens:service.maxTokens};
  }catch{service.configured=false;}
  updateStatus();
}
function openConfig() {
  $('accessGroup').hidden=!service.requiresAccess;
  $('accessInput').value=accessToken;
  $('modelSelect').innerHTML=service.models.length?service.models.map(id=>`<option value="${escapeHTML(id)}">${escapeHTML(id)}</option>`).join(''):'<option value="">Sin modelos configurados</option>';
  $('modelSelect').value=selectedModel;
  $('temperatureInput').value=String(generationSettings.temperature);
  $('maxTokensInput').value=String(generationSettings.max_tokens);
  $('maxTokensInput').max=String(service.maxTokens);
  $('configStatus').textContent=service.configured?'':'El administrador debe completar .env en el servidor y reiniciar el servicio.';
  if(window.location.protocol==='file:')$('configStatus').textContent='Inicia el servidor con npm start y abre la dirección que muestra la terminal.';
  if(!$('configDialog').open)$('configDialog').showModal();
}
function closeDialog(id){if($(id).open)$(id).close();}
function saveConfig(event){
  event.preventDefault();
  if(!service.configured){$('configStatus').textContent='La institución todavía no ha configurado su API en el servidor.';return;}
  const model=$('modelSelect').value,temperature=Number($('temperatureInput').value),max_tokens=Number($('maxTokensInput').value);
  if(!service.models.includes(model)||!Number.isFinite(temperature)||temperature<0||temperature>1||!Number.isInteger(max_tokens)||max_tokens<128||max_tokens>service.maxTokens){$('configStatus').textContent='Revisa el modelo y los límites de respuesta.';return;}
  selectedModel=model;generationSettings={temperature,max_tokens};sessionToken($('accessInput').value.trim());
  closeDialog('configDialog');updateStatus();showToast('Preferencias guardadas para esta pestaña.');
}
function apiError(status){return ({401:'Código de acceso incorrecto. Revisa Preferencias.',429:'Se alcanzó el límite de solicitudes. Espera un minuto.',503:'El servicio está pendiente de configuración o temporalmente ocupado.',504:'El proveedor tardó demasiado en responder.'})[status]||'No se pudo completar la respuesta. Contacta al administrador si continúa.';}
function friendlyError(error){return error.name==='TimeoutError'||error.name==='AbortError'?'La respuesta tardó demasiado. Intenta nuevamente.':error instanceof TypeError?'No se pudo conectar con el servidor.':error.message||'No se pudo completar la solicitud.';}
function openKnowledge(slugOrId) {
  $('knowledgeSearch').value = ''; renderKnowledge('');
  if (!$('knowledgeDialog').open) $('knowledgeDialog').showModal();
  const doc = documents.find(doc => doc.slug === slugOrId || doc.id === Number(slugOrId));
  if (doc) { const entry = $('knowledge-'+doc.id); entry.open = true; entry.scrollIntoView({block:'nearest'}); entry.querySelector('summary').focus(); }
  else $('knowledgeSearch').focus();
}
function normalize(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function renderKnowledge(query) {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matching = documents.filter(doc => tokens.every(token => normalize(doc.title+' '+doc.content+' '+doc.note).includes(token)));
  $('knowledgeList').innerHTML = matching.map(doc => `<details class="knowledge-entry" id="knowledge-${doc.id}"><summary>[${doc.id}] ${escapeHTML(doc.title)}</summary><div>${escapeHTML(doc.content)}${doc.note ? '<p class="field-note">'+escapeHTML(doc.note)+'</p>' : ''}<p class="field-note">Consultado el ${escapeHTML(displayDate(doc.reviewed))}</p><div class="source-list">${renderSources(doc)}</div><button class="text-button" type="button" data-ask-topic="${doc.id}">Conversar sobre este tema →</button></div></details>`).join('') || '<p class="empty-search">No encontré ese tema en la base local. Intenta otra palabra o consulta el sitio oficial de UVG.</p>';
}
function scrollMessages() { $('chatMessages').scrollTop = $('chatMessages').scrollHeight; }
function appendMessage(role, text, pending = false) {
  const article = document.createElement('article'); article.className = 'message ' + role;
  const author = document.createElement('span'); author.className = 'message-author'; author.textContent = role === 'user' ? 'Vos' : 'Asistente UVG';
  const content = document.createElement('div'); content.className = 'message-content';
  if (pending) { content.classList.add('typing'); content.textContent = 'Preparando tu respuesta'; }
  else if (role === 'user') content.textContent = text;
  else content.innerHTML = renderMarkdown(text);
  article.append(author, content); $('chatMessages').appendChild(article); hasVisibleMessages = true; scrollMessages(); return content;
}
function replacePending(content, text, error = false) {
  content.classList.remove('typing');
  if (error) { content.classList.add('error-message'); content.textContent = text; }
  else {
    content.innerHTML = renderMarkdown(text);
    const ids = citedIds(text);
    if (ids.length) {
      const links = document.createElement('div'); links.className = 'source-list';
      links.innerHTML = ids.map(id => `<button type="button" class="source-link" data-source="${id}">[${id}] ${escapeHTML(docById(id).title)} ↗</button>`).join(''); content.appendChild(links);
    } else if (documents.length) {
      const note = document.createElement('p'); note.className = 'source-warning'; note.textContent = 'Esta respuesta no incluyó citas. Comprueba cualquier dato institucional en Fuentes.'; content.appendChild(note);
    }
  }
  scrollMessages();
}
function autoResize() { const input = $('messageInput'); input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight,150)+'px'; }
async function sendMessage(event) {
  if (event) event.preventDefault();
  if (isSending) return;
  const input = $('messageInput'), message = input.value.trim();
  if (!message) return;
  if (message.length > 6000) { showToast('Acorta tu mensaje a 6000 caracteres.'); return; }
  await bootPromise;
  if(isSending)return;
  if(!service.configured || (service.requiresAccess&&!accessToken)){openConfig();return;}
  isSending = true; $('sendButton').disabled = true; input.disabled = true;
  $('sendStatus').textContent = 'Consultando…'; updateStatus();
  const welcome = $('welcomeCard'); if (welcome) welcome.hidden = true;
  appendMessage('user', message); input.value = ''; autoResize();
  conversationHistory.push({role:'user',content:message});
  const pending = appendMessage('assistant','',true);
  try {
    const response = await fetch('/api/chat', {
      method:'POST', signal:AbortSignal.timeout(130000),
      headers:{'Content-Type':'application/json',...(accessToken ? {'X-App-Token':accessToken} : {})},
      body:JSON.stringify({model:selectedModel,messages:conversationHistory.slice(-17),...generationSettings,stream:false})
    });
    const data = await response.json();
    if(!response.ok)throw new Error(data.error?.message || apiError(response.status));
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('El modelo no devolvió texto. Aumenta el límite de respuesta en Configurar o prueba otro modelo.');
    conversationHistory.push({role:'assistant',content:answer});
    replacePending(pending,answer);
  } catch (error) {
    conversationHistory.pop(); input.value = message; autoResize();
    replacePending(pending,friendlyError(error)+' Tu pregunta quedó en el cuadro para que puedas reintentar.',true);
  } finally {
    isSending = false; $('sendButton').disabled = false; input.disabled = false;
    $('sendStatus').textContent = ''; updateStatus(); input.focus();
  }
}
function askQuestion(question) { closeDialog('knowledgeDialog'); $('messageInput').value = question; autoResize(); $('messageInput').focus(); }
function newConversation() {
  if (isSending) return;
  conversationHistory = []; hasVisibleMessages = false; document.querySelectorAll('#chatMessages .message').forEach(el => el.remove());
  $('welcomeCard').hidden = false; $('messageInput').value = ''; autoResize(); updateStatus(); scrollMessages();
}
function exportConversation() {
  if (!conversationHistory.length || isSending) return;
  const references = [...new Set(conversationHistory.filter(m=>m.role==='assistant').flatMap(m=>citedIds(m.content)))];
  const text = ['Asistente UVG · Proyecto estudiantil','Base consultada: '+knowledge.reviewed,'Proveedor: '+service.provider,'Modelo: '+selectedModel,'',...conversationHistory.map(m => (m.role==='user'?'Vos':'Asistente UVG')+':\n'+m.content+'\n'),'Fuentes citadas:',...references.map(id=>'['+id+'] '+docById(id).title+'\n'+docById(id).sources.map(s=>s.url).join('\n'))].join('\n');
  const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'conversacion-uvg.txt'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const savedTheme = readSetting('uvg_theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');
function syncThemeButton() {
  const dark = document.body.classList.contains('dark');
  const label = dark ? 'Activar modo claro' : 'Activar modo oscuro';
  $('themeButton').setAttribute('aria-pressed', String(dark));
  $('themeButton').setAttribute('aria-label', label);
  $('themeButton').title = label;
}
syncThemeButton();
$('themeButton').addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  writeSetting('uvg_theme',document.body.classList.contains('dark')?'dark':'light');
  syncThemeButton();
});
$('configButton').addEventListener('click',openConfig);
$('configForm').noValidate=true;
$('configForm').addEventListener('submit',saveConfig);
$('clearAccessButton').addEventListener('click',()=>{sessionToken('');$('accessInput').value='';$('configStatus').textContent='Código de acceso borrado de esta pestaña.';});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.dataset.close)));
$('configDialog').addEventListener('close',()=>{$('accessInput').value='';});
$('sourcesButton').addEventListener('click',()=>openKnowledge());
$('welcomeSources').addEventListener('click',()=>openKnowledge());
document.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>openKnowledge(button.dataset.topic)));
document.querySelectorAll('[data-question]').forEach(button=>button.addEventListener('click',()=>askQuestion(button.dataset.question)));
$('knowledgeSearch').addEventListener('input',()=>renderKnowledge($('knowledgeSearch').value));
$('knowledgeList').addEventListener('click',event=>{const button=event.target.closest('[data-ask-topic]');if(button)askQuestion('Contame sobre '+docById(button.dataset.askTopic).title+' y explicame el siguiente paso con fuentes.');});
$('chatMessages').addEventListener('click',event=>{const source=event.target.closest('[data-source]');if(source){event.preventDefault();openKnowledge(Number(source.dataset.source));}});
$('messageForm').addEventListener('submit',sendMessage);
$('messageInput').addEventListener('input',autoResize);
$('messageInput').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendMessage();}});
$('newChatButton').addEventListener('click',newConversation);
$('exportButton').addEventListener('click',exportConversation);
$('knowledgeSummary').textContent = documents.length ? documents.length+' temas con fuentes oficiales' : 'No se pudo cargar la información';
$('knowledgeDate').textContent = documents.length ? 'Consulta: '+displayDate(knowledge.reviewed) : 'Revisa que js/knowledge.js esté junto a los archivos del chat.';
$('knowledgeDescription').textContent = documents.length ? documents.length+' temas para consultar sin clave. Puedes buscarlos, leer el resumen y abrir la página original. Consulta: '+displayDate(knowledge.reviewed)+'.' : 'La base no se pudo cargar. Consulta https://www.uvg.edu.gt/.';
updateStatus();


const bootPromise=loadServiceConfig();
