'use strict';
// A small guard for common credential formats; not a substitute for review.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const patterns=[/nvapi-[A-Za-z0-9_-]{30,}/,/sk-or-v1-[A-Za-z0-9_-]{30,}/,/sk-ant-[A-Za-z0-9_-]{30,}/,/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{40,}/,/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/];
let count=0,failures=0;
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.name==='.git'||entry.name==='node_modules'||entry.name==='.env'||(entry.name.startsWith('.env.')&&entry.name!=='.env.example'))continue;
  const file=path.join(dir,entry.name);if(entry.isDirectory()){scan(file);continue;}
  if(/\.(png|jpg|woff2|zip)$/i.test(file))continue;
  count++;const text=fs.readFileSync(file,'utf8');
  for(const pattern of patterns){if(pattern.test(text)){console.error('Posible credencial en '+path.relative(root,file));failures++;break;}}
}}
scan(root);if(failures)process.exitCode=1;else console.log('Sin patrones de claves reales en '+count+' archivos revisados.');
