import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Plug } from 'lucide-react';

const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-100px', amount: 0.3 });

  return (
    <section id="contato" className="py-32 relative overflow-hidden">
      {/* Decorative connection elements - CSS animations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] connection-circle opacity-5 animate-spin-slow" style={{ animationDuration: '100s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] connection-circle opacity-10 animate-spin-slow" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />

      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <Plug size={16} className="text-muted-foreground" />
            <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
              Pronto para Conectar?
            </p>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 md:mb-8 uppercase"
          >
            Vamos criar uma
            <br />
            <span className="text-gradient-connect">conexão</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8 md:mb-12"
          >
            Conecte-se conosco e descubra como podemos transformar sua presença digital
            em resultados concretos para seu negócio.
          </motion.p>

          <motion.a
            href="https://wa.me/5584988156694?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20de%20marketing%20digital%20da%20Connect."
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-3 md:gap-4 bg-foreground text-background px-8 md:px-10 py-4 md:py-5 text-base md:text-lg uppercase tracking-wider font-medium hover:bg-foreground/90 transition-colors duration-300"
          >
            <Plug size={20} className="opacity-60" />
            Conectar Agora
            <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={22} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;