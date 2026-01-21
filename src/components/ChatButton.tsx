import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const ChatButton = () => {
    const whatsappNumber = '5584988156694';
    const message = encodeURIComponent('Olá! Vim pelo site da Connect e gostaria de saber mais sobre os serviços.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[100] group"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 1
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-foreground/10 rounded-full blur-xl group-hover:bg-foreground/20 transition-colors duration-500" />

            {/* Main Button (The "Bolinha") */}
            <div className="relative h-16 w-16 bg-card border border-foreground/10 rounded-full flex items-center justify-center glass backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Animated Background Pulse */}
                <div className="absolute inset-0 bg-gradient-to-tr from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <MessageSquare className="text-foreground relative z-10 w-7 h-7" strokeWidth={1.5} />

                {/* The Connection Node (The second "Bolinha") */}
                <div className="absolute top-3 right-3 w-3 h-3 bg-foreground rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20">
                    <div className="absolute inset-0 bg-foreground rounded-full animate-ping opacity-75" />
                </div>

                {/* Border Glow Line */}
                <div className="absolute inset-0 border border-foreground/5 rounded-full" />
            </div>

            {/* Decorative tooltip like element on hover */}
            <motion.div
                className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-card border border-foreground/10 glass rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap"
            >
                <span className="text-xs uppercase tracking-[0.2em] font-medium">Fale Conosco</span>
            </motion.div>
        </motion.a>
    );
};

export default ChatButton;
