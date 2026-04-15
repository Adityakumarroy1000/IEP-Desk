export default function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
        <span>IEP Desk - built for parents.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">How It Works</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Terms</a>
        </div>
      </div>
    </footer>
  );
}
