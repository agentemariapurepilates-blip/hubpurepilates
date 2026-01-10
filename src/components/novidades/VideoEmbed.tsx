interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

// Utility to extract video ID and type from various video URLs
export const parseVideoUrl = (url: string): { type: 'youtube' | 'vimeo' | 'drive' | null; id: string | null } => {
  if (!url) return { type: null, id: null };
  
  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] };
  }

  // Vimeo patterns
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }

  // Google Drive patterns
  const driveMatch = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/
  );
  if (driveMatch) {
    return { type: 'drive', id: driveMatch[1] };
  }

  return { type: null, id: null };
};

// Get embed URL based on video type
export const getEmbedUrl = (type: 'youtube' | 'vimeo' | 'drive', id: string): string => {
  switch (type) {
    case 'youtube':
      return `https://www.youtube.com/embed/${id}`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${id}`;
    case 'drive':
      return `https://drive.google.com/file/d/${id}/preview`;
    default:
      return '';
  }
};

const VideoEmbed = ({ url, title = 'Vídeo', className = '' }: VideoEmbedProps) => {
  const { type, id } = parseVideoUrl(url);
  
  if (!type || !id) {
    return null;
  }

  const embedUrl = getEmbedUrl(type, id);

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-muted ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoEmbed;
