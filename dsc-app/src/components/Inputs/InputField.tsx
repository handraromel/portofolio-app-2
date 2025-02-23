import React, { useState } from "react";
import { Editor } from "primereact/editor";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Calendar } from "primereact/calendar";
import {
  Controller,
  useFormContext,
  ControllerRenderProps,
} from "react-hook-form";
import { css } from "./style";

interface FieldInputProps {
  id: string;
  label: string;
  type: "text" | "textarea" | "datepicker" | "password";
  name: string;
  placeholder?: string;
  rows?: number;
  passwordFeedback?: boolean;
  onBlur?: (value: string) => void | Promise<void>;
}

export const InputField: React.FC<FieldInputProps> = ({
  id,
  label,
  type,
  name,
  placeholder,
  rows,
  passwordFeedback = false,
  onBlur,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const [editorContent, setEditorContent] = useState<string>("");
  const error = errors[name]?.message as string;

  const getInputComponent = (
    field: ControllerRenderProps<Record<string, string>>,
  ) => {
    const hasError = !!error;

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        await onBlur(e.target.value);
      }
      field.onBlur();
    };

    switch (type) {
      case "textarea":
        return (
          <Editor
            id={id}
            value={editorContent}
            onTextChange={(e) => {
              setEditorContent(e.htmlValue || "");
              field.onChange(e.htmlValue || "");
            }}
            style={{ height: rows ? `${rows * 40}px` : "280px" }}
          />
        );
      case "password":
        return (
          <Password
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={handleBlur}
            toggleMask
            feedback={passwordFeedback}
            className="p-inputtext-sm w-full"
            placeholder={placeholder}
            invalid={hasError}
            pt={css.passwordStyles}
          />
        );
      case "datepicker":
        return (
          <Calendar
            id={id}
            value={field.value ? new Date(field.value) : null}
            onChange={(e) => field.onChange(e.value)}
            onBlur={handleBlur}
            dateFormat="yy-mm-dd"
            placeholder={placeholder}
            invalid={hasError}
            className="p-inputtext-sm w-full"
          />
        );
      default:
        return (
          <InputText
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={handleBlur}
            type={type}
            placeholder={placeholder}
            invalid={hasError}
            className="p-inputtext-sm w-full"
          />
        );
    }
  };

  return (
    <div className="field">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => getInputComponent(field)}
      />
      {error && <small className="p-error">{error}</small>}
    </div>
  );
};
