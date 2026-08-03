# Ícone e splash screen (Android/iOS) — com suporte a modo escuro

## ⚠️ Bug conhecido: contorno claro em volta do ícone (já corrigido automaticamente)

O `@capacitor/assets` tem um bug onde o arquivo `ic_launcher_background.png` às vezes
sai **branco** em vez de usar a cor de `--iconBackgroundColor`/`--iconBackgroundColorDark`.
Isso cria um contorno/fresta clara em volta do ícone no launcher (mais visível em launchers
como o da Xiaomi/MIUI, mas é bug nosso, não do sistema — confirmamos analisando os
arquivos gerados pixel a pixel).

**Já está corrigido automaticamente:** o `npm run cap:assets` agora roda
`scripts/fix-icon-background.mjs` logo depois da geração, que substitui esse arquivo
por um quadrado sólido na cor certa (claro ou escuro, dependendo da pasta) em todas as
densidades. Não precisa fazer nada extra — só rodar `cap:assets` normalmente.

## O que já está pronto

```
resources/
├── icon.png              (glifo transparente, usado como base — "Easy Mode")
├── icon-dark.png          (mesmo glifo — funciona bem tanto no fundo claro quanto escuro)
├── splash.png             (tela de abertura, tema claro)
├── splash-dark.png        (tela de abertura, tema escuro)
└── marca/                 (ícones já com fundo aplicado — ver seção "Pasta marca/" abaixo)
```

Só rodar:
```bash
npm run cap:assets
npm run cap:sync
```

## Como o modo escuro do ícone funciona

Isso usa o **"Easy Mode"** do `@capacitor/assets`: em vez de eu já entregar o fundo
"assado" na imagem, entrego só o glifo transparente (`icon.png`/`icon-dark.png`), e a
própria ferramenta aplica o fundo — nas cores que passamos via flag no script
`cap:assets` do `package.json`:

```
--iconBackgroundColor '#0ea5e9'        (fundo claro — azul da marca)
--iconBackgroundColorDark '#10151b'    (fundo escuro — mesmo tom do modo escuro do app)
```

**Por que isso é melhor que eu tentar montar manualmente:** o Android precisa de pastas
específicas (`mipmap-night-hdpi`, `mipmap-night-xxhdpi` etc — o qualificador `night` é
o que diz pro sistema "use isto quando o celular estiver em modo escuro"). A ferramenta
`@capacitor/assets` gera tudo isso automaticamente nas duas passadas (clara e escura)
quando você usa esse "Easy Mode" com as duas cores de fundo. Eu cheguei a montar uma
versão manual disso (duas gerações + renomear pastas), mas descobri que a própria
ferramenta já faz isso de forma oficial e mais confiável — não precisa de gambiarra.

**Limitação consciente:** o fundo vira uma cor **sólida**, não o gradiente diagonal que
o app usa em outros lugares (botões, por exemplo) — é uma limitação da ferramenta (só
aceita 1 cor hexadecimal por flag, não gradiente). Se um dia você quiser o gradiente de
verdade no ícone nativo, dá pra voltar pro fluxo manual (ícone com fundo já pintado +
gerar cópia pras pastas `mipmap-night-*`), mas perde a atualização automática — é
mais trabalho de manutenção. Por enquanto, cor sólida = suporte a dark mode automático
e confiável, que foi o que você pediu.

## Pasta `marca/`

Os 5 arquivos que já eram do jeito que você pediu no mockup (`ic_launcher.png`,
`ic_launcher_round.png`, `ic_launcher_round_dark.png`, `ic_launcher_foreground.png`,
`ic_launcher_foreground_dark.png`) — esses têm o fundo (inclusive gradiente) já
"assado" na imagem, prontos pra uso em materiais de marca, loja de apps, README, site
etc. **Não fazem parte do pipeline de geração automática** (`cap:assets` não lê essa
pasta) — são só referência/material visual pronto.

## ⚠️ Se mesmo assim o ícone não aparecer no celular

Isso é uma pegadinha bem comum do Android: ele **cacheia o ícone antigo por app
instalado**. Rodar `cap:sync` de novo e reinstalar o app por cima geralmente **não**
atualiza o ícone na tela inicial. O jeito certo:

1. **Desinstale o app do celular/emulador primeiro** (não só "rode de novo" no Android
   Studio — precisa desinstalar mesmo).
2. Rode `npm run cap:assets && npm run cap:sync`.
3. Abra o Android Studio (`npm run cap:open:android`) e rode o app de novo — vai
   instalar como se fosse a primeira vez, com o ícone novo.
4. Pra testar o modo escuro especificamente: troque o tema do sistema (Configurações
   do Android → Tela → Tema escuro) e volte pra tela inicial — o ícone deve trocar
   sozinho, sem precisar reinstalar de novo (diferente do problema de cache do passo 1,
   que só acontece na primeira instalação).

## Se quiser trocar a arte no futuro

Substitua `resources/icon.png` (e `icon-dark.png`, se quiser um glifo diferente pro
modo escuro) e rode os dois comandos do topo de novo.
