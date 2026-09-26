import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  AlertTriangle, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Maximize2 
} from 'lucide-react';
import { getFileUrl } from '../../services/api';

/**
 * Fullscreen Lightbox Modal for Citizen Evidence Photos
 */
export const PhotoLightbox = ({ isOpen, photos = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length, onClose]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const resolvedUrl = getFileUrl(currentPhoto);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="w-full flex items-center justify-between text-white/90 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-bold bg-white/[0.06]/10 px-3 py-1 rounded-full border border-white/20">
            Photo {currentIndex + 1} of {photos.length}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={resolvedUrl}
            download={`evidence_photo_${currentIndex + 1}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/[0.06]/10 hover:bg-white/[0.06]/20 text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold"
            title="Download Original High-Res"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.06]/10 hover:bg-white/[0.06]/20 text-white transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="relative flex-1 w-full flex items-center justify-center py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
            className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={resolvedUrl}
          alt={`Citizen Field Evidence ${currentIndex + 1}`}
          className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-all select-none"
        />

        {photos.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple) */}
      {photos.length > 1 && (
        <div 
          className="flex items-center space-x-2 overflow-x-auto py-2 px-3 bg-black/40 rounded-2xl border border-white/10 max-w-xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                currentIndex === idx ? 'border-teal scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={getFileUrl(url)}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Thumbnail Grid with Lightbox Trigger for Photos
 */
export const PhotoThumbnailGrid = ({ photos = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
          <span>Field Evidence Photos ({photos.length})</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {photos.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                setLightboxOpen(true);
              }}
              className="group relative aspect-square w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-white/10 overflow-hidden shadow-xs hover:shadow-float-hover hover:border-teal transition-all cursor-zoom-in"
              title="Click to view full image in lightbox"
            >
              <img
                src={getFileUrl(url)}
                alt={`Field Photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <PhotoLightbox
        isOpen={lightboxOpen}
        photos={photos}
        initialIndex={selectedIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

/**
 * Styled Inline Audio Player for Citizen Voice Notes
 */
export const CitizenAudioPlayer = ({ src, label = "Citizen Voice Note" }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(!src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio play prevented or failed", err);
        setHasError(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoaded(true);
      setHasError(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration || hasError) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newRatio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Fallback state if audio is unavailable or fails to load
  if (hasError || !src) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/[0.06]/90 border border-white/10 rounded-xl text-xs text-slate-500 w-fit">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="font-semibold text-slate-300">Evidence unavailable</span>
        <span className="text-[11px] text-slate-400">(Voice note could not be retrieved)</span>
      </div>
    );
  }

  const resolvedUrl = getFileUrl(src);

  return (
    <div className="bg-gradient-to-r from-teal-50/60 via-white to-slate-50 border border-teal-200/80 rounded-xl p-3 shadow-xs space-y-2 max-w-md">
      <audio
        ref={audioRef}
        src={resolvedUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 font-bold text-white">
          <Mic className="w-3.5 h-3.5 text-teal" />
          <span>{label}</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 font-semibold">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Scrubber & Controls */}
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-xl bg-navy hover:bg-navy-light text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
          title={isPlaying ? "Pause" : "Play Voice Note"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          )}
        </button>

        {/* Progress Bar Scrubber */}
        <div 
          onClick={handleSeek}
          className="flex-1 h-3.5 bg-slate-200/70 hover:bg-white/[0.12] rounded-full cursor-pointer relative overflow-hidden transition-colors"
          title="Click to seek"
        >
          <div 
            className="h-full bg-teal transition-[width] duration-75 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Playback Speed Toggle */}
        <button
          type="button"
          onClick={toggleSpeed}
          className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.06] text-[11px] font-mono font-bold text-white transition-colors shrink-0"
          title="Change playback speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

export default {
  PhotoLightbox,
  PhotoThumbnailGrid,
  CitizenAudioPlayer
};
