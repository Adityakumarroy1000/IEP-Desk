import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

export default function ProfileCard({ profile }) {
  if (!profile) return null;
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800">Active Child Profile</h3>
      <div className="mt-4 grid gap-2 text-sm text-gray-600">
        <div><span className="font-semibold">Name:</span> {profile.childName}</div>
        <div><span className="font-semibold">Grade:</span> {profile.grade}</div>
        <div><span className="font-semibold">State:</span> {profile.state}</div>
        <div className="flex flex-wrap gap-2">
          {profile.diagnoses?.map((d) => (
            <Badge key={d}>{d}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
