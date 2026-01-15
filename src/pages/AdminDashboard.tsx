import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Users, Mail, Phone, User, Filter, Search, LogOut, UserCircle, Menu, X, UserPlus, ChevronLeft, ChevronRight, Check, CheckCircle, UserCheck, Briefcase } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import logo from '@/assets/connect-logo.jpg';
import { TRANSITIONS, DURATION, EASING, TRANSITION_CLASSES } from '@/lib/animations';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { PortfolioContent } from '@/components/PortfolioContent';
import { toast } from 'sonner';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

// Extensão segura para opções de notificação que podem não estar no lib.dom básico
interface ExtendedNotificationOptions extends NotificationOptions {
    vibrate?: number[];
    requireInteraction?: boolean;
}


const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'bookings' | 'clients' | 'calendar' | 'portfolio'>('bookings');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState<'all' | 'recording' | 'meeting'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Calendar navigation state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Real data from Supabase
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
        if (typeof window === 'undefined') return 'default';
        const stashed = localStorage.getItem('connect_notification_dismissed');
        if (stashed === 'true' && Notification.permission === 'granted') return 'granted';
        return Notification.permission;
    });

    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const checkStandalone = () => {
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as Navigator & { standalone?: boolean }).standalone ||
                document.referrer.includes('android-app://');
            setIsStandalone(!!isPWA);
        };
        checkStandalone();
    }, []);

    // Monitorar mudanças de permissão quando a aba volta a ser focada
    useEffect(() => {
        const checkPermission = () => {
            if ('Notification' in window) {
                const currentStatus = Notification.permission;
                setNotificationPermission(currentStatus);
                if (currentStatus === 'granted') {
                    localStorage.setItem('connect_notification_dismissed', 'true');
                }
            }
        };

        window.addEventListener('focus', checkPermission);
        checkPermission(); // Checagem inicial

        return () => window.removeEventListener('focus', checkPermission);
    }, []);

    const requestNotificationPermission = async () => {
        console.log('Botão de notificação clicado!');
        if (!('Notification' in window)) {
            alert('Este navegador não suporta notificações de desktop.');
            return;
        }

        try {
            // Alguns navegadores antigos usam callback, outros usam Promise
            const permission = await Notification.requestPermission();
            console.log('Resultado da permissão:', permission);

            setNotificationPermission(permission);

            if (permission === 'granted') {
                localStorage.setItem('connect_notification_dismissed', 'true');

                // Tentar assinar para Web Push (notificação com app fechado)
                try {
                    if ('serviceWorker' in navigator && 'PushManager' in window) {
                        const registration = await navigator.serviceWorker.ready;

                        // Chave pública VAPID (Este é um exemplo, para produção real deve-se usar as chaves do projeto)
                        const vapidPublicKey = 'BO8_Wq_n43p5_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_lW4_WfX0_';

                        // Nota: Para o Web Push funcionar 100%, você precisará configurar as chaves no servidor.
                        // Mas o código aqui já prepara o navegador para receber.
                        console.log('Solicitando assinatura de Push...');

                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidPublicKey
                        });

                        // Extrair dados da assinatura
                        const subJson = JSON.parse(JSON.stringify(subscription));
                        const endpoint = subJson.endpoint;

                        // Obter o ID do usuário logado para vincular à assinatura
                        const { data: { session } } = await supabase.auth.getSession();

                        console.log('Dados da assinatura prontos para salvar. Endpoint:', endpoint);

                        // Salvar assinatura no banco de dados vinculada ao Admin
                        const { error: subError } = await supabase
                            .from('push_subscriptions')
                            .upsert({
                                user_id: session?.user?.id,
                                endpoint: endpoint,
                                subscription: subJson,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'endpoint' });

                        if (subError) {
                            console.error('Erro ao salvar assinatura no banco:', subError);
                        } else {
                            console.log('Dispositivo registrado com sucesso para Web Push!');
                        }
                    }
                } catch (pushErr) {
                    const message = pushErr instanceof Error ? pushErr.message : 'Erro desconhecido';
                    console.warn('Este dispositivo/navegador não suporta Web Push de fundo ainda:', message);
                }

                toast.success('Notificações ativadas!', {
                    description: 'Você receberá alertas mesmo com o app fechado.'
                });

                // Notificação de boas-vindas
                showNativeNotification({
                    name: 'Connect!',
                    date: new Date().toISOString(),
                    message: 'Notificações ativadas com sucesso!',
                    id: 'welcome',
                    created_at: new Date().toISOString(),
                    email: '',
                    phone: '',
                    status: 'confirmed',
                    time: '',
                    type: 'meeting'
                } as Booking);
            } else if (permission === 'denied') {
                toast.error('Notificações bloqueadas pelo navegador.');
            }
        } catch (err) {
            console.error('Erro ao pedir permissão:', err);
        }
    };

    // Tentar re-assinar automaticamente se já tiver permissão
    useEffect(() => {
        if (notificationPermission === 'granted') {
            const checkAndSubscribe = async () => {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const existingSub = await registration.pushManager.getSubscription();
                    if (!existingSub) {
                        console.log('Permissão concedida mas sem assinatura. Criando agora...');
                        // No VAPID key here, just checking if we can get it or if we need to call request again
                        // In reality, we'd call the subscribe logic here too.
                    }
                } catch (e) {
                    console.log('Erro ao checar assinatura automática:', e);
                }
            };
            checkAndSubscribe();
        }
    }, [notificationPermission]);

    // Fetch bookings from Supabase
    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Erro ao carregar agendamentos');
        }
    };

    // Fetch clients from Supabase
    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('total_bookings', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Erro ao carregar clientes');
        }
    };

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchBookings(), fetchClients()]);
            setLoading(false);
        };
        loadData();

        // Subscribe to real-time updates for new bookings
        const channel = supabase
            .channel('admin-bookings-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings'
                },
                (payload) => {
                    const newBooking = payload.new as Booking;

                    // Notificar o admin (Visual)
                    toast.success('Novo Agendamento!', {
                        description: `${newBooking.name} agendou para ${new Date(newBooking.date).toLocaleDateString('pt-BR')}`,
                        duration: 8000,
                        action: {
                            label: 'Ver Agora',
                            onClick: () => {
                                handleTabChange('bookings');
                                fetchBookings();
                            }
                        }
                    });

                    // Notificar o admin (Nativa/Celular)
                    showNativeNotification(newBooking);

                    // Tocar som opcional (se o navegador permitir)
                    try {
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        audio.volume = 0.5;
                        audio.play();
                    } catch (e) {
                        console.log('Som de notificação bloqueado pelo navegador');
                    }

                    // Atualizar a lista automaticamente
                    fetchBookings();
                }
            )
            .subscribe();



        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Função para mostrar notificação nativa no sistema/celular (versão PWA/Mobile robusta)
    const showNativeNotification = async (booking: Booking) => {
        console.log('Tentando mostrar notificação nativa para:', booking.name);

        if (!('Notification' in window)) {
            console.error('Navegador não suporta notificações');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Permissão de notificação não concedida:', Notification.permission);
            return;
        }

        const title = 'Novo Agendamento Connect! 🔌';
        const dateStr = booking.date ? new Date(booking.date).toLocaleDateString('pt-BR') : 'Nova data';

        const options: ExtendedNotificationOptions = {
            body: booking.message || `${booking.name} agendou para ${dateStr}`,
            icon: '/notification-icon.png',
            badge: '/notification-icon.png',
            tag: booking.id || 'new-booking',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
            requireInteraction: true,
            data: {
                url: window.location.origin + '/admin'
            }
        };

        // Use Service Worker registration if available for better background support
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
            console.log('Notificação enviada via Service Worker');
        } catch (e) {
            console.error('Erro no Service Worker, tentando fallback:', e);
            try {
                new Notification(title, options);
            } catch (err) {
                console.error('Falha crítica ao mostrar notificação:', err);
            }
        }
    };

    const handleTestNotification = () => {
        toast.info('Enviando notificação de teste...', { duration: 2000 });
        showNativeNotification({
            name: 'Teste de Sistema',
            date: new Date().toISOString(),
            status: 'pending',
            id: 'test',
            created_at: new Date().toISOString(),
            email: 'teste@connect.com',
            phone: '',
            time: '12:00',
            type: 'meeting',
            message: 'Esta é uma notificação de teste.'
        } as Booking);
    };

    // Scroll to top when component mounts or tab changes
    useEffect(() => {
        setTimeout(() => {
            if (mainContentRef.current) {
                mainContentRef.current.scrollTop = 0;
            }
        }, 100);
    }, [activeTab]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const filteredBookings = bookings.filter(booking => {
        const normalizedStatus = booking.status ? booking.status.toLowerCase() : 'pending';
        const normalizedType = booking.type ? booking.type.toLowerCase() : '';
        const matchesType = filter === 'all' || normalizedType === filter;
        const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
        const matchesSearch = booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesStatus && matchesSearch;
    });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        const normalized = status ? status.toLowerCase() : 'pending';
        switch (normalized) {
            case 'pending': return 'text-yellow-500';
            case 'confirmed': return 'text-green-500';
            case 'completed': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        const normalized = status ? status.toLowerCase() : 'pending';
        switch (normalized) {
            case 'pending': return 'Pendente';
            case 'confirmed': return 'Confirmado';
            case 'completed': return 'Concluído';
            default: return status;
        }
    };

    // Sidebar always collapsed as requested
    const isSidebarCollapsed = true;

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    // const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Function to change tab and scroll to top
    const handleTabChange = (tab: 'bookings' | 'clients' | 'calendar' | 'portfolio') => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
        // Immediate scroll to top
        setTimeout(() => {
            if (mainContentRef.current) {
                mainContentRef.current.scrollTop = 0;
            }
        }, 0);
    };

    // Calendar navigation functions
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    // Functions to update booking status
    const handleConfirmBooking = async (bookingId: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', bookingId);

            if (error) throw error;

            await fetchBookings(); // Refresh data
            toast.success('Agendamento confirmado com sucesso!');
        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error('Erro ao confirmar agendamento');
        }
    };

    const handleRejectBooking = async (bookingId: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

            if (error) throw error;

            await fetchBookings(); // Refresh data
            toast.success('Agendamento rejeitado e removido');
        } catch (error) {
            console.error('Error rejecting booking:', error);
            toast.error('Erro ao rejeitar agendamento');
        }
    };

    const handleCompleteBooking = async (bookingId: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', bookingId);

            if (error) throw error;

            await fetchBookings(); // Refresh data
            toast.success('Agendamento marcado como concluído!');
        } catch (error) {
            console.error('Error completing booking:', error);
            toast.error('Erro ao concluir agendamento');
        }
    };

    // Função para converter agendamento em cliente (migração manual se necessário)
    const handleConvertToClient = async (booking: Booking) => {
        // if (!confirm(`Deseja converter ${booking.name} em um cliente fiel e migrar o histórico?`)) return;

        try {
            // Verifica se já existe
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', booking.email)
                .single();

            if (existingClient) {
                toast.error('Este cliente já existe na base de dados!');
                return;
            }

            // Cria o cliente baseado no agendamento
            const { error } = await supabase
                .from('clients')
                .insert({
                    name: booking.name,
                    email: booking.email,
                    phone: booking.phone,
                    last_booking: booking.date,
                });

            if (error) throw error;

            toast.success('Cliente criado com sucesso!');
            fetchClients(); // Atualiza a lista
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error('Erro ao converter:', err);
            toast.error('Erro ao converter cliente: ' + message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                /* Hide scroll indicators and connection nodes in admin dashboard */
                .admin-dashboard .connection-node,
                .admin-dashboard .connection-circle,
                .admin-dashboard [class*="scroll"] {
                    display: none !important;
                }
                
                /* Hide scrollbar for Chrome, Safari and Opera */
                aside::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden admin-dashboard">

                {/* Mobile Header with Tabs */}
                <div className="md:hidden sticky top-0 bg-card border-b border-foreground/10 z-10">
                    {/* Logo and Logout */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Connect" className="w-8 h-8 rounded-full object-cover ring-1 ring-foreground/10" />
                            <span className="font-display text-xl tracking-widest">CONNECT</span>
                        </div>
                        <button onClick={handleLogout} className="p-2">
                            <LogOut size={20} />
                        </button>
                    </div>

                    {/* Horizontal Tabs */}
                    <div className="flex border-t border-foreground/10">
                        <button
                            onClick={() => handleTabChange('bookings')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider transition-colors ${activeTab === 'bookings'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground'
                                }`}
                        >
                            <Calendar size={16} />
                            <span className="hidden xs:inline">Agendamentos</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('clients')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider transition-colors border-x border-foreground/10 ${activeTab === 'clients'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground'
                                }`}
                        >
                            <UserCircle size={16} />
                            <span className="hidden xs:inline">Clientes</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('calendar')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider transition-colors ${activeTab === 'calendar'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground'
                                }`}
                        >
                            <Clock size={16} />
                            <span className="hidden xs:inline">Calendário</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('portfolio')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider transition-colors border-l border-foreground/10 ${activeTab === 'portfolio'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Briefcase size={16} />
                            <span className="hidden xs:inline">Portfólio</span>
                        </button>
                    </div>
                </div>



                {/* Sidebar - Desktop Only */}
                <aside
                    className={`
                        hidden md:flex md:static inset-y-0 left-0 z-[110] bg-card flex-col border-r border-foreground/5 transition-all duration-fast ease-premium relative
                        md:w-20
                    `}
                    style={{
                        height: '100dvh',
                        backgroundColor: 'hsl(0 0% 6%)',
                    }}
                >
                    {/* Toggle Button removed permanently as requested */}

                    {/* Logo */}
                    <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
                        <img src={logo} alt="Connect" className="w-10 h-10 rounded-full object-cover ring-2 ring-foreground/10" />
                        {!isSidebarCollapsed && (
                            <div>
                                <span className="font-display text-lg tracking-widest block">CONNECT</span>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Painel Admin
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 pt-8 md:pt-4 space-y-2">
                        <button
                            onClick={() => handleTabChange('bookings')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider ${TRANSITION_CLASSES.smooth} ${activeTab === 'bookings'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                } group relative rounded-md`}
                            title={isSidebarCollapsed ? "Agendamentos" : ""}
                        >
                            <Calendar size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Agendamentos</span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('clients')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider ${TRANSITION_CLASSES.smooth} ${activeTab === 'clients'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                } group relative rounded-md`}
                            title={isSidebarCollapsed ? "Clientes" : ""}
                        >
                            <UserCircle size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Clientes</span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('calendar')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider ${TRANSITION_CLASSES.smooth} ${activeTab === 'calendar'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                } group relative rounded-md`}
                            title={isSidebarCollapsed ? "Calendário" : ""}
                        >
                            <Clock size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Calendário</span>}
                        </button>

                        <button
                            onClick={() => handleTabChange('portfolio')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider ${TRANSITION_CLASSES.smooth} ${activeTab === 'portfolio'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                } group relative rounded-md`}
                            title={isSidebarCollapsed ? "Portfólio" : ""}
                        >
                            <Briefcase size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Portfólio</span>}
                        </button>
                    </nav>

                    {/* Logout */}
                    <div className="p-4">
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-foreground/5 ${TRANSITION_CLASSES.smooth} rounded-md`}
                            title={isSidebarCollapsed ? "Sair" : ""}
                        >
                            <LogOut size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Sair</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main ref={mainContentRef} className="flex-1 overflow-auto h-[calc(100dvh-120px)] md:h-screen w-full">
                    <div className="p-4 md:p-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'bookings' ? (
                                <motion.div
                                    key="bookings"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={TRANSITIONS.smooth}
                                >
                                    {/* Header */}
                                    <div className="mb-4 md:mb-6 lg:mb-8">
                                        {/* Discret Notification Prompt */}
                                        {notificationPermission !== 'granted' ? (
                                            <button
                                                onClick={requestNotificationPermission}
                                                className="group mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-yellow-500/60 hover:text-yellow-500 transition-colors"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                Ativar alertas no celular
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleTestNotification}
                                                className="group mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-green-500/40 hover:text-green-500 transition-colors"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                                                Enviar notificação de teste
                                            </button>
                                        )}
                                        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none mb-2 md:mb-4">
                                            Agendamentos
                                        </h1>
                                        <p className="text-muted-foreground text-sm md:text-base">
                                            Visualize e gerencie todos os agendamentos de gravações e reuniões.
                                        </p>
                                    </div>



                                    {/* Filters */}
                                    <div className="mb-8 space-y-4">
                                        {/* Search */}
                                        <div className="relative max-w-md">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nome ou email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-card border border-foreground/10 pl-12 pr-4 py-3 text-base md:text-sm text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                            />
                                        </div>

                                        {/* Filters - Horizontal Scroll on Mobile */}
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Filter size={16} className="text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Tipo:</span>
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                                                    <button
                                                        onClick={() => setFilter('all')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${filter === 'all'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Todos
                                                    </button>
                                                    <button
                                                        onClick={() => setFilter('recording')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${filter === 'recording'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Gravações
                                                    </button>
                                                    <button
                                                        onClick={() => setFilter('meeting')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${filter === 'meeting'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Reuniões
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Filter size={16} className="text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Status:</span>
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                                                    <button
                                                        onClick={() => setStatusFilter('all')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${statusFilter === 'all'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Todos
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusFilter('pending')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${statusFilter === 'pending'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Pendentes
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusFilter('confirmed')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${statusFilter === 'confirmed'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Confirmados
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusFilter('completed')}
                                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${statusFilter === 'completed'
                                                            ? 'bg-foreground text-background'
                                                            : 'border border-foreground/30 hover:border-foreground/50'
                                                            }`}
                                                    >
                                                        Concluídos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bookings List */}
                                    <div className="space-y-4">
                                        {filteredBookings.length === 0 ? (
                                            <div className="bg-card border border-foreground/10 p-12 text-center">
                                                <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
                                            </div>
                                        ) : (
                                            filteredBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className="bg-card border border-foreground/10 p-4 md:p-6 lg:p-8 hover:border-foreground/20 transition-colors relative overflow-hidden"
                                                >
                                                    <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

                                                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                                        <div className="space-y-3 md:space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                {booking.type === 'recording' ? (
                                                                    <Video size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                                                                ) : (
                                                                    <Users size={20} className="text-muted-foreground mt-1 flex-shrink-0" />
                                                                )}
                                                                <div>
                                                                    <h3 className="font-display text-lg md:text-xl lg:text-2xl mb-1">
                                                                        {booking.type === 'recording' ? 'Gravação de Conteúdo' : 'Reunião Estratégica'}
                                                                    </h3>
                                                                    <span className={`text-xs md:text-sm uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                                                                        {getStatusLabel(booking.status)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <User size={16} />
                                                                    <span>{booking.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Mail size={16} />
                                                                    <a href={`mailto:${booking.email}`} className="hover:text-foreground transition-colors">
                                                                        {booking.email}
                                                                    </a>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${booking.phone}`} className="hover:text-foreground transition-colors">
                                                                        {booking.phone}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                                <div className="flex items-center gap-2 text-foreground">
                                                                    <Calendar size={16} />
                                                                    <span className="font-medium text-sm md:text-base">
                                                                        {new Date(booking.date).toLocaleDateString('pt-BR', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-foreground">
                                                                    <Clock size={16} />
                                                                    <span className="font-medium text-sm md:text-base">{booking.time}</span>
                                                                </div>
                                                            </div>

                                                            {booking.message && (
                                                                <div className="bg-background border border-foreground/10 p-3 md:p-4">
                                                                    <p className="text-xs md:text-sm text-muted-foreground mb-1 uppercase tracking-wider">Observações:</p>
                                                                    <p className="text-xs md:text-sm">{booking.message}</p>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-foreground/10">
                                                                <p className="text-xs text-muted-foreground mb-1">
                                                                    Solicitado em: {new Date(booking.created_at).toLocaleDateString('pt-BR')}
                                                                </p>

                                                                {/* Action Buttons */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(booking.status?.toLowerCase() === 'pending' || !booking.status) && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleConfirmBooking(booking.id)}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 transition-colors rounded"
                                                                            >
                                                                                <Check size={14} />
                                                                                Confirmar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleRejectBooking(booking.id)}
                                                                                className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-colors rounded"
                                                                            >
                                                                                <X size={14} />
                                                                                Rejeitar
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    {booking.status?.toLowerCase() === 'confirmed' && (
                                                                        <button
                                                                            onClick={() => handleCompleteBooking(booking.id)}
                                                                            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-colors rounded"
                                                                        >
                                                                            <CheckCircle size={14} />
                                                                            Concluir
                                                                        </button>
                                                                    )}

                                                                    {/* Convert to Client Button */}
                                                                    {/* Convert to Client Button */}
                                                                    {booking.status?.toLowerCase() === 'completed' && (() => {
                                                                        const isClient = clients.some(c => c.email === booking.email || c.phone === booking.phone);
                                                                        return (
                                                                            <button
                                                                                onClick={() => !isClient && handleConvertToClient(booking)}
                                                                                disabled={isClient}
                                                                                className={`flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider transition-colors rounded border ${isClient
                                                                                    ? 'bg-foreground/5 text-muted-foreground border-transparent cursor-default'
                                                                                    : 'text-muted-foreground hover:text-foreground border-foreground/20 hover:border-foreground/40'
                                                                                    }`}
                                                                            >
                                                                                {isClient ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                                                                {isClient ? 'Cliente' : 'Tornar Cliente'}
                                                                            </button>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-8 md:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2">{bookings.length}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Total</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-yellow-500">
                                                {bookings.filter(b => b.status === 'pending').length}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Pendentes</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-green-500">
                                                {bookings.filter(b => b.status === 'confirmed').length}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Confirmados</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-blue-500">
                                                {bookings.filter(b => b.status === 'completed').length}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Concluídos</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'clients' ? (
                                <motion.div
                                    key="clients"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={TRANSITIONS.smooth}
                                >
                                    {/* Header */}
                                    <div className="mb-6 md:mb-8">
                                        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none mb-2 md:mb-4">
                                            Lista de Clientes
                                        </h1>
                                        <p className="text-muted-foreground text-base md:text-lg">
                                            Gerencie todos os seus clientes e histórico de agendamentos.
                                        </p>
                                    </div>

                                    {/* Search */}
                                    <div className="mb-8">
                                        <div className="relative max-w-md">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-card border border-foreground/10 pl-12 pr-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Clients List */}
                                    <div className="space-y-4">
                                        {filteredClients.length === 0 ? (
                                            <div className="bg-card border border-foreground/10 p-12 text-center">
                                                <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
                                            </div>
                                        ) : (
                                            filteredClients.map((client) => (
                                                <div
                                                    key={client.id}
                                                    className="bg-card border border-foreground/10 p-6 md:p-8 hover:border-foreground/20 transition-colors relative overflow-hidden"
                                                >
                                                    <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                <UserCircle size={24} className="text-muted-foreground mt-1" />
                                                                <div>
                                                                    <h3 className="font-display text-2xl mb-1">{client.name}</h3>
                                                                    <p className="text-sm text-muted-foreground">{client.company}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Mail size={16} />
                                                                    <a href={`mailto:${client.email}`} className="hover:text-foreground transition-colors">
                                                                        {client.email}
                                                                    </a>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${client.phone}`} className="hover:text-foreground transition-colors">
                                                                        {client.phone}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="bg-background border border-foreground/10 p-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total de Agendamentos</p>
                                                                        <p className="font-display text-2xl">
                                                                            {bookings.filter(b => b.email === client.email).length}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Último Agendamento</p>
                                                                        <p className="text-sm font-medium">
                                                                            {client.last_booking ? new Date(client.last_booking).toLocaleDateString('pt-BR') : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2">{clients.length}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Total de Clientes</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2">
                                                {bookings.length}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Agendamentos Totais</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-4 md:p-6 text-center col-span-2 md:col-span-1">
                                            <p className="font-display text-2xl md:text-3xl mb-1 md:mb-2">
                                                {clients.length > 0 ? (bookings.length / clients.length).toFixed(1) : '0.0'}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Média por Cliente</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'calendar' ? (
                                <motion.div
                                    key="calendar"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={TRANSITIONS.smooth}
                                >
                                    <div className="mb-6 md:mb-8">
                                        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none mb-2 md:mb-4">Calendário</h1>
                                        <p className="text-muted-foreground text-base md:text-lg">Visualize os dias de gravação e agendamentos.</p>
                                    </div>

                                    <div className="bg-card border border-foreground/5 p-6 rounded-lg">
                                        {/* Month Navigation */}
                                        <div className="flex items-center justify-between mb-6">
                                            <button
                                                onClick={goToPreviousMonth}
                                                className="p-2 hover:bg-foreground/5 rounded transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>

                                            <div className="text-center">
                                                <h3 className="font-display text-2xl md:text-3xl">
                                                    {new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', {
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </h3>
                                                <button
                                                    onClick={goToToday}
                                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 uppercase tracking-wider"
                                                >
                                                    Hoje
                                                </button>
                                            </div>

                                            <button
                                                onClick={goToNextMonth}
                                                className="p-2 hover:bg-foreground/5 rounded transition-colors"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>

                                        {/* Simple Calendar Legends */}
                                        <div className="flex gap-4 mb-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-red-500/50"></div>
                                                <span>Gravação</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-blue-500/50"></div>
                                                <span>Reunião</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                                <div key={day} className="text-sm font-medium text-muted-foreground py-2 uppercase tracking-wider">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {Array.from({ length: 35 }).map((_, i) => {
                                                const today = new Date();
                                                const firstDay = new Date(currentYear, currentMonth, 1);
                                                const startPadding = firstDay.getDay();

                                                const dayNumber = i - startPadding + 1;
                                                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                                                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

                                                // Check if this is today
                                                const isToday = isCurrentMonth &&
                                                    dayNumber === today.getDate() &&
                                                    currentMonth === today.getMonth() &&
                                                    currentYear === today.getFullYear();

                                                const dateStr = isCurrentMonth
                                                    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                                                    : '';

                                                const dayBookings = bookings.filter(b => b.date === dateStr && b.status === 'confirmed');
                                                const hasRecording = dayBookings.some(b => b.type === 'recording');
                                                const hasMeeting = dayBookings.some(b => b.type === 'meeting');

                                                if (!isCurrentMonth) return <div key={i} className="aspect-square bg-foreground/2 rounded-md" />;

                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            if (isCurrentMonth) {
                                                                setSelectedDate(dateStr);
                                                                setIsDialogOpen(true);
                                                            }
                                                        }}
                                                        className={`aspect-square p-2 border rounded-md relative group hover:border-foreground/30 transition-colors cursor-pointer ${isToday ? 'ring-2 ring-foreground/50' : ''
                                                            } ${hasRecording ? 'bg-red-500/10 border-red-500/30' :
                                                                hasMeeting ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card border-foreground/5'
                                                            }`}
                                                    >
                                                        <span className={`text-sm ${dateStr === new Date().toISOString().split('T')[0]
                                                            ? 'bg-foreground text-background w-6 h-6 flex items-center justify-center rounded-full'
                                                            : 'text-muted-foreground'
                                                            }`}>
                                                            {dayNumber}
                                                        </span>

                                                        <div className="mt-2 flex flex-col gap-1 overflow-hidden">
                                                            {dayBookings.slice(0, 3).map((b, idx) => (
                                                                <div key={idx} className={`text-[10px] px-1 py-0.5 rounded truncate ${b.type === 'recording' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                                                                    }`} title={`${b.time} - ${b.name}`}>
                                                                    {b.time.slice(0, 5)} • {b.name.split(' ')[0]}
                                                                </div>
                                                            ))}
                                                            {dayBookings.length > 3 && (
                                                                <div className="text-[10px] text-muted-foreground pl-1">
                                                                    +{dayBookings.length - 3} mais...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogContent className="max-w-md bg-card border border-foreground/10 max-h-[80vh] overflow-y-auto overflow-x-hidden">
                                                <DialogHeader>
                                                    <DialogTitle className="font-display text-2xl">
                                                        {selectedDate && new Date(selectedDate).toLocaleDateString('pt-BR', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long'
                                                        })}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Agendamentos para este dia.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4 mt-4">
                                                    {bookings.filter(b => b.date === selectedDate).length === 0 ? (
                                                        <p className="text-muted-foreground text-center py-8">
                                                            Nenhum agendamento para este dia.
                                                        </p>
                                                    ) : (
                                                        bookings.filter(b => b.date === selectedDate).map(booking => (
                                                            <div key={booking.id} className="bg-background border border-foreground/5 p-4 rounded-lg relative overflow-hidden group">
                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.type === 'recording' ? 'bg-red-500' : 'bg-blue-500'}`} />

                                                                <div className="pl-3">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {booking.type === 'recording' ? (
                                                                                <Video size={16} className="text-red-500" />
                                                                            ) : (
                                                                                <Users size={16} className="text-blue-500" />
                                                                            )}
                                                                            <span className="font-display tracking-wide">{booking.time.slice(0, 5)}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                                                                            booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                                                                                'bg-yellow-500/10 text-yellow-500'
                                                                            }`}>
                                                                            {getStatusLabel(booking.status)}
                                                                        </span>
                                                                    </div>

                                                                    <h4 className="font-medium mb-1">{booking.name}</h4>
                                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                                        <a href={`mailto:${booking.email}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                                                            <Mail size={12} /> {booking.email}
                                                                        </a>
                                                                        <a href={`tel:${booking.phone}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                                                            <Phone size={12} /> {booking.phone}
                                                                        </a>
                                                                    </div>

                                                                    {booking.message && (
                                                                        <div className="mt-2 bg-foreground/2 p-2 rounded text-xs text-muted-foreground/80">
                                                                            "{booking.message}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'portfolio' ? (
                                <motion.div
                                    key="portfolio"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={TRANSITIONS.smooth}
                                >
                                    <PortfolioContent isAdmin={true} />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
