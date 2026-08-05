// ---- Anúncios (AdMob) ----
// Só roda em Android/iOS nativo (via Capacitor) — nunca no navegador nem no Electron,
// onde o plugin nem existe. Ver o `Capacitor.isNativePlatform()` no App.tsx.

// ⚠️ Troque para `false` antes de publicar de verdade na loja — só depois de já ter
// colocado os IDs reais do seu AdMob logo abaixo. Deixar `true` em produção significa
// que os anúncios reais nunca aparecem (só o de teste).
export const USE_TEST_ADS = false;

// Aparelhos que sempre recebem anúncio de teste, MESMO usando os IDs reais abaixo —
// evita que cliques do próprio desenvolvedor/testadores internos sejam contados como
// "cliques inválidos" pelo AdMob (motivo comum de suspensão de conta). Pega esse ID no
// logcat do Android na primeira vez que abrir o app: procure por
// "Use RequestConfiguration.Builder().setTestDeviceIds(...)" — o ID aparece ali.
export const TESTING_DEVICE_IDS = ['7C7F8578F00D8CC2ACAF743EE205F133'];

// IDs de teste OFICIAIS do Google (documentados publicamente) — sempre mostram um
// anúncio de exemplo, nunca geram receita real, mas também nunca arriscam banir sua
// conta AdMob por clique inválido durante os próprios testes (usar ID de produção
// enquanto você mesmo testa é uma das formas mais comuns de conta ser suspensa).
const TEST_IDS = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

const PROD_IDS = {
  appId: 'ca-app-pub-5037515593513331~7352588393',
  banner: 'ca-app-pub-5037515593513331/9090990137',
  interstitial: 'ca-app-pub-5037515593513331/5159218057',
};

export const AD_IDS = USE_TEST_ADS ? TEST_IDS : PROD_IDS;

// O intersticial (tela cheia) só aparece a cada N aberturas do app — evita cansar
// quem usa o app várias vezes por dia. Ajuste esse número à vontade.
const INTERSTICIAL_A_CADA_N_ABERTURAS = 4;
const STORAGE_KEY_ABERTURAS = 'simple-finance-v1-contagem-aberturas';

// Chama isso uma vez por abertura do app. Devolve true só quando é "a vez" de
// mostrar o intersticial, conforme a frequência configurada acima.
export function deveMostrarIntersticial(): boolean {
  try {
    const contagem = Number(localStorage.getItem(STORAGE_KEY_ABERTURAS) || '0') + 1;
    localStorage.setItem(STORAGE_KEY_ABERTURAS, String(contagem));
    return contagem % INTERSTICIAL_A_CADA_N_ABERTURAS === 0;
  } catch {
    return false;
  }
}
