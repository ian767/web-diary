import React, { useEffect, useState, useRef } from 'react';
import './ImageLightbox.css';

const ImageLightbox = ({ images, currentIndex = 0, onClose, onNavigate }) => {
  const currentImage = images && images[currentIndex];
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Mobile gesture handling
  const touchStartRef = useRef(null);
  const lastDistanceRef = useRef(null);
  const swipeStartRef = useRef(null);

  // Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleArrowKeys = (e) => {
      if (!images || images.length <= 1) return;
      
      // Only navigate if not zoomed
      if (zoomLevel === 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
          onNavigate(prevIndex);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
          onNavigate(nextIndex);
        }
      }
    };

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(5, prev + delta)));
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleArrowKeys);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrowKeys);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, images, currentIndex, onNavigate, zoomLevel]);

  if (!currentImage || !images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;
  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(nextIndex);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(5, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(0.5, prev - 0.25);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      handleResetZoom();
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch-to-zoom gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastDistanceRef.current = distance;
      touchStartRef.current = { zoom: zoomLevel };
    } else if (e.touches.length === 1) {
      // Single touch - could be pan or swipe
      if (zoomLevel > 1) {
        // Pan when zoomed
        setIsPanning(true);
        setPanStart({ 
          x: e.touches[0].clientX - panPosition.x, 
          y: e.touches[0].clientY - panPosition.y 
        });
      } else {
        // Track swipe start for navigation/close
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      }
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling while interacting
    
    if (e.touches.length === 2 && lastDistanceRef.current) {
      // Pinch-to-zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (touchStartRef.current) {
        const scale = distance / lastDistanceRef.current;
        const newZoom = Math.max(0.5, Math.min(5, touchStartRef.current.zoom * scale));
        setZoomLevel(newZoom);
      }
    } else if (isPanning && zoomLevel > 1 && e.touches.length === 1) {
      // Pan when zoomed
      setPanPosition({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    setIsPanning(false);
    
    // Handle swipe gestures (only when not zoomed)
    if (zoomLevel === 1 && swipeStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      const deltaY = touch.clientY - swipeStartRef.current.y;
      const deltaTime = Date.now() - swipeStartRef.current.time;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Swipe threshold: 50px and < 300ms
      if (deltaTime < 300) {
        if (absDeltaX > absDeltaY && absDeltaX > 50) {
          // Horizontal swipe - navigate
          if (deltaX > 0 && hasMultipleImages) {
            goToPrevious();
          } else if (deltaX < 0 && hasMultipleImages) {
            goToNext();
          }
        } else if (absDeltaY > absDeltaX && absDeltaY > 50 && deltaY > 0) {
          // Swipe down - close
          onClose();
        }
      }
    }
    
    // Reset gesture tracking
    touchStartRef.current = null;
    lastDistanceRef.current = null;
    swipeStartRef.current = null;
  };

  return (
    <div 
      className="image-lightbox-overlay" 
      onClick={zoomLevel === 1 ? onClose : undefined}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="image-lightbox-content" 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        {/* Zoom controls */}
        <div className="lightbox-zoom-controls">
          <button 
            className="lightbox-zoom-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            aria-label="Zoom out"
            disabled={zoomLevel <= 0.5}
          >
            −
          </button>
          <span className="lightbox-zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button 
            className="lightbox-zoom-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            aria-label="Zoom in"
            disabled={zoomLevel >= 5}
          >
            +
          </button>
          {zoomLevel !== 1 && (
            <button 
              className="lightbox-zoom-reset" 
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              aria-label="Reset zoom"
            >
              Reset
            </button>
          )}
        </div>
        
        {hasMultipleImages && zoomLevel === 1 && (
          <>
            {/* Clickable gap area on the left */}
            <div 
              className="lightbox-nav-area lightbox-nav-area-left"
              onClick={onClose}
              aria-label="Close"
            />
            {/* Clickable gap area on the right */}
            <div 
              className="lightbox-nav-area lightbox-nav-area-right"
              onClick={onClose}
              aria-label="Close"
            />
            <button 
              className="lightbox-nav lightbox-prev" 
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 13L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="lightbox-nav lightbox-next" 
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 5L11 9L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
        
        <div 
          className="lightbox-image-container"
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none' // Prevent default touch behaviors
          }}
        >
          <img 
            ref={imageRef}
            src={currentImage.url} 
            alt={currentImage.alt || 'Diary attachment'} 
            className="lightbox-image"
            style={{
              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              transition: isPanning ? 'none' : 'transform 0.2s ease'
            }}
            draggable={false}
          />
        </div>
        {currentImage.filename && (
          <div className="lightbox-caption">{currentImage.filename}</div>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;


