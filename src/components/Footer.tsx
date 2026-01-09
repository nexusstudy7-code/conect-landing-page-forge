import { Instagram, Linkedin, Mail, Plug } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/connect-logo.jpg';

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/sejaconect?igsh=YTEyamp5NTBhb2x0', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:luanv2570@gmail.com', label: 'Email' },
];

const Footer = () => {
  return (
    <footer className="border-t border-foreground/10 py-16 relative overflow-hidden">
      {/* Decorative connection line */}
      <div className="absolute top-0 left-0 w-full h-px energy-line" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-12">
          {/* Logo with connection theme */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <img src={logo} alt="Connect" className="h-16 w-16 object-cover rounded-full" />
              <div className="absolute -inset-2 rounded-full border border-foreground/10 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <span className="font-display text-3xl tracking-widest">CONNECT</span>
            <p className="text-muted-foreground text-sm text-center">
              Seja Referência, Seja Connect!
            </p>
          </motion.div>

          {/* Social Links with connection nodes */}
          <div className="flex items-center gap-8">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="relative text-muted-foreground hover:text-foreground transition-colors duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -3 }}
              >
                <div className="absolute -inset-3 rounded-full border border-foreground/0 group-hover:border-foreground/20 transition-colors" />
                <social.icon size={22} strokeWidth={1.5} />
              </motion.a>
            ))}
          </div>

          {/* Copyright */}
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            © 2024 Connect. Todos os direitos reservados.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;