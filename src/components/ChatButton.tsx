import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const ChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'Olá! Como podemos ajudar você hoje? Seja bem-vindo à Connect.',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');

        // Simulated Bot Response
        setTimeout(() => {
            const botMessage: Message = {
                id: Date.now() + 1,
                text: 'Obrigado por sua mensagem! Um de nossos especialistas entrará em contato em breve através do seu canal de preferência.',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[320px] sm:w-[380px] h-[500px] bg-card border border-foreground/10 glass shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col rounded-[2rem] pointer-events-auto"
                    >
                        {/* Chat Header */}
                        <div className="p-6 border-b border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10">
                                        <MessageSquare size={20} className="text-foreground" strokeWidth={1.5} />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-display tracking-widest uppercase">Connect Chat</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Online agora</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                                aria-label="Fechar chat"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed ${msg.sender === 'user'
                                                ? 'bg-foreground text-background font-medium'
                                                : 'bg-foreground/5 border border-foreground/10 text-foreground'
                                            }`}
                                    >
                                        {msg.text}
                                        <div className={`text-[9px] mt-2 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 border-t border-foreground/10 bg-foreground/[0.02]">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Diga algo..."
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-foreground/30 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="p-3 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                                    aria-label="Enviar"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-[8px] text-center text-muted-foreground mt-3 uppercase tracking-[0.2em] opacity-40">
                                Seja Referência, Seja Connect
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative h-16 w-16 bg-card border border-foreground/10 rounded-full flex items-center justify-center glass backdrop-blur-xl shadow-2xl overflow-hidden pointer-events-auto"
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.5
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-foreground/10 rounded-full blur-xl group-hover:bg-foreground/20 transition-colors duration-500" />

                {/* Icon Toggle */}
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="text-foreground relative z-10 w-6 h-6" strokeWidth={1.5} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MessageSquare className="text-foreground relative z-10 w-7 h-7" strokeWidth={1.5} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Connection Node (The second "Bolinha") - Only shown when closed */}
                {!isOpen && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-foreground rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20">
                        <div className="absolute inset-0 bg-foreground rounded-full animate-ping opacity-75" />
                    </div>
                )}

                {/* Border Glow Line */}
                <div className="absolute inset-0 border border-foreground/5 rounded-full" />
            </motion.button>
        </div>
    );
};

export default ChatButton;
