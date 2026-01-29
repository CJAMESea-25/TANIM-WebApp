import React from 'react';
import { useCropStore } from '@/stores/cropStore';

interface CropImageProps {
  cropName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDetails?: boolean;
}

export const CropImage: React.FC<CropImageProps> = ({
  cropName,
  size = 'md',
  className = '',
  showDetails = false
}) => {
  const { getCropInfo } = useCropStore();
  const cropInfo = getCropInfo(cropName);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  if (!cropInfo) {
    return (
      <div className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-2xl">🌱</span>
      </div>
    );
  }

  if (showDetails) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${className}`}>
        <img
          src={cropInfo.imageUrl}
          alt={cropInfo.name}
          className={`${sizeClasses[size]} object-cover rounded-md`}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjhkMzkxIi8+Cjwvc3ZnPgo=';
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{cropInfo.name}</h4>
          <p className="text-xs text-muted-foreground truncate">{cropInfo.category}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cropInfo.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={cropInfo.imageUrl}
        alt={cropInfo.name}
        className={`${sizeClasses[size]} object-cover rounded-md`}
        onError={(e) => {
          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjhkMzkxIi8+Cjwvc3ZnPgo=';
        }}
        title={`${cropInfo.name} - ${cropInfo.category}`}
      />
      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded-sm opacity-80 text-[8px]">
        {cropInfo.category.slice(0, 3).toUpperCase()}
      </div>
    </div>
  );
};