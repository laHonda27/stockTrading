import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className={`border-4 border-blue-600 border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${className}`}></div>
    );
};

export default LoadingSpinner;