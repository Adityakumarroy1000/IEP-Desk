export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block text-sm text-gray-700">
      {label && <span className="mb-2 block text-sm text-gray-600">{label}</span>}
      <input
        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    </label>
  );
}
