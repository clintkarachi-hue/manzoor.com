import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export function InstallPWA({ className = '' }: { className?: string }) {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log('PWA install prompt ready');
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check if already installed to not show it unnecessarily
    window.addEventListener('appinstalled', () => {
      setSupportsPWA(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const onClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;

    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setSupportsPWA(false);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  // If the browser doesn't support PWA install or it's already installed
  if (!supportsPWA) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-lg ${className}`}
    >
      <Download size={18} />
      <span>Install App</span>
    </button>
  );
}
