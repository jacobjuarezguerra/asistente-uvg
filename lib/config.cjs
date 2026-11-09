'use strict';
function number(env, name, fallback, min, max) {
  const value = env[name] === undefined || env[name] === '' ? fallback : Number(env[name]);
  if (!Number.isFinite(value) || value < min || value > max) throw Error(`${name}: valor fuera de rango.`);
  return value;
}
function readConfig(env = process.env) {
  const provider = env.AI_PROVIDER || 'openai-compatible';
  if (!['openai-compatible','anthropic'].includes(provider)) throw Error('AI_PROVIDER debe ser openai-compatible o anthropic.');
  const base = (env.AI_BASE_URL || '').trim().replace(/\/+$/,'');
  if (base) {
    let url; try { url = new URL(base); } catch { throw Error('AI_BASE_URL no es una URL válida.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw Error('AI_BASE_URL debe usar HTTPS y no incluir credenciales, query ni fragmentos.');
  }
  const model = (env.AI_MODEL || '').trim();
  const models = [...new Set([model,...(env.AI_ALLOWED_MODELS || '').split(',').map(x=>x.trim())].filter(Boolean))];
  if (models.some(m=>!/^[-\w.:/]{1,180}$/.test(m))) throw Error('AI_MODEL o AI_ALLOWED_MODELS contiene identificadores inválidos.');
  const authHeader = env.AI_AUTH_HEADER || (provider === 'anthropic' ? 'x-api-key' : 'Authorization');
  if (!['Authorization','api-key','x-api-key'].includes(authHeader)) throw Error('AI_AUTH_HEADER no admitido.');
  const tokenParameter = env.AI_TOKEN_PARAMETER || 'max_tokens';
  if (!['max_tokens','max_completion_tokens'].includes(tokenParameter)) throw Error('AI_TOKEN_PARAMETER no admitido.');
  const apiKey = (env.AI_API_KEY || '').trim();
  if (/[\r\n]/.test(apiKey)) throw Error('AI_API_KEY no puede contener saltos de línea.');
  const accessToken = env.APP_ACCESS_TOKEN || '';
  const host = env.HOST || '127.0.0.1';
  if (!['127.0.0.1','0.0.0.0'].includes(host)) throw Error('HOST debe ser 127.0.0.1 o 0.0.0.0.');
  if (host !== '127.0.0.1' && accessToken.length < 24) throw Error('La escucha en red requiere APP_ACCESS_TOKEN de al menos 24 caracteres.');
  const port = number(env,'PORT',8765,1024,65535);
  if (!Number.isInteger(port)) throw Error('PORT debe ser entero.');
  const origin = env.PUBLIC_ORIGIN || '';
  if (origin && new URL(origin).origin !== origin) throw Error('PUBLIC_ORIGIN debe incluir solo esquema, host y puerto, sin barra final.');
  if (host !== '127.0.0.1' && !origin) throw Error('Configura PUBLIC_ORIGIN al escuchar en red.');
  let extraBody; try { extraBody = JSON.parse(env.AI_EXTRA_BODY_JSON || '{}'); } catch { throw Error('AI_EXTRA_BODY_JSON no es JSON válido.'); }
  if (!extraBody || Array.isArray(extraBody) || typeof extraBody !== 'object' || Object.keys(extraBody).some(k=>['model','messages','system','stream','max_tokens','max_completion_tokens','temperature'].includes(k))) throw Error('AI_EXTRA_BODY_JSON no puede sobrescribir campos principales.');
  return {
    provider, base, model, models, apiKey, authHeader, tokenParameter, extraBody,
    apiVersion:env.AI_API_VERSION || '2023-06-01',
    sendTemperature:env.AI_SEND_TEMPERATURE !== 'false',
    maxTokens:Math.floor(number(env,'AI_MAX_TOKENS',2048,128,16384)),
    temperature:number(env,'AI_TEMPERATURE',0.2,0,1),
    timeoutMs:number(env,'AI_TIMEOUT_MS',120000,100,180000),
    rpm:Math.floor(number(env,'RATE_LIMIT_PER_MINUTE',20,1,1000)),
    maxConcurrent:Math.floor(number(env,'MAX_CONCURRENT_REQUESTS',4,1,100)),
    host, port, origin, accessToken,
    configured:!!(base && model && apiKey),
  };
}
module.exports = {readConfig};
