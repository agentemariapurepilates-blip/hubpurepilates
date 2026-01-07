import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, Target, Users, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(350, 72%, 45%)', 'hsl(210, 70%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(280, 60%, 55%)'];

const Metricas = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase.from('metrics').select('*');
      setMetrics(data || []);
      setLoading(false);
    };
    fetchMetrics();
  }, []);

  const getMetricValue = (name: string) => 
    metrics.find((m) => m.metric_name === name)?.metric_value || 0;

  const chartData = [
    { name: 'Unidades Ativas', value: getMetricValue('unidades_ativas') },
    { name: 'Novas 2024', value: getMetricValue('unidades_novas_ano') },
  ];

  const pieData = [
    { name: 'NPS', value: getMetricValue('nps_score') },
    { name: 'Engajamento', value: getMetricValue('engajamento_franqueados') },
    { name: 'Campanhas', value: getMetricValue('performance_campanhas') },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold">Métricas</h1>
          <p className="text-muted-foreground">Indicadores gerais da Pure Pilates</p>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="card-pure">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Ativas</CardTitle>
                  <Building2 className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getMetricValue('unidades_ativas')}</div>
                </CardContent>
              </Card>

              <Card className="card-pure">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Novas Unidades</CardTitle>
                  <TrendingUp className="h-5 w-5 text-sector-academy" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getMetricValue('unidades_novas_ano')}</div>
                  <p className="text-xs text-muted-foreground">Este ano</p>
                </CardContent>
              </Card>

              <Card className="card-pure">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">NPS Score</CardTitle>
                  <Target className="h-5 w-5 text-sector-franchising" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getMetricValue('nps_score')}</div>
                </CardContent>
              </Card>

              <Card className="card-pure">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas</CardTitle>
                  <Megaphone className="h-5 w-5 text-sector-marketing" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getMetricValue('performance_campanhas')}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-pure">
                <CardHeader>
                  <CardTitle>Unidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Bar dataKey="value" fill="hsl(350, 72%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-pure">
                <CardHeader>
                  <CardTitle>Indicadores (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Metricas;
