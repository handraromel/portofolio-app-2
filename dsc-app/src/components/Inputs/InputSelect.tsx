import React from "react";
import { Dropdown } from "primereact/dropdown";
import { Controller, useFormContext } from "react-hook-form";

interface Option {
  label: string;
  value: string;
}

interface FieldSelectProps {
  id: string;
  label: string;
  name: string;
  options: Option[];
  placeholder?: string;
}

export const FieldSelect: React.FC<FieldSelectProps> = ({
  id,
  label,
  name,
  options,
  placeholder,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="field">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Dropdown
            id={id}
            value={field.value}
            options={options}
            onChange={(e) => field.onChange(e.value)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            className="p-inputtext-sm w-full"
            invalid={!!error}
          />
        )}
      />
      {error && <small className="p-error">{error}</small>}
    </div>
  );
};

export default FieldSelect;
