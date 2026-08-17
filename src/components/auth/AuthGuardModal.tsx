'use client';

import React from 'react';
import QuickPinPadModal from './QuickPinPadModal';
import { UserRole } from '@/context/AppContext';

interface AuthGuardModalProps {
  requiredRole: 'cashier' | 'kitchen' | 'admin';
  title?: string;
  onSuccess?: (role: UserRole) => void;
  onClose?: () => void;
}

export default function AuthGuardModal({
  requiredRole,
  title,
  onSuccess,
  onClose,
}: AuthGuardModalProps) {
  return (
    <QuickPinPadModal
      requiredRole={requiredRole}
      initialRole={requiredRole}
      title={title}
      isOpen={true}
      onSuccess={onSuccess}
      onClose={onClose}
    />
  );
}
