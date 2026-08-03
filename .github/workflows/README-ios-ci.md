# Build iOS via GitHub Actions

## Estado atual: valida o build (Estágio 1)

O workflow `.github/workflows/ios-build.yml` roda automaticamente a cada push na
`main` (ou manualmente, na aba **Actions** do GitHub → **Build iOS** →
**Run workflow**). Ele:

1. Sobe um runner macOS na nuvem (grátis até um limite de minutos/mês do GitHub)
2. Instala as dependências e builda o app web
3. Adiciona/sincroniza a plataforma iOS via Capacitor
4. Compila para o **Simulador iOS**, sem assinatura de código
5. Guarda o `.app` resultante como artefato baixável na própria página da execução

**O que isso já garante:** qualquer erro de build específico do iOS (algo que só
quebra nessa plataforma, não no Android/Windows) aparece no log do GitHub, sem
precisar de Mac nenhum.

**O que isso ainda não faz:** instalar no seu iPhone. Um `.app` de simulador não
roda em hardware real — a Apple exige assinatura de código pra qualquer instalação
em iPhone físico, mesmo só pra teste pessoal seu.

## Estágio 2 — quando você tiver a Apple Developer Program (US$99/ano)

Nesse ponto o workflow precisa ganhar mais alguns passos:

1. **Certificado de distribuição** (arquivo `.p12`) e **perfil de provisionamento**
   (`.mobileprovision`), gerados no [Apple Developer Portal](https://developer.apple.com/account).
2. Esses arquivos (convertidos em base64) e a senha do certificado viram
   **GitHub Secrets** do repositório (`Settings` → `Secrets and variables` →
   `Actions`) — nunca ficam no código, só guardados de forma criptografada pelo
   GitHub.
3. O workflow passa a: importar o certificado num keychain temporário no runner,
   compilar com `CODE_SIGNING_ALLOWED=YES` referenciando o perfil de
   provisionamento, gerar o `.ipa` assinado.
4. Um passo final envia esse `.ipa` pro **TestFlight** automaticamente (via
   `xcrun altool` ou a action `apple-actions/upload-testflight-build`), usando uma
   **API Key do App Store Connect** (outro segredo).
5. Daí você recebe o build no app TestFlight do seu próprio iPhone, sem precisar
   de cabo nem Mac — só abrir o TestFlight e instalar.

**Quando chegar nessa etapa, me chama de novo** — como isso depende dos seus
certificados reais (que eu não tenho como gerar nem testar por aqui), vamos montar
esses passos juntos, com você me passando os nomes/valores que a Apple gerar, pra
eu ajustar o workflow com precisão em vez de eu chutar um formato que pode não
bater com a versão exata das ferramentas na hora.

## Se o workflow atual (Estágio 1) der erro

Esse é o tipo de coisa que eu não consigo testar por aqui (não tenho acesso a um
runner macOS real) — é bem possível que precise de pequenos ajustes na primeira
tentativa (nome exato do scheme do Xcode, versão do CocoaPods, etc). Se der erro,
copia o log da aba **Actions** do GitHub e me manda — a gente ajusta junto.
