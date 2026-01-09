import { motion, useInView } from 'framer-motion';
import { ArrowRight, Plug } from 'lucide-react';
import { useRef } from 'react';
import ConnectionLines from './ConnectionLines';
import { TRANSITIONS, EASING, DURATION } from '@/lib/animations';

const Hero = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: DURATION.normal,
        ease: EASING.premium,
      },
    },
  };

  return (
    <section ref={ref} id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Connection Lines Background */}
      <ConnectionLines />

      {/* Static Connection Circles - CSS animations for performance */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] connection-circle opacity-20 animate-spin-slow" style={{ animationDuration: '80s' }} />
      <div className="absolute top-1/3 right-1/3 w-[350px] h-[350px] connection-circle opacity-30 animate-spin-slow" style={{ animationDuration: '50s', animationDirection: 'reverse' }} />

      {/* Central glow - static for performance */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(0 0% 100% / 0.1) 0%, transparent 70%)',
        }}
      />

      {/* Floating plug icon - CSS animation */}
      <div className="absolute top-[15%] right-[5%] md:top-[20%] md:right-[15%] text-foreground/10 animate-float hover:text-foreground/20 transition-colors">
        <Plug className="w-14 h-14 md:w-20 md:h-20" strokeWidth={1} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-20 pt-32 md:pt-32">
        <motion.div
          className="max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Connection node indicator */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4 mb-6"
          >
            <div className="connection-node" />
            <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
              Agência de Marketing Digital
            </p>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] leading-[0.9] mb-6 md:mb-8 uppercase"
          >
            <span className="whitespace-nowrap">Seja Referência,</span>
            <br />
            Seja <span className="text-gradient-connect">Connect</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-sm sm:text-base md:text-xl max-w-xl mb-8 md:mb-12 leading-relaxed"
          >
            Conectamos sua marca ao sucesso. Estratégias de marketing
            que geram resultados mensuráveis e impacto duradouro.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 relative z-30"
          >
            <a
              href="#contato"
              className="group inline-flex items-center justify-center gap-2 md:gap-3 bg-foreground text-background px-6 md:px-8 py-3 md:py-4 text-xs md:text-sm uppercase tracking-wider font-medium hover:bg-foreground/90 transition-all duration-fast ease-premium relative overflow-hidden pointer-events-auto"
              style={{ zIndex: 30 }}
            >
              <span className="relative z-10 flex items-center gap-2 md:gap-3">
                Iniciar Conexão
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </span>
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center justify-center gap-2 md:gap-3 border border-foreground/30 px-6 md:px-8 py-3 md:py-4 text-xs md:text-sm uppercase tracking-wider hover:border-foreground hover:bg-foreground/5 transition-all duration-fast ease-premium pointer-events-auto"
              style={{ zIndex: 30 }}
            >
              <Plug size={14} className="opacity-50" />
              Explorar Serviços
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator with connection theme */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center z-10"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-foreground/40 mb-2"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-12 bg-gradient-to-b from-foreground/40 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default Hero;
