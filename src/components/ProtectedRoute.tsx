import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session || session.user.email !== 'admin@connect.com') {
                navigate('/login');
            }
            setLoading(false);
        });

        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session || session.user.email !== 'admin@connect.com') {
                navigate('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground"></div>
            </div>
        );
    }

    return <>{children}</>;
}
