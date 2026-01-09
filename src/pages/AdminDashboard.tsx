import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Users, Mail, Phone, User, Filter, Search, LogOut, UserCircle, Menu, X, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSITIONS, DURATION, EASING, TRANSITION_CLASSES } from '@/lib/animations';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];


const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'bookings' | 'clients' | 'calendar'>('bookings');
    const [filter, setFilter] = useState<'all' | 'recording' | 'meeting'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Real data from Supabase
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesType = filter === 'all' || booking.type === filter;
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
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
        switch (status) {
            case 'pending': return 'text-yellow-500';
            case 'confirmed': return 'text-green-500';
            case 'completed': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'confirmed': return 'Confirmado';
            case 'completed': return 'Concluído';
            default: return status;
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Função para converter agendamento em cliente (migração manual se necessário)
    const handleConvertToClient = async (booking: Booking) => {
        if (!confirm(`Deseja converter ${booking.name} em um cliente fiel e migrar o histórico?`)) return;

        try {
            // Verifica se já existe
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', booking.email)
                .single();

            if (existingClient) {
                alert('Este cliente já existe na base de dados!');
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
                    // total_bookings será atualizado via trigger ou contagem futura
                });

            if (error) throw error;

            alert('Cliente criado com sucesso!');
            fetchClients(); // Atualiza a lista
        } catch (err: any) {
            console.error('Erro ao converter:', err);
            alert('Erro ao converter cliente: ' + err.message);
        }
    };

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

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-foreground/10 bg-card z-50">
                    <span className="font-display text-xl tracking-widest">CONNECT</span>
                    <button onClick={toggleMobileMenu} className="p-2">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Sidebar Overlay (Mobile) */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
                        fixed md:static inset-y-0 left-0 z-50 bg-card flex flex-col border-r border-foreground/5 transition-all duration-fast ease-premium relative
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
                        w-64
                    `}
                    style={{
                        height: '100vh',
                        backgroundColor: 'hsl(0 0% 6%)',
                    }}
                >
                    {/* Toggle Button (Desktop) */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:flex absolute -right-3 top-20 bg-foreground text-background rounded-full p-1 shadow-lg hover:bg-foreground/90 transition-colors z-40"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    {/* Logo */}
                    <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {isSidebarCollapsed ? (
                            <span className="font-display text-xl tracking-widest">C</span>
                        ) : (
                            <div>
                                <span className="font-display text-2xl tracking-widest">CONNECT</span>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                    Painel Admin
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 pt-8 md:pt-4 space-y-2">
                        <button
                            onClick={() => { setActiveTab('bookings'); setIsMobileMenuOpen(false); }}
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
                            onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }}
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
                            onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 text-sm uppercase tracking-wider ${TRANSITION_CLASSES.smooth} ${activeTab === 'calendar'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                                } group relative rounded-md`}
                            title={isSidebarCollapsed ? "Calendário" : ""}
                        >
                            <Clock size={20} />
                            {!isSidebarCollapsed && <span className="ml-3">Calendário</span>}
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
                <main className="flex-1 overflow-auto h-[calc(100vh-65px)] md:h-screen w-full">

                    <div className="p-8">
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
                                    <div className="mb-8">
                                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-none mb-4">
                                            Agendamentos
                                        </h1>
                                        <p className="text-muted-foreground text-base md:text-lg">
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
                                                className="w-full bg-card border border-foreground/10 pl-12 pr-4 py-3 text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                                            />
                                        </div>

                                        {/* Filter buttons */}
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2">
                                                <Filter size={16} className="text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground uppercase tracking-wider">Tipo:</span>
                                            </div>
                                            <button
                                                onClick={() => setFilter('all')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${filter === 'all'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setFilter('recording')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${filter === 'recording'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Gravações
                                            </button>
                                            <button
                                                onClick={() => setFilter('meeting')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${filter === 'meeting'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Reuniões
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2">
                                                <Filter size={16} className="text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground uppercase tracking-wider">Status:</span>
                                            </div>
                                            <button
                                                onClick={() => setStatusFilter('all')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${statusFilter === 'all'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter('pending')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${statusFilter === 'pending'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Pendentes
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter('confirmed')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${statusFilter === 'confirmed'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Confirmados
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter('completed')}
                                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${statusFilter === 'completed'
                                                    ? 'bg-foreground text-background'
                                                    : 'border border-foreground/30 hover:border-foreground/50'
                                                    }`}
                                            >
                                                Concluídos
                                            </button>
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
                                                    className="bg-card border border-foreground/10 p-6 md:p-8 hover:border-foreground/20 transition-colors relative overflow-hidden"
                                                >
                                                    <div className="absolute bottom-0 left-0 w-full h-px energy-line" />

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                {booking.type === 'recording' ? (
                                                                    <Video size={24} className="text-muted-foreground mt-1" />
                                                                ) : (
                                                                    <Users size={24} className="text-muted-foreground mt-1" />
                                                                )}
                                                                <div>
                                                                    <h3 className="font-display text-2xl mb-1">
                                                                        {booking.type === 'recording' ? 'Gravação de Conteúdo' : 'Reunião Estratégica'}
                                                                    </h3>
                                                                    <span className={`text-sm uppercase tracking-wider ${getStatusColor(booking.status)}`}>
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
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2 text-foreground">
                                                                    <Calendar size={18} />
                                                                    <span className="font-medium">
                                                                        {new Date(booking.date).toLocaleDateString('pt-BR', {
                                                                            day: '2-digit',
                                                                            month: 'long',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-foreground">
                                                                    <Clock size={18} />
                                                                    <span className="font-medium">{booking.time}</span>
                                                                </div>
                                                            </div>

                                                            {booking.message && (
                                                                <div className="bg-background border border-foreground/10 p-4">
                                                                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Observações:</p>
                                                                    <p className="text-sm">{booking.message}</p>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-foreground/10">
                                                                <p className="text-xs text-muted-foreground mb-1">
                                                                    Solicitado em: {new Date(booking.created_at).toLocaleDateString('pt-BR')}
                                                                </p>

                                                                {/* Botão de conversão manual */}
                                                                <button
                                                                    onClick={() => handleConvertToClient(booking)}
                                                                    className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-fit"
                                                                >
                                                                    <UserPlus size={14} />
                                                                    Tornar Cliente
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2">{bookings.length}</p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Total</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2 text-yellow-500">
                                                {bookings.filter(b => b.status === 'pending').length}
                                            </p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Pendentes</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2 text-green-500">
                                                {bookings.filter(b => b.status === 'confirmed').length}
                                            </p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Confirmados</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2 text-blue-500">
                                                {bookings.filter(b => b.status === 'completed').length}
                                            </p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Concluídos</p>
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
                                    <div className="mb-8">
                                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-none mb-4">
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
                                                                        <p className="font-display text-2xl">{client.total_bookings}</p>
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
                                    <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2">{clients.length}</p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Total de Clientes</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2">
                                                {clients.reduce((acc, client) => acc + (client.total_bookings || 0), 0)}
                                            </p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Agendamentos Totais</p>
                                        </div>
                                        <div className="bg-card border border-foreground/10 p-6 text-center">
                                            <p className="font-display text-3xl mb-2">
                                                {clients.length > 0 ? (clients.reduce((acc, client) => acc + (client.total_bookings || 0), 0) / clients.length).toFixed(1) : '0.0'}
                                            </p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Média por Cliente</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="calendar"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={TRANSITIONS.smooth}
                                >
                                    <div className="mb-8">
                                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-none mb-4">Calendário</h1>
                                        <p className="text-muted-foreground text-base md:text-lg">Visualize os dias de gravação e agendamentos.</p>
                                    </div>

                                    <div className="bg-card border border-foreground/5 p-6 rounded-lg">
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
                                                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                                const startPadding = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

                                                // Adjust startPadding if your month renders incorrectly, but usually day 1 is placed at index 'startPadding'
                                                const dayNumber = i - startPadding + 1;
                                                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                                                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

                                                const dateStr = isCurrentMonth
                                                    ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                                                    : '';

                                                const dayBookings = bookings.filter(b => b.date === dateStr);
                                                const hasRecording = dayBookings.some(b => b.type === 'recording');
                                                const hasMeeting = dayBookings.some(b => b.type === 'meeting');

                                                if (!isCurrentMonth) return <div key={i} className="aspect-square bg-foreground/2 rounded-md" />;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`aspect-square p-2 border border-foreground/5 rounded-md relative group hover:border-foreground/30 transition-colors ${hasRecording ? 'bg-red-500/10 border-red-500/30' :
                                                            hasMeeting ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card'
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
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
