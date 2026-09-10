import { useEffect, useRef, useState } from "react";
import { cepErrorMessage, formatCep, onlyDigits } from "../lib/br-docs";
import { lookupCep } from "../services/cep";

type CepFieldProps = {
  id: string;
  label?: string;
  value: string;
  locationLabel: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onCepChange: (maskedCep: string) => void;
  onResolved: (locationLabel: string, city: string, state: string) => void;
  onClearLocation: () => void;
};

export function CepField({
  id,
  label = "CEP *",
  value,
  locationLabel,
  error,
  disabled,
  className,
  inputClassName,
  onCepChange,
  onResolved,
  onClearLocation,
}: CepFieldProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(locationLabel ? "ok" : "idle");
  const [hint, setHint] = useState(locationLabel ? `Localizacao: ${locationLabel}` : "");
  const onResolvedRef = useRef(onResolved);
  const onClearRef = useRef(onClearLocation);
  onResolvedRef.current = onResolved;
  onClearRef.current = onClearLocation;

  useEffect(() => {
    const digits = onlyDigits(value, 8);
    if (digits.length !== 8) {
      setStatus("idle");
      setHint("");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setHint("Buscando endereco...");

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const address = await lookupCep(digits);
          if (cancelled) return;
          onResolvedRef.current(address.locationLabel, address.city, address.state);
          setStatus("ok");
          setHint(`Localizacao: ${address.locationLabel}`);
        } catch (err: unknown) {
          if (cancelled) return;
          onClearRef.current();
          setStatus("error");
          setHint(err instanceof Error ? err.message : "CEP nao encontrado.");
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  const showError = error || (status === "error" ? hint : "");

  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        maxLength={9}
        disabled={disabled}
        className={inputClassName}
        value={value}
        aria-invalid={Boolean(showError)}
        onChange={(event) => {
          onCepChange(formatCep(event.target.value));
          onClearLocation();
          setStatus("idle");
          setHint("");
        }}
      />
      {status === "loading" && (
        <div style={{ marginTop: "0.35rem", fontSize: "0.82rem", color: "#6b7080" }}>Buscando endereco...</div>
      )}
      {status === "ok" && locationLabel && !showError && (
        <div style={{ marginTop: "0.35rem", fontSize: "0.82rem", color: "#0f766e" }}>
          Localizacao: {locationLabel}
        </div>
      )}
      {showError && (
        <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", fontWeight: 600, color: "#dc2626" }}>
          {showError}
        </div>
      )}
    </div>
  );
}

export function validateCepLocation(cep: string, locationLabel: string): string | undefined {
  const formatError = cepErrorMessage(cep);
  if (formatError) return formatError;
  if (!locationLabel.trim()) {
    return "Informe um CEP valido para preencher a localizacao.";
  }
  return undefined;
}
