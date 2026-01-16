import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Plug, X } from 'lucide-react';
import logo from '@/assets/connect-logo.jpg';
import { TRANSITIONS, DURATION, EASING } from '@/lib/animations';
import { supabase } from '@/lib/supabase/client';

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Verificar se já está logado e redirecionar automaticamente
    useState(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user.email === 'admin@connect.com') {
                navigate('/admin');
            }
        });
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const remember = (e.target as any).remember.checked;

        try {
            // No Supabase, a persistência é por padrão. 
            // Se o usuário desmarcar, poderíamos tecnicamente limpar ao fechar o navegador,
            // mas o pedido do usuário é justamente GARANTIR que fique conectado para notificações.
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            // Redirecionar para o admin
            navigate('/admin');
        } catch (error: any) {
            setError(error.message || 'Email ou senha incorretos');
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
            {/* Background decorations */}
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] connection-circle opacity-20 animate-spin-slow hidden md:block" style={{ animationDuration: '80s' }} />
            <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] connection-circle opacity-30 animate-spin-slow hidden md:block" style={{ animationDuration: '50s', animationDirection: 'reverse' }} />

            {/* Central glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10"
                style={{
                    background: 'radial-gradient(circle, hsl(0 0% 100% / 0.1) 0%, transparent 70%)',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.slow, ease: EASING.premium }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo and Title */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: DURATION.normal, ease: EASING.premium }}
                        className="flex justify-center mb-6"
                    >
                        <div className="relative">
                            <img src={logo} alt="Connect" className="h-20 w-20 object-cover rounded-full" />
                            <div className="absolute -inset-3 rounded-full border border-foreground/10 animate-pulse" style={{ animationDuration: '3s' }} />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: DURATION.normal, delay: 0.1, ease: EASING.premium }}
                        className="font-display text-4xl md:text-5xl mb-3"
                    >
                        Área Administrativa
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: DURATION.normal, delay: 0.2, ease: EASING.premium }}
                        className="text-muted-foreground flex items-center justify-center gap-2"
                    >
                        <Plug size={14} />
                        Acesso Restrito
                    </motion.p>
                </div>

                {/* Login Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION.normal, delay: 0.3, ease: EASING.premium }}
                    onSubmit={handleSubmit}
                    className="bg-card border border-foreground/10 p-8 md:p-10 relative overflow-hidden"
                >
                    {/* Energy line */}
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

                        {/* Password */}
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
                                    placeholder="Digite sua senha"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Keep Connected */}
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    className="peer w-5 h-5 appearance-none rounded border-2 border-white/50 bg-white checked:bg-white checked:border-white transition-all cursor-pointer"
                                    defaultChecked
                                />
                                <X className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                            </div>
                            <label htmlFor="remember" className="text-sm text-muted-foreground uppercase tracking-[0.1em] cursor-pointer group-hover:text-foreground transition-colors">
                                Manter conectado
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-500 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
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
                        </motion.button>
                    </div>
                </motion.form>



                {/* Back to Home */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: DURATION.normal, delay: 0.4 }}
                    className="text-center mt-8"
                >
                    <a
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                        ← Voltar para o site
                    </a>
                </motion.div>


            </motion.div>
        </div>
    );
};

export default LoginPage;
