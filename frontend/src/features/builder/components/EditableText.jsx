import { useEffect, useRef, useState } from "react";

export default function EditableText({
  value,
  onSave,
  multiline = false,
  className = "",
  placeholder = "",
}) {
  const [text, setText] = useState(value ?? "");
  const timerRef = useRef(null);

  useEffect(() => setText(value ?? ""), [value]);

  const save = (nextText = text) => {
    if (nextText !== value) onSave(nextText);
  };

  const handleChange = (nextText) => {
    setText(nextText);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      save(nextText);
    }, 500);
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const commonProps = {
    value: text,
    placeholder,
    onChange: (e) => handleChange(e.target.value),
    onBlur: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      save();
    },
    className: `w-full border-none bg-transparent outline-none ${className}`,
  };

  if (multiline) {
    return <textarea rows={4} {...commonProps} className={`w-full resize-none border-none bg-transparent outline-none ${className}`} />;
  }

  return <input {...commonProps} />;
}
