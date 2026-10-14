/**
 * Mensagens de erro seguras para UI: sem TypeError, Failed to fetch, stack ou path de arquivo.
 */

const TECHNICAL_PATTERN =
  /failed to fetch|networkerror|typeerror|referenceerror|syntaxerror|err_connection|econnrefused|cors|net::|status code|\.tsx?\b|\.jsx?\b|at Object\.|at async |stack|127\.0\.0\.1|localhost:\d+|supabase\.co|openai|traceback|exception/i;

const SAFE_APP_PATTERN =
  /informe|selecione|remova|invalido|inválido|nao foi|não foi|falha|senha|e-mail|email|plano|conta|cep|cnpj|cpf|prototipo|protótipo|curto|longo|obrigat|incorret|confirm|aceitar|termos|titulo|título|descricao|descrição|candidato|empresa|vaga|assinatura|pagamento|cartao|cartão|mensagem|assunto|chamado/i;

export function toUserErrorMessage(error: unknown, fallback: string): string {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";

  const message = (raw || "").trim();
  if (!message) return fallback;
  if (message.length > 180) return fallback;
  if (TECHNICAL_PATTERN.test(message)) return fallback;
  if (SAFE_APP_PATTERN.test(message)) return message;

  // Mensagem desconhecida: nao vazar detalhe tecnico.
  return fallback;
}

/** Log curto em dev; nunca imprime stack/objeto de erro completo. */
export function logAppError(context: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[Worky] ${context}`);
  }
}
