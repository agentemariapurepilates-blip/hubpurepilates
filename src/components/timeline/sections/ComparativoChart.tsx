import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SectionTitle } from '../shared';

const janVsFevData = [
  { name: 'Meta Aula', janeiro: 9599, fevereiro: 8189 },
  { name: 'Realizado Aula', janeiro: 11547, fevereiro: 7548 },
  { name: 'Presença', janeiro: 8061, fevereiro: 5624 },
  { name: 'Matrículas', janeiro: 1619, fevereiro: 1439 },
];

const ComparativoChart = () => (
  <AnimatedSection>
    <Card>
      <CardContent className="pt-6">
        <SectionTitle className="mb-6">Comparativo Jan × Fev</SectionTitle>
        <div style={{ width: '100%', minHeight: 288 }}>
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={janVsFevData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="janeiro" name="Janeiro" fill="hsl(350 72% 45%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
              <Bar dataKey="fevereiro" name="Fevereiro" fill="hsl(350 72% 70%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </AnimatedSection>
);

export default ComparativoChart;
