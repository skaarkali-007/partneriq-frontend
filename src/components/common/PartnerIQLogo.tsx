import React from 'react';
import { Link } from 'react-router-dom';
import { LOGO_SIZES } from '../../constants/brand';

export interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'dark';
  className?: string;
  clickable?: boolean;
}

const PartnerIQLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  clickable = true
}) => {
  const dimensions = LOGO_SIZES[size];

  const logoImage = (
    <img
      src="/partner-iq-logo.svg"
      alt="Partner IQ"
      width={dimensions.width}
      height={dimensions.height}
      className={`${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    />
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-block">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
};

export default PartnerIQLogo;