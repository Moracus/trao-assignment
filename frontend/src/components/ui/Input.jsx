export default function Input({
  label,
  error,
  register,
  ...props
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>

      <input
        {...register}
        {...props}
        className="w-full rounded-none border-2 bg-transparent px-4 py-3 outline-none transition focus:translate-x-1 focus:-translate-y-1 border-(--border)"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}