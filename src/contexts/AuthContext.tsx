import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserType = 'colaborador' | 'franqueado';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isColaborador: boolean;
  userType: UserType | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Colaborador = pode criar conteúdo. Admin também é considerado colaborador.
  const isColaborador = userType === 'colaborador' || isAdmin;

  const checkUserRoleAndType = async (userId: string) => {
    try {
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      // Check user type from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData?.user_type) {
        setUserType(profileData.user_type as UserType);
      } else {
        setUserType('colaborador'); // Default
      }
    } catch {
      setIsAdmin(false);
      setUserType('colaborador');
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

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!validatePureEmail(email)) {
      return { error: new Error('Somente emails @purepilates.com.br são permitidos') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
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

    toast.success('Conta criada com sucesso!');
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
    toast.success('Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isColaborador, userType, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
