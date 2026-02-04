import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserType = 'colaborador' | 'franqueado';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  isColaborador: boolean;
  userType: UserType | null;
  isApproved: boolean;
  isPending: boolean;
  requestedUserType: UserType | null;
  signUp: (email: string, password: string, fullName: string, requestedType: UserType) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshApprovalStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [requestedUserType, setRequestedUserType] = useState<UserType | null>(null);

  // Colaborador = pode criar conteúdo. Admin também é considerado colaborador.
  const isColaborador = userType === 'colaborador' || isAdmin;
  
  // Loading completo inclui carregamento do perfil
  const isFullyLoaded = !loading && !profileLoading;
  
  // Usuário está logado mas aguardando aprovação
  const isPending = !!user && !isApproved && isFullyLoaded;

  const checkUserRoleAndType = async (userId: string) => {
    setProfileLoading(true);
    try {
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      // Check user type and approval status from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type, is_approved, requested_user_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setIsApproved(profileData.is_approved ?? false);
        setRequestedUserType(profileData.requested_user_type as UserType | null);
        
        if (profileData.user_type) {
          setUserType(profileData.user_type as UserType);
        } else {
          setUserType('colaborador');
        }
      } else {
        setIsApproved(false);
        setUserType('colaborador');
      }
    } catch {
      setIsAdmin(false);
      setUserType('colaborador');
      setIsApproved(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshApprovalStatus = async () => {
    if (user) {
      await checkUserRoleAndType(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRoleAndType(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserType(null);
          setIsApproved(false);
          setRequestedUserType(null);
          setProfileLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkUserRoleAndType(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validatePureEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@purepilates.com.br');
  };

  const signUp = async (email: string, password: string, fullName: string, requestedType: UserType) => {
    if (!validatePureEmail(email)) {
      return { error: new Error('Somente emails @purepilates.com.br são permitidos') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: new Error('Este email já está cadastrado') };
      }
      return { error };
    }

    // Update the profile with the requested user type (is_approved defaults to false)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ 
          requested_user_type: requestedType,
          is_approved: false
        })
        .eq('user_id', data.user.id);
    }

    toast.success('Cadastro realizado! Aguarde aprovação do administrador.');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    if (!validatePureEmail(email)) {
      return { error: new Error('Somente emails @purepilates.com.br são permitidos') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: new Error('Email ou senha incorretos') };
      }
      return { error };
    }

    toast.success('Login realizado com sucesso!');
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserType(null);
    setIsApproved(false);
    setRequestedUserType(null);
    toast.success('Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      profileLoading,
      isAdmin, 
      isColaborador, 
      userType, 
      isApproved,
      isPending,
      requestedUserType,
      signUp, 
      signIn, 
      signOut,
      refreshApprovalStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};