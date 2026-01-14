import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { getEmbedUrl, getVideoThumbnail } from '@/lib/video';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    thumbnailUrl?: string;
    title: string;
}

export const VideoModal = ({ isOpen, onClose, videoUrl, thumbnailUrl, title }: VideoModalProps) => {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const { type, embedUrl } = getEmbedUrl(videoUrl);
    // Use provided thumbnail OR try to get one from the video URL
    const finalThumbnail = thumbnailUrl || getVideoThumbnail(videoUrl);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`relative w-full ${type === 'instagram' ? 'max-w-md' : 'max-w-5xl'} ${type === 'instagram' ? '' : 'bg-card border border-foreground/20'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 text-white hover:text-foreground transition-colors z-10"
                        aria-label="Close"
                    >
                        <X size={32} />
                    </button>

                    {/* Title */}
                    {title && (
                        <div className="absolute -top-12 left-0 right-12 text-white">
                            <h3 className="font-display text-xl truncate">{title}</h3>
                        </div>
                    )}

                    {/* Video Player */}
                    <div
                        className={`relative ${type === 'instagram' ? 'h-[85vh] w-full mx-auto' : 'aspect-video w-full bg-black'}`}
                        style={{
                            backgroundImage: finalThumbnail ? `url(${finalThumbnail})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    >
                        {type === 'youtube' ? (
                            <iframe
                                src={embedUrl}
                                className="w-full h-full relative z-10"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : type === 'instagram' ? (
                            <iframe
                                src={embedUrl}
                                className="w-full h-full relative z-10 border-0"
                                frameBorder="0"
                                scrolling="no"
                                allowTransparency
                                allow="encrypted-media"
                            />
                        ) : (
                            <video
                                src={embedUrl}
                                poster={finalThumbnail}
                                controls
                                autoPlay
                                className="w-full h-full relative z-10"
                            >
                                Seu navegador não suporta reprodução de vídeo.
                            </video>
                        )}
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
