import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

const features = [
  { title: "Plain-English Analysis", desc: "Turn a dense IEP into simple, clear guidance." },
  { title: "Rights Breakdown", desc: "Know the federal and state protections your child is entitled to." },
  { title: "Meeting Prep Kit", desc: "Scripts, questions, and emails tailored to your meeting." },
  { title: "Red Flag Alerts", desc: "Spot missing accommodations before the meeting." },
  { title: "Document Vault", desc: "Store IEPs, evaluations, and meeting notes securely." },
  { title: "Parent-Friendly UX", desc: "Built for families, not districts." }
];

const stats = [
  { label: "IEP children in the US", value: "7M+" },
  { label: "Parents feel excluded", value: "40%" },
  { label: "Minutes to understand", value: "5" }
];

const pains = [
  { title: "Confusion", icon: "C", desc: "IEPs are packed with legal jargon and unclear goals." },
  { title: "Fear", icon: "F", desc: "Meetings can feel intimidating without the right language." },
  { title: "Chaos", icon: "K", desc: "Docs live in email, drives, and folders with no system." }
];

const steps = [
  "Upload your IEP",
  "Answer a few child profile questions",
  "Get analysis, rights, and a meeting kit"
];

const testimonials = [
  "I finally understood the meeting agenda before walking in.",
  "The scripts helped me push back without fear."
];

export default function Landing() {
  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              Built for parents - 100% free
            </span>
            <h1 className="mt-4 text-4xl font-bold text-gray-800 md:text-5xl">Understand your child's IEP in minutes.</h1>
            <p className="mt-4 text-lg text-gray-600">
              IEP Desk turns dense documents into plain-English guidance, legal rights, and a meeting prep kit you can use immediately.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Join Waitlist - Free</Button>
              <Button variant="ghost">See How It Works</Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-center shadow-sm">
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-primary/20 bg-white/80">
            <h3 className="text-lg font-semibold text-gray-800">Why families use IEP Desk</h3>
            <p className="mt-3 text-sm text-gray-600">
              From first-time IEPs to annual reviews, get clarity, confidence, and a system for every document.
            </p>
            <div className="mt-4 grid gap-3">
              {pains.map((pain) => (
                <div key={pain.title} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-sm font-semibold text-primary">{pain.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-800">{pain.title}</div>
                    <div className="text-xs text-gray-500">{pain.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-primary">How it works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <Card key={step}>
                <div className="text-sm font-semibold text-primary">Step {idx + 1}</div>
                <p className="mt-2 text-gray-600">{step}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-primary">Features</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <h3 className="text-lg font-semibold text-gray-800">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-primary">What parents are saying</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {testimonials.map((quote) => (
              <Card key={quote}>
                <p className="text-sm text-gray-600">&quot;{quote}&quot;</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <Card className="border-primary/20 bg-white/85">
            <h2 className="text-2xl font-bold text-primary">Beta access - free for the first 100 families</h2>
            <p className="mt-2 text-sm text-gray-600">Get full access to analysis, rights, and meeting prep tools.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <input
                className="w-full max-w-xs rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Email address"
              />
              <Button>Join Waitlist - Free</Button>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
