import React from "react";

export interface RadiologyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  children?: React.ReactNode;
}

const RadiologyPopup: React.FC<RadiologyPopupProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      data-testid="popup-overlay"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-11/12 h-4/5 max-w-7xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="popup-content"
      >
        <div id="image-container" className="w-full h-full flex items-center justify-center">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Radiology" 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RadiologyPopup;
