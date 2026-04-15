import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerWithEmail(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <Card>
          <h2 className="text-xl font-semibold text-gray-800">Create your IEP Desk account</h2>
          <p className="text-sm text-gray-500">Start your first analysis in minutes.</p>
          <div className="mt-4">
            <Button className="w-full" onClick={loginWithGoogle}>Sign up with Google</Button>
          </div>
          <div className="my-4 text-center text-xs text-gray-400">or</div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
            <Button className="w-full" type="submit" disabled={loading}>{loading ? <Spinner label="Creating" /> : "Register"}</Button>
          </form>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-primary">Login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
