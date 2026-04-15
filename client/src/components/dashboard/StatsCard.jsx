import Card from "../ui/Card.jsx";

export default function StatsCard({ label, value }) {
  return (
    <Card className="text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Card>
  );
}
