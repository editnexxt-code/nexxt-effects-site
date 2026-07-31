/* Gera o index.html final embutindo as imagens como data URI.
   Uso: node build.js
   As capturas novas entram de prints/ (o dono salva ali). */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const FF = 'C:/Users/Willi/OneDrive/Documentos/Nexxt Effects/3 - Backup Supremo/Nexxt Effects/tools/ffmpeg.exe';
const FF_ALT = 'C:/Users/Willi/AppData/Roaming/Adobe/CEP/extensions/Nexxt Effects/tools/ffmpeg.exe';
const ffmpeg = fs.existsSync(FF) ? FF : FF_ALT;

// converte um print pra jpg comprimido e devolve o data URI
function dataUri(srcPath, largura) {
  const tmp = path.join(__dirname, 'img', '_tmp.jpg');
  cp.execFileSync(ffmpeg, ['-hide_banner', '-y', '-i', srcPath,
    '-vf', `scale=${largura}:-1`, '-q:v', '5', tmp], { stdio: 'ignore', windowsHide: true });
  const b64 = fs.readFileSync(tmp).toString('base64');
  fs.unlinkSync(tmp);
  return 'data:image/jpeg;base64,' + b64;
}

function b64file(f) { return fs.readFileSync(path.join(__dirname, 'img', f), 'utf8').trim(); }

const P = (f) => path.join(__dirname, 'prints', f);
const faltando = [];
function proof(arquivo, largura) {
  const p = P(arquivo);
  if (!fs.existsSync(p)) { faltando.push(arquivo); return null; }
  return dataUri(p, largura);
}

const map = {
  __NAVICON__: b64file('navicon.b64'),
  __HEROART__: b64file('hero2.b64'),
  __PAINEL__:  b64file('painel.b64'),
  __PROOF1__:  proof('1-legenda.png', 1000),
  __PROOF2__:  proof('2-pote.png', 1000),
  __PROOF3A__: proof('5-vinculador-painel.png', 760),
  __PROOF3B__: proof('4-vinculador-timeline.png', 1000),
};

if (faltando.length) {
  console.error('FALTAM prints em prints/:');
  faltando.forEach(f => console.error('  - ' + f));
  process.exit(1);
}

let h = fs.readFileSync(path.join(__dirname, 'index.src.html'), 'utf8');
for (const [k, v] of Object.entries(map)) h = h.split(k).join(v);

const sobrou = h.match(/__[A-Z0-9]+__/g);
if (sobrou) { console.error('placeholder sem valor:', [...new Set(sobrou)]); process.exit(1); }

fs.writeFileSync(path.join(__dirname, 'index.html'), h);
const kb = (h.length / 1024).toFixed(0);
const links = (h.match(/pay\.cakto\.com\.br/g) || []).length;
console.log(`index.html gerado: ${kb} KB | links do checkout: ${links}`);
if (kb > 900) console.warn('AVISO: pagina acima de 900 KB — considere comprimir mais os prints.');
