import { onlyDigits } from "../lib/br-docs";

export type CepAddress = {
  cep: string;
  city: string;
  state: string;
  neighborhood: string;
  street: string;
  locationLabel: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

export async function lookupCep(cep: string): Promise<CepAddress> {
  const digits = onlyDigits(cep, 8);
  if (digits.length !== 8) {
    throw new Error("CEP incompleto. Use 8 digitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP agora.");
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro === true || data.erro === "true" || !data.localidade || !data.uf) {
    throw new Error("CEP nao encontrado.");
  }

  const city = data.localidade.trim();
  const state = data.uf.trim().toUpperCase();

  return {
    cep: digits,
    city,
    state,
    neighborhood: (data.bairro || "").trim(),
    street: (data.logradouro || "").trim(),
    locationLabel: `${city}, ${state}`,
  };
}
