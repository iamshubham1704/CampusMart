import React from 'react';
import styles from '../app/styles/ModernButtons.module.css';

const ModernButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  outline = false,
  disabled = false,
  loading = false,
  icon = null,
  iconOnly = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // Build class names
  const buttonClasses = [
    styles.btn,
    styles[`btn${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    size !== 'medium' && styles[`btn${size.charAt(0).toUpperCase() + size.slice(1)}`],
    outline && styles.btnOutline,
    iconOnly && styles.btnIcon,
    loading && styles.btnLoading,
    className
  ].filter(Boolean).join(' ');

  // Handle icon positioning
  const renderContent = () => {
    if (loading) {
      return null; // Loading spinner will be shown via CSS
    }

    if (iconOnly && icon) {
      return icon;
    }

    if (icon) {
      return (
        <>
          {icon}
          {children}
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

// Button Group Component
export const ButtonGroup = ({ children, vertical = false, className = '', ...props }) => {
  const groupClasses = [
    styles.btnGroup,
    vertical && styles.btnGroupVertical,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} {...props}>
      {children}
    </div>
  );
};

// Floating Action Button Component
export const FloatingButton = ({ children, className = '', ...props }) => {
  const floatingClasses = [
    styles.btn,
    styles.btnPrimary,
    styles.btnFloating,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={floatingClasses} {...props}>
      {children}
    </button>
  );
};

// Export the main button component
export default ModernButton;

// Usage Examples:
/*
// Basic usage
<ModernButton variant="primary" onClick={handleClick}>
  Click Me
</ModernButton>

// With icon
<ModernButton variant="success" icon={<ShoppingCart size={16} />}>
  Add to Cart
</ModernButton>

// Outline variant
<ModernButton variant="danger" outline>
  Delete
</ModernButton>

// Different sizes
<ModernButton variant="primary" size="large">
  Large Button
</ModernButton>

// Loading state
<ModernButton variant="primary" loading>
  Processing...
</ModernButton>

// Icon only
<ModernButton variant="info" icon={<Plus size={20} />} iconOnly />

// Button group
<ButtonGroup>
  <ModernButton variant="primary">Save</ModernButton>
  <ModernButton variant="secondary">Cancel</ModernButton>
</ButtonGroup>

// Floating action button
<FloatingButton onClick={handleAdd}>
  <Plus size={24} />
</FloatingButton>
*/
