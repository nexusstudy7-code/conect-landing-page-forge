import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Calendar, CheckCircle, Instagram, Phone } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    action?: string;
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

const ChatButton = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Don't show the chat in the admin area or login page
    if (location.pathname.startsWith('/admin') || location.pathname === '/login') {
        return null;
    }
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');

    useEffect(() => {
        // Gera um ID único baseado no tempo + string aleatória para evitar duplicidade
        const uniqueId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        setSessionId(uniqueId);
    }, []);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou seu assistente Connect. Como posso ajudar com informações sobre a agência ou agendamentos hoje?',
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
    }, [isOpen, messages, isLoading]);

    const handleAction = (action: string) => {
        if (action === 'open_booking') {
            const bookingSection = document.getElementById('agenda');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
                setIsOpen(false);
            }
        }

        if (action === 'open_whatsapp') {
            window.open('https://wa.me/5584988156694', '_blank');
        }

        if (action === 'open_instagram') {
            window.open('https://www.instagram.com/sejaconect?igsh=YTEyamp5NTBhb2x0', '_blank');
        }

        if (action === 'booking_saved') {
            // Poderia disparar um confetti ou som de sucesso aqui
            console.log('Agendamento salvo com sucesso pelo Agente AI!');
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const currentInput = inputValue;
        const userMessage: Message = {
            id: Date.now().toString(),
            text: currentInput,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Se o webhook não estiver configurado corretamente, avisar o usuário
            if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('seu-n8n')) {
                throw new Error('WEBHOOK_NOT_CONFIGURED');
            }

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                mode: 'cors', // Garantir o modo CORS
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    sessionId: sessionId,
                    currentDate: new Date().toLocaleDateString('pt-BR'),
                    currentDay: new Date().toLocaleTimeString('pt-BR', { weekday: 'long' }),
                    timestamp: new Date().toISOString()
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const text = await response.text();
            if (!text) throw new Error('EMPTY_RESPONSE');

            const data = JSON.parse(text);

            // Detecta ações baseado na pergunta do usuário caso o n8n não retorne
            const detectAction = (text: string): string | undefined => {
                const lowerText = text.toLowerCase();
                if (lowerText.includes('whatsapp') || lowerText.includes('wpp') || lowerText.includes('whats') || lowerText.includes('zap') || lowerText.includes('número') || lowerText.includes('numero') || lowerText.includes('telefone')) {
                    return 'open_whatsapp';
                }
                if (lowerText.includes('instagram') || lowerText.includes('insta')) {
                    return 'open_instagram';
                }
                return undefined;
            };

            // n8n response format handling (assuming { output: string, action?: string })
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.output || data.message || 'Desculpe, tive um problema ao processar sua resposta.',
                sender: 'bot',
                timestamp: new Date(),
                action: data.action || detectAction(currentInput)
            };

            setMessages((prev) => [...prev, botMessage]);

            if (data.action) {
                handleAction(data.action);
            }

        } catch (error: any) {
            console.error('Chat error:', error);

            let errorMessage = 'Desculpe, ocorreu um erro na conexão. Por favor, tente novamente mais tarde.';

            if (error.message === 'WEBHOOK_NOT_CONFIGURED') {
                errorMessage = 'O agente de IA está sendo configurado. Por favor, configure o webhook no n8n para começar a conversar!';
            } else if (error.message === 'EMPTY_RESPONSE' || error instanceof SyntaxError) {
                errorMessage = 'O n8n não enviou uma resposta válida. Verifique o nó "Respond to Webhook"!';
            }

            const errorBotMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: errorMessage,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorBotMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[320px] sm:w-[380px] h-[550px] bg-card border border-foreground/10 glass shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col rounded-[2rem] pointer-events-auto"
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
                                    <h3 className="text-sm font-display tracking-widest uppercase">Connect AI Agent</h3>
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
                                        className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed relative ${msg.sender === 'user'
                                            ? 'bg-foreground text-background font-medium'
                                            : 'bg-foreground/5 border border-foreground/10 text-foreground'
                                            }`}
                                    >
                                        {msg.text}
                                        {msg.action === 'open_booking' && (
                                            <button
                                                onClick={() => handleAction('open_booking')}
                                                className="mt-3 flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 px-3 py-1.5 rounded-full text-[11px] transition-colors"
                                            >
                                                <Calendar size={12} />
                                                Ir para agendamentos
                                            </button>
                                        )}
                                        {msg.action === 'booking_saved' && (
                                            <div className="mt-3 flex items-center gap-2 text-green-500 font-medium text-[11px] bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                                                <CheckCircle size={12} />
                                                Agendamento Confirmado
                                            </div>
                                        )}
                                        {msg.action === 'open_whatsapp' && (
                                            <button
                                                onClick={() => handleAction('open_whatsapp')}
                                                className="mt-3 flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-full text-[11px] transition-colors"
                                            >
                                                <Phone size={12} />
                                                Conversar no WhatsApp
                                            </button>
                                        )}
                                        {msg.action === 'open_instagram' && (
                                            <button
                                                onClick={() => handleAction('open_instagram')}
                                                className="mt-3 flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/20 px-3 py-1.5 rounded-full text-[11px] transition-colors"
                                            >
                                                <Instagram size={12} />
                                                Seguir no Instagram
                                            </button>
                                        )}
                                        <div className={`text-[9px] mt-2 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-foreground/5 border border-foreground/10 p-4 rounded-2xl">
                                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                    </div>
                                </motion.div>
                            )}
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
                                    disabled={isLoading}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-foreground/30 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-3 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                                    aria-label="Enviar"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
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
                <div className="absolute inset-0 bg-foreground/10 rounded-full blur-xl group-hover:bg-foreground/20 transition-colors duration-500" />

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

                {!isOpen && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-foreground rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20">
                        <div className="absolute inset-0 bg-foreground rounded-full animate-ping opacity-75" />
                    </div>
                )}
                <div className="absolute inset-0 border border-foreground/5 rounded-full" />
            </motion.button>
        </div>
    );
};

export default ChatButton;
