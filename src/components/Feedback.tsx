import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Quote, Star, MessageCircle } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@/components/ui/carousel';
import { TRANSITIONS, EASING, DURATION } from '@/lib/animations';

const feedbacks = [
    {
        name: 'Ricardo Almeida',
        role: 'CEO, TechFlow Solutions',
        text: 'A Connect transformou completamente nossa presença digital. O resultado superou todas as expectativas.',
        rating: 5,
    },
    {
        name: 'Marina Costa',
        role: 'Diretora de Marketing, Luxe Brand',
        text: 'Profissionalismo e criatividade em cada detalhe. Nossa marca nunca esteve tão forte no mercado.',
        rating: 5,
    },
    {
        name: 'Felipe Santos',
        role: 'Founder, StartUp Innovate',
        text: 'Estratégias que realmente funcionam. Nosso ROI triplicou em apenas 6 meses de parceria.',
        rating: 5,
    },
    {
        name: 'Juliana Ferreira',
        role: 'CMO, Premium Retail',
        text: 'A equipe da Connect entende profundamente o mercado de luxo. Resultados excepcionais.',
        rating: 5,
    },
];

const FeedbackCard = ({ feedback, index }: { feedback: typeof feedbacks[0]; index: number }) => {
    return (
        <motion.div
            whileHover={{
                y: -8,
                transition: { duration: DURATION.fast }
            }}
            className="group relative bg-card border-glow p-6 md:p-8 lg:p-10 h-full"
        >
            {/* Number with plug connector style */}
            <div className="absolute top-6 right-6 flex flex-col items-center">
                <div className="w-1 h-3 bg-foreground/10 rounded-full mb-1" />
                <div className="w-1 h-3 bg-foreground/10 rounded-full mb-2" />
                <span className="font-display text-4xl text-foreground/10 group-hover:text-foreground/30 transition-colors duration-fast ease-premium">
                    0{index + 1}
                </span>
            </div>

            {/* Icon with connection circle */}
            <div className="mb-6 relative">
                <div className="absolute -inset-2 rounded-full border border-foreground/5 group-hover:border-foreground/10 transition-colors" />
                <Quote
                    size={32}
                    className="text-muted-foreground group-hover:text-foreground transition-colors duration-fast ease-premium relative z-10"
                    strokeWidth={1.5}
                />
            </div>

            {/* Rating Stars */}
            <div className="flex gap-1 mb-4">
                {[...Array(feedback.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-foreground/30 group-hover:text-foreground/50 transition-colors" fill="currentColor" />
                ))}
            </div>

            {/* Content */}
            <blockquote className="mb-6">
                <p className="text-muted-foreground text-base leading-relaxed">
                    "{feedback.text}"
                </p>
            </blockquote>

            <div>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl mb-1 tracking-wide">
                    {feedback.name}
                </h3>
                <p className="text-muted-foreground text-sm uppercase tracking-wider">
                    {feedback.role}
                </p>
            </div>

            {/* Animated energy line at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

            {/* Connection line effect on hover */}
            <div className="absolute top-0 right-0 h-0 w-px bg-gradient-to-b from-foreground to-transparent group-hover:h-full transition-all duration-normal ease-premium" />
        </motion.div>
    );
};

const Feedback = () => {
    const sectionRef = useRef(null);
    const headerRef = useRef(null);
    const isHeaderInView = useInView(headerRef, { margin: '-100px', amount: 0.3 });

    const autoplayPlugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    return (
        <section ref={sectionRef} id="feedback" className="py-32 relative overflow-hidden">
            {/* Background Element */}
            <div className="absolute inset-0 geometric-bg opacity-20 pointer-events-none" />

            {/* Decorative connection element - CSS animation */}
            <div className="absolute top-20 left-10 opacity-10 w-32 h-32 connection-circle animate-spin-slow" style={{ animationDuration: '60s' }} />

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: DURATION.slow, ease: EASING.premium }}
                    className="max-w-2xl mb-20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <MessageCircle size={16} className="text-muted-foreground" />
                        <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
                            Feedbacks
                        </p>
                    </div>
                    <h2 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] leading-[0.9] uppercase">
                        Resultados
                        <br />
                        <span className="text-gradient-connect">Comprovados</span>
                    </h2>
                </motion.div>

                {/* Feedback Carousel */}
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {feedbacks.map((feedback, index) => (
                            <CarouselItem key={feedback.name} className="pl-4 md:basis-1/2 lg:basis-1/2">
                                <FeedbackCard feedback={feedback} index={index} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
};

export default Feedback;
