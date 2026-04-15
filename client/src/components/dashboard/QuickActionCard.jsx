import { Link } from "react-router-dom";
import Card from "../ui/Card.jsx";

export default function QuickActionCard({ title, description, to, icon, accent = "bg-white" }) {
  return (
    <Card className={`flex flex-col justify-between gap-3 border-white/70 ${accent}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Link to={to} className="text-sm font-semibold text-primary">Go -&gt;</Link>
    </Card>
  );
}
