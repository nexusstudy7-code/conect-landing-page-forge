import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Palette, BarChart3, Megaphone, Code, Plug } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const services = [
  {
    icon: Palette,
    title: 'Branding Estratégico',
    description: 'Construímos identidades visuais que comunicam a essência da sua marca e geram conexão emocional com seu público.',
  },
  {
    icon: BarChart3,
    title: 'Gestão de Tráfego',
    description: 'Campanhas otimizadas em Google Ads e Meta Ads com foco em ROI e crescimento escalável.',
  },
  {
    icon: Megaphone,
    title: 'Social Media High-End',
    description: 'Estratégias de conteúdo premium que posicionam sua marca como autoridade no mercado.',
  },
  {
    icon: Code,
    title: 'Desenvolvimento Web',
    description: 'Sites e landing pages de alta performance, desenvolvidos para converter visitantes em clientes.',
  },
];

const ServiceCard = ({ service, index }: { service: typeof services[0]; index: number }) => {
  return (
    <motion.div
      whileHover={{
        y: -8,
        transition: { duration: 0.3 }
      }}
      className="group relative bg-card border-glow p-6 md:p-8 lg:p-10 h-full"
    >
      {/* Number with plug connector style */}
      <div className="absolute top-6 right-6 flex flex-col items-center">
        <div className="w-1 h-3 bg-foreground/10 rounded-full mb-1" />
        <div className="w-1 h-3 bg-foreground/10 rounded-full mb-2" />
        <span className="font-display text-4xl text-foreground/10 group-hover:text-foreground/30 transition-colors duration-300">
          0{index + 1}
        </span>
      </div>

      {/* Icon with connection circle */}
      <div className="mb-6 relative">
        <div className="absolute -inset-2 rounded-full border border-foreground/5 group-hover:border-foreground/10 transition-colors" />
        <service.icon
          size={32}
          className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 relative z-10"
          strokeWidth={1.5}
        />
      </div>

      {/* Content */}
      <h3 className="font-display text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4 tracking-wide">
        {service.title}
      </h3>
      <p className="text-muted-foreground text-base leading-relaxed">
        {service.description}
      </p>

      {/* Animated energy line at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

      {/* Connection line effect on hover */}
      <div className="absolute top-0 right-0 h-0 w-px bg-gradient-to-b from-foreground to-transparent group-hover:h-full transition-all duration-500" />
    </motion.div>
  );
};

const Services = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { margin: '-100px', amount: 0.3 });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  return (
    <section ref={sectionRef} id="servicos" className="py-32 relative overflow-hidden">
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
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl mb-20"
        >
          <div className="flex items-center gap-4 mb-4">
            <Plug size={16} className="text-muted-foreground" />
            <p className="text-muted-foreground uppercase tracking-[0.3em] text-sm">
              Nossos Serviços
            </p>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none">
            Soluções que
            <br />
            <span className="text-gradient-connect">Conectam</span>
          </h2>
        </motion.div>

        {/* Services Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {services.map((service, index) => (
              <CarouselItem key={service.title} className="pl-4 md:basis-1/2 lg:basis-1/2">
                <ServiceCard service={service} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default Services;
