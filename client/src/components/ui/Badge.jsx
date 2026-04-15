export default function Badge({ children, tone = "default" }) {
  const styles = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-success",
    warning: "bg-amber-100 text-warning",
    danger: "bg-red-100 text-danger"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}
