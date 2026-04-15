export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></span>
      <span>{label}</span>
    </div>
  );
}
