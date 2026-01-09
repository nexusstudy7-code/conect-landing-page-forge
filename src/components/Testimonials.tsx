import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Quote, Star } from 'lucide-react';
import { TRANSITIONS, TRANSITION_CLASSES } from '@/lib/animations';

const testimonials = [
    {
        id: 1,
        name: 'Cliente Satisfeito',
        role: 'Empresa de Marketing',
        text: 'Experiência incrível! Desde a elaboração do roteiro até as orientações e suporte na hora da captação. Parabéns a equipe!',
        rating: 5,
    },
    {
        id: 2,
        name: 'Cliente Fiel',
        role: 'Parceiro há mais de 1 ano',
        text: 'Passando pra agradecer o trabalho de vocês, já sou cliente há mais de ano e sempre me surpreendo com o trabalho lindo. Saiu tudo perfeito, a paciência e o carisma com todas as crianças foi muito importante, foi o vídeo saiu perfeito (muito rápido ⚡⚡ kkk). Parabéns pelo o trabalho, equipe Connect é top 🥺❤️',
        rating: 5,
    },
    {
        id: 3,
        name: 'Cliente Entusiasmado',
        role: 'Criador de Conteúdo',
        text: 'Eu amei muitoooo! Vocês arrasaram, muitas visualizações, vídeos incríveis. Já estou pronta pra próxima!',
        rating: 5,
    },
    {
        id: 4,
        name: 'Novo Cliente',
        role: 'Boulevard Marketing',
        text: 'Acabei de fazer uma venda de 3 peças. Cliente disse que veio pela publicação do marketing do Boulevard. Veio em busca da promoção que foi anunciada 😍',
        rating: 5,
    },
];

const Testimonials = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: '-100px', amount: 0.3 });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: TRANSITIONS.smooth,
        },
    };

    return (
        <section id="depoimentos" ref={ref} className="py-32 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-20 left-10 opacity-10 w-32 h-32 connection-circle animate-spin-slow hidden md:block" style={{ animationDuration: '60s' }} />
            <div className="absolute bottom-20 right-10 opacity-10 w-48 h-48 connection-circle animate-spin-slow hidden md:block" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />

            <div className="container mx-auto px-6 relative z-20">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-16">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <Quote size={16} className="text-muted-foreground" />
                            <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
                                Feedbacks
                            </p>
                        </div>
                        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none mb-6">
                            O Que Nossos
                            <br />
                            <span className="text-gradient-connect">Clientes Dizem</span>
                        </h2>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                            Feedbacks reais de clientes que transformaram suas marcas com a Connect.
                        </p>
                    </motion.div>

                    {/* Testimonials Grid */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.id}
                                variants={itemVariants}
                                className={`group bg-card border border-foreground/10 p-6 md:p-8 hover:border-foreground/20 ${TRANSITION_CLASSES.smooth} relative overflow-hidden`}
                            >
                                {/* Energy line */}
                                <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

                                {/* Quote icon */}
                                <div className="mb-6 relative">
                                    <div className="absolute -inset-2 rounded-full border border-foreground/5 group-hover:border-foreground/10 transition-colors" />
                                    <Quote size={32} className="text-muted-foreground/30 relative z-10" strokeWidth={1.5} />
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={16} className="fill-foreground text-foreground" />
                                    ))}
                                </div>

                                {/* Testimonial text */}
                                <p className="text-foreground/90 text-base md:text-lg leading-relaxed">
                                    "{testimonial.text}"
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stats */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-16 grid grid-cols-2 gap-6 max-w-2xl mx-auto"
                    >
                        <div className="text-center">
                            <p className="font-display text-4xl md:text-5xl mb-2 text-gradient-connect">150+</p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Clientes Satisfeitos</p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-4xl md:text-5xl mb-2 text-gradient-connect">500+</p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Projetos Entregues</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Testimonials;
