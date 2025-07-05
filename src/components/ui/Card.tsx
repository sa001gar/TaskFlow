import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white shadow-soft border border-gray-200',
    elevated: 'bg-white shadow-medium border border-gray-200',
    outlined: 'bg-white border-2 border-primary-dark',
  };

  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -4, scale: 1.02, boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)' },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={`rounded-2xl ${variants[variant]} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`p-6 pb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <h3 className={`text-xl font-bold text-primary-dark ${className}`} {...props}>
      {children}
    </h3>
  );
};