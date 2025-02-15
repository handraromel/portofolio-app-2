import React from "react";
import { Dropdown } from "primereact/dropdown";
import { useField } from "formik";

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
  const [field, meta, helpers] = useField(name);

  const handleChange = (e: { value: string }) => {
    helpers.setValue(e.value);
  };

  return (
    <div className="field">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <Dropdown
        id={id}
        name={name}
        value={field.value}
        options={options}
        onChange={handleChange}
        placeholder={placeholder}
        className="p-inputtext-sm w-full"
        invalid={!!(meta.touched && meta.error)}
      />
      {meta.touched && meta.error && (
        <small className="p-error">{meta.error}</small>
      )}
    </div>
  );
};
