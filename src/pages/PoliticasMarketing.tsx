import MainLayout from '@/components/layout/MainLayout';

const PoliticasMarketing = () => {
  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-3.5rem)] lg:h-screen">
        <iframe
          src="/politicas-marketing-2026.html"
          title="Políticas de Marketing"
          className="w-full h-full border-0"
        />
      </div>
    </MainLayout>
  );
};

export default PoliticasMarketing;
