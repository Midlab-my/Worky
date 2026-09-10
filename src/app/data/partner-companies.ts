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

export const PARTNER_COMPANIES: PartnerCompany[] = [
  {
    id: "norte-tech",
    name: "Norte Tech",
    sector: "Software",
    location: "São Paulo, SP",
    size: "51-200",
    jobsOpen: 8,
    highlight: "Vagas de engenharia e produto com foco em produto B2B.",
    initials: "NT",
    tone: "blue",
  },
  {
    id: "atlas-dados",
    name: "Atlas Dados",
    sector: "Data & Analytics",
    location: "Remoto (Brasil)",
    size: "11-50",
    jobsOpen: 5,
    highlight: "Contrata analistas e cientistas de dados para times de insight.",
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
    highlight: "Divulga oportunidades de people, recrutamento e people analytics.",
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
    highlight: "Abre vagas em risco, compliance e engenharia de pagamentos.",
    initials: "PF",
    tone: "slate",
  },
  {
    id: "orbital-design",
    name: "Orbital Design",
    sector: "Design & UX",
    location: "Belo Horizonte, MG",
    size: "11-50",
    jobsOpen: 3,
    highlight: "Busca designers de produto e researchers para squads digitais.",
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
    highlight: "Vagas em cloud, SRE e segurança para ambientes multi-cloud.",
    initials: "CC",
    tone: "teal",
  },
];
