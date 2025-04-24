import { useState, FormEvent } from "react";
import { useSignIn } from "convex/react-auth";

export function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useSignIn();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate credentials
    if (!["morpheus", "elisa"].includes(username)) {
      setError("Ungültiger Benutzername");
      return;
    }

    const validPasswords = {
      morpheus: "redpill123",
      elisa: "followthewhiterabbit"
    };

    if (password !== validPasswords[username as keyof typeof validPasswords]) {
      setError("Ungültiges Passwort");
      return;
    }

    try {
      await signIn({ username, password });
    } catch (error) {
      setError("Anmeldung fehlgeschlagen");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black font-mono text-[#00ff99]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        `}
      </style>

      <h1 className="text-5xl tracking-[10px] text-shadow-glow mb-10">NEO – AI ASSISTENT</h1>

      <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-[#00ff99] p-10 rounded-xl shadow-glow flex flex-col items-center w-[300px]">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Benutzername"
          className="bg-black border border-[#00ff99] text-[#00ff99] p-2 mb-4 w-full rounded-md"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="bg-black border border-[#00ff99] text-[#00ff99] p-2 mb-4 w-full rounded-md"
        />
        <button
          type="submit"
          className="bg-[#00ff99] text-black py-2 px-4 rounded-md w-full hover:bg-black hover:text-[#00ff99] hover:border hover:border-[#00ff99] transition-all"
        >
          Anmelden
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </form>

      <div className="absolute bottom-5 text-lg opacity-60 tracking-[2px]">
        WAKE UP… THE MATRIX HAS YOU.
      </div>
    </div>
  );
}
