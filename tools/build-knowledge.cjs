'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadKnowledge}=require('../lib/knowledge.cjs');
const root=path.resolve(__dirname,'..');
const data=loadKnowledge(path.join(root,'data/institucion.json'));
const bundle='// Generado desde data/institucion.json. No editar manualmente.\nwindow.UVG_KNOWLEDGE = '+JSON.stringify(data,null,2)+';\n';
if(process.argv.includes('--check')){
  if(fs.readFileSync(path.join(root,'js/knowledge.js'),'utf8').replace(/\r\n/g,'\n')!==bundle){console.error('Ejecuta npm run build:knowledge y guarda js/knowledge.js.');process.exitCode=1;}
}else{fs.writeFileSync(path.join(root,'js/knowledge.js'),bundle);console.log('Base validada: '+data.documents.length+' temas.');}
