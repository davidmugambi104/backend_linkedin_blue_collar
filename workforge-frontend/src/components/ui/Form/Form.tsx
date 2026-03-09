import React from 'react';
import { cn } from '@lib/utils/cn';
import { FieldValues } from 'react-hook-form';
import { FormProps, FormFieldProps, FormLabelProps, FormErrorProps } from './Form.types';

export const Form = <T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormProps<T>) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {children}
    </form>
  );
};

export const FormField = <T extends FieldValues>({
  name,
  label,
  hint,
  required,
  children,
  className,
}: FormFieldProps<T>) => {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <FormLabel htmlFor={name} required={required}>
          {label}
        </FormLabel>
      )}
      {children}
      {hint && <p className="mt-1 text-sm text-gray-500 bg-text-gray-400">{hint}</p>}
    </div>
  );
};

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  required,
  className,
  htmlFor,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'mb-1 block text-sm font-medium text-gray-700 bg-text-gray-300',
        className
      )}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
};

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;
  
  return (
    <p className={cn('mt-1 text-sm text-red-600 bg-text-red-400', className)}>
      {error}
    </p>
  );
};

Form.displayName = 'Form';
FormField.displayName = 'FormField';
FormLabel.displayName = 'FormLabel';
FormError.displayName = 'FormError';