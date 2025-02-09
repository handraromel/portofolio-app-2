import React, { useState, useEffect } from "react";
import { Editor } from "primereact/editor";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Calendar } from "primereact/calendar";
import { useField } from "formik";
import { css } from "./style";

interface FieldInputProps {
  id: string;
  label: string;
  type: "text" | "textarea" | "datepicker" | "password";
  name: string;
  placeholder?: string;
  rows?: number;
  passwordFeedback?: boolean;
}

const FieldInput: React.FC<FieldInputProps> = ({
  id,
  label,
  type,
  name,
  placeholder,
  rows,
  passwordFeedback = false,
}) => {
  const [field, meta, helpers] = useField(name);
  const [editorContent, setEditorContent] = useState<string>("");

  useEffect(() => {
    if (type === "textarea" && typeof field.value === "string") {
      setEditorContent(field.value);
    }
  }, [field.value, type]);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    helpers.setValue(content);
  };

  const handleCalendarChange = (e: { value: Date | undefined | null }) => {
    helpers.setValue(e.value ?? null);
  };

  const getInputComponent = () => {
    const hasError = meta.touched && meta.error;

    switch (type) {
      case "textarea":
        return (
          <Editor
            id={id}
            value={editorContent}
            onTextChange={(e) => handleEditorChange(e.htmlValue || "")}
            style={{ height: rows ? `${rows * 40}px` : "280px" }}
          />
        );
      case "password":
        return (
          <Password
            id={id}
            {...field}
            toggleMask
            feedback={passwordFeedback}
            className="p-inputtext-sm w-full"
            placeholder={placeholder}
            invalid={!!hasError}
            pt={css.passwordStyles}
          />
        );
      case "datepicker":
        return (
          <Calendar
            id={id}
            value={field.value ? new Date(field.value) : null}
            onChange={handleCalendarChange}
            dateFormat="yy-mm-dd"
            placeholder={placeholder}
            invalid={!!hasError}
            className="p-inputtext-sm w-full"
          />
        );
      default:
        return (
          <InputText
            id={id}
            {...field}
            type={type}
            placeholder={placeholder}
            invalid={!!hasError}
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
      {getInputComponent()}
      {meta.touched && meta.error && (
        <small className="p-error">{meta.error}</small>
      )}
    </div>
  );
};

export default FieldInput;
