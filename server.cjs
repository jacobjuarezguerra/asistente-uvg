'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {readConfig}=require('./lib/config.cjs');
const {makeRequest,readAnswer}=require('./lib/providers.cjs');
const {loadKnowledge,buildPrompt}=require('./lib/knowledge.cjs');
const APP_ID='asistente-uvg';
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/assets/chat.css','assets/chat.css'],['/js/chat.js','js/chat.js'],['/js/knowledge.js','js/knowledge.js']]);
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
function reply(res,status,data){if(res.destroyed||res.writableEnded)return;const b=Buffer.from(JSON.stringify(data));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length});res.end(b);}
async function readBody(req){
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){req.resume();throw new HttpError(415,'Envía JSON.');}
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>128*1024)throw new HttpError(413,'La conversación es demasiado larga. Inicia otra.');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'JSON inválido.');}
}
async function readResponse(response,controller){
  const chunks=[];let size=0;
  if(!response.body)throw new HttpError(502,'El proveedor devolvió una respuesta vacía.');
  for await(const chunk of response.body){size+=chunk.length;if(size>4*1024*1024){controller.abort();throw new HttpError(502,'Respuesta demasiado grande.');}chunks.push(Buffer.from(chunk));}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(502,'El proveedor devolvió un formato inesperado.');}
}
function sameToken(given,expected){const a=Buffer.from(given||''),b=Buffer.from(expected);return a.length===b.length&&crypto.timingSafeEqual(a,b);}
function createServer({config=readConfig(),staticRoot=__dirname,knowledge=loadKnowledge(path.join(staticRoot,'data/institucion.json')),fetchImpl=globalThis.fetch}={}){
  const rates=new Map();let active=0;
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try{
      const local='http://127.0.0.1:'+req.socket.localPort,localhost='http://localhost:'+req.socket.localPort;
      const origins=[local,localhost,...(config.origin?[config.origin]:[])];
      if(!origins.some(origin=>new URL(origin).host===req.headers.host))throw new HttpError(403,'Host no autorizado.');
      const route=(req.url||'').split('?')[0];
      if(route.startsWith('/api/')){
        if((req.headers.origin&&!origins.includes(req.headers.origin))||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'Origen no autorizado.');
        if((req.url||'').includes('?'))throw new HttpError(400,'No se aceptan credenciales o parámetros en la URL.');
        if(route==='/api/health'&&req.method==='GET'){reply(res,200,{app:APP_ID,configured:config.configured});return;}
        if(route==='/api/config'&&req.method==='GET'){
          reply(res,200,{provider:config.provider,configured:config.configured,requiresAccess:!!config.accessToken,models:config.models,defaultModel:config.model,maxTokens:config.maxTokens,temperature:config.temperature});return;
        }
        if(route!=='/api/chat')throw new HttpError(404,'Ruta no disponible.');
        if(req.method!=='POST')throw new HttpError(405,'Método no permitido.');
        if(config.accessToken&&!sameToken(req.headers['x-app-token'],config.accessToken))throw new HttpError(401,'Código de acceso incorrecto. Revisa Preferencias.');
        if(!config.configured)throw new HttpError(503,'La institución debe configurar su proveedor, modelo y clave en el servidor.');
        const now=Date.now();for(const [key,entry] of rates){if(entry.until<=now)rates.delete(key);}
        const ip=req.socket.remoteAddress;let rate=rates.get(ip);if(!rate){rate={count:0,until:now+60000};rates.set(ip,rate);}
        if(++rate.count>config.rpm){res.setHeader('Retry-After','60');throw new HttpError(429,'Límite de solicitudes. Espera un minuto.');}
        const body=await readBody(req),model=body.model||config.model;
        if(!config.models.includes(model))throw new HttpError(400,'Modelo no autorizado por la institución.');
        const messages=body.messages;
        if(!Array.isArray(messages)||!messages.length||messages.length>17||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>6000)||messages[0].role!=='user'||messages.at(-1).role!=='user')throw new HttpError(400,'Conversación inválida. Inicia una nueva conversación.');
        const tokens=body.max_tokens??config.maxTokens,temperature=body.temperature??config.temperature;
        if(!Number.isInteger(tokens)||tokens<128||tokens>config.maxTokens||!Number.isFinite(temperature)||temperature<0||temperature>1)throw new HttpError(400,'Parámetros fuera de los límites autorizados.');
        if(active>=config.maxConcurrent)throw new HttpError(429,'El servicio está ocupado. Intenta más tarde.');
        const controller=new AbortController();let timedOut=false;
        const timer=setTimeout(()=>{timedOut=true;controller.abort();},config.timeoutMs);
        const cancel=()=>{if(!res.writableEnded)controller.abort();};res.once('close',cancel);active++;
        try{
          const request=makeRequest(config,{model,messages:messages.map(({role,content})=>({role,content})),system:buildPrompt(knowledge),temperature,max_tokens:tokens});
          const upstream=await fetchImpl(request.url,{...request.options,signal:controller.signal});
          if(!upstream.ok){if(upstream.body)await upstream.body.cancel().catch(()=>{});const mapped=({401:502,403:502,404:502,429:429,503:503})[upstream.status]||502;throw new HttpError(mapped,upstream.status===429?'El proveedor alcanzó su límite de uso. Intenta más tarde.':'El proveedor rechazó la solicitud. El administrador debe revisar modelo, clave, permisos y parámetros.');}
          const data=await readResponse(upstream,controller);let answer;
          try{answer=readAnswer(config.provider,data);}catch{throw new HttpError(502,'El modelo no devolvió texto. El administrador debe revisar los parámetros del modelo.');}
          reply(res,200,{choices:[{message:{role:'assistant',content:answer}}],model});
        }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(timedOut?504:502,timedOut?'El proveedor tardó demasiado. Intenta más tarde.':'No se pudo conectar con el proveedor.');}
        finally{active--;clearTimeout(timer);res.removeListener('close',cancel);}
        return;
      }
      if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Método no permitido.');
      const file=assets.get(route);if(!file)throw new HttpError(404,'Archivo no disponible.');
      let content;try{content=await fs.readFile(path.join(staticRoot,file));}catch{throw new HttpError(404,'Archivo no disponible.');}
      const type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html';
      res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Content-Length':content.length});res.end(req.method==='HEAD'?undefined:content);
    }catch(error){reply(res,error instanceof HttpError?error.status:500,{error:{message:error instanceof HttpError?error.message:'Error interno del servicio.'}});}
  });
}
if(require.main===module){
  try{
    const envFile=path.join(__dirname,'.env');
    if(require('node:fs').existsSync(envFile))process.loadEnvFile(envFile);
    const config=readConfig(),server=createServer({config});
    server.requestTimeout=30000;server.headersTimeout=15000;
    server.on('error',()=>{console.error('No se pudo iniciar el servicio. Revisa el puerto y los permisos.');process.exitCode=1;});
    server.listen(config.port,config.host,()=>console.log(`Asistente UVG: http://127.0.0.1:${config.port} · API ${config.configured?'configurada':'pendiente de configuración'}`));
    for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
  }catch(error){console.error('No se pudo iniciar: '+error.message);process.exitCode=1;}
}
module.exports={createServer,APP_ID};
