import React from 'react';

export type ViewType = 'home' | 'experience';

export interface Device {
  name: string;
  action: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface StepData {
  title: string;
  step: number;
  totalSteps: number;
  description: string;
  bgColor: string;
  car: {
    content: React.ReactNode;
    animation: string;
  };
  phone: {
    content: React.ReactNode;
    animation: string;
  };
  home: {
    content: React.ReactNode;
    animation: string;
  };
}
