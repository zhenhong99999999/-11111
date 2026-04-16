import React from 'react';
import { cn } from '../../lib/utils';

export const XiaomiLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-8 h-8 bg-mi-orange rounded-lg flex items-center justify-center font-bold text-lg text-white font-sans", className)}>
    m
  </div>
);
