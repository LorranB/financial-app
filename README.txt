# Controle Financeiro – Desktop (Electron)

Este pacote já está pronto para gerar o instalador `.exe` no Windows.

## Requisitos
- Windows 10/11
- **Node.js** (recomendado LTS). Se não tiver, o script vai te orientar.

## Como gerar o EXE (passo a passo simples)
1. Extraia o ZIP em alguma pasta (ex.: `C:\ControleFinanceiro`).
2. Clique duas vezes em **scripts\\Build_EXE.bat**.
   - Ele vai: instalar dependências, gerar o build e empacotar com o electron-builder.
3. Ao finalizar, o instalador estará em **release\\ControleFinanceiro-Setup-1.0.0.exe**.
4. Execute o instalador e use o app normalmente.

## Atalhos úteis
- **scripts\\Run_Dev.bat**: abre a versão de desenvolvimento (navegador ou janela Electron) para testar antes de empacotar.

---

Se quiser apenas abrir no navegador sem instalar, rode:
```
npm install
npm run dev
```
e acesse o endereço que o Vite mostrar.