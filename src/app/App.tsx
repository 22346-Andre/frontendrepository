import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/auth-context';
import { AccessibilityProvider } from './contexts/accessibility-context';
import { ThemeProvider } from './contexts/theme-context';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  useEffect(() => {
    const scriptId = 'vlibras-script';
    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        if ((window as any).VLibras) {
          new (window as any).VLibras.Widget('https://vlibras.gov.br/app');
        }
      };
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId="276032801929-jtq3aoqitk13pve6kegqpl55ej8sh4mb.apps.googleusercontent.com">
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
            
            {/* 🟢 O truque final: Usamos o spread {...} com "as any" para o TypeScript ignorar o erro,
                mas o React vai renderizar no HTML exatamente o "vw" que o governo exige. */}
            <div {...{ vw: "true" } as any} className="enabled">
              <div {...{ "vw-access-button": "true" } as any} className="active"></div>
              <div {...{ "vw-plugin-wrapper": "true" } as any}>
                <div className="vw-plugin-top-wrapper"></div>
              </div>
            </div>
            
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}