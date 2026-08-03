<div align="center">

# 💙 Simple Finance

**Controle financeiro pessoal — um único código, três plataformas.**

Windows • Android • iOS — feito com React + TypeScript, empacotado com Electron e Capacitor.

[![Uso](https://img.shields.io/badge/uso-portf%C3%B3lio%20%2F%20demonstra%C3%A7%C3%A3o-blue)](#-licença)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB)](#-stack-técnica)
[![Plataformas](https://img.shields.io/badge/plataformas-Windows%20%7C%20Android%20%7C%20iOS-informational)](#-multiplataforma-de-verdade)

</div>

---

> ⚠️ **Este repositório é uma vitrine de portfólio.** O código é público pra quem
> quiser avaliar como o projeto foi construído, mas **não é livre pra uso, cópia ou
> redistribuição** — é um produto comercial em desenvolvimento pelo
> [CROOMA Design Studio](https://croomastudio.com). Detalhes em [LICENSE](./LICENSE).

## O que é

Simple Finance é um app de controle financeiro pessoal: lançamentos de despesas,
ganhos e investimentos, com suporte a recorrência (contas fixas mensais e compras
parceladas), gráficos de evolução e distribuição por categoria, tudo rodando 100%
local no aparelho — sem servidor, sem conta, sem seus dados financeiros saindo do
seu controle.

O diferencial técnico do projeto é que **o mesmo código-fonte React roda nativamente
em três plataformas diferentes** — Windows (via Electron), Android e iOS (via
Capacitor) — sem duplicar lógica de negócio entre elas.

## ✨ Funcionalidades

- 💸 **Lançamentos** de despesas, ganhos e investimentos, com categorias
- 🔁 **Recorrência inteligente**: contas fixas mensais e compras parceladas, com
  edição por escopo ("só esta ocorrência" ou "esta e todas as seguintes") sem
  quebrar o histórico já lançado
- 📊 **Gráficos** de evolução no período e distribuição de despesas por categoria
- 🌗 **Modo claro/escuro**, incluindo a cor da barra de status do celular e o
  próprio ícone do app trocando automaticamente com o tema do sistema
- 🌍 **3 idiomas** (Português, English, Español) com detecção automática do idioma
  do aparelho
- 💱 **4 moedas** (R$, US$, €, £) com formatação correta por convenção decimal de
  cada uma
- 🙈 **Modo privacidade**: um toque oculta todos os valores monetários da tela
- 📤 **Backup completo**: exportação/importação em JSON e CSV, preservando
  inclusive a estrutura de recorrência (não só os valores)
- 🔒 Dados 100% locais — nenhuma informação financeira trafega pra fora do
  aparelho

## 🧩 Multiplataforma de verdade

```
                    ┌─────────────────────┐
                    │   src/  (React+TS)  │   ← única fonte de verdade
                    └──────────┬──────────┘
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐   ┌──────────────┐   ┌──────────────┐
        │ Electron │   │  Capacitor   │   │  Capacitor   │
        │ (Windows)│   │  (Android)   │   │    (iOS)     │
        └──────────┘   └──────────────┘   └──────────────┘
```

Nenhuma tela ou regra de negócio é reescrita por plataforma — o que muda é só a
"casca" nativa em volta do mesmo app web.

## 🛠 Stack técnica

| Camada | Tecnologia |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS |
| Animação | Framer Motion |
| Gráficos | Recharts |
| Datas | date-fns (com locale dinâmico por idioma) |
| Build | Vite |
| Desktop | Electron + electron-builder |
| Mobile | Capacitor 6 (Android/iOS) |
| Ícones/splash nativos | @capacitor/assets, com correção própria pra um bug de
  geração da ferramenta (`scripts/fix-icon-background.mjs`) |
| Persistência | localStorage (sem backend) |

## 🚀 Rodando o projeto

```bash
npm install
npm run dev              # navegador
npm run dev:electron     # janela desktop
```

<details>
<summary><b>Build Windows (.exe)</b></summary>

```bash
npm run dist:win
```
Gera o instalador em `release/`. Requer `assets/icone.ico`.
</details>

<details>
<summary><b>Build Android</b></summary>

```bash
npm run cap:add:android   # só na primeira vez
npm run cap:assets        # gera ícone/splash (claro + escuro) a partir de resources/
npm run cap:sync
npm run cap:open:android  # abre o Android Studio
```
</details>

<details>
<summary><b>Build iOS</b></summary>

Requer um Mac com Xcode.
```bash
npm run cap:add:ios
npm run cap:sync
npm run cap:open:ios
```
</details>

## 📁 Estrutura

```
src/                    código React — única fonte de verdade
├── App.tsx             aplicação principal
├── i18n.ts             sistema de tradução (pt-BR/en/es)
└── currency.ts          formatação/moeda (BRL/USD/EUR/GBP)
electron/               processo principal + preload do Electron
capacitor.config.ts     identidade e config do app mobile
resources/              artes-fonte pro ícone/splash nativo
scripts/                utilitários de build (correção de bug de ícone)
```

## 📜 Licença

Uso restrito — ver [LICENSE](./LICENSE). Código público para fins de avaliação
técnica e portfólio; uso, cópia ou redistribuição comercial não são permitidos sem
autorização.

## 👤 Autor

Desenvolvido por **Bruno Lorran Sanches do Vale** —
[CROOMA Design Studio](https://croomastudio.com) — Rio de Janeiro, Brasil.
