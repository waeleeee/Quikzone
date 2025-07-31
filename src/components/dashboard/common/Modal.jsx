import React from "react";

const Modal = ({ isOpen, onClose, title, children, size = "md", className = "" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    xxl: "max-w-screen-2xl w-full", // Make xxl truly massive, nearly full screen
    "75": "w-11/12 max-w-7xl max-h-[90vh]", // Better centered 75% size
    "full": "w-full h-full max-w-none max-h-none", // Full screen
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className={`relative inline-block w-full max-h-full bg-white text-right overflow-hidden shadow-xl transform transition-all rounded-lg ${sizeClasses[size]} ${className}`}>
          {/* Header */}
          <div className={`bg-white px-6 pt-6 pb-6 sm:p-8 sm:pb-6 ${size === '75' || size === 'full' ? 'h-full overflow-y-auto' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl leading-6 font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">إغلاق</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal; 
