export const getEmbedUrl = (url: string): { type: 'video' | 'youtube' | 'instagram'; embedUrl: string } => {
    if (!url) return { type: 'video', embedUrl: '' };

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        }
        return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
        };
    }

    // Instagram
    if (url.includes('instagram.com')) {
        let embedUrl = url;
        try {
            const urlObj = new URL(url);
            urlObj.search = '';
            let cleanUrl = urlObj.toString();
            if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

            if (!cleanUrl.endsWith('/embed')) {
                embedUrl = `${cleanUrl}/embed`;
            } else {
                embedUrl = cleanUrl;
            }
        } catch (e) {
            embedUrl = url.split('?')[0];
            if (embedUrl.endsWith('/')) embedUrl = embedUrl.slice(0, -1);
            if (!embedUrl.endsWith('/embed')) embedUrl += '/embed';
        }
        return {
            type: 'instagram',
            embedUrl: embedUrl
        };
    }

    // Direct video
    return {
        type: 'video',
        embedUrl: url
    };
};

/**
 * Detects if a URL is a social media link (YouTube/Instagram) and returns its thumbnail.
 * If it's a direct image link or something else, it returns it as is.
 */
export const getValidatedImageUrl = (url: string | null | undefined, videoUrlFallback?: string | null): string => {
    if (!url && !videoUrlFallback) return '';

    // If we have a URL, check if it's a social link mis-entered as an image URL
    if (url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('instagram.com'))) {
        const thumb = getVideoThumbnail(url);
        if (thumb) return thumb;
    }

    // If it's not a social link, use it as is if it exists
    if (url) return url;

    // Fallback to video URL thumbnail extraction
    if (videoUrlFallback) {
        return getVideoThumbnail(videoUrlFallback) || '';
    }

    return '';
};

export const getVideoThumbnail = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null;

    // YouTube Thumbnail
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('youtube.com/shorts/')[1].split('/')[0].split('?')[0];
        }

        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    }

    // Instagram Thumbnail
    if (url.includes('instagram.com')) {
        try {
            let cleanUrl = url.split('?')[0].split('#')[0];
            if (cleanUrl.endsWith('/')) {
                cleanUrl = cleanUrl.slice(0, -1);
            }

            // Convert any instagram post/reel/tv/p link to media endpoint
            return `${cleanUrl}/media/?size=l`;
        } catch (e) {
            return null;
        }
    }

    return null;
};
