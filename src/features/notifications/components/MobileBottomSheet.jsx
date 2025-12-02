import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * MobileBottomSheet Component
 * Bottom sheet modal for mobile devices with drag handle and smooth animations
 */
const MobileBottomSheet = ({ isOpen, onClose, title, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - startY;

    // Only allow downward drag
    if (diff > 0) {
      setCurrentY(touchY);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = currentY - startY;
    
    // If dragged down more than 100px, close
    if (diff > 100) {
      onClose();
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Calculate transform based on drag
  const getTransform = () => {
    if (!isDragging) return 'translateY(0)';
    
    const diff = currentY - startY;
    return diff > 0 ? `translateY(${diff}px)` : 'translateY(0)';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] animate-fade-in md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[999]
          bg-white dark:bg-gray-900
          rounded-t-3xl shadow-2xl
          max-h-[85vh] h-[75vh]
          flex flex-col
          md:hidden
          ${isOpen ? 'animate-slide-up' : ''}
        `}
        style={{
          transform: getTransform(),
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Drag Handle Area */}
        <div
          className="py-3 px-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg 
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
};

export default MobileBottomSheet;
