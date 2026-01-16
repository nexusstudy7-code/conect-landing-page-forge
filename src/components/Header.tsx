import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/connect-logo.jpg';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { TRANSITIONS, EASING, DURATION } from '@/lib/animations';

const navLinks = [
  { name: 'Início', href: '#inicio' },
  { name: 'Serviços', href: '#servicos' },
  { name: 'Portfólio', href: 'portfolio', useLink: true },
  { name: 'Sobre', href: '#sobre' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollDirection = useScrollDirection();
  const location = useLocation();
  const isHidden = !isVisible;

  // Função para gerar o link correto
  const getLink = (href: string) => {
    // Se estiver na home, usa âncora normal. Senão, adiciona / antes.
    return location.pathname === '/' ? href : `/${href}`;
  };

  // Função para navegação no desktop (com scroll manual para compensar header fixo)
  const handleDesktopClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (location.pathname !== '/') {
      window.location.href = `/${href}`;
      return;
    }

    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerOffset = 100;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Função simplificada para mobile (deixa o navegador lidar com a âncora)
  const handleMobileClick = () => {
    // Pequeno delay para garantir que o clique/tap seja registrado e a navegação inicie
    // antes de remover o elemento do DOM
    setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsMobileMenuOpen(false); // Close menu when hiding
      }

      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: isHidden ? -100 : 0 }}
      transition={TRANSITIONS.smooth}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-slow ease-premium ${isScrolled ? 'bg-background/95 py-1' : 'py-2 bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href={location.pathname === '/' ? '#inicio' : '/'} className="flex items-center gap-3">
          <img src={logo} alt="Connect" className="h-10 w-10 object-cover rounded-full" />
          <span className="font-display text-2xl tracking-widest">CONNECT</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            link.useLink ? (
              <Link
                key={link.name}
                to={`/${link.href}`}
                className="nav-link text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-fast ease-premium"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={getLink(link.href)}
                onClick={(e) => handleDesktopClick(e, link.href)}
                className="nav-link text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-fast ease-premium"
              >
                {link.name}
              </a>
            )
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
            onClick={(e) => handleDesktopClick(e, '#contato')}
            className="border border-foreground/30 px-6 py-2 text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-fast ease-premium"
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
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: DURATION.fast, ease: EASING.smooth }}
            style={{ transformOrigin: 'top' }}
            className="md:hidden absolute top-[100%] left-0 right-0 bg-background border-b border-foreground/10 shadow-2xl z-50 overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link, index) => {
                const className = "text-base font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all py-3 px-4 rounded-md cursor-pointer block";
                return link.useLink ? (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/${link.href}`}
                      onClick={handleMobileClick}
                      className={className}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={link.name}
                    href={getLink(link.href)}
                    onClick={handleMobileClick}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={className}
                  >
                    {link.name}
                  </motion.a>
                );
              })}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="w-full"
              >
                <Link
                  to="/agenda"
                  onClick={handleMobileClick}
                  className={`text-base font-medium uppercase tracking-wider transition-all py-3 px-4 rounded-md cursor-pointer block ${location.pathname === '/agenda' ? 'text-foreground bg-foreground/5' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }`}
                >
                  Agenda
                </Link>
              </motion.div>
              <motion.a
                href={getLink('#contato')}
                onClick={handleMobileClick}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-base font-medium uppercase tracking-wider text-background bg-foreground hover:bg-foreground/90 transition-all py-3 px-4 rounded-md text-center cursor-pointer block shadow-sm"
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