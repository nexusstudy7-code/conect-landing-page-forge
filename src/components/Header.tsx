import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/connect-logo.jpg';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const navLinks = [
  { name: 'Início', href: '#inicio' },
  { name: 'Serviços', href: '#servicos' },
  { name: 'Sobre', href: '#sobre' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollDirection = useScrollDirection();
  const location = useLocation();
  // Header só aparece quando está no topo (isScrolled é false)
  const isHidden = isScrolled;

  // Função para gerar o link correto
  const getLink = (href: string) => {
    // Se estiver na home, usa âncora normal. Senão, adiciona / antes.
    return location.pathname === '/' ? href : `/${href}`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isHidden ? -100 : 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${isScrolled ? 'bg-background/95 py-4' : 'py-6 bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href={location.pathname === '/' ? '#inicio' : '/'} className="flex items-center gap-3">
          <img src={logo} alt="Connect" className="h-16 w-16 object-cover rounded-full" />
          <span className="font-display text-2xl tracking-widest">CONNECT</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={getLink(link.href)}
              className="nav-link text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Link
            to="/agenda"
            className={`nav-link text-sm uppercase tracking-wider transition-colors ${location.pathname === '/agenda' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Agenda
          </Link>
          <a
            href={getLink('#contato')}
            className="border border-foreground/30 px-6 py-2 text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Contato
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="md:hidden bg-background/95"
          >
            <nav className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={getLink(link.href)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/agenda"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-wider transition-colors ${location.pathname === '/agenda' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Agenda
                </Link>
              </motion.div>
              <motion.a
                href={getLink('#contato')}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="border border-foreground/30 px-6 py-3 text-center uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Contato
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;