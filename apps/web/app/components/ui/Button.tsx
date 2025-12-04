import React, { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bgColor?: string
  textColor?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  variant?: 'solid' | 'outline' | 'ghost'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      size = 'md',
      bgColor = 'bg-blue-600',
      textColor = 'text-white',
      rounded = 'md',
      variant = 'solid',
      fullWidth = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    }

    // Rounded classes
    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    }

    // Variant styles
    const getVariantClasses = () => {
      switch (variant) {
        case 'outline':
          return `border-2 ${bgColor.replace('bg-', 'border-')} ${textColor.replace('text-', 'text-')} bg-transparent hover:${bgColor} hover:text-white`
        case 'ghost':
          return `${textColor} bg-transparent hover:${bgColor.replace('600', '100')}`
        case 'solid':
        default:
          return `${bgColor} ${textColor} hover:opacity-90`
      }
    }

    const baseClasses = ' font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0 focus:ring-offset-1'
    const widthClass = fullWidth ? 'w-full' : ''

    const buttonClasses = `
      ${baseClasses}
      ${sizeClasses[size]}
      ${roundedClasses[rounded]}
      ${getVariantClasses()}
      ${widthClass}
      ${className}
    `.trim().replace(/\s+/g, ' ')

    return (
      <button
        ref={ref}
        type="button"
        className={buttonClasses}
        {...props}
      >
        {children || text}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button



{/* <Button text="Small" size="sm" />
<Button text="Medium" size="md" />
<Button text="Large" size="lg" />
<Button text="Extra Large" size="xl" />

// Different colors
<Button text="Blue" bgColor="bg-blue-600" textColor="text-white" />
<Button text="Red" bgColor="bg-red-600" textColor="text-white" />
<Button text="Green" bgColor="bg-green-600" textColor="text-white" />
<Button text="Purple" bgColor="bg-purple-600" textColor="text-white" />

// Different variants
<Button text="Solid" variant="solid" bgColor="bg-blue-600" />
<Button text="Outline" variant="outline" bgColor="bg-blue-600" />
<Button text="Ghost" variant="ghost" bgColor="bg-blue-600" textColor="text-blue-600" />

// Different rounded corners
<Button text="No Round" rounded="none" />
<Button text="Small Round" rounded="sm" />
<Button text="Medium Round" rounded="md" />
<Button text="Large Round" rounded="lg" />
<Button text="Full Round" rounded="full" />

// Full width
<Button text="Full Width" fullWidth />

// Combined props
<Button 
  text="Submit" 
  size="lg" 
  bgColor="bg-green-600" 
  textColor="text-white" 
  rounded="full" 
  fullWidth 
/>

// With onClick
<Button 
  text="Delete" 
  bgColor="bg-red-600" 
  onClick={() => console.log('Deleted!')} 
/>

// Disabled
<Button text="Disabled" disabled />

// Using children instead of text
<Button size="lg" bgColor="bg-purple-600">
  <span>Custom Content</span>
</Button> */}