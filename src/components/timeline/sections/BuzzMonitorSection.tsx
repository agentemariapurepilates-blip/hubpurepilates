import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import { Shield } from 'lucide-react';
import { SectionTitle } from '../shared';

const buzzJanData = [
  { name: 'Positivas', value: 41.27 },
  { name: 'Neutras', value: 55.65 },
  { name: 'Negativas', value: 3.08 },
];

const buzzFevData = [
  { name: 'Positivas', value: 36.5 },
  { name: 'Neutras', value: 60.79 },
  { name: 'Negativas', value: 2.71 },
];

const PIE_COLORS = ['hsl(350 72% 45%)', 'hsl(0 0% 60%)', 'hsl(0 0% 85%)'];

const BuzzMonitorSection = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <Shield className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Buzz Monitor — Saúde de Marca
      </SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Janeiro */}
      <AnimatedSection variant="fade-left">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold text-lg mb-1">Janeiro</h4>
            <p className="text-xs text-muted-foreground mb-4">
              41,27% positivas · 55,65% neutras · 3,08% negativas
            </p>
            <div style={{ width: '100%', minHeight: 192 }}>
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie data={buzzJanData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                    {buzzJanData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground mt-3 leading-relaxed space-y-2">
              <p><strong>Menções positivas</strong> reforçam:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Experiência acolhedora nas unidades</li>
                <li>Melhora na postura e fortalecimento</li>
                <li>Bem-estar físico e emocional</li>
                <li>Senso de comunidade entre alunos</li>
                <li>Engajamento com desafios semanais</li>
              </ul>
              <p className="mt-2">
                <strong>Conversas sobre preços e planos</strong> aumentaram, com menções a Gympass e audiência investigativa buscando comparativos entre modalidades e condições de pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Fevereiro */}
      <AnimatedSection variant="fade-right">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold text-lg mb-1">Fevereiro</h4>
            <p className="text-xs text-muted-foreground mb-4">
              36,5% positivas · 60,79% neutras · 2,71% negativas
            </p>
            <div style={{ width: '100%', minHeight: 192 }}>
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie data={buzzFevData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                    {buzzFevData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground mt-3 leading-relaxed space-y-2">
              <p>Aumento nas <strong>interações neutras</strong>, refletindo buscas por informações práticas:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Valores, planos e condições de pagamento</li>
                <li>Localização de unidades próximas</li>
                <li>Gympass e TotalPass — dúvidas frequentes</li>
              </ul>
              <p className="mt-2">
                <strong>Menções positivas</strong> destacam benefícios físicos e emocionais. Os desafios semanais continuam como principal vetor de engajamento orgânico.
              </p>
              <p className="mt-2">
                <strong>Menções negativas (2,71%)</strong> concentram-se em falta de clareza sobre horários e tempo de resposta no atendimento. O cenário geral é de uma comunidade ativa, porém mais analítica e sensível a preço.
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  </>
);

export default BuzzMonitorSection;
