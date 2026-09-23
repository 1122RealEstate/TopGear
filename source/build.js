// Empaqueta el juego en un único HTML autónomo: node build.js [salida]
const fs = require('fs');
const path = require('path');
const src = __dirname;
const out = process.argv[2] || path.join(src, '..', 'TopGear.html');
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  const css = fs.readFileSync(path.join(src, href), 'utf8');
  return '<style>\n' + css + '\n</style>';
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, file) => {
  const js = fs.readFileSync(path.join(src, file), 'utf8');
  if (/<\/script/i.test(js)) throw new Error('Secuencia </script> no permitida en ' + file);
  return '<script>\n' + js + '\n</script>';
});
fs.writeFileSync(out, html);
console.log('OK ' + out + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
