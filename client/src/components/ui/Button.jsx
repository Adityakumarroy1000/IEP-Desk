export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  onClick
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark disabled:bg-primary/60",
    ghost: "bg-white text-primary border border-primary/30 hover:bg-primary-light",
    danger: "bg-danger text-white hover:bg-red-700 disabled:bg-danger/60"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
