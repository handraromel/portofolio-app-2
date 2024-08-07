import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import { useField } from "formik";
import "react-datepicker/dist/react-datepicker.css";

interface FieldInputProps {
  id: string;
  label: string;
  type: "text" | "textarea" | "datepicker" | "password";
  name: string;
  placeholder?: string;
  rows?: number;
}

const FieldInput: React.FC<FieldInputProps> = ({
  id,
  label,
  type,
  name,
  placeholder,
  rows,
}) => {
  const [field, meta, helpers] = useField(name);
  const [editorContent, setEditorContent] = useState<string>("");
  const [dateValue, setDateValue] = useState<Date | null>(null);

  useEffect(() => {
    if (type === "textarea" && typeof field.value === "string") {
      setEditorContent(field.value);
    }
    if (type === "datepicker" && field.value instanceof Date) {
      setDateValue(field.value);
    }
  }, [field.value, type]);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    helpers.setValue(event.target.value);
  };

  const handleDateInput = (date: Date | null) => {
    if (date) {
      setDateValue(date);
      helpers.setValue(date);
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    helpers.setValue(content);
  };

  const fieldClasses = `block w-full rounded-md border-0 p-2 text-gray-900 ring-1 ring-inset transition duration-300 ease-in-out placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
    meta.touched && meta.error
      ? "ring-red-500 focus:ring-red-500"
      : "ring-gray-300 focus:ring-indigo-500/50"
  }`;

  const tinymceConfig = {
    height: rows ? rows * 40 : 140,
    menubar: false,
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "searchreplace visualblocks code fullscreen",
      "insertdatetime media table paste code help wordcount",
    ],
    toolbar:
      "undo redo | formatselect | bold italic backcolor | \
      alignleft aligncenter alignright alignjustify | \
      bullist numlist outdent indent | removeformat | help",
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {type === "textarea" ? (
        <Editor
          id={id}
          apiKey={process.env.REACT_APP_EDITOR_KEY}
          value={editorContent}
          init={tinymceConfig}
          onEditorChange={handleEditorChange}
        />
      ) : type === "datepicker" ? (
        <DatePicker
          id={id}
          selected={dateValue}
          onChange={handleDateInput}
          name={name}
          placeholderText={placeholder}
          dateFormat="yyyy-MM-dd"
          className={fieldClasses}
        />
      ) : (
        <input
          {...field}
          id={id}
          type={type}
          className={fieldClasses}
          placeholder={placeholder}
        />
      )}
      {meta.touched && meta.error && (
        <span className="text-sm text-red-500">{meta.error}</span>
      )}
    </div>
  );
};

export default FieldInput;
