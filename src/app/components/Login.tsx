import { useState } from "react";
import { useNavigate } from "react-router";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-200 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-4 border-neutral-900 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-mono border-b-2 border-neutral-900 pb-4 mb-2">
              PLATAFORMA DE ANÁLISE DE VAGAS
            </h1>
            <p className="text-sm text-neutral-600">TELA DE LOGIN</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-mono mb-2 text-neutral-700">
                ENDEREÇO DE EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900"
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-mono mb-2 text-neutral-700">
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-3 border-2 border-neutral-900 hover:bg-neutral-700 font-mono"
            >
              [ENTRAR]
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-neutral-300">
            <button className="text-sm text-neutral-600 hover:text-neutral-900 font-mono">
              [Esqueceu a senha?]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}