'use client';

import React, { useState, useCallback, useMemo, memo, Component, type ErrorInfo, type ReactNode } from 'react';
import Image from 'next/image';

// Fix 3: ErrorBoundary to prevent image errors from crashing the entire page
class ImageErrorBoundary extends Component<
  { children: ReactNode; fallbackSrc: string; width?: number; height?: number; alt: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallbackSrc: string; width?: number; height?: number; alt: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('AppImage ErrorBoundary caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render a simple fallback <img> tag — no next/image optimization to avoid further crashes
      return (
        <img
          src={this.props.fallbackSrc}
          alt={this.props.alt}
          width={this.props.width || 40}
          height={this.props.height || 40}
          style={{ objectFit: 'cover' }}
        />
      );
    }
    return this.props.children;
  }
}

interface AppImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    fill?: boolean;
    sizes?: string;
    onClick?: () => void;
    fallbackSrc?: string;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
    [key: string]: any;
}

const AppImage = memo(function AppImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    quality = 85,
    placeholder = 'empty',
    blurDataURL,
    fill = false,
    sizes,
    onClick,
    fallbackSrc = '/assets/images/no_image.png',
    loading = 'lazy',
    unoptimized: unoptimizedProp,
    ...props
}: AppImageProps) {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Fix 3: Determine if unoptimized should be forced
    // External URLs and local assets should skip the optimization pipeline to prevent crashes
    const isExternalUrl = useMemo(() => typeof imageSrc === 'string' && imageSrc.startsWith('http'), [imageSrc]);
    const isLocalAsset = useMemo(() => typeof imageSrc === 'string' && imageSrc.startsWith('/'), [imageSrc]);
    const resolvedUnoptimized = unoptimizedProp !== undefined ? unoptimizedProp : (isExternalUrl || isLocalAsset);

    const handleError = useCallback(() => {
        try {
            if (!hasError && imageSrc !== fallbackSrc) {
                setImageSrc(fallbackSrc);
                setHasError(true);
            }
        } catch {
            // Prevent cascade failures
        }
        setIsLoading(false);
    }, [hasError, imageSrc, fallbackSrc]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    const imageClassName = useMemo(() => {
        const classes = [className];
        if (isLoading) classes.push('bg-gray-200');
        if (onClick) classes.push('cursor-pointer hover:opacity-90 transition-opacity duration-200');
        return classes.filter(Boolean).join(' ');
    }, [className, isLoading, onClick]);

    const imageProps = useMemo(() => {
        const baseProps: any = {
            src: imageSrc,
            alt,
            className: imageClassName,
            quality,
            placeholder,
            unoptimized: resolvedUnoptimized,
            onError: handleError,
            onLoad: handleLoad,
            onClick,
        };

        if (priority) {
            baseProps.priority = true;
        } else {
            baseProps.loading = loading;
        }

        if (blurDataURL && placeholder === 'blur') {
            baseProps.blurDataURL = blurDataURL;
        }

        return baseProps;
    }, [imageSrc, alt, imageClassName, quality, placeholder, blurDataURL, resolvedUnoptimized, priority, loading, handleError, handleLoad, onClick]);

    // Fix 3: Wrap in ErrorBoundary to prevent image errors from crashing the page
    if (fill) {
        return (
            <ImageErrorBoundary fallbackSrc={fallbackSrc} alt={alt} width={width} height={height}>
                <div className="relative" style={{ width: '100%', height: '100%' }}>
                    <Image
                        {...imageProps}
                        fill
                        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                        style={{ objectFit: 'cover' }}
                        {...props}
                    />
                </div>
            </ImageErrorBoundary>
        );
    }

    return (
        <ImageErrorBoundary fallbackSrc={fallbackSrc} alt={alt} width={width} height={height}>
            <Image
                {...imageProps}
                width={width || 400}
                height={height || 300}
                sizes={sizes}
                {...props}
            />
        </ImageErrorBoundary>
    );
});

AppImage.displayName = 'AppImage';

export default AppImage;