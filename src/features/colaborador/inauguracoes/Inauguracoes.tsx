import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { NovaInauguracaoForm } from './components/NovaInauguracaoForm';
import { ListaInauguracoes } from './components/ListaInauguracoes';

type Aba = 'nova' | 'solicitacoes';

/**
 * Tela de Inaugurações: reúne o formulário de nova solicitação e a lista das
 * já feitas em duas abas. Controlado (não `defaultValue`) porque, ao salvar
 * o formulário, a tela precisa trocar de aba sozinha — com `defaultValue` a
 * troca por código é ignorada silenciosamente.
 */
const Inauguracoes = () => {
  const { isAdmin } = useAuth();
  const [aba, setAba] = useState<Aba>('nova');

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-2 sm:px-4 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inaugurações</h1>
          <p className="text-sm text-muted-foreground">
            Avise o marketing sobre a inauguração de uma nova unidade e acompanhe as solicitações
            já feitas.
          </p>
        </div>

        <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nova">Nova solicitação</TabsTrigger>
            <TabsTrigger value="solicitacoes">
              {isAdmin ? 'Todas as solicitações' : 'Minhas solicitações'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nova">
            <NovaInauguracaoForm aoSalvar={() => setAba('solicitacoes')} />
          </TabsContent>

          <TabsContent value="solicitacoes">
            <ListaInauguracoes aoIrParaNova={() => setAba('nova')} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Inauguracoes;
