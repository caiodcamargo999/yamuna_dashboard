"use client";

import { X, Play } from "lucide-react";
import { useEffect } from "react";

interface CreativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    creative: {
        name: string;
        imageUrl?: string;
        videoUrl?: string;
        type: 'image' | 'video';
    } | null;
}

export function CreativeModal({ isOpen, onClose, creative }: CreativeModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !creative) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-white truncate max-w-[80%]">
                        {creative.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {creative.type === 'video' && creative.videoUrl ? (
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                                controls
                                autoPlay
                                muted
                                playsInline
                                loop
                                className="w-full h-full"
                                src={creative.videoUrl}
                                onError={(e) => {
                                    console.error("Video failed to load:", creative.videoUrl);
                                }}
                            >
                                Seu navegador não suporta vídeo.
                            </video>
                        </div>
                    ) : creative.imageUrl ? (
                        <div className="relative w-full">
                            <img
                                src={creative.imageUrl}
                                alt={creative.name}
                                className="w-full h-auto rounded-lg"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-slate-800 rounded-lg">
                            <p className="text-slate-400">Nenhuma mídia disponível</p>
                        </div>
                    )}
                </div>

                {/* Footer with metadata */}
                <div className="border-t border-slate-800 p-4 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-1 bg-slate-800 rounded">
                            {creative.type === 'video' ? '📹 Vídeo' : '🖼️ Imagem'}
                        </span>
                        <span className="px-2 py-1 bg-slate-800 rounded">
                            Meta Ads Creative
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
