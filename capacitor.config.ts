import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // MESMO appId deve ser usado em Android, iOS e (se quiser) como appId do Electron.
  // Depois de definido e publicado numa loja, evite trocar — é a identidade do app.
  appId: 'com.croomastudio.simplefinance',
  appName: 'Simple Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  // Valor inicial da barra de status (antes do JS carregar e assumir o controle
  // dinâmico conforme claro/escuro — ver useEffect em App.tsx). Combina com o tema
  // claro, que é o padrão do app ao abrir.
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#f7fbff',
    },
  },
};

export default config;
