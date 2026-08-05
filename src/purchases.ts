// ---- Compras (versão Pro, remove anúncios) ----
// Usa o RevenueCat, que cuida da parte chata (validar a compra de verdade junto ao
// Google/Apple) sem a gente precisar de um servidor próprio — importante aqui porque
// o Simple Finance não tem backend nenhum.

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// TODO: troque pela sua chave pública do RevenueCat (Project Settings → API Keys →
// Public app-specific key para Android). É diferente da chave "secret" — essa aqui é
// segura de deixar no código do app.
const REVENUECAT_API_KEY_ANDROID = 'SUA_CHAVE_PUBLICA_REVENUECAT_AQUI';

// Precisa bater com o "Entitlement identifier" que você criar no painel do RevenueCat
const ENTITLEMENT_SEM_ANUNCIOS = 'sem_anuncios';

let inicializado = false;

export async function inicializarCompras(): Promise<void> {
  if (!Capacitor.isNativePlatform() || inicializado) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
    inicializado = true;
  } catch (e) {
    console.warn('RevenueCat não pôde ser inicializado:', e);
  }
}

// Verifica se a pessoa já comprou a versão sem anúncios (inclusive em outro momento,
// mesmo depois de reinstalar o app — a checagem é pela conta do Google, não pelo
// aparelho).
export async function temVersaoSemAnuncios(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await inicializarCompras();
    const info = await Purchases.getCustomerInfo();
    if (info.customerInfo.entitlements.active[ENTITLEMENT_SEM_ANUNCIOS]) return true;

    // Instalação nova gera um ID anônimo novo no RevenueCat, que ainda não sabe da
    // compra — restorePurchases() consulta a conta Google Play de verdade (sem
    // mostrar nenhuma tela pro usuário) e vincula a compra a esse ID, se existir.
    const restaurado = await Purchases.restorePurchases();
    return !!restaurado.customerInfo.entitlements.active[ENTITLEMENT_SEM_ANUNCIOS];
  } catch {
    return false;
  }
}

// Busca as ofertas configuradas no RevenueCat e compra o pacote "sem anúncios".
// Devolve true se a compra foi concluída com sucesso.
export async function comprarSemAnuncios(): Promise<{ sucesso: boolean; mensagem?: string }> {
  if (!Capacitor.isNativePlatform()) return { sucesso: false, mensagem: 'Só funciona no app instalado.' };
  try {
    await inicializarCompras();
    const offerings = await Purchases.getOfferings();
    const pacote = offerings.current?.availablePackages[0];
    if (!pacote) {
      return { sucesso: false, mensagem: 'Oferta não configurada ainda no RevenueCat.' };
    }
    const resultado = await Purchases.purchasePackage({ aPackage: pacote });
    const liberado = !!resultado.customerInfo.entitlements.active[ENTITLEMENT_SEM_ANUNCIOS];
    return { sucesso: liberado };
  } catch (e: any) {
    if (e?.userCancelled) return { sucesso: false };
    return { sucesso: false, mensagem: e?.message || 'Não foi possível completar a compra.' };
  }
}

// Pra quem trocou de aparelho ou reinstalou o app — restaura a compra sem cobrar de novo
export async function restaurarCompras(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await inicializarCompras();
    const info = await Purchases.restorePurchases();
    return !!info.customerInfo.entitlements.active[ENTITLEMENT_SEM_ANUNCIOS];
  } catch {
    return false;
  }
}
