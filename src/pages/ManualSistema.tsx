import MainLayout from '@/components/layout/MainLayout';

const ManualSistema = () => {
  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8" style={{ height: 'calc(100vh - 7rem)' }}>
        <iframe
          src="https://manualfranqueado.lovable.app/"
          className="w-full h-full border-0 rounded-lg"
          title="Manual do Sistema Pure Pilates"
          allow="fullscreen"
        />
      </div>
    </MainLayout>
  );
};

export default ManualSistema;
