import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className = '',
      disabled,
      fullWidth = false,
      leadingIcon,
      loading = false,
      size = 'md',
      trailingIcon,
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) {
    const classes = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth ? 'button--full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        aria-busy={loading || undefined}
        className={classes}
        disabled={disabled || loading}
        ref={ref}
        type={type}
        {...props}
      >
        {loading ? (
          <span aria-hidden="true" className="button__spinner" />
        ) : leadingIcon ? (
          <Icon name={leadingIcon} size={18} />
        ) : null}
        <span>{children}</span>
        {trailingIcon && !loading ? (
          <Icon name={trailingIcon} size={18} />
        ) : null}
      </button>
    );
  },
);

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: IconName;
  label: string;
  size?: 'sm' | 'md';
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className = '', icon, label, size = 'md', type = 'button', ...props },
    ref,
  ) {
    return (
      <button
        aria-label={label}
        className={`icon-button icon-button--${size} ${className}`.trim()}
        ref={ref}
        title={label}
        type={type}
        {...props}
      >
        <Icon name={icon} size={size === 'sm' ? 17 : 20} />
      </button>
    );
  },
);

export type ButtonContent = ReactNode;
