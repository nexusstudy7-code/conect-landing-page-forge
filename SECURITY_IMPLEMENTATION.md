# Guia de Implementação de Segurança - Connect

## 🔐 Implementação de Autenticação Segura com Supabase

### Passo 1: Configurar Supabase Auth

```typescript
// src/lib/supabase/auth.ts
import { supabase } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

/**
 * Realiza login seguro usando Supabase Auth
 * @param credentials - Email e senha do usuário
 * @returns Session data ou erro
 */
export const secureLogin = async ({ email, password }: LoginCredentials) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log de auditoria (implementar backend logging)
      console.error('[AUTH] Login failed:', {
        timestamp: new Date().toISOString(),
        email,
        error: error.message,
      });
      
      throw error;
    }

    // Log de sucesso
    console.log('[AUTH] Login successful:', {
      timestamp: new Date().toISOString(),
      userId: data.user?.id,
    });

    return data;
  } catch (error) {
    throw {
      message: 'Credenciais inválidas. Por favor, tente novamente.',
      code: 'AUTH_ERROR',
    } as AuthError;
  }
};

/**
 * Realiza logout seguro
 */
export const secureLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Limpar dados locais
    localStorage.removeItem('isAuthenticated');
    
    console.log('[AUTH] Logout successful');
  } catch (error) {
    console.error('[AUTH] Logout failed:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário está autenticado
 */
export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return {
      isAuthenticated: !!session,
      user: session?.user || null,
      session,
    };
  } catch (error) {
    console.error('[AUTH] Session check failed:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }
};

/**
 * Atualiza a senha do usuário
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    console.log('[AUTH] Password updated successfully');
  } catch (error) {
    console.error('[AUTH] Password update failed:', error);
    throw error;
  }
};
```

---

### Passo 2: Atualizar LoginPage.tsx

```typescript
// src/pages/LoginPage.tsx (versão segura)
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Plug, AlertCircle } from 'lucide-react';
import logo from '@/assets/connect-logo.jpg';
import { TRANSITIONS, DURATION, EASING } from '@/lib/animations';
import { secureLogin } from '@/lib/supabase/auth';

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Rate limiting simples (client-side)
        if (attemptCount >= 5) {
            setError('Muitas tentativas. Por favor, aguarde alguns minutos.');
            setIsLoading(false);
            return;
        }

        try {
            const { session } = await secureLogin({
                email: formData.email,
                password: formData.password,
            });

            if (session) {
                // Autenticação bem-sucedida
                navigate('/admin');
            }
        } catch (err: any) {
            setAttemptCount(prev => prev + 1);
            setError(err.message || 'Erro ao fazer login. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    return (
        <div className="min-h-dvh bg-background text-foreground flex items-center justify-center relative overflow-x-hidden px-6 py-8">
            {/* ... decorações de fundo ... */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.slow, ease: EASING.premium }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo e Título */}
                <div className="text-center mb-12">
                    {/* ... logo ... */}
                    <h1 className="font-display text-4xl md:text-5xl mb-3">
                        Área Administrativa
                    </h1>
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                        <Plug size={14} />
                        Acesso Restrito
                    </p>
                </div>

                {/* Formulário de Login */}
                <form onSubmit={handleSubmit} className="bg-card border border-foreground/10 p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px energy-line" />

                    <div className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-foreground/10 pl-12 pr-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label htmlFor="password" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-foreground/10 pl-12 pr-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {/* Mensagem de Erro */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-500 text-sm flex items-center gap-2"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        {/* Botão de Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || attemptCount >= 5}
                            className="group w-full inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 text-sm uppercase tracking-wider font-medium hover:bg-foreground/90 transition-colors duration-fast ease-premium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <Plug size={18} className="opacity-60" />
                                    Acessar Painel
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Voltar para o site */}
                <div className="text-center mt-8">
                    <a
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                        ← Voltar para o site
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
```

---

### Passo 3: Proteger Rotas com Auth Guard

```typescript
// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAuth } from '@/lib/supabase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const { isAuthenticated } = await checkAuth();
      setIsAuthenticated(isAuthenticated);
    };

    verifyAuth();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

### Passo 4: Configurar RLS (Row Level Security) no Supabase

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Política: Apenas usuários autenticados podem ler
CREATE POLICY "Authenticated users can read bookings"
ON bookings FOR SELECT
TO authenticated
USING (true);

-- Política: Apenas usuários autenticados podem inserir
CREATE POLICY "Authenticated users can insert bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update bookings"
ON bookings FOR UPDATE
TO authenticated
USING (true);

-- Política: Apenas usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete bookings"
ON bookings FOR DELETE
TO authenticated
USING (true);

-- Repetir para a tabela feedback
CREATE POLICY "Authenticated users can read feedback"
ON feedback FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert feedback"
ON feedback FOR INSERT
TO authenticated
WITH CHECK (true);
```

---

### Passo 5: Implementar Rate Limiting (Backend)

```typescript
// src/lib/supabase/rateLimiter.ts
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (identifier: string, config: RateLimitConfig): boolean => {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt || now > attempt.resetAt) {
    // Nova janela de tempo
    loginAttempts.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  if (attempt.count >= config.maxAttempts) {
    return false; // Rate limit excedido
  }

  // Incrementar contador
  attempt.count++;
  return true;
};

export const resetRateLimit = (identifier: string): void => {
  loginAttempts.delete(identifier);
};
```

---

## 🔒 Checklist de Segurança

### Implementação Imediata
- [x] Remover credenciais expostas do frontend
- [ ] Implementar Supabase Auth
- [ ] Adicionar validação de email
- [ ] Implementar rate limiting
- [ ] Configurar RLS no Supabase

### Curto Prazo (1-2 semanas)
- [ ] Adicionar logs de auditoria
- [ ] Implementar recuperação de senha
- [ ] Adicionar CAPTCHA após múltiplas falhas
- [ ] Configurar HTTPS enforcement
- [ ] Implementar timeout de sessão

### Médio Prazo (1 mês)
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Adicionar política de senhas fortes
- [ ] Implementar detecção de anomalias
- [ ] Configurar alertas de segurança
- [ ] Realizar teste de penetração

---

## 📚 Recursos Adicionais

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Última atualização:** 2026-01-12  
**Versão:** 1.0
