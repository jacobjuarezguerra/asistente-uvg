'use strict';
function makeRequest(config, {model,messages,system,temperature,max_tokens}) {
  const headers = {'Content-Type':'application/json',Accept:'application/json'};
  headers[config.authHeader] = config.authHeader === 'Authorization' ? 'Bearer '+config.apiKey : config.apiKey;
  let body;
  if (config.provider === 'anthropic') {
    headers['anthropic-version'] = config.apiVersion;
    body = {model,system,messages,max_tokens,stream:false,...config.extraBody};
  } else {
    body = {model,messages:[{role:'system',content:system},...messages],[config.tokenParameter]:max_tokens,stream:false,...config.extraBody};
  }
  if (config.sendTemperature) body.temperature=temperature;
  return {url:config.base+(config.provider==='anthropic'?'/messages':'/chat/completions'),options:{method:'POST',headers,body:JSON.stringify(body),redirect:'error'}};
}
function readAnswer(provider, data) {
  const text = provider === 'anthropic'
    ? (Array.isArray(data.content) ? data.content.filter(b=>b.type==='text').map(b=>b.text).join('\n') : '')
    : data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw Error('EMPTY_RESPONSE');
  return text;
}
module.exports={makeRequest,readAnswer};
