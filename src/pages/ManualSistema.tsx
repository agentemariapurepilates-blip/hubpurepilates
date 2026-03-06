import MainLayout from '@/components/layout/MainLayout';

const ManualSistema = () => {
  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 -mt-4 sm:-mt-6 lg:-mt-8" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <iframe
          src="https://manualfranqueado.lovable.app/"
          className="w-full h-full border-0"
          title="Manual do Sistema Pure Pilates"
          allow="fullscreen"
          onLoad={(e) => {
            try {
              const iframe = e.target as HTMLIFrameElement;
              const doc = iframe.contentDocument;
              if (doc) {
                const style = doc.createElement('style');
                style.textContent = `
                  nav, header { display: none !important; }
                  main, [role="main"], #root > div > div:not(nav):not(header) {
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                  }
                `;
                doc.head.appendChild(style);
              }
            } catch (err) {
              // Cross-origin iframe - can't modify
            }
          }}
        />
      </div>
    </MainLayout>
  );
};

export default ManualSistema;
