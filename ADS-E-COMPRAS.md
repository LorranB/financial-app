# Anúncios (AdMob) + Versão Pro (RevenueCat) — configuração

Já está tudo implementado no código, funcionando com **IDs de teste** (mostra
anúncio de exemplo, não gera receita, não arrisca sua conta ser suspensa enquanto
você mesmo testa). Faltam só passos externos — contas e configuração que só você
pode fazer, com seus próprios dados.

## 1. AdMob (anúncios)

1. Cria uma conta grátis em [admob.google.com](https://admob.google.com) (usa a
   mesma conta Google do Play Console, se quiser)
2. Cadastra o app (`Apps` → `Adicionar app` → Android → não publicado ainda, tudo
   bem, o AdMob aceita isso)
3. Cria **dois blocos de anúncio**: um do tipo **Banner**, outro do tipo
   **Intersticial**
4. Copia os 3 IDs gerados (App ID, ID do banner, ID do intersticial) e cola em
   `src/ads.ts`, no objeto `PROD_IDS`
5. Troca `USE_TEST_ADS` de `true` para `false` no mesmo arquivo (só faça isso
   quando for testar/publicar de verdade — deixando `true`, o app sempre mostra o
   anúncio de exemplo, mesmo com os IDs reais preenchidos)

**Passo nativo obrigatório** — o Android exige o App ID também dentro do
`AndroidManifest.xml` (o `src/ads.ts` sozinho não é suficiente). Abre
`android/app/src/main/AndroidManifest.xml` e adiciona isso dentro da tag
`<application>` (em qualquer lugar dentro dela):

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="SEU_APP_ID_ADMOB_AQUI"/>
```

Sem isso, o app **crasha ao abrir** em produção (com `USE_TEST_ADS = false`) —
com o ID de teste, funciona sem essa tag também, mas já deixa configurado com o ID
real desde já pra não esquecer depois.

## 2. RevenueCat (versão Pro / remover anúncios)

1. Cria uma conta grátis em [app.revenuecat.com](https://app.revenuecat.com)
   (grátis até uma faixa alta de receita — não vai pagar nada nesse estágio)
2. Cria um projeto novo, adiciona o app Android (usa o mesmo `applicationId`:
   `com.croomastudio.simplefinance`)
3. Em `Project Settings → API Keys`, copia a **chave pública** (não a secreta) e
   cola em `src/purchases.ts`, na constante `REVENUECAT_API_KEY_ANDROID`
4. No **Google Play Console** (precisa do app já em pelo menos teste interno):
   `Monetizar → Produtos → Produtos no app` → cria um produto do tipo **produto
   único** (não assinatura), com o preço que você quiser (ex: R$5,00), e um ID
   tipo `remover_anuncios`
5. De volta no RevenueCat: `Products` → importa esse produto do Play Console →
   cria um **Entitlement** chamado exatamente `sem_anuncios` (tem que bater com a
   constante `ENTITLEMENT_SEM_ANUNCIOS` em `src/purchases.ts`) → associa o produto
   a esse entitlement
6. Cria uma **Offering** (`Offerings` → `+ New`) com esse produto dentro — é o que
   o app busca via `Purchases.getOfferings()` pra saber o que oferecer pra compra

## Testando antes de publicar

- **Anúncios**: funcionam desde já com `USE_TEST_ADS = true`, sem precisar de
  nenhuma conta configurada — já dá pra ver o banner e o intersticial de exemplo
  rodando no app.
- **Compra Pro**: só funciona de verdade com o app instalado **via Google Play**
  (mesmo que seja só o canal de teste interno) — instalação direta por APK/Android
  Studio não consegue processar compras reais. Pra testar sem gastar dinheiro de
  verdade, adiciona sua própria conta Google como "testador de licença" em
  `Play Console → Configurações → Testes de licença`.

## Onde cada coisa está no código

| Arquivo | O que faz |
|---|---|
| `src/ads.ts` | IDs do AdMob (teste/produção) e a regra de frequência do intersticial |
| `src/purchases.ts` | Integração com RevenueCat: checar, comprar e restaurar a versão sem anúncios |
| `src/App.tsx` | Inicializa os dois na abertura do app; banner só aparece se `!isPro`; opção de compra fica no menu (≡) |
| `android/app/src/main/AndroidManifest.xml` | Precisa do `meta-data` do App ID do AdMob (passo manual, ver acima) |
