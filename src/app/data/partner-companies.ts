export type PartnerCompany = {
  id: string;
  name: string;
  sector: string;
  location: string;
  size: string;
  jobsOpen: number;
  highlight: string;
  initials: string;
  tone: "slate" | "blue" | "teal" | "indigo";
};

/** Dados demo para a pagina de empresas (parceiros ilustrativos). */
export const PARTNER_COMPANIES: PartnerCompany[] = [
  {
    id: "norte-tech",
    name: "Norte Tech",
    sector: "Software",
    location: "São Paulo, SP",
    size: "51-200",
    jobsOpen: 8,
    highlight: "Engenharia e produto B2B.",
    initials: "NT",
    tone: "blue",
  },
  {
    id: "atlas-dados",
    name: "Atlas Dados",
    sector: "Dados",
    location: "Remoto (Brasil)",
    size: "11-50",
    jobsOpen: 5,
    highlight: "Analistas e cientistas de dados.",
    initials: "AD",
    tone: "teal",
  },
  {
    id: "horizon-rh",
    name: "Horizon RH",
    sector: "Recursos Humanos",
    location: "Curitiba, PR",
    size: "201-500",
    jobsOpen: 12,
    highlight: "Recrutamento e people ops.",
    initials: "HR",
    tone: "indigo",
  },
  {
    id: "pulse-fintech",
    name: "Pulse Fintech",
    sector: "Finanças",
    location: "Rio de Janeiro, RJ",
    size: "51-200",
    jobsOpen: 6,
    highlight: "Risco, compliance e pagamentos.",
    initials: "PF",
    tone: "slate",
  },
  {
    id: "orbital-design",
    name: "Orbital Design",
    sector: "Design",
    location: "Belo Horizonte, MG",
    size: "11-50",
    jobsOpen: 3,
    highlight: "Product design e pesquisa.",
    initials: "OD",
    tone: "blue",
  },
  {
    id: "campo-cloud",
    name: "Campo Cloud",
    sector: "Infraestrutura",
    location: "Remoto (Brasil)",
    size: "51-200",
    jobsOpen: 9,
    highlight: "Cloud, SRE e segurança.",
    initials: "CC",
    tone: "teal",
  },
];
