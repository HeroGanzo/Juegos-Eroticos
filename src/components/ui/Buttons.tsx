"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingText = "Guardando...",
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

export function ConfirmButton({
  children,
  className,
  message = "¿Seguro que quieres eliminar este elemento? Esta acción no se puede deshacer.",
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
