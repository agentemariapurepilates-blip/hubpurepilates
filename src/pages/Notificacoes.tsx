import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, User, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Notification {
  id: string;
  user_id: string;
  demand_id: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_by: string;
  created_at: string;
  demand?: {
    title: string;
  };
  creator_profile?: {
    full_name: string | null;
  };
}

const Notificacoes = () => {
  const { user, isColaborador, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-colaboradores
  useEffect(() => {
    if (user && !isColaborador && !isAdmin) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Apenas colaboradores podem acessar esta área.",
        variant: "destructive"
      });
    }
  }, [user, isColaborador, isAdmin, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data: notificationsData, error } = await supabase
        .from('demand_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch demand titles
      const demandIds = [...new Set(notificationsData?.map(n => n.demand_id) || [])];
      const { data: demands } = await supabase
        .from('demands')
        .select('id, title')
        .in('id', demandIds);

      // Fetch creator profiles
      const creatorIds = [...new Set(notificationsData?.map(n => n.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', creatorIds);

      const notificationsWithData = notificationsData?.map(n => ({
        ...n,
        demand: demands?.find(d => d.id === n.demand_id),
        creator_profile: profiles?.find(p => p.user_id === n.created_by)
      })) as Notification[];

      setNotifications(notificationsWithData || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('demand_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('demand_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas."
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    navigate('/pedidos-demanda');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isColaborador && !isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Notificações</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    notification.notification_type === 'mention' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {notification.notification_type === 'mention' ? (
                      <AtSign className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                      {notification.message}
                    </p>
                    {notification.demand && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Demanda: {notification.demand.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNowStrict(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notificacoes;
