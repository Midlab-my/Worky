/**
 * Tratamento generico e seguro de mensagens de erro para UI.
 * Impede vazamento de:
 * - Stack traces e nomes de classes/funcoes internas
 * - Detalhes tecnicos de banco (SQL, PostgreSQL, colunas, tabelas, RLS)
 * - Nomes de servidores, portas, IPs internos e endpoints
 * - Erros de rede crus (TypeError, Failed to fetch, CORS)
 */

const TECHNICAL_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /typeerror/i,
  /referenceerror/i,
  /syntaxerror/i,
  /err_connection/i,
  /econnrefused/i,
  /cors/i,
  /net::/i,
  /status code \d+/i,
  /\.tsx?\b/i,
  /\.jsx?\b/i,
  /at Object\./i,
  /at async /i,
  /traceback/i,
  /exception/i,
  /sqlalchemy/i,
  /psycopg/i,
  /postgres/i,
  /supabase\.co/i,
  /127\.0\.0\.1|localhost:\d+/i,
  /relation ".*" does not exist/i,
  /duplicate key value/i,
  /violates foreign key/i,
  /permission denied for/i,
  /null value in column/i,
  /column ".*" of relation/i,
  /token is expired/i,
  /jwt expired/i,
  /invalid signature/i,
  /internal server error/i,
];

const KNOWN_SAFE_MESSAGES = [
  "Entre novamente para continuar.",
  "Sessao invalida ou expirada.",
  "E-mail ou senha incorretos.",
  "E-mail ainda nao confirmado. Verifique sua caixa de entrada.",
  "Este e-mail ja possui conta. Faca login ou use outro e-mail.",
  "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
  "Muitas requisicoes. Aguarde um momento e tente de novo.",
  "Servidor ocupado. Tente novamente mais tarde.",
  "Senha fraca: preencha todos os requisitos de seguranca.",
  "As senhas nao coincidem.",
  "Informe seu e-mail.",
  "Informe sua senha.",
  "Codigo incorreto ou expirado.",
  "Voce precisa aceitar os termos e a politica de privacidade.",
  "Nao foi possivel conectar agora. Verifique sua conexao e tente de novo.",
];

export function toUserErrorMessage(error: unknown, fallback = "Ocorreu um erro ao processar sua solicitacao. Tente novamente."): string {
  if (!error) return fallback;

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";

  const message = raw.trim();
  if (!message) return fallback;

  // Se o erro conter qualquer indicio de informacao tecnica ou de infraestrutura
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(message)) {
      return fallback;
    }
  }

  // Se a mensagem for muito longa, provavelmente e dump de servidor
  if (message.length > 200) {
    return fallback;
  }

  // Verifica se e mensagem de negocio segura conhecida
  const isKnown = KNOWN_SAFE_MESSAGES.some(
    (known) => known.toLowerCase() === message.toLowerCase(),
  );
  if (isKnown) {
    return message;
  }

  // Regra de sanitizacao adicional: nao permitir comandos ou scripts
  if (/<[a-z]|javascript:|;|--/i.test(message)) {
    return fallback;
  }

  return message;
}

/** Log curto em desenvolvimento; sem expor dados confidenciais ou senhas */
export function logAppError(context: string, detail?: unknown): void {
  if (import.meta.env.DEV) {
    if (detail && typeof detail === "object" && "password" in (detail as Record<string, unknown>)) {
      const sanitized = { ...(detail as Record<string, unknown>) };
      delete sanitized.password;
      console.warn(`[Worky Seguranca] ${context}`, sanitized);
      return;
    }
    console.warn(`[Worky Seguranca] ${context}`, detail || "");
  }
}
