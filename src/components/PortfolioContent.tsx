import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, X, Filter, Search, Image as ImageIcon, Video, Briefcase, Trash2, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { VideoModal } from './VideoModal';
import { getVideoThumbnail, getValidatedImageUrl } from '@/lib/video';

type Portfolio = Database['public']['Tables']['portfolio']['Row'];

interface PortfolioContentProps {
    isAdmin?: boolean;
}

export const PortfolioContent = ({ isAdmin = true }: PortfolioContentProps) => {
    const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'project'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [useUrl, setUseUrl] = useState(true);

    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        category: 'video' as 'video' | 'image' | 'project',
        image_url: '',
        video_url: '',
        client_name: '',
        tags: '',
    });

    // Video modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string; thumbnail?: string } | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

        if (![...validImageTypes, ...validVideoTypes].includes(file.type)) {
            alert('Tipo de arquivo não suportado');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert('Arquivo muito grande. Máximo: 50MB');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));

        if (validImageTypes.includes(file.type)) {
            setNewItem({ ...newItem, category: 'image' });
        } else if (validVideoTypes.includes(file.type)) {
            setNewItem({ ...newItem, category: 'video' });
        }
    };

    // Upload file
    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);
            setUploadProgress(0);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('portfolio')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(fileName);

            setUploadProgress(100);
            return publicUrl;
        } catch (error: any) {
            alert('Erro ao fazer upload: ' + error.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Fetch portfolio
    const fetchPortfolio = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPortfolioItems(data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

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

    const handleAddItem = async () => {
        if (!newItem.title) {
            alert('Preencha o título');
            return;
        }

        try {
            let imageUrl = newItem.image_url;
            let videoUrl = newItem.video_url;

            if (!useUrl && selectedFile) {
                const uploadedUrl = await uploadFile(selectedFile);
                if (!uploadedUrl) return;

                if (selectedFile.type.startsWith('image/')) {
                    imageUrl = uploadedUrl;
                } else {
                    videoUrl = uploadedUrl;
                }
            }

            const { error } = await supabase
                .from('portfolio')
                .insert({
                    title: newItem.title,
                    description: newItem.description,
                    category: newItem.category,
                    image_url: imageUrl,
                    video_url: videoUrl,
                    client_name: newItem.client_name,
                    tags: newItem.tags ? newItem.tags.split(',').map(t => t.trim()) : [],
                });

            if (error) throw error;

            setNewItem({ title: '', description: '', category: 'video', image_url: '', video_url: '', client_name: '', tags: '' });
            setSelectedFile(null);
            setPreviewUrl('');
            setIsAddModalOpen(false);
            fetchPortfolio();
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Excluir este item?')) return;

        try {
            const { error } = await supabase.from('portfolio').delete().eq('id', id);
            if (error) throw error;
            fetchPortfolio();
        } catch (err) {
            alert('Erro ao excluir');
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
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl md:text-4xl tracking-widest mb-2">PORTFÓLIO</h1>
                    <p className="text-muted-foreground">Gerencie os trabalhos e projetos</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-foreground text-background px-4 py-2 hover:bg-foreground/90 transition-colors"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline text-sm uppercase tracking-wider">Adicionar</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-foreground/10 pl-12 pr-4 py-3 text-sm focus:border-foreground/30 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-muted-foreground" />
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'video', 'image', 'project'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat as any)}
                                className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${filter === cat ? 'bg-foreground text-background' : 'border border-foreground/30'
                                    }`}
                            >
                                {cat === 'all' ? 'Todos' : getCategoryLabel(cat)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
                {filteredItems.length === 0 ? (
                    <div className="bg-card border border-foreground/10 p-12 text-center">
                        <p className="text-muted-foreground">Nenhum item encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group bg-card border border-foreground/10 overflow-hidden hover:border-foreground/20 transition-all relative"
                            >
                                <div
                                    className={`aspect-video bg-foreground/5 relative overflow-hidden ${item.category === 'video' && item.video_url ? 'cursor-pointer' : ''
                                        }`}
                                    onClick={() => item.category === 'video' && handleVideoClick(item)}
                                >
                                    <div className="w-full h-full flex items-center justify-center absolute inset-0">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    {getValidatedImageUrl(item.image_url, item.video_url) && (
                                        <img
                                            src={getValidatedImageUrl(item.image_url, item.video_url)}
                                            alt={item.title}
                                            className="w-full h-full object-cover relative z-10 transition-opacity duration-300"
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

                                    <div className="absolute top-3 left-3 bg-background/90 px-3 py-1 flex items-center gap-2">
                                        {getCategoryIcon(item.category)}
                                        <span className="text-xs uppercase">{getCategoryLabel(item.category)}</span>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="absolute top-3 right-3 bg-red-500/90 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-3">
                                    <h3 className="font-display text-xl">{item.title}</h3>
                                    {item.client_name && <p className="text-sm text-muted-foreground">Cliente: {item.client_name}</p>}
                                    {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags.map((tag, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-foreground/5 border border-foreground/10">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-card border border-foreground/10 p-6 text-center">
                    <p className="font-display text-3xl mb-2">{portfolioItems.length}</p>
                    <p className="text-sm text-muted-foreground uppercase">Total</p>
                </div>
                <div className="bg-card border border-foreground/10 p-6 text-center">
                    <p className="font-display text-3xl mb-2">{portfolioItems.filter(i => i.category === 'video').length}</p>
                    <p className="text-sm text-muted-foreground uppercase">Vídeos</p>
                </div>
                <div className="bg-card border border-foreground/10 p-6 text-center">
                    <p className="font-display text-3xl mb-2">{portfolioItems.filter(i => i.category === 'image').length}</p>
                    <p className="text-sm text-muted-foreground uppercase">Imagens</p>
                </div>
                <div className="bg-card border border-foreground/10 p-6 text-center">
                    <p className="font-display text-3xl mb-2">{portfolioItems.filter(i => i.category === 'project').length}</p>
                    <p className="text-sm text-muted-foreground uppercase">Projetos</p>
                </div>
            </div>

            {/* Add Modal */}
            {isAdmin && isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-foreground/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-foreground/10 p-6 flex items-center justify-between">
                            <h2 className="font-display text-2xl">Adicionar Item</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-foreground/5">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Título *</label>
                                <input
                                    type="text"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Categoria *</label>
                                <div className="flex gap-2">
                                    {(['video', 'image', 'project'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewItem({ ...newItem, category: cat })}
                                            className={`flex-1 py-3 text-sm uppercase ${newItem.category === cat ? 'bg-foreground text-background' : 'border border-foreground/30'}`}
                                        >
                                            {getCategoryLabel(cat)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Descrição</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none resize-none"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Cliente</label>
                                <input
                                    type="text"
                                    value={newItem.client_name}
                                    onChange={(e) => setNewItem({ ...newItem, client_name: e.target.value })}
                                    className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Método</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setUseUrl(true)}
                                        className={`flex-1 py-3 text-sm ${useUrl ? 'bg-foreground text-background' : 'border border-foreground/30'}`}
                                    >
                                        📎 URL
                                    </button>
                                    <button
                                        onClick={() => setUseUrl(false)}
                                        className={`flex-1 py-3 text-sm ${!useUrl ? 'bg-foreground text-background' : 'border border-foreground/30'}`}
                                    >
                                        📤 Upload
                                    </button>
                                </div>
                            </div>

                            {useUrl ? (
                                <>
                                    <div>
                                        <label className="block text-sm text-muted-foreground mb-2 uppercase">URL Imagem (Opcional se for vídeo do YT/Insta)</label>
                                        <input
                                            type="url"
                                            value={newItem.image_url}
                                            onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                                            className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-muted-foreground mb-2 uppercase">URL Vídeo</label>
                                        <input
                                            type="url"
                                            value={newItem.video_url}
                                            onChange={(e) => setNewItem({ ...newItem, video_url: e.target.value })}
                                            className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none"
                                            placeholder="YouTube or Instagram link"
                                        />
                                    </div>

                                    {/* URL Preview */}
                                    {getValidatedImageUrl(newItem.image_url, newItem.video_url) && (
                                        <div className="mt-4 border border-foreground/10 p-4">
                                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-tighter">Prévia da Thumbnail:</p>
                                            <img
                                                src={getValidatedImageUrl(newItem.image_url, newItem.video_url)}
                                                alt="Preview"
                                                className="max-h-48 mx-auto object-contain"
                                                onError={(e) => {
                                                    // Fallback for broken Instagram thumbnails
                                                    if (newItem.video_url?.includes('instagram.com') || newItem.image_url?.includes('instagram.com')) {
                                                        (e.target as HTMLImageElement).classList.add('opacity-0');
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm text-muted-foreground mb-2 uppercase">Arquivo</label>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="w-full bg-background border border-foreground/10 px-4 py-3 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-foreground file:text-background"
                                    />
                                    {previewUrl && (
                                        <div className="mt-4 border border-foreground/10 p-4">
                                            {selectedFile?.type.startsWith('image/') ? (
                                                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto" />
                                            ) : (
                                                <video src={previewUrl} controls className="max-h-48 mx-auto" />
                                            )}
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="mt-4">
                                            <div className="w-full bg-foreground/10 h-2">
                                                <div className="bg-foreground h-full" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-muted-foreground mb-2 uppercase">Tags</label>
                                <input
                                    type="text"
                                    value={newItem.tags}
                                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                                    className="w-full bg-background border border-foreground/10 px-4 py-3 focus:border-foreground/30 focus:outline-none"
                                    placeholder="tag1, tag2, tag3"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 border border-foreground/30 text-sm uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItem.title || uploading}
                                    className="flex-1 py-3 bg-foreground text-background text-sm uppercase disabled:opacity-50"
                                >
                                    {uploading ? 'Enviando...' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};
