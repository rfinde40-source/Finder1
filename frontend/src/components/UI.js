import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  disabled = false,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
    outline: "border border-input bg-background hover:bg-muted rounded-xl",
    ghost: "hover:bg-muted rounded-xl",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
    link: "text-primary underline-offset-4 hover:underline"
  };
  
  const sizes = {
    sm: "h-9 px-4 text-sm",
    default: "h-11 px-6 py-2",
    lg: "h-14 px-8 text-lg font-semibold",
    icon: "h-10 w-10"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ 
  className = '', 
  type = 'text',
  error = false,
  ...props 
}) {
  return (
    <input
      type={type}
      className={`
        w-full h-12 rounded-xl border bg-background px-4 py-2 text-sm
        placeholder:text-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${error ? 'border-destructive' : 'border-input'}
        ${className}
      `}
      {...props}
    />
  );
}

export function Textarea({ 
  className = '', 
  error = false,
  ...props 
}) {
  return (
    <textarea
      className={`
        w-full min-h-[100px] rounded-xl border bg-background px-4 py-3 text-sm
        placeholder:text-muted-foreground resize-none
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${error ? 'border-destructive' : 'border-input'}
        ${className}
      `}
      {...props}
    />
  );
}

export function Select({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <select
      className={`
        w-full h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiIHN0cm9rZT0iIzcxNzE3QSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] 
        bg-[length:16px] bg-[right_12px_center] bg-no-repeat
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-card rounded-2xl border border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`shimmer rounded-xl ${className}`} />
  );
}

export function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <svg 
      className={`animate-spin text-primary ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <Icon size={32} className="text-muted-foreground" />
        </div>
      )}
      <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
