import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Calendar, Clock, Video, Users, Plug, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const bookingTypes = [
    {
        icon: Video,
        title: 'Gravação de Conteúdo',
        description: 'Sessão profissional de gravação para seu projeto',
        duration: '1-4 horas',
    },
    {
        icon: Users,
        title: 'Reunião Estratégica',
        description: 'Planejamento e alinhamento de estratégias',
        duration: '1-4 horas',
    },
];

const Booking = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: '-100px', amount: 0.3 });
    const [selectedType, setSelectedType] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            // Salvar no Supabase
            const { data, error } = await supabase
                .from('bookings')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    type: selectedType,
                    date: formData.date,
                    time: formData.time,
                    message: formData.message || null,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;

            // Sucesso - mostrar mensagem e abrir WhatsApp
            setSubmitStatus('success');

            // Criar mensagem para WhatsApp
            const typeText = selectedType === 'recording' ? 'Gravação de Conteúdo' : 'Reunião Estratégica';
            const message = `Olá! Gostaria de agendar um(a) *${typeText}*\n\n` +
                `📋 *Dados:*\n` +
                `Nome: ${formData.name}\n` +
                `Email: ${formData.email}\n` +
                `Telefone: ${formData.phone}\n` +
                `Data preferida: ${formData.date}\n` +
                `Horário preferido: ${formData.time}\n\n` +
                `💬 *Mensagem:*\n${formData.message || 'Sem observações adicionais'}`;

            const whatsappUrl = `https://wa.me/5584988156694?text=${encodeURIComponent(message)}`;

            // Aguardar um pouco para mostrar a mensagem de sucesso
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');

                // Resetar formulário após 2 segundos
                setTimeout(() => {
                    setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        date: '',
                        time: '',
                        message: '',
                    });
                    setSelectedType('');
                    setSubmitStatus('idle');
                }, 2000);
            }, 1000);

        } catch (error: any) {
            console.error('Error saving booking:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                status: error.status
            });
            setSubmitStatus('error');
            setErrorMessage(error.message || 'Erro ao salvar agendamento. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <section id="agenda" className="py-32 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-20 right-10 opacity-10 w-32 h-32 connection-circle animate-spin-slow hidden md:block" style={{ animationDuration: '60s' }} />
            <div className="absolute bottom-20 left-10 opacity-10 w-48 h-48 connection-circle animate-spin-slow hidden md:block" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />

            <div className="container mx-auto px-6 relative z-20">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl mx-auto"
                >
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center gap-4 mb-6"
                        >
                            <Calendar size={16} className="text-muted-foreground" />
                            <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
                                Agende Conosco
                            </p>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none mb-6"
                        >
                            Reserve Seu
                            <br />
                            <span className="text-gradient-connect">Horário</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
                        >
                            Escolha o tipo de serviço e agende sua gravação ou reunião estratégica com nossa equipe.
                        </motion.p>
                    </div>

                    {/* Booking Types */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {bookingTypes.map((type, index) => (
                            <motion.button
                                key={type.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.3, delay: 0.15 + index * 0.1 }}
                                onClick={() => setSelectedType(index === 0 ? 'recording' : 'meeting')}
                                className={`group relative bg-card border p-6 md:p-8 text-left transition-all duration-300 ${selectedType === (index === 0 ? 'recording' : 'meeting')
                                    ? 'border-foreground/30 bg-foreground/5'
                                    : 'border-foreground/10 hover:border-foreground/20'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="absolute -inset-2 rounded-full border border-foreground/5 group-hover:border-foreground/10 transition-colors" />
                                        <type.icon
                                            size={28}
                                            className={`transition-colors relative z-10 ${selectedType === (index === 0 ? 'recording' : 'meeting')
                                                ? 'text-foreground'
                                                : 'text-muted-foreground group-hover:text-foreground'
                                                }`}
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-display text-xl md:text-2xl mb-2">{type.title}</h3>
                                        <p className="text-muted-foreground text-sm md:text-base mb-3">{type.description}</p>
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                            <Clock size={14} />
                                            <span>{type.duration}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated energy line at bottom */}
                                <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

                                {selectedType === (index === 0 ? 'recording' : 'meeting') && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-foreground to-transparent origin-top"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Booking Form */}
                    {selectedType && (
                        <motion.form
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            onSubmit={handleSubmit}
                            className="bg-card border border-foreground/10 p-6 md:p-10"
                        >
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-foreground/10 px-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-foreground/10 px-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                        Telefone *
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-foreground/10 px-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                        placeholder="(84) 98888-8888"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                        Data Preferida *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            required
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-foreground/10 px-4 py-3 pr-12 text-foreground focus:border-foreground/30 focus:outline-none transition-colors cursor-pointer"
                                            onClick={(e) => e.currentTarget.showPicker?.()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => (document.getElementById('date') as HTMLInputElement)?.showPicker?.()}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label="Abrir calendário"
                                        >
                                            <Calendar size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                        Horário Preferido *
                                    </label>
                                    <input
                                        type="time"
                                        id="time"
                                        name="time"
                                        required
                                        value={formData.time}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-foreground/10 px-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="mb-8">
                                <label htmlFor="message" className="block text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                                    Observações
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-background border border-foreground/10 px-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors resize-none"
                                    placeholder="Conte-nos mais sobre o que você precisa..."
                                />
                            </div>

                            {/* Success/Error Messages */}
                            {submitStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 bg-green-500/10 border border-green-500/30 p-4 flex items-start gap-3"
                                >
                                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-500 font-medium mb-1">Agendamento confirmado!</p>
                                        <p className="text-green-500/80 text-sm">
                                            Seu agendamento foi salvo com sucesso. Você será redirecionado para o WhatsApp em instantes...
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {submitStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3"
                                >
                                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-500 font-medium mb-1">Erro ao salvar agendamento</p>
                                        <p className="text-red-500/80 text-sm">{errorMessage}</p>
                                    </div>
                                </motion.div>
                            )}

                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                                className={`group w-full md:w-auto inline-flex items-center justify-center gap-3 md:gap-4 px-8 md:px-10 py-4 md:py-5 text-base md:text-lg uppercase tracking-wider font-medium transition-colors duration-300 ${isSubmitting
                                    ? 'bg-foreground/50 text-background/50 cursor-not-allowed'
                                    : 'bg-foreground text-background hover:bg-foreground/90'
                                    }`}
                            >
                                <Plug size={20} className="opacity-60" />
                                {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
                                {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                            </motion.button>
                        </motion.form>
                    )}

                    {!selectedType && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-muted-foreground text-sm"
                        >
                            Selecione um tipo de serviço acima para continuar
                        </motion.p>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default Booking;
