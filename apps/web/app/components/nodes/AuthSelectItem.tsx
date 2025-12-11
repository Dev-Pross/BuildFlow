'use client';

import { SelectItem } from '@workspace/ui/components/select';
import React, { useEffect } from 'react';

interface AuthSelectItemProps {
  authUrl?: string | boolean;
  error?: string | boolean;
  success?: string | boolean;
}

export const AuthSelectItem = ({ authUrl, error, success }: AuthSelectItemProps) => {
  const [isSelected, setIsSelected] = React.useState(false);

  useEffect(() => {
    if (isSelected && typeof authUrl === 'string' && authUrl) {
      window.open(authUrl, '_blank', 'noopener,noreferrer');
      setIsSelected(false);
    }
  }, [isSelected, authUrl]);

  return (
    <SelectItem value='select node' onSelect={() => setIsSelected(true)}>
      {typeof authUrl === 'string' && authUrl ? 'No credentials, create new' : typeof error === 'string' ? error : typeof success === 'string' ? success : 'Processing...'}
    </SelectItem>
  );
};
