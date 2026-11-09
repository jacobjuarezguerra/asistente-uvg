'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/chat.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function harness({configured=true,requiresAccess=false}={}){
  const elements=new Map(),storage=new Map(),calls=[];
  function el(id){if(!elements.has(id))elements.set(id,{value:'',hidden:false,disabled:false,open:false,style:{},textContent:'',innerHTML:'',scrollHeight:60,children:[],classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},addEventListener(){},focus(){},showModal(){this.open=true;},close(){this.open=false;},append(...x){this.children.push(...x);},appendChild(x){this.children.push(x);},remove(){},click(){},scrollIntoView(){},querySelector(){return el('summary');}});return elements.get(id);}
  const c=vm.createContext({console,URL,Blob,AbortController,AbortSignal,setTimeout(){return 1},clearTimeout(){},
    window:{location:{protocol:'http:'},UVG_KNOWLEDGE:JSON.parse(fs.readFileSync(path.join(root,'data/institucion.json'),'utf8')),matchMedia:()=>({matches:false})},
    document:{getElementById:el,body:el('body'),createElement:tag=>el(tag+'-'+elements.size),querySelectorAll:()=>[]},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url==='/api/config'?{configured,requiresAccess,models:['test/model'],defaultModel:'test/model',provider:'openai-compatible',temperature:0.2,maxTokens:2048}:{choices:[{message:{content:'Consulta la fuente. [2]'}}]}};}
  });vm.runInContext(source,c);return {c,el,calls,run:code=>vm.runInContext(code,c)};
}
test('la interfaz conserva controles y no contiene configuración personal de API',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  for(const m of source.matchAll(/\$\('([^']+)'\)/g)){if(!m[1].startsWith('knowledge-'))assert(ids.includes(m[1]),m[1]);}
  assert(!source.includes('nvidia_nim_api_key'));assert(!source.includes('openrouter_api_key'));assert(!html.includes('id="apiKeyInput"'));
});
test('enviar funciona con proveedor institucional sin pegar su clave',async()=>{
  const h=harness();await h.run('bootPromise');h.el('messageInput').value='Hola';await h.c.sendMessage();
  assert.equal(h.run('conversationHistory.length'),2);const request=h.calls.find(c=>c.url==='/api/chat');assert(request);
  assert(!request.options.headers.Authorization);const payload=JSON.parse(request.options.body);assert.equal(payload.messages[0].role,'user');assert.equal(payload.model,'test/model');
});
test('acceso compartido, preferencias y recuperación ante error',async()=>{
  const h=harness({requiresAccess:true});await h.run('bootPromise');h.el('messageInput').value='Pregunta';await h.c.sendMessage();assert(h.el('configDialog').open);
  h.el('modelSelect').value='test/model';h.el('accessInput').value='codigo-de-prueba';h.el('temperatureInput').value='0.2';h.el('maxTokensInput').value='512';h.c.saveConfig({preventDefault(){}});assert(!h.el('configDialog').open);
  await h.c.sendMessage();const request=h.calls.find(c=>c.url==='/api/chat');assert.equal(request.options.headers['X-App-Token'],'codigo-de-prueba');
  h.c.fetch=async()=>({ok:false,status:429,json:async()=>({error:{message:'Espera un minuto.'}})});h.el('messageInput').value='Reintentar';await h.c.sendMessage();assert.equal(h.el('messageInput').value,'Reintentar');assert.equal(h.run('isSending'),false);assert.equal(h.run('conversationHistory.length'),2);
});
test('sin configuración permite fuentes y explica el pendiente; contenido se escapa',async()=>{
  const h=harness({configured:false});await h.run('bootPromise');h.el('messageInput').value='Hola';await h.c.sendMessage();assert(h.el('configDialog').open);assert(!h.calls.some(c=>c.url==='/api/chat'));
  assert(!h.c.renderMarkdown('<img src=x onerror=alert(1)>').includes('<img'));
  h.c.renderKnowledge('admision');assert(h.el('knowledgeList').innerHTML.includes('Admisiones'));
});
