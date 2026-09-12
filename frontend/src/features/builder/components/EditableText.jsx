import { useEffect, useState } from "react";

export default function EditableText({
  value,
  onSave,
  multiline = false,
  className = "",
  placeholder = "",
}) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  const save = () => {
    if (text !== value) onSave(text);
  };

  if (multiline) {
    return (
      <textarea
        rows={4}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        className={`w-full resize-none border-none bg-transparent outline-none ${className}`}
      />
    );
  }

  return (
    <input
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={save}
      className={`w-full border-none bg-transparent outline-none ${className}`}
    />
  );
}
