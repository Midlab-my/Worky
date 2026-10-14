export type PartnerJob = {
  id: string;
  title: string;
  modelo: "Remoto" | "Híbrido" | "Presencial";
  location: string;
  salary: string;
  skills: string[];
  description: string;
};

export type PartnerCompany = {
  id: string;
  name: string;
  sector: string;
  location: string;
  size: string;
  jobsOpen: number;
  highlight: string;
  about: string;
  initials: string;
  tone: "slate" | "blue" | "teal" | "indigo";
  jobs: PartnerJob[];
};

/** Dados demo para a pagina de empresas (parceiros ilustrativos). */
export const PARTNER_COMPANIES: PartnerCompany[] = [
  {
    id: "norte-tech",
    name: "Norte Tech",
    sector: "Software",
    location: "São Paulo, SP",
    size: "51-200",
    jobsOpen: 4,
    highlight: "Engenharia e produto B2B.",
    about:
      "A Norte Tech constrói produtos SaaS para mid-market. Time de engenharia focado em TypeScript, APIs e experiencia do cliente.",
    initials: "NT",
    tone: "blue",
    jobs: [
      {
        id: "nt-1",
        title: "Desenvolvedor Full Stack",
        modelo: "Híbrido",
        location: "São Paulo, SP",
        salary: "R$ 8.000 - R$ 12.000",
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
        description: "Atuar no produto principal da Norte Tech, do backend ao frontend, com entregas semanais.",
      },
      {
        id: "nt-2",
        title: "Engenheiro de Software Pleno",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 9.000 - R$ 13.000",
        skills: ["TypeScript", "AWS", "Clean Architecture"],
        description: "Evoluir servicos de dominio e melhorar observabilidade das APIs.",
      },
      {
        id: "nt-3",
        title: "Product Designer",
        modelo: "Híbrido",
        location: "São Paulo, SP",
        salary: "R$ 7.000 - R$ 10.000",
        skills: ["Figma", "Design System", "Pesquisa"],
        description: "Desenhar fluxos B2B e manter o design system alinhado com engenharia.",
      },
      {
        id: "nt-4",
        title: "QA Automation",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 6.500 - R$ 9.000",
        skills: ["Playwright", "Cypress", "CI/CD"],
        description: "Ampliar cobertura de testes E2E e pipeline de regressao.",
      },
    ],
  },
  {
    id: "atlas-dados",
    name: "Atlas Dados",
    sector: "Dados",
    location: "Remoto (Brasil)",
    size: "11-50",
    jobsOpen: 3,
    highlight: "Analistas e cientistas de dados.",
    about:
      "A Atlas Dados ajuda empresas a transformar dados brutos em decisoes. Cultura remota, foco em Python e analytics.",
    initials: "AD",
    tone: "teal",
    jobs: [
      {
        id: "ad-1",
        title: "Analista de Dados",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 5.500 - R$ 8.000",
        skills: ["SQL", "Python", "Power BI"],
        description: "Construir dashboards e extrair insights para clientes B2B.",
      },
      {
        id: "ad-2",
        title: "Cientista de Dados Junior",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 6.000 - R$ 8.500",
        skills: ["Python", "scikit-learn", "Pandas"],
        description: "Prototipar modelos de classificacao e apoiar o time senior.",
      },
      {
        id: "ad-3",
        title: "Engenheiro de Dados",
        modelo: "Híbrido",
        location: "São Paulo, SP",
        salary: "R$ 9.000 - R$ 14.000",
        skills: ["Airflow", "dbt", "BigQuery"],
        description: "Manter pipelines confiaveis e modelagem analitica.",
      },
    ],
  },
  {
    id: "horizon-rh",
    name: "Horizon RH",
    sector: "Recursos Humanos",
    location: "Curitiba, PR",
    size: "201-500",
    jobsOpen: 3,
    highlight: "Recrutamento e people ops.",
    about:
      "Consultoria de RH especializada em tech hiring e people analytics para mid e large companies.",
    initials: "HR",
    tone: "indigo",
    jobs: [
      {
        id: "hr-1",
        title: "Recrutador Tech",
        modelo: "Híbrido",
        location: "Curitiba, PR",
        salary: "R$ 4.500 - R$ 7.000",
        skills: ["Recrutamento", "LinkedIn", "ATS"],
        description: "Conduzir processos end-to-end para vagas de engenharia e produto.",
      },
      {
        id: "hr-2",
        title: "People Analytics",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 7.000 - R$ 10.000",
        skills: ["Excel", "SQL", "People Ops"],
        description: "Medir turnover, tempo de contratacao e saude dos times.",
      },
      {
        id: "hr-3",
        title: "Business Partner de RH",
        modelo: "Presencial",
        location: "Curitiba, PR",
        salary: "R$ 8.000 - R$ 11.000",
        skills: ["BP", "Gestao de pessoas", "Comunicacao"],
        description: "Apoiar liderancas em performance, clima e desenvolvimento.",
      },
    ],
  },
  {
    id: "pulse-fintech",
    name: "Pulse Fintech",
    sector: "Finanças",
    location: "Rio de Janeiro, RJ",
    size: "51-200",
    jobsOpen: 3,
    highlight: "Risco, compliance e pagamentos.",
    about:
      "Fintech de pagamentos com foco em compliance, antifraude e experiencia do merchant.",
    initials: "PF",
    tone: "slate",
    jobs: [
      {
        id: "pf-1",
        title: "Analista de Compliance",
        modelo: "Híbrido",
        location: "Rio de Janeiro, RJ",
        salary: "R$ 6.000 - R$ 9.000",
        skills: ["LGPD", "KYC", "Regulacao"],
        description: "Garantir aderencia normativa e processos de onboarding.",
      },
      {
        id: "pf-2",
        title: "Engenheiro Backend Pagamentos",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 10.000 - R$ 15.000",
        skills: ["Java", "Kafka", "PostgreSQL"],
        description: "Evoluir o core de liquidacao e conciliacao.",
      },
      {
        id: "pf-3",
        title: "Analista de Risco",
        modelo: "Híbrido",
        location: "Rio de Janeiro, RJ",
        salary: "R$ 5.500 - R$ 8.500",
        skills: ["SQL", "Antifraude", "Python"],
        description: "Monitorar alertas e calibrar regras de risco.",
      },
    ],
  },
  {
    id: "orbital-design",
    name: "Orbital Design",
    sector: "Design",
    location: "Belo Horizonte, MG",
    size: "11-50",
    jobsOpen: 2,
    highlight: "Product design e pesquisa.",
    about:
      "Studio de product design para startups e scale-ups. Forte em pesquisa qualitativa e UI systems.",
    initials: "OD",
    tone: "blue",
    jobs: [
      {
        id: "od-1",
        title: "Product Designer",
        modelo: "Híbrido",
        location: "Belo Horizonte, MG",
        salary: "R$ 6.500 - R$ 9.500",
        skills: ["Figma", "UI", "Prototipacao"],
        description: "Desenhar interfaces e fluxos para produtos digitais.",
      },
      {
        id: "od-2",
        title: "UX Researcher",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 7.000 - R$ 10.000",
        skills: ["Entrevistas", "Usabilidade", "Synthese"],
        description: "Planejar e conduzir pesquisas com usuarios finais.",
      },
    ],
  },
  {
    id: "campo-cloud",
    name: "Campo Cloud",
    sector: "Infraestrutura",
    location: "Remoto (Brasil)",
    size: "51-200",
    jobsOpen: 3,
    highlight: "Cloud, SRE e segurança.",
    about:
      "Especialistas em cloud e SRE. Operam ambientes criticos com foco em confiabilidade e custo.",
    initials: "CC",
    tone: "teal",
    jobs: [
      {
        id: "cc-1",
        title: "SRE Pleno",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 11.000 - R$ 16.000",
        skills: ["Kubernetes", "Terraform", "Observabilidade"],
        description: "Melhorar SLOs, alertas e automacao de incidente.",
      },
      {
        id: "cc-2",
        title: "Cloud Security Analyst",
        modelo: "Remoto",
        location: "Remoto (Brasil)",
        salary: "R$ 9.000 - R$ 13.000",
        skills: ["AWS", "IAM", "DevSecOps"],
        description: "Revisar posturas de seguranca e hardening de contas cloud.",
      },
      {
        id: "cc-3",
        title: "DevOps Engineer",
        modelo: "Híbrido",
        location: "São Paulo, SP",
        salary: "R$ 10.000 - R$ 14.000",
        skills: ["CI/CD", "Docker", "GitHub Actions"],
        description: "Padronizar pipelines e ambientes de deploy.",
      },
    ],
  },
];

export function getPartnerCompanyById(id: string): PartnerCompany | undefined {
  return PARTNER_COMPANIES.find((company) => company.id === id);
}
