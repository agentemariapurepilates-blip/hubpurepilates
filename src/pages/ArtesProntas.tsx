import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Palette, Sparkles } from 'lucide-react';
import { useState } from 'react';

import datasImportantes from '@/assets/artes/datas-importantes.png';
import feriados from '@/assets/artes/feriados.png';
import a5Informativos from '@/assets/artes/a5-informativos.png';
import aniversarioCidades from '@/assets/artes/aniversario-cidades.png';
import postagensDescontraidas from '@/assets/artes/postagens-descontraidas.png';
import nossoEndereco from '@/assets/artes/nosso-endereco.png';
import depoimentosClientes from '@/assets/artes/depoimentos-clientes.png';
import anuncioVagas from '@/assets/artes/anuncio-vagas.png';

interface Arte {
  id: string;
  name: string;
  image: string;
  canvaUrl: string;
}

const artes: Arte[] = [
  {
    id: '1',
    name: 'Datas Importantes',
    image: datasImportantes,
    canvaUrl: 'https://www.canva.com/design/DAG5EsPKROU/lhPPGffKR4f9OhpVSxJsCA/view?utm_content=DAG5EsPKROU&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
  },
  {
    id: '2',
    name: 'Feriados',
    image: feriados,
    canvaUrl: 'https://www.canva.com/design/DAG5FW1GAKs/HCgNP1YfYU93JyPcUQk6Wg/view?utm_content=DAG5FW1GAKs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
  },
  {
    id: '3',
    name: 'A5 para Informativos',
    image: a5Informativos,
    canvaUrl: 'https://www.canva.com/design/DAGT7S7HNyQ/4ahehqleIfxkq9NnNVVSNQ/view?utm_content=DAGT7S7HNyQ&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
  },
  {
    id: '4',
    name: 'Feriado Cidades',
    image: aniversarioCidades,
    canvaUrl: 'https://www.canva.com/design/DAG5GKH5oOs/aophxGttJFdqVpN1fCAxBw/view?utm_content=DAG5GKH5oOs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
  },
  {
    id: '5',
    name: 'Aniversário Cidades',
    image: aniversarioCidades,
    canvaUrl: 'https://www.canva.com/design/DAG5GKH5oOs/aophxGttJFdqVpN1fCAxBw/view?utm_content=DAG5GKH5oOs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
  },
  {
    id: '6',
    name: 'Postagens Descontraídas',
    image: postagensDescontraidas,
    canvaUrl: 'https://www.canva.com/design/DAGqoCWlk3o/GSi7MmjaQXF3kKeVAr86pA/edit',
  },
  {
    id: '7',
    name: 'Nosso Endereço',
    image: nossoEndereco,
    canvaUrl: 'https://www.canva.com/design/DAGqt7UPcFg/OVnTPMFPUhPvQdd95GztaQ/view?utm_content=DAGqt7UPcFg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h422cd60ee5',
  },
  {
    id: '8',
    name: 'Depoimentos de Clientes',
    image: depoimentosClientes,
    canvaUrl: 'https://www.canva.com/design/DAGqt1TQ59g/jnsKIaAtCITKH6nyg2Wz5g/edit',
  },
  {
    id: '9',
    name: 'Anúncio de Vaga para Instrutores',
    image: anuncioVagas,
    canvaUrl: 'https://www.canva.com/design/DAGT7XJqLGo/ZfoClOHcuGxafoOmC-WjXQ/edit',
  },
];

const ArtesProntas = () => {
  const [selectedArte, setSelectedArte] = useState<Arte | null>(null);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Quer deixar seu feed ainda mais completo?
            </h1>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Lembre-se que temos um enxoval de artes editáveis prontas para você usar! 
              Basta logar na sua conta pessoal e criar uma cópia do modelo que deseja editar.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artes.map((arte) => (
            <Card
              key={arte.id}
              className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/30"
              onClick={() => setSelectedArte(arte)}
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={arte.image}
                  alt={arte.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Clique para acessar</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {arte.name}
                </h3>
              </div>
            </Card>
          ))}
        </div>

        {/* Dialog */}
        <Dialog open={!!selectedArte} onOpenChange={() => setSelectedArte(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                {selectedArte?.name}
              </DialogTitle>
              <DialogDescription>
                Acesse o modelo no Canva para criar sua própria versão personalizada.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-muted">
                <img
                  src={selectedArte?.image}
                  alt={selectedArte?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <Button
                className="w-full gap-2"
                onClick={() => window.open(selectedArte?.canvaUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Acesse aqui o modelo do Canva
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ArtesProntas;
