import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Video, FileText, Users } from 'lucide-react';

const profileTypes = [
  { value: 'colaborador', label: 'Colaborador', icon: Users },
  { value: 'professor', label: 'Professor', icon: GraduationCap },
  { value: 'franqueado', label: 'Franqueado', icon: FileText },
];

const Onboarding = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('onboarding_content')
        .select('*')
        .order('step_order');
      setContent(data || []);
      setLoading(false);
    };
    fetchContent();
  }, []);

  const getContentByProfile = (profileType: string) => 
    content.filter((c) => c.profile_type === profileType);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold">Onboarding</h1>
          <p className="text-muted-foreground">Trilhas de integração para novos membros</p>
        </div>

        <Tabs defaultValue="colaborador" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {profileTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="gap-2">
                <type.icon className="h-4 w-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {profileTypes.map((type) => (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : getContentByProfile(type.value).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Conteúdo em breve</p>
              ) : (
                getContentByProfile(type.value).map((item, index) => (
                  <Card key={item.id} className="card-pure">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      {item.content && <p>{item.content}</p>}
                      {item.video_url && (
                        <div className="mt-4 flex items-center gap-2 text-primary">
                          <Video className="h-4 w-4" />
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                            Assistir vídeo
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Onboarding;
