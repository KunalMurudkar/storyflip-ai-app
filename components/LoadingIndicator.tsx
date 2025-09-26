import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-lg flex flex-col items-center max-w-2xl mx-auto">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-600 mb-6"></div>
      <h2 className="text-2xl font-bold text-purple-600 mb-2">Crafting your story...</h2>
      <p className="text-slate-500 max-w-md">{message}</p>
    </div>
  );
};
