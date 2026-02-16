import { ReactNode } from 'react';
import { FieldValues, UseFormReturn, Path } from 'react-hook-form';

export interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  children: ReactNode;
  className?: string;
}

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export interface FormLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export interface FormErrorProps {
  error?: string;
  className?: string;
}