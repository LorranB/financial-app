// Corrige um bug conhecido do @capacitor/assets: o arquivo ic_launcher_background.png
// às vezes sai BRANCO em vez de usar a cor passada em --iconBackgroundColor/-Dark.
// Isso faz aparecer um contorno claro fino em volta do ícone no launcher (a máscara do
// Android/MIUI mostra esse branco por baixo, na diferença entre o formato do nosso
// ícone e o formato que o sistema recorta).
//
// Esse script roda DEPOIS do "capacitor-assets generate" (ver package.json) e substitui
// todo ic_launcher_background.png por um quadrado sólido na cor certa — claro nas pastas
// normais (mipmap-*), escuro nas pastas -night (mipmap-night-*), mantendo o tamanho
// exato de cada arquivo original.

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ANDROID_RES = join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
const COR_CLARA = '#0ea5e9';   // mesma cor do --iconBackgroundColor
const COR_ESCURA = '#10151b';  // mesma cor do --iconBackgroundColorDark

async function main() {
  let pastas;
  try {
    pastas = readdirSync(ANDROID_RES).filter(nome => nome.startsWith('mipmap-'));
  } catch {
    console.log('[fix-icon-background] Pasta android/app/src/main/res ainda não existe — rode "npm run cap:add:android" primeiro. Pulando.');
    return;
  }

  let corrigidos = 0;
  for (const pasta of pastas) {
    const caminhoPasta = join(ANDROID_RES, pasta);
    if (!statSync(caminhoPasta).isDirectory()) continue;

    const arquivo = join(caminhoPasta, 'ic_launcher_background.png');
    let tamanho;
    try {
      const meta = await sharp(arquivo).metadata();
      tamanho = meta.width;
    } catch {
      continue; // não existe esse arquivo nessa pasta, ignora
    }

    const cor = pasta.startsWith('mipmap-night-') || pasta === 'mipmap-night' ? COR_ESCURA : COR_CLARA;

    await sharp({
      create: { width: tamanho, height: tamanho, channels: 4, background: cor },
    }).png().toFile(arquivo);

    corrigidos++;
    console.log(`[fix-icon-background] ${pasta}/ic_launcher_background.png -> ${cor} (${tamanho}x${tamanho})`);
  }

  console.log(`[fix-icon-background] Pronto. ${corrigidos} arquivo(s) corrigido(s).`);
}

main();
