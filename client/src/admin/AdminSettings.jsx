import Navbar from "../components/layout/Navbar.jsx";
import PageWrapper from "../components/layout/PageWrapper.jsx";
import Card from "../components/ui/Card.jsx";

export default function AdminSettings() {
  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <PageWrapper title="Admin Settings">
        <Card>
          <p className="text-sm text-gray-600">App-wide settings can be managed here.</p>
        </Card>
      </PageWrapper>
    </div>
  );
}
