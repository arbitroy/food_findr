import React from 'react';

const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-primary-light hover:bg-primary text-white',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
    text: 'text-primary hover:text-primary-dark underline',
};

const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) => {
    const baseClasses = 'rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50';
    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;