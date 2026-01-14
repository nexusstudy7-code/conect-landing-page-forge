import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Filter, Search, Image as ImageIcon, Video, Briefcase, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { getVideoThumbnail, getValidatedImageUrl } from '@/lib/video';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { VideoModal } from '@/components/VideoModal';

type Portfolio = Database['public']['Tables']['portfolio']['Row'];

const PortfolioPage = () => {
    const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'project'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Video modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string; thumbnail?: string } | null>(null);

    // Fetch portfolio items
    const fetchPortfolio = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPortfolioItems(data || []);
        } catch (err) {
            console.error('Error fetching portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    // Filter portfolio items
    const filteredItems = portfolioItems.filter(item => {
        const matchesCategory = filter === 'all' || item.category === filter;
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.client_name && item.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const handleVideoClick = (item: Portfolio) => {
        if (item.video_url) {
            setSelectedVideo({
                url: item.video_url,
                title: item.title,
                thumbnail: item.image_url || getVideoThumbnail(item.video_url) || undefined
            });
            setIsModalOpen(true);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'video': return <Video size={20} />;
            case 'image': return <ImageIcon size={20} />;
            case 'project': return <Briefcase size={20} />;
            default: return <ImageIcon size={20} />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'video': return 'Vídeo';
            case 'image': return 'Imagem';
            case 'project': return 'Projeto';
            default: return category;
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-background flex items-center justify-center text-foreground pt-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground"></div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background text-foreground pt-32">
                <main className="container mx-auto px-4 py-8">
                    {/* Page Title */}
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-4">PORTFÓLIO</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Conheça nossos trabalhos e projetos realizados
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="mb-8 space-y-4">
                        {/* Search */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por título, descrição ou cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-card border border-foreground/10 pl-12 pr-4 py-3 text-sm text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex flex-col gap-2 items-center">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-muted-foreground" />
                                <span className="text-sm text-muted-foreground uppercase tracking-wider">Categoria:</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {['all', 'video', 'image', 'project'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat as any)}
                                        className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors whitespace-nowrap rounded-full ${filter === cat
                                            ? 'bg-foreground text-background'
                                            : 'border border-foreground/30 hover:border-foreground/50'
                                            }`}
                                    >
                                        {cat === 'all' ? 'Todos' : getCategoryLabel(cat)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Grid */}
                    <AnimatePresence mode="wait">
                        {filteredItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-card border border-foreground/10 p-12 text-center"
                            >
                                <p className="text-muted-foreground">Nenhum item encontrado.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group bg-card border border-foreground/10 overflow-hidden hover:border-foreground/20 transition-all relative"
                                    >
                                        {/* Image/Video Preview */}
                                        <div
                                            className={`aspect-video bg-foreground/5 relative overflow-hidden ${item.category === 'video' && item.video_url ? 'cursor-pointer' : ''
                                                }`}
                                            onClick={() => item.category === 'video' && handleVideoClick(item)}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {getCategoryIcon(item.category)}
                                            </div>
                                            {(getValidatedImageUrl(item.image_url, item.video_url)) && (
                                                <img
                                                    src={getValidatedImageUrl(item.image_url, item.video_url)}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 relative z-10"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).classList.add('opacity-0');
                                                    }}
                                                />
                                            )}
                                            {item.category === 'video' && item.video_url && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors z-20">
                                                    <div className="w-16 h-16 rounded-full bg-foreground/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Play size={28} className="text-background ml-1" fill="currentColor" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Category Badge */}
                                            <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 flex items-center gap-2">
                                                {getCategoryIcon(item.category)}
                                                <span className="text-xs uppercase tracking-wider">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 space-y-3">
                                            <h3 className="font-display text-xl tracking-wide">{item.title}</h3>

                                            {item.client_name && (
                                                <p className="text-sm text-muted-foreground">
                                                    Cliente: {item.client_name}
                                                </p>
                                            )}

                                            {item.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}

                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {item.tags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2 py-1 bg-foreground/5 border border-foreground/10"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-foreground/10">
                                                <p className="text-xs text-muted-foreground">
                                                    Adicionado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Energy line decoration */}
                                        <div className="absolute bottom-0 left-0 w-full h-px energy-line" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-foreground/10 p-6 text-center">
                            <p className="font-display text-3xl mb-2">{portfolioItems.length}</p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Total</p>
                        </div>
                        <div className="bg-card border border-foreground/10 p-6 text-center">
                            <p className="font-display text-3xl mb-2">
                                {portfolioItems.filter(i => i.category === 'video').length}
                            </p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Vídeos</p>
                        </div>
                        <div className="bg-card border border-foreground/10 p-6 text-center">
                            <p className="font-display text-3xl mb-2">
                                {portfolioItems.filter(i => i.category === 'image').length}
                            </p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Imagens</p>
                        </div>
                        <div className="bg-card border border-foreground/10 p-6 text-center">
                            <p className="font-display text-3xl mb-2">
                                {portfolioItems.filter(i => i.category === 'project').length}
                            </p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Projetos</p>
                        </div>
                    </div>
                </main>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <VideoModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    videoUrl={selectedVideo.url}
                    thumbnailUrl={selectedVideo.thumbnail}
                    title={selectedVideo.title}
                />
            )}

            <Footer />
        </>
    );
};

export default PortfolioPage;
