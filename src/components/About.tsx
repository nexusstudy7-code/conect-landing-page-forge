import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { Plug, Zap, TrendingUp } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Conexões Criadas', icon: Plug },
  { value: '98%', label: 'Clientes Satisfeitos', icon: Zap },
  { value: '+5M', label: 'em Campanhas', icon: TrendingUp },
];

const AnimatedCounter = ({ value, isInView, scrollDirection, index }: {
  value: string;
  isInView: boolean;
  scrollDirection: 'up' | 'down';
  index: number;
}) => {
  const yOffset = scrollDirection === 'down' ? 50 : -50;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5, y: yOffset }}
      animate={isInView
        ? { opacity: 1, scale: 1, y: 0 }
        : { opacity: 0, scale: 0.5, y: yOffset }
      }
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="font-display text-5xl sm:text-6xl md:text-7xl text-gradient-connect"
    >
      {value}
    </motion.span>
  );
};

const About = () => {
  const sectionRef = useRef(null);
  const ref = useRef(null);
  const statsRef = useRef(null);
  const isInView = useInView(ref, { margin: '-100px', amount: 0.3 });
  const isStatsInView = useInView(statsRef, { margin: '-50px', amount: 0.3 });
  const scrollDirection = useScrollDirection();

  return (
    <section ref={sectionRef} id="sobre" className="py-32 relative overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-foreground/[0.03] to-transparent" />

      {/* Decorative connection circle - CSS animation */}
      <div className="absolute bottom-20 right-20 opacity-10 w-48 h-48 connection-circle animate-spin-slow" style={{ animationDuration: '80s', animationDirection: 'reverse' }} />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <motion.div ref={ref}>
            <motion.div
              initial={{ opacity: 0, x: scrollDirection === 'down' ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: scrollDirection === 'down' ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="connection-node" />
              <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
                Sobre Nós
              </p>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: scrollDirection === 'down' ? 60 : -60, rotate: scrollDirection === 'down' ? 2 : -2 }}
              animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: scrollDirection === 'down' ? 60 : -60, rotate: scrollDirection === 'down' ? 2 : -2 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] leading-[0.9] mb-6 md:mb-8 uppercase"
            >
              Conexões
              <br />
              <span className="text-gradient-connect">Duradouras</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: scrollDirection === 'down' ? 40 : -40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: scrollDirection === 'down' ? 40 : -40 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 md:mb-6"
            >
              A Connect nasceu da obsessão por criar conexões reais entre marcas e pessoas.
              Não criamos campanhas bonitas que não convertem. Cada estratégia é construída
              sobre dados, cada criativo é testado até performar.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: scrollDirection === 'down' ? 30 : -30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: scrollDirection === 'down' ? 30 : -30 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="text-muted-foreground text-xs sm:text-sm leading-relaxed"
            >
              Somos o plug que conecta sua marca ao sucesso. Seu crescimento é nossa métrica.
            </motion.p>
          </motion.div>

          {/* Right Content - Stats */}
          <div ref={statsRef} className="space-y-0">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: scrollDirection === 'down' ? 80 : -80, scale: 0.9 }}
                animate={isStatsInView
                  ? { opacity: 1, x: 0, scale: 1 }
                  : { opacity: 0, x: scrollDirection === 'down' ? 80 : -80, scale: 0.9 }
                }
                transition={{ duration: 0.35, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ x: 10, transition: { duration: 0.2 } }}
                className="border-t border-foreground/10 py-8 first:border-t-0 cursor-default group"
              >
                <div className="flex items-baseline gap-6">
                  <div className="relative">
                    <stat.icon
                      size={16}
                      className="absolute -left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-hover:text-foreground/40 transition-colors"
                    />
                    <AnimatedCounter
                      value={stat.value}
                      isInView={isStatsInView}
                      scrollDirection={scrollDirection}
                      index={index}
                    />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, x: scrollDirection === 'down' ? 30 : -30 }}
                    animate={isStatsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: scrollDirection === 'down' ? 30 : -30 }}
                    transition={{ duration: 0.25, delay: index * 0.08 + 0.15 }}
                    className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider"
                  >
                    {stat.label}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;