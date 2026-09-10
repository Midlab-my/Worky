import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { profileService, type ProfileCourseSuggestion } from "../services/api";
import { getUserAvatarUrl, getUserFirstName, type AuthUser } from "../services/auth";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ReferralCard } from "../components/ReferralCard";
import { getReferralLink, getReferralProgress, registerReferralShare } from "../services/referral";
import { CepField } from "../components/CepField";
import { fetchCompanyProfile } from "../services/company";

type SkillType = "tech" | "soft";

type Skill = {
  label: string;
  type: SkillType;
};

type ProfileFormData = {
  nome: string;
  bio: string;
  cidade: string;
  estado: string;
};

type Experience = {
  id: number;
  cargo: string;
  empresa: string;
  inicio: string;
  fim: string;
  atual: boolean;
  descricao: string;
};

type Education = {
  id: number;
  nome: string;
  instituicao: string;
  inicio: string;
  fim: string;
  atual: boolean;
};

type Certification = {
  id: number;
  logo: string;
  color: string;
  name: string;
  emissor: string;
  data: string;
};

type ProfessionalDraft = {
  avatarUrl: string;
  form: ProfileFormData;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  certs: Certification[];
};

type ProfessionalProfile = ProfessionalDraft & {
  completedAt: string;
};

type ProfileMode = "summary" | "edit" | "completed";

type IconProps = {
  d: string;
  size?: number;
  color?: string;
  fill?: string;
  sw?: number;
};

type SkillCategory = {
  id: string;
  label: string;
  description: string;
  skillLabels: string[];
};

type MarketInsight = {
  role: string;
  score: number;
  summary: string;
};

type ProfileInsights = {
  market: MarketInsight;
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const SUPABASE_AVATAR_BUCKET = (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || "profile-avatars").trim();
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_EDITOR_VIEWPORT = 320;
const AVATAR_OUTPUT_SIZE = 960;

const SUGGESTIONS: Skill[] = [
  { label: "HTML", type: "tech" },
  { label: "CSS", type: "tech" },
  { label: "Sass", type: "tech" },
  { label: "Less", type: "tech" },
  { label: "JavaScript", type: "tech" },
  { label: "TypeScript", type: "tech" },
  { label: "React.js", type: "tech" },
  { label: "Vue.js", type: "tech" },
  { label: "Angular", type: "tech" },
  { label: "Svelte", type: "tech" },
  { label: "Next.js", type: "tech" },
  { label: "Nuxt.js", type: "tech" },
  { label: "Remix", type: "tech" },
  { label: "Astro", type: "tech" },
  { label: "Tailwind CSS", type: "tech" },
  { label: "Bootstrap", type: "tech" },
  { label: "Material UI", type: "tech" },
  { label: "Design System", type: "tech" },
  { label: "Micro-frontends", type: "tech" },
  { label: "Web Components", type: "tech" },
  { label: "Vite", type: "tech" },
  { label: "Webpack", type: "tech" },
  { label: "Node.js", type: "tech" },
  { label: "Express.js", type: "tech" },
  { label: "NestJS", type: "tech" },
  { label: "Fastify", type: "tech" },
  { label: "Bun", type: "tech" },
  { label: "Deno", type: "tech" },
  { label: "Python", type: "tech" },
  { label: "Django", type: "tech" },
  { label: "Flask", type: "tech" },
  { label: "FastAPI", type: "tech" },
  { label: "Java", type: "tech" },
  { label: "Spring Boot", type: "tech" },
  { label: "Kotlin", type: "tech" },
  { label: "C#", type: "tech" },
  { label: ".NET", type: "tech" },
  { label: "ASP.NET", type: "tech" },
  { label: "PHP", type: "tech" },
  { label: "Laravel", type: "tech" },
  { label: "Symfony", type: "tech" },
  { label: "Ruby", type: "tech" },
  { label: "Ruby on Rails", type: "tech" },
  { label: "Go", type: "tech" },
  { label: "Rust", type: "tech" },
  { label: "C", type: "tech" },
  { label: "C++", type: "tech" },
  { label: "Elixir", type: "tech" },
  { label: "Phoenix", type: "tech" },
  { label: "Scala", type: "tech" },
  { label: "Clojure", type: "tech" },
  { label: "Shell Script", type: "tech" },
  { label: "PowerShell", type: "tech" },
  { label: "REST APIs", type: "tech" },
  { label: "GraphQL", type: "tech" },
  { label: "gRPC", type: "tech" },
  { label: "WebSockets", type: "tech" },
  { label: "Microsserviços", type: "tech" },
  { label: "Arquitetura Hexagonal", type: "tech" },
  { label: "Clean Architecture", type: "tech" },
  { label: "DDD", type: "tech" },
  { label: "TDD", type: "tech" },
  { label: "Git", type: "tech" },
  { label: "GitHub", type: "tech" },
  { label: "GitLab", type: "tech" },
  { label: "Bitbucket", type: "tech" },
  { label: "React Native", type: "tech" },
  { label: "Flutter", type: "tech" },
  { label: "Dart", type: "tech" },
  { label: "Android", type: "tech" },
  { label: "iOS", type: "tech" },
  { label: "Swift", type: "tech" },
  { label: "Objective-C", type: "tech" },
  { label: "Kotlin Multiplatform", type: "tech" },
  { label: "PostgreSQL", type: "tech" },
  { label: "MySQL", type: "tech" },
  { label: "MariaDB", type: "tech" },
  { label: "SQL Server", type: "tech" },
  { label: "Oracle Database", type: "tech" },
  { label: "SQLite", type: "tech" },
  { label: "MongoDB", type: "tech" },
  { label: "Redis", type: "tech" },
  { label: "Elasticsearch", type: "tech" },
  { label: "OpenSearch", type: "tech" },
  { label: "DynamoDB", type: "tech" },
  { label: "Firebase", type: "tech" },
  { label: "Supabase", type: "tech" },
  { label: "Prisma", type: "tech" },
  { label: "TypeORM", type: "tech" },
  { label: "Sequelize", type: "tech" },
  { label: "SQL", type: "tech" },
  { label: "Modelagem de Dados", type: "tech" },
  { label: "Data Warehouse", type: "tech" },
  { label: "Data Lake", type: "tech" },
  { label: "ETL", type: "tech" },
  { label: "ELT", type: "tech" },
  { label: "Apache Airflow", type: "tech" },
  { label: "dbt", type: "tech" },
  { label: "Apache Spark", type: "tech" },
  { label: "PySpark", type: "tech" },
  { label: "Kafka", type: "tech" },
  { label: "Flink", type: "tech" },
  { label: "Databricks", type: "tech" },
  { label: "Snowflake", type: "tech" },
  { label: "BigQuery", type: "tech" },
  { label: "Amazon Redshift", type: "tech" },
  { label: "Power BI", type: "tech" },
  { label: "Tableau", type: "tech" },
  { label: "Looker", type: "tech" },
  { label: "Metabase", type: "tech" },
  { label: "Excel Avançado", type: "tech" },
  { label: "Pandas", type: "tech" },
  { label: "NumPy", type: "tech" },
  { label: "scikit-learn", type: "tech" },
  { label: "TensorFlow", type: "tech" },
  { label: "PyTorch", type: "tech" },
  { label: "Machine Learning", type: "tech" },
  { label: "Deep Learning", type: "tech" },
  { label: "MLOps", type: "tech" },
  { label: "LLMs", type: "tech" },
  { label: "Prompt Engineering", type: "tech" },
  { label: "RAG", type: "tech" },
  { label: "OpenAI API", type: "tech" },
  { label: "Computer Vision", type: "tech" },
  { label: "NLP", type: "tech" },
  { label: "Estatística", type: "tech" },
  { label: "A/B Testing", type: "tech" },
  { label: "AWS", type: "tech" },
  { label: "Microsoft Azure", type: "tech" },
  { label: "Google Cloud", type: "tech" },
  { label: "Docker", type: "tech" },
  { label: "Kubernetes", type: "tech" },
  { label: "Helm", type: "tech" },
  { label: "Terraform", type: "tech" },
  { label: "Ansible", type: "tech" },
  { label: "Pulumi", type: "tech" },
  { label: "Jenkins", type: "tech" },
  { label: "GitHub Actions", type: "tech" },
  { label: "GitLab CI/CD", type: "tech" },
  { label: "Azure DevOps", type: "tech" },
  { label: "Argo CD", type: "tech" },
  { label: "FluxCD", type: "tech" },
  { label: "Linux", type: "tech" },
  { label: "Windows Server", type: "tech" },
  { label: "Active Directory", type: "tech" },
  { label: "Entra ID", type: "tech" },
  { label: "VMware", type: "tech" },
  { label: "Hyper-V", type: "tech" },
  { label: "Virtualização", type: "tech" },
  { label: "Redes TCP/IP", type: "tech" },
  { label: "DNS", type: "tech" },
  { label: "DHCP", type: "tech" },
  { label: "VPN", type: "tech" },
  { label: "Firewall", type: "tech" },
  { label: "Load Balancer", type: "tech" },
  { label: "Nginx", type: "tech" },
  { label: "Apache HTTP Server", type: "tech" },
  { label: "IIS", type: "tech" },
  { label: "Observabilidade", type: "tech" },
  { label: "Prometheus", type: "tech" },
  { label: "Grafana", type: "tech" },
  { label: "Datadog", type: "tech" },
  { label: "New Relic", type: "tech" },
  { label: "Splunk", type: "tech" },
  { label: "Zabbix", type: "tech" },
  { label: "SRE", type: "tech" },
  { label: "FinOps", type: "tech" },
  { label: "ITIL", type: "tech" },
  { label: "Service Desk", type: "tech" },
  { label: "Help Desk", type: "tech" },
  { label: "Suporte N1", type: "tech" },
  { label: "Suporte N2", type: "tech" },
  { label: "Suporte N3", type: "tech" },
  { label: "GLPI", type: "tech" },
  { label: "ServiceNow", type: "tech" },
  { label: "Jira Service Management", type: "tech" },
  { label: "Microsoft 365", type: "tech" },
  { label: "Google Workspace", type: "tech" },
  { label: "Hardware", type: "tech" },
  { label: "Redes Wi-Fi", type: "tech" },
  { label: "Cabeamento Estruturado", type: "tech" },
  { label: "Backup e Restore", type: "tech" },
  { label: "Disaster Recovery", type: "tech" },
  { label: "Segurança da Informação", type: "tech" },
  { label: "IAM", type: "tech" },
  { label: "OAuth 2.0", type: "tech" },
  { label: "OpenID Connect", type: "tech" },
  { label: "SSO", type: "tech" },
  { label: "Keycloak", type: "tech" },
  { label: "Pentest", type: "tech" },
  { label: "Vulnerability Management", type: "tech" },
  { label: "SIEM", type: "tech" },
  { label: "SOC", type: "tech" },
  { label: "DevSecOps", type: "tech" },
  { label: "LGPD", type: "tech" },
  { label: "OWASP", type: "tech" },
  { label: "QA", type: "tech" },
  { label: "Testes Automatizados", type: "tech" },
  { label: "Cypress", type: "tech" },
  { label: "Playwright", type: "tech" },
  { label: "Selenium", type: "tech" },
  { label: "Jest", type: "tech" },
  { label: "Vitest", type: "tech" },
  { label: "Testing Library", type: "tech" },
  { label: "Postman", type: "tech" },
  { label: "Insomnia", type: "tech" },
  { label: "UX Research", type: "tech" },
  { label: "UI Design", type: "tech" },
  { label: "Figma", type: "tech" },
  { label: "Product Management", type: "tech" },
  { label: "Product Owner", type: "tech" },
  { label: "Scrum", type: "tech" },
  { label: "Kanban", type: "tech" },
  { label: "SAP", type: "tech" },
  { label: "Salesforce", type: "tech" },
  { label: "Power Platform", type: "tech" },
  { label: "RPA", type: "tech" },
  { label: "UiPath", type: "tech" },
  { label: "Low-code", type: "tech" },
  { label: "No-code", type: "tech" },
  { label: "Comunicação", type: "soft" },
  { label: "Liderança", type: "soft" },
  { label: "Liderança Técnica", type: "soft" },
  { label: "Pensamento Analítico", type: "soft" },
  { label: "Resolução de Problemas", type: "soft" },
  { label: "Trabalho em Equipe", type: "soft" },
  { label: "Organização", type: "soft" },
  { label: "Proatividade", type: "soft" },
  { label: "Adaptabilidade", type: "soft" },
  { label: "Criatividade", type: "soft" },
  { label: "Negociação", type: "soft" },
  { label: "Gestão de Stakeholders", type: "soft" },
  { label: "Mentoria", type: "soft" },
  { label: "Documentação", type: "soft" },
  { label: "Aprendizado Contínuo", type: "soft" },
  { label: "Atenção a Detalhes", type: "soft" },
  { label: "Atendimento ao Cliente", type: "soft" },
  { label: "Agile", type: "soft" },
  { label: "Design Thinking", type: "soft" },
];

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "frontend",
    label: "Frontend",
    description: "Interfaces web, mobile e design system",
    skillLabels: ["HTML", "CSS", "Sass", "Less", "JavaScript", "TypeScript", "React.js", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "Remix", "Astro", "Tailwind CSS", "Bootstrap", "Material UI", "Design System", "Micro-frontends", "Web Components", "Vite", "Webpack"],
  },
  {
    id: "backend",
    label: "Backend",
    description: "APIs, serviços e arquitetura",
    skillLabels: ["Node.js", "Express.js", "NestJS", "Fastify", "Bun", "Deno", "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot", "Kotlin", "C#", ".NET", "ASP.NET", "PHP", "Laravel", "Symfony", "Ruby", "Ruby on Rails", "Go", "Rust", "C", "C++", "Elixir", "Phoenix", "Scala", "Clojure", "REST APIs", "GraphQL", "gRPC", "WebSockets", "Microsserviços", "Arquitetura Hexagonal", "Clean Architecture", "DDD", "TDD"],
  },
  {
    id: "data",
    label: "Dados e BI",
    description: "Análise, engenharia e visualização",
    skillLabels: ["SQL", "Modelagem de Dados", "PostgreSQL", "MySQL", "SQL Server", "Oracle Database", "MongoDB", "Redis", "Data Warehouse", "Data Lake", "ETL", "ELT", "Apache Airflow", "dbt", "Apache Spark", "PySpark", "Kafka", "Flink", "Databricks", "Snowflake", "BigQuery", "Amazon Redshift", "Power BI", "Tableau", "Looker", "Metabase", "Excel Avançado", "Pandas", "NumPy", "Estatística", "A/B Testing"],
  },
  {
    id: "ai",
    label: "IA e Machine Learning",
    description: "Modelos, automação inteligente e MLOps",
    skillLabels: ["scikit-learn", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "MLOps", "LLMs", "Prompt Engineering", "RAG", "OpenAI API", "Computer Vision", "NLP"],
  },
  {
    id: "cloud-devops",
    label: "Cloud e DevOps",
    description: "Cloud, containers, CI/CD e automação",
    skillLabels: ["AWS", "Microsoft Azure", "Google Cloud", "Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Pulumi", "Jenkins", "GitHub Actions", "GitLab CI/CD", "Azure DevOps", "Argo CD", "FluxCD", "SRE", "FinOps"],
  },
  {
    id: "infra-support",
    label: "Infra e Suporte",
    description: "Redes, sistemas, service desk e operação",
    skillLabels: ["Linux", "Windows Server", "Active Directory", "Entra ID", "VMware", "Hyper-V", "Virtualização", "Redes TCP/IP", "DNS", "DHCP", "VPN", "Firewall", "Load Balancer", "Nginx", "Apache HTTP Server", "IIS", "Observabilidade", "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk", "Zabbix", "ITIL", "Service Desk", "Help Desk", "Suporte N1", "Suporte N2", "Suporte N3", "GLPI", "ServiceNow", "Jira Service Management", "Microsoft 365", "Google Workspace", "Hardware", "Redes Wi-Fi", "Cabeamento Estruturado", "Backup e Restore", "Disaster Recovery"],
  },
  {
    id: "security",
    label: "Segurança",
    description: "Cybersecurity, identidade e governança",
    skillLabels: ["Segurança da Informação", "IAM", "OAuth 2.0", "OpenID Connect", "SSO", "Keycloak", "Pentest", "Vulnerability Management", "SIEM", "SOC", "DevSecOps", "LGPD", "OWASP"],
  },
  {
    id: "qa",
    label: "QA e Testes",
    description: "Qualidade, automação e validação",
    skillLabels: ["QA", "Testes Automatizados", "Cypress", "Playwright", "Selenium", "Jest", "Vitest", "Testing Library", "Postman", "Insomnia"],
  },
  {
    id: "product",
    label: "Produto e UX",
    description: "Produto, pesquisa, gestão ágil e design",
    skillLabels: ["UX Research", "UI Design", "Figma", "Product Management", "Product Owner", "Scrum", "Kanban", "Agile", "Design Thinking"],
  },
  {
    id: "business",
    label: "ERP, automação e plataformas",
    description: "Ferramentas corporativas e low-code",
    skillLabels: ["SAP", "Salesforce", "Power Platform", "RPA", "UiPath", "Low-code", "No-code"],
  },
  {
    id: "soft",
    label: "Soft Skills",
    description: "Comportamento, comunicação e liderança",
    skillLabels: ["Comunicação", "Liderança", "Liderança Técnica", "Pensamento Analítico", "Resolução de Problemas", "Trabalho em Equipe", "Organização", "Proatividade", "Adaptabilidade", "Criatividade", "Negociação", "Gestão de Stakeholders", "Mentoria", "Documentação", "Aprendizado Contínuo", "Atenção a Detalhes", "Atendimento ao Cliente"],
  },
];

const avatarControlCss = `
.wp-avatar-input{display:none;}
.wp-avatar-control{
  display:flex;
  flex-direction:column;
  align-items:center;
  width:max-content;
}
.wp-avatar-shell{
  position:relative;
  display:inline-flex;
  flex-shrink:0;
}
.wp-account-avatar-shell{border-radius:22px;}
.wp-avatar-panel-shell{border-radius:24px;}
.wv-avatar-shell{border-radius:50%;}
.wp-avatar-overlay{
  position:absolute;
  inset:0;
  border:none;
  border-radius:inherit;
  background:linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.42));
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  opacity:0;
  cursor:pointer;
  transition:opacity .18s ease, transform .18s ease;
}
.wp-avatar-shell:hover .wp-avatar-overlay,
.wp-avatar-shell:focus-within .wp-avatar-overlay{
  opacity:1;
}
.wp-avatar-overlay:disabled{
  cursor:not-allowed;
  opacity:.45;
}
.wp-avatar-overlay-icon{
  width:42px;
  height:42px;
  border-radius:999px;
  background:rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.32);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter:blur(8px);
}
.wp-avatar-overlay-icon svg{width:18px;height:18px;}
.wp-avatar-feedback{
  margin-top:.6rem;
  font-size:.78rem;
  color:var(--error, #dc2626);
  line-height:1.45;
  text-align:center;
  max-width:260px;
}
.wp-avatar-dialog{
  max-width:440px !important;
  border-radius:24px !important;
  padding:1.35rem 1.35rem 1.2rem !important;
}
.wp-avatar-dialog-header{padding-right:1.5rem;}
.wp-avatar-dialog-title{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:1.1rem !important;
  font-weight:800 !important;
  color:#0f172a;
}
.wp-avatar-dialog-actions{
  display:flex;
  gap:.75rem;
  flex-wrap:wrap;
}
.wp-avatar-dialog-btn{
  flex:1 1 0;
  min-height:46px;
  border-radius:16px;
  border:1px solid rgba(148,163,184,.35);
  background:#fff;
  color:#1e293b;
  font-family:'Inter',sans-serif;
  font-size:.92rem;
  font-weight:700;
  cursor:pointer;
  transition:background .15s ease, border-color .15s ease, opacity .15s ease;
}
.wp-avatar-dialog-btn:hover{background:#f8fafc;border-color:#94a3b8;}
.wp-avatar-dialog-btn:disabled{cursor:not-allowed;opacity:.65;}
.wp-avatar-dialog-btn-primary{
  background:#2563eb;
  color:#fff;
  border-color:#2563eb;
}
.wp-avatar-dialog-btn-primary:hover{background:#1d4ed8;border-color:#1d4ed8;}
.wp-avatar-editor{display:flex;flex-direction:column;gap:1rem;}
.wp-avatar-editor-frame{
  position:relative;
  width:${AVATAR_EDITOR_VIEWPORT}px;
  height:${AVATAR_EDITOR_VIEWPORT}px;
  margin:0 auto;
  border-radius:32px;
  overflow:hidden;
  background:
    radial-gradient(circle at center, transparent 61%, rgba(15,23,42,.5) 62%),
    linear-gradient(135deg, #eff6ff, #ecfeff);
  box-shadow:inset 0 0 0 1px rgba(148,163,184,.16);
  touch-action:none;
}
.wp-avatar-editor-frame::after{
  content:"";
  position:absolute;
  inset:16px;
  border-radius:999px;
  box-shadow:0 0 0 999px rgba(15,23,42,.42);
  border:2px solid rgba(255,255,255,.82);
  pointer-events:none;
}
.wp-avatar-editor-frame.is-loading::before{
  content:"Carregando...";
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#334155;
  font-family:'Inter',sans-serif;
  font-size:.9rem;
  z-index:2;
}
.wp-avatar-editor-image{
  position:absolute;
  max-width:none;
  user-select:none;
  -webkit-user-drag:none;
}
.wp-avatar-editor-controls{display:flex;flex-direction:column;gap:.55rem;}
.wp-avatar-editor-label{
  font-family:'Inter',sans-serif;
  font-size:.8rem;
  font-weight:700;
  color:#475569;
}
.wp-avatar-editor-range{width:100%;accent-color:#2563eb;}
.wp-avatar-editor-hint{
  font-size:.78rem;
  color:#64748b;
  line-height:1.45;
}
@media(max-width:560px){
  .wp-avatar-dialog{padding:1.15rem 1rem 1rem !important;}
  .wp-avatar-dialog-actions{flex-direction:column;}
  .wp-avatar-dialog-btn{width:100%;}
  .wp-avatar-editor-frame{
    width:min(${AVATAR_EDITOR_VIEWPORT}px, calc(100vw - 5rem));
    height:min(${AVATAR_EDITOR_VIEWPORT}px, calc(100vw - 5rem));
  }
}
@media(hover:none){
  .wp-avatar-overlay{
    opacity:1;
    background:transparent;
    align-items:flex-end;
    justify-content:flex-end;
    padding:.45rem;
  }
  .wp-avatar-overlay-icon{
    width:36px;
    height:36px;
    background:#2563eb;
    border-color:#2563eb;
  }
}
`;

const profileFormCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary:        #003ec7;
  --primary-btn:    #0052ff;
  --primary-dim:    rgba(0,82,255,0.10);
  --tertiary:       #005858;
  --tertiary-dim:   rgba(0,114,114,0.10);
  --surface:        #f8f9fa;
  --surface-low:    #f3f4f5;
  --surface-card:   #ffffff;
  --surface-high:   #e7e8e9;
  --outline:        #737688;
  --outline-soft:   #c3c5d9;
  --on-surface:     #191c1d;
  --on-muted:       #434656;
  --error:          #ba1a1a;
  --r-card:         16px;
  --r-input:        10px;
}

body { margin:0; }

.wp-root {
  font-family: 'Inter', sans-serif;
  background: var(--surface);
  min-height: 100vh;
  display: flex; flex-direction: column;
  color: var(--on-surface);
}

.wp-nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  padding: 0 2rem;
  display: flex; align-items: center; justify-content: space-between;
  height: 60px;
}
.wp-logo {
  font-family: 'Sora', sans-serif;
  font-size: 1.1rem; font-weight: 700;
  color: #003ec7; letter-spacing: 0; text-decoration: none;
  background: none; border: 0; cursor: pointer;
}
.wp-nav-links { display: flex; gap: 2rem; }
.wp-nav-link {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 500;
  color: #64748b; text-decoration: none; cursor: pointer;
  transition: color 0.15s;
  background: none; border: 0;
}
.wp-nav-link:hover { color: #003ec7; }
.wp-nav-actions { display: flex; align-items: center; gap: 10px; }
.wp-nav-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.45rem 1.1rem;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.wp-nav-primary:hover { background: #1d4ed8; }
.wp-nav-primary.btn-profile-avatar {
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0;
}
.wp-nav-ghost {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
}
.wp-nav-ghost:hover { background: #f1f5f9; }
.wp-icon-btn {
  width: 38px; height: 38px; border-radius: 50%;
  border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--on-muted); transition: background 0.15s;
}
.wp-icon-btn:hover { background: var(--surface-high); }
.wp-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  overflow: hidden; cursor: pointer;
  background: var(--surface-high);
}
.wp-avatar img { width:100%; height:100%; object-fit:cover; }
.wp-avatar-fallback {
  width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; color:#2563eb;
}

.wp-main {
  flex: 1;
  padding: 3rem 1.5rem 4rem;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}

.wp-hero { text-align: center; margin-bottom: 3rem; }
.wp-hero-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2.75rem;
  font-weight: 900; letter-spacing: 0;
  color: var(--on-surface); margin-bottom: 0.75rem;
}
.wp-hero-sub {
  font-size: 0.95rem; color: var(--on-muted);
  line-height: 1.65; max-width: 480px; margin: 0 auto;
}

.wp-sections { display: flex; flex-direction: column; gap: 1.5rem; }

.wp-section {
  background: var(--surface-card);
  border-radius: var(--r-card);
  border: 1px solid rgba(195,197,217,0.3);
  padding: 2rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.wp-section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.75rem;
}
.wp-section-title-wrap { display: flex; align-items: center; gap: 10px; }
.wp-section-icon {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.wp-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.25rem; font-weight: 800;
  color: var(--on-surface); letter-spacing: 0;
}
.wp-add-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.825rem; font-weight: 600; color: var(--primary);
  background: none; border: none; cursor: pointer;
  padding: 6px 12px; border-radius: 20px;
  transition: background 0.15s;
}
.wp-add-btn:hover { background: var(--primary-dim); }

.wp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.wp-field { display: flex; flex-direction: column; gap: 6px; }
.wp-label {
  font-size: 0.78rem; font-weight: 600;
  color: var(--on-muted);
}
.wp-label-upper {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--outline);
}
.wp-input {
  width: 100%;
  background: var(--surface-low);
  border: 1.5px solid transparent;
  border-radius: var(--r-input);
  padding: 0.7rem 0.9rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: var(--on-surface);
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.wp-input::placeholder { color: #9ca3af; }
.wp-input:focus {
  border-color: rgba(0,82,255,0.45);
  box-shadow: 0 0 0 3px rgba(0,82,255,0.07);
  background: white;
}
.wp-select {
  width: 100%; appearance: none;
  background: var(--surface-low) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23737688' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
  border: 1.5px solid transparent;
  border-radius: var(--r-input);
  padding: 0.7rem 2.25rem 0.7rem 0.9rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: var(--on-surface);
  outline: none; cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.wp-select:focus {
  border-color: rgba(0,82,255,0.45);
  box-shadow: 0 0 0 3px rgba(0,82,255,0.07);
  background-color: white;
}
.wp-textarea {
  width: 100%; resize: none;
  background: transparent;
  border: none; border-bottom: 1.5px solid var(--outline-soft);
  padding: 0.5rem 0;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: var(--on-surface);
  outline: none; transition: border-color 0.2s;
}
.wp-textarea:focus { border-bottom-color: var(--primary); }
.wp-inline-input {
  width: 100%;
  background: transparent;
  border: none; border-bottom: 1.5px solid var(--outline-soft);
  padding: 0.4rem 0;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: var(--on-surface);
  outline: none; transition: border-color 0.2s;
}
.wp-inline-input:focus { border-bottom-color: var(--primary); }
.wp-month-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: end;
}
.wp-check-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding-top: 0.5rem;
}
.wp-check-row input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-btn);
}
.wp-check-row label {
  font-size: 0.8rem;
  color: var(--on-muted);
  font-weight: 600;
}
.wp-empty-state {
  border: 1px dashed var(--outline-soft);
  border-radius: 12px;
  padding: 1rem;
  color: var(--outline);
  font-size: 0.85rem;
  line-height: 1.55;
  background: rgba(248,249,250,0.7);
}

.wp-search-wrap {
  position: relative; margin-bottom: 1rem;
}
.wp-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--outline); pointer-events: none;
}
.wp-search-input {
  width: 100%;
  background: var(--surface-low);
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 0.8rem 1rem 0.8rem 2.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: var(--on-surface);
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.wp-search-input::placeholder { color: #9ca3af; }
.wp-search-input:focus {
  border-color: rgba(0,82,255,0.45);
  box-shadow: 0 0 0 3px rgba(0,82,255,0.07);
  background: white;
}
.wp-search-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: white; border: 1px solid var(--outline-soft);
  border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 20; overflow: hidden;
  max-height: 360px;
  overflow-y: auto;
}
.wp-search-item {
  padding: 10px 16px; font-size: 0.875rem; cursor: pointer;
  color: var(--on-surface); transition: background 0.1s;
  display: flex; align-items: center; gap: 8px;
}
.wp-search-item:hover { background: var(--surface-low); }
.wp-skill-category-button {
  width: 100%;
  border: 0;
  background: white;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  transition: background 0.1s;
}
.wp-skill-category-button:hover { background: var(--surface-low); }
.wp-skill-category-name {
  display: block;
  font-size: 0.88rem;
  font-weight: 750;
  color: var(--on-surface);
}
.wp-skill-category-desc {
  display: block;
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--outline);
  line-height: 1.45;
}
.wp-skill-count {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-dim);
  border-radius: 999px;
  padding: 3px 8px;
}
.wp-skill-back {
  width: 100%;
  border: 0;
  background: var(--surface-low);
  color: var(--primary);
  padding: 10px 16px;
  font-size: 0.82rem;
  font-weight: 750;
  text-align: left;
  cursor: pointer;
}
.wp-search-item-type {
  font-size: 0.68rem; font-weight: 600; padding: 2px 7px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;
}

.wp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.wp-chip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 12px 6px 14px; border-radius: 20px;
  font-size: 0.82rem; font-weight: 600; cursor: default;
}
.wp-chip.tech   { background: var(--primary-dim); color: var(--primary); }
.wp-chip.soft   { background: var(--tertiary-dim); color: var(--tertiary); }
.wp-chip-x {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%;
  background: none; border: none; cursor: pointer;
  color: inherit; opacity: 0.6; padding: 0;
  transition: opacity 0.15s;
}
.wp-chip-x:hover { opacity: 1; }

.wp-exp-card {
  background: var(--surface-low); border-radius: 12px;
  padding: 1.25rem 1.5rem;
  border: 1.5px solid transparent;
  position: relative; transition: border-color 0.2s;
}
.wp-exp-card:hover { border-color: rgba(0,82,255,0.2); }
.wp-exp-delete {
  position: absolute; top: 12px; right: 12px;
  width: 32px; height: 32px; border-radius: 50%;
  background: none; border: none; cursor: pointer;
  color: var(--error); display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s, background 0.15s;
}
.wp-exp-card:hover .wp-exp-delete { opacity: 1; }
.wp-exp-delete:hover { background: rgba(186,26,26,0.08); }

.wp-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.wp-edu-item {
  background: var(--surface-low); border-radius: 10px;
  padding: 1rem 1.1rem;
}
.wp-edu-name { font-size: 0.9rem; font-weight: 700; color: var(--on-surface); }
.wp-edu-sub  { font-size: 0.8rem; color: var(--on-muted); margin-top: 2px; }

.wp-cert-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface-low); border-radius: 10px;
  padding: 0.8rem 1rem;
}
.wp-cert-editor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}
.wp-cert-editor-card {
  background: var(--surface-low);
  border-radius: 12px;
  border: 1.5px solid transparent;
  padding: 1rem 1.1rem;
  position: relative;
}
.wp-cert-editor-card:hover {
  border-color: rgba(0,82,255,0.2);
}
.wp-cert-editor-card:hover .wp-exp-delete {
  opacity: 1;
}
.wp-cert-editor-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0.85rem;
}
.wp-cert-logo {
  width: 40px; height: 40px; border-radius: 8px;
  background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 800; flex-shrink: 0;
}
.wp-cert-name { font-size: 0.82rem; font-weight: 700; color: var(--on-surface); }
.wp-cert-sub  { font-size: 0.72rem; color: var(--outline); margin-top: 1px; }

.wp-account-card {
  display:grid;
  grid-template-columns: 78px 1fr;
  gap: 1.25rem;
  align-items: center;
}
.wp-account-avatar {
  width: 78px; height: 78px; border-radius: 22px;
  background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%);
  color:white; display:flex; align-items:center; justify-content:center;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:1.45rem; font-weight:800;
}
.wp-account-name {
  font-family:'Plus Jakarta Sans',sans-serif; font-size:1.35rem; font-weight:850; margin-bottom:.25rem;
}
.wp-account-mail { color: var(--on-muted); font-size:.9rem; line-height:1.55; }
.wp-account-avatar-image {
  width: 78px; height: 78px; border-radius: 22px;
  object-fit: cover; display: block;
  box-shadow: 0 8px 20px rgba(37,99,235,0.18);
}
.wp-avatar-panel {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.1rem; margin-bottom: 1.25rem;
  border: 1px solid rgba(37,99,235,0.12);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(239,246,255,0.92), rgba(240,253,250,0.92));
}
.wp-avatar-panel-image,
.wp-avatar-panel-fallback {
  width: 84px; height: 84px; border-radius: 24px; flex-shrink: 0;
  box-shadow: 0 12px 24px rgba(15,23,42,0.12);
}
.wp-avatar-panel-image { object-fit: cover; display: block; }
.wp-avatar-panel-fallback {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%);
  color: white; font-family:'Plus Jakarta Sans',sans-serif; font-size:1.5rem; font-weight:800;
}
.wp-avatar-panel-copy { display: flex; flex-direction: column; align-items: flex-start; }
.wp-avatar-panel-title {
  font-family:'Plus Jakarta Sans',sans-serif; font-size:1rem; font-weight:800; color: var(--on-surface);
}
.wp-avatar-panel-text {
  margin: 0.25rem 0 0.8rem;
  color: var(--on-muted); font-size: 0.84rem; line-height: 1.55; max-width: 360px;
}

.wp-action-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1.5rem; flex-wrap: wrap;
  padding-top: 2rem;
  border-top: 1px solid rgba(195,197,217,0.3);
  margin-top: 1rem;
}
.wp-action-note { font-size: 0.82rem; color: var(--on-muted); max-width: 360px; line-height: 1.55; }
.wp-action-error { font-size: 0.82rem; color: var(--error); max-width: 360px; line-height: 1.55; }
.wp-action-btns { display: flex; gap: 12px; }
.btn-discard {
  padding: 0.75rem 1.75rem; border-radius: 9999px;
  border: 1.5px solid var(--outline-soft);
  background: white; color: var(--on-surface);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-discard:hover { background: var(--surface-high); }
.btn-finalize {
  padding: 0.75rem 2.25rem; border-radius: 9999px;
  border: none;
  background: var(--primary-btn); color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.95rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,82,255,0.28);
  transition: opacity 0.15s, transform 0.12s;
}
.btn-finalize:hover { opacity: 0.92; }
.btn-finalize:active { transform: scale(0.97); }
.btn-finalize:disabled {
  cursor: not-allowed;
  opacity: .55;
  box-shadow: none;
}

.wp-footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 1rem;
}
.wp-footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.9rem; color: #003ec7; }
.wp-footer-copy { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
.wp-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.wp-footer-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #64748b; text-decoration: none; cursor: pointer; transition: color 0.15s; }
.wp-footer-link:hover { color: #2563eb; }

@media (max-width: 660px) {
  .wp-grid { grid-template-columns: 1fr; }
  .wp-month-row { grid-template-columns: 1fr; }
  .wp-cert-editor-grid { grid-template-columns: 1fr; }
  .wp-bottom-grid { grid-template-columns: 1fr; }
  .wp-nav { height: auto; min-height: 60px; flex-wrap: wrap; gap: 0.75rem; padding: 0.75rem 1rem; }
  .wp-nav-links { order: 3; width: 100%; justify-content: center; gap: 1.25rem; }
  .wp-nav-actions { margin-left: auto; }
  .wp-action-row { flex-direction: column; align-items: stretch; }
  .wp-action-btns { flex-direction: column; }
  .wp-account-card { grid-template-columns: 1fr; text-align:center; }
  .wp-account-avatar { margin: 0 auto; }
  .wp-account-avatar-image { margin: 0 auto; }
  .wp-avatar-panel { flex-direction: column; text-align: center; }
  .wp-avatar-panel-copy { align-items: center; }
  .wp-hero-title { font-size: 2rem; }
}
`;

const profileViewCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --primary:      #003ec7;
  --primary-btn:  #0052ff;
  --primary-dim:  #eff2ff;
  --primary-text: #1d4ed8;
  --tertiary:     #005858;
  --tert-bg:      #007272;
  --tert-text:    #95f5f4;
  --surface:      #f8f9fa;
  --surface-low:  #f3f4f5;
  --surface-card: #ffffff;
  --surface-high: #e7e8e9;
  --outline:      #737688;
  --outline-soft: #c3c5d9;
  --on-surface:   #191c1d;
  --on-muted:     #52525b;
  --on-light:     #434656;
}

body{margin:0;}

.wv-root{
  font-family:'Inter',sans-serif;
  background:var(--surface);
  color:var(--on-surface);
  min-height:100vh;
}

.wv-topnav{
  position:sticky;top:0;z-index:60;
  background:rgba(255,255,255,0.92);
  backdrop-filter:blur(10px);
  border-bottom:1px solid #e2e8f0;
  padding:0 2rem;
  display:flex;align-items:center;justify-content:space-between;
  height:60px;
}
.wv-logo{
  font-family:'Sora',sans-serif;
  font-size:1.1rem;font-weight:700;
  color:#003ec7;letter-spacing:0;
  background:none;border:0;cursor:pointer;
}
.wv-toplinks{display:flex;align-items:center;gap:1.75rem;}
.wv-toplink{font-size:.875rem;font-weight:500;color:var(--on-muted);cursor:pointer;text-decoration:none;transition:color .15s;background:none;border:0;}
.wv-toplink:hover{color:var(--primary);}
.wv-topactions{display:flex;align-items:center;gap:.75rem;}
.btn-nav-primary{
  background:#2563eb;color:white;border:none;
  padding:.45rem 1.1rem;border-radius:20px;
  font-size:.875rem;font-weight:500;cursor:pointer;
  transition:opacity .15s;
}
.btn-nav-primary:hover{background:#1d4ed8;}
.btn-nav-ghost{
  background:none;border:none;font-size:.875rem;
  font-weight:500;color:#374151;cursor:pointer;
  padding:0.4rem 0.75rem;border-radius:6px;
}
.btn-nav-ghost:hover{background:#f1f5f9;}

.wv-layout{display:flex;justify-content:center;}

.wv-main{
  flex:1;min-width:0;
  padding:2rem 2.5rem 5rem;
  max-width:960px;
}

.wv-bento{display:grid;grid-template-columns:1fr;gap:1.25rem;margin-bottom:2.5rem;}

.wv-profile-card{
  background:var(--surface-card);
  border:1px solid rgba(195,197,217,0.3);
  border-radius:18px;
  padding:2rem;
  display:flex;gap:1.75rem;
  align-items:flex-start;
  box-shadow:0 1px 6px rgba(0,0,0,0.04);
}
.wv-avatar-wrap{position:relative;flex-shrink:0;}
.wv-avatar{
  width:120px;height:120px;border-radius:50%;
  object-fit:cover;
  border:4px solid white;
  box-shadow:0 4px 16px rgba(0,0,0,0.12);
  background:var(--surface-high);
}
.wv-avatar-fallback{
  width:120px;height:120px;border-radius:50%;
  border:4px solid white;
  box-shadow:0 4px 16px rgba(0,0,0,0.12);
  background:linear-gradient(135deg,#2563eb,#0d9488);
  color:white;display:flex;align-items:center;justify-content:center;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:2rem;font-weight:900;
}
.wv-profile-info{flex:1;min-width:0;}
.wv-profile-name{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:2rem;font-weight:900;
  letter-spacing:0;color:var(--on-surface);
  margin-bottom:4px;
}
.wv-profile-role{font-size:1rem;color:var(--on-muted);font-weight:500;margin-bottom:1rem;}
.wv-profile-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:.75rem;}
.wv-tag-location{
  display:flex;align-items:center;gap:5px;
  font-size:.8rem;color:var(--on-muted);
  background:var(--surface-low);
  padding:4px 12px;border-radius:20px;
}

.wv-section{margin-bottom:2.5rem;}
.wv-section-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:1.25rem;
}
.wv-section-title{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:1.25rem;font-weight:800;letter-spacing:0;
  display:flex;align-items:center;gap:9px;color:var(--on-surface);
}
.wv-ai-badge-sm{
  font-size:.65rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.08em;color:var(--primary-text);
  background:var(--primary-dim);padding:3px 8px;border-radius:6px;
}

.wv-suggestions-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}
.wv-suggest-card{
  background:var(--surface-card);
  border:1px solid rgba(195,197,217,0.3);
  border-radius:14px;padding:1.4rem;
  display:flex;flex-direction:column;gap:.75rem;
  box-shadow:0 1px 4px rgba(0,0,0,0.04);
  transition:box-shadow .2s,transform .15s;
}
.wv-suggest-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.08);transform:translateY(-2px);}
.wv-suggest-icon{
  width:40px;height:40px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
}
.wv-suggest-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:.9rem;font-weight:700;color:var(--on-surface);}
.wv-suggest-text{font-size:.8rem;color:var(--on-muted);line-height:1.55;}
.wv-suggest-text strong{color:var(--on-surface);font-weight:700;}
.wv-suggest-action{
  display:flex;align-items:center;justify-content:center;gap:5px;
  background:var(--surface-low);border:1px solid var(--outline-soft);
  border-radius:8px;padding:.5rem .75rem;
  font-size:.78rem;font-weight:600;color:var(--primary-text);
  cursor:pointer;transition:background .15s;margin-top:auto;
  width:100%;
  text-decoration:none;
}
.wv-suggest-action:hover{background:var(--primary-dim);}

.wv-comp-grid{display:grid;grid-template-columns:1fr 280px;gap:1.25rem;align-items:start;}
.wv-comp-left{
  background:var(--surface-card);
  border:1px solid rgba(195,197,217,0.3);
  border-radius:14px;padding:1.5rem;
  box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.wv-skill-category{margin-bottom:1.25rem;}
.wv-skill-label{
  font-size:.68rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.1em;color:var(--outline);margin-bottom:.75rem;
}
.wv-skills-wrap{display:flex;flex-wrap:wrap;gap:8px;}
.wv-skill-chip-tech{
  background:var(--surface-low);
  border:1px solid rgba(195,197,217,0.4);
  color:var(--on-light);font-size:.82rem;font-weight:500;
  padding:6px 14px;border-radius:8px;cursor:default;
  transition:background .15s;
}
.wv-skill-chip-tech:hover{background:var(--surface-high);}
.wv-skill-chip-soft{
  border:1px solid var(--outline-soft);
  color:var(--on-light);font-size:.82rem;font-weight:500;
  padding:6px 14px;border-radius:8px;cursor:default;
  background:white;
}

.wv-insight-col{display:flex;flex-direction:column;gap:1rem;}

.wv-insight-card{
  background:rgba(255,255,255,.85);
  backdrop-filter:blur(12px);
  border:1px solid rgba(195,197,217,0.3);
  border-radius:14px;padding:1.4rem;
  box-shadow:0 4px 20px rgba(0,0,0,0.06);
  position:relative;overflow:hidden;
}
.wv-insight-sparkle{
  position:absolute;top:12px;right:12px;
  color:rgba(0,82,255,.08);
}
.wv-insight-header{display:flex;align-items:center;gap:8px;margin-bottom:.9rem;}
.wv-ai-tag{
  background:var(--tert-bg);color:var(--tert-text);
  font-size:.6rem;font-weight:800;text-transform:uppercase;
  letter-spacing:.08em;padding:3px 8px;border-radius:4px;
}
.wv-insight-title{font-size:.9rem;font-weight:700;color:var(--on-surface);}
.wv-insight-text{font-size:.82rem;color:var(--on-muted);line-height:1.6;margin-bottom:1rem;}
.wv-insight-text strong{color:var(--primary-text);font-weight:700;}
.wv-companies{display:flex;align-items:center;gap:10px;}
.wv-company-avatars{display:flex;}
.wv-company-avatar{
  width:28px;height:28px;border-radius:50%;
  border:2px solid white;margin-left:-7px;
  background:var(--surface-high);overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  font-size:.6rem;font-weight:800;color:var(--on-muted);
}
.wv-company-avatar:first-child{margin-left:0;}
.wv-companies-text{font-size:.75rem;color:var(--on-muted);}

.wv-exp-list{display:flex;flex-direction:column;gap:1rem;}
.wv-exp-card{
  background:var(--surface-low);
  border-radius:14px;padding:1.25rem 1.5rem;
  display:flex;gap:1.25rem;align-items:flex-start;
  border:1px solid transparent;
  transition:background .15s,border-color .15s;cursor:default;
}
.wv-exp-card:hover{background:var(--surface-high);border-color:rgba(195,197,217,.4);}
.wv-exp-icon{
  width:52px;height:52px;background:white;border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 6px rgba(0,0,0,.08);flex-shrink:0;
}
.wv-exp-body{flex:1;min-width:0;}
.wv-exp-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px;gap:1rem;}
.wv-exp-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:1rem;font-weight:800;color:var(--on-surface);}
.wv-exp-badge{
  background:var(--primary-dim);color:var(--primary-text);
  font-size:.72rem;font-weight:700;
  padding:3px 10px;border-radius:20px;white-space:nowrap;
}
.wv-exp-company{font-size:.875rem;font-weight:600;color:var(--on-surface);margin-bottom:2px;}
.wv-exp-period{font-size:.78rem;color:var(--outline);margin-bottom:.75rem;}
.wv-exp-desc{font-size:.82rem;color:var(--on-muted);line-height:1.6;max-width:700px;}

.wv-bottom-grid{display:grid;grid-template-columns:3fr 2fr;gap:2.5rem;}
.wv-cert-grid{display:grid;grid-template-columns:1fr 1fr;gap:.85rem;}
.wv-cert-card{
  background:white;
  border:1px solid rgba(195,197,217,.35);
  border-radius:12px;padding:1rem 1.1rem;
  display:flex;align-items:center;gap:12px;
  transition:box-shadow .2s;cursor:default;
}
.wv-cert-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.07);}
.wv-cert-icon{
  width:42px;height:42px;background:var(--surface-low);
  border-radius:10px;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;color:var(--on-muted);
}
.wv-cert-name{font-size:.82rem;font-weight:700;color:var(--on-surface);}
.wv-cert-sub{font-size:.72rem;color:var(--outline);margin-top:2px;}

.wv-edu-list{display:flex;flex-direction:column;gap:1.25rem;}
.wv-edu-item{
  position:relative;padding-left:1.25rem;
  border-left:3px solid var(--primary-dim);
}
.wv-edu-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:.9rem;font-weight:800;color:var(--on-surface);}
.wv-edu-school{font-size:.8rem;color:var(--on-muted);margin-top:2px;}
.wv-edu-meta{font-size:.72rem;color:var(--outline);font-weight:500;margin-top:2px;}

.wp-footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 1rem;
}
.wp-footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.9rem; color: #003ec7; }
.wp-footer-copy { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
.wp-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.wp-footer-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #64748b; text-decoration: none; cursor: pointer; transition: color 0.15s; }
.wp-footer-link:hover { color: #2563eb; }

@media(max-width:900px){
  .wv-bento{grid-template-columns:1fr;}
  .wv-comp-grid{grid-template-columns:1fr;}
  .wv-suggestions-grid{grid-template-columns:1fr;}
  .wv-bottom-grid{grid-template-columns:1fr;}
  .wv-cert-grid{grid-template-columns:1fr;}
  .wv-main{padding:1.5rem 1rem 5rem;}
}
@media(max-width:600px){
  .wv-toplinks{display:none;}
  .wv-bento{grid-template-columns:1fr;}
  .wv-profile-card{flex-direction:column;align-items:center;text-align:center;}
  .wv-profile-tags{justify-content:center;}
}
`;

function Ic({ d, size = 18, color = "currentColor", fill = "none", sw = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "W";
}

function createInitialDraft(user: AuthUser | null): ProfessionalDraft {
  return {
    avatarUrl: getUserAvatarUrl(user),
    form: {
      nome: user?.name || "",
      bio: "",
      cidade: "",
      estado: "",
    },
    skills: [],
    experiences: [],
    educations: [],
    certs: [],
  };
}

function createBlankExperience(): Experience {
  return {
    id: Date.now(),
    cargo: "",
    empresa: "",
    inicio: "",
    fim: "",
    atual: false,
    descricao: "",
  };
}

function createBlankEducation(): Education {
  return {
    id: Date.now(),
    nome: "",
    instituicao: "",
    inicio: "",
    fim: "",
    atual: false,
  };
}

function createBlankCertification(): Certification {
  return {
    id: Date.now(),
    logo: "",
    color: "#2563eb",
    name: "",
    emissor: "",
    data: "",
  };
}

function cloneDraft(draft: ProfessionalDraft): ProfessionalDraft {
  return {
    avatarUrl: draft.avatarUrl,
    form: { ...draft.form },
    skills: draft.skills.map((skill) => ({ ...skill })),
    experiences: draft.experiences.map((experience) => ({ ...experience })),
    educations: draft.educations.map((education) => ({ ...education })),
    certs: draft.certs.map((cert) => ({ ...cert })),
  };
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getBooleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function getNumberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getArrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSkill(raw: unknown): Skill | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const label = getStringValue(item.label).trim();
  const type = item.type === "soft" ? "soft" : "tech";

  return label ? { label, type } : null;
}

function normalizeExperience(raw: unknown, index: number): Experience | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const legacyPeriod = getStringValue(item.periodo);
  const cargo = getStringValue(item.cargo);
  const empresa = getStringValue(item.empresa);
  const descricao = getStringValue(item.descricao);

  if (!cargo && !empresa && !descricao && !legacyPeriod) {
    return null;
  }

  return {
    id: getNumberValue(item.id, Date.now() + index),
    cargo,
    empresa,
    inicio: getStringValue(item.inicio),
    fim: getStringValue(item.fim),
    atual: getBooleanValue(item.atual) || /atual|presente/i.test(legacyPeriod),
    descricao,
  };
}

function normalizeEducation(raw: unknown, index: number): Education | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const nome = getStringValue(item.nome);
  const instituicao = getStringValue(item.instituicao) || getStringValue(item.info);

  if (!nome && !instituicao) {
    return null;
  }

  return {
    id: getNumberValue(item.id, Date.now() + index),
    nome,
    instituicao,
    inicio: getStringValue(item.inicio),
    fim: getStringValue(item.fim),
    atual: getBooleanValue(item.atual),
  };
}

function normalizeCertification(raw: unknown, index: number): Certification | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const name = getStringValue(item.name);
  const emissor = getStringValue(item.emissor) || getStringValue(item.sub);

  if (!name && !emissor) {
    return null;
  }

  return {
    id: getNumberValue(item.id, Date.now() + index),
    logo: getStringValue(item.logo),
    color: getStringValue(item.color) || "#2563eb",
    name,
    emissor,
    data: getStringValue(item.data),
  };
}

function normalizeProfilePayload(raw: unknown): ProfessionalDraft | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const root = raw as Record<string, unknown>;
  const formSource =
    root.form && typeof root.form === "object"
      ? (root.form as Record<string, unknown>)
      : {};

  return {
    avatarUrl: getStringValue(root.avatarUrl),
    form: {
      nome: getStringValue(formSource.nome),
      bio: getStringValue(formSource.bio),
      cidade: getStringValue(formSource.cidade),
      estado: getStringValue(formSource.estado),
    },
    skills: getArrayValue(root.skills).map(normalizeSkill).filter(Boolean) as Skill[],
    experiences: getArrayValue(root.experiences).map(normalizeExperience).filter(Boolean) as Experience[],
    educations: getArrayValue(root.educations).map(normalizeEducation).filter(Boolean) as Education[],
    certs: getArrayValue(root.certs).map(normalizeCertification).filter(Boolean) as Certification[],
  };
}

function getSupabaseErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const errorPayload = payload as Record<string, unknown>;
  for (const key of ["message", "msg", "hint", "details", "code"]) {
    const value = errorPayload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function assertProfileConfig(): void {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return;
  }

  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar o perfil no Supabase.");
}

type StoredProfileRecord = {
  draft: ProfessionalDraft;
  completedAt: string | null;
};

async function fetchStoredProfileRecord(user: AuthUser | null, accessToken: string | null): Promise<StoredProfileRecord | null> {
  if (!user?.id || !accessToken) {
    return null;
  }

  assertProfileConfig();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/professional_profiles?select=profile_json,completed_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getSupabaseErrorMessage(payload, "Não foi possível carregar seu perfil profissional."));
  }

  const rows = Array.isArray(payload) ? payload : [];
  const firstRow = rows[0] as Record<string, unknown> | undefined;
  if (!firstRow) {
    return null;
  }

  return {
    draft: sortDraftChronologically(normalizeProfilePayload(firstRow.profile_json) || createInitialDraft(user)),
    completedAt: getStringValue(firstRow.completed_at) || null,
  };
}

export async function fetchProfessionalProfile(user: AuthUser | null, accessToken: string | null): Promise<ProfessionalProfile | null> {
  const storedRecord = await fetchStoredProfileRecord(user, accessToken);
  if (!storedRecord?.completedAt) {
    return null;
  }

  return {
    ...storedRecord.draft,
    completedAt: storedRecord.completedAt,
  };
}

async function saveProfessionalProfile(user: AuthUser | null, accessToken: string | null, profile: ProfessionalProfile): Promise<void> {
  if (!user?.id || !accessToken) {
    throw new Error("Entre novamente para salvar seu perfil profissional.");
  }

  assertProfileConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/professional_profiles?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      profile_json: profile,
      completed_at: profile.completedAt,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getSupabaseErrorMessage(payload, "Não foi possível salvar seu perfil profissional no Supabase."));
  }
}

function getStorageObjectPath(userId: string): string {
  return `${userId}/avatar`;
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getStorageErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const errorPayload = payload as Record<string, unknown>;
  for (const key of ["message", "error", "msg"]) {
    const value = errorPayload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

async function uploadProfileAvatar(user: AuthUser | null, accessToken: string | null, file: File): Promise<string> {
  if (!user?.id || !accessToken) {
    throw new Error("Entre novamente para atualizar sua foto de perfil.");
  }

  assertProfileConfig();

  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem válido.");
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    throw new Error("A foto deve ter no máximo 5 MB.");
  }

  const storagePath = encodeStoragePath(getStorageObjectPath(user.id));
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_AVATAR_BUCKET)}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  const payload = await response.text().then((raw) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  });

  if (!response.ok) {
    throw new Error(getStorageErrorMessage(payload, "Não foi possível enviar sua foto para o Supabase."));
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_AVATAR_BUCKET)}/${storagePath}?v=${Date.now()}`;
}

async function persistProfileAvatar(
  user: AuthUser | null,
  accessToken: string | null,
  avatarUrl: string,
): Promise<StoredProfileRecord> {
  if (!user?.id || !accessToken) {
    throw new Error("Entre novamente para salvar sua foto de perfil.");
  }

  const existingRecord = await fetchStoredProfileRecord(user, accessToken);
  const nextDraft = existingRecord
    ? {
        ...cloneDraft(existingRecord.draft),
        avatarUrl,
      }
    : {
        ...createInitialDraft(user),
        avatarUrl,
      };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/professional_profiles?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      profile_json: nextDraft,
      completed_at: existingRecord?.completedAt,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getSupabaseErrorMessage(payload, "Não foi possível salvar a foto do perfil no Supabase."));
  }

  return {
    draft: nextDraft,
    completedAt: existingRecord?.completedAt || null,
  };
}

type AvatarImageMetrics = {
  width: number;
  height: number;
};

type AvatarCropState = {
  offsetX: number;
  offsetY: number;
  zoom: number;
};

function clampAvatarOffset(
  offsetX: number,
  offsetY: number,
  zoom: number,
  metrics: AvatarImageMetrics,
): AvatarCropState {
  const baseScale = Math.max(AVATAR_EDITOR_VIEWPORT / metrics.width, AVATAR_EDITOR_VIEWPORT / metrics.height);
  const drawnWidth = metrics.width * baseScale * zoom;
  const drawnHeight = metrics.height * baseScale * zoom;
  const maxOffsetX = Math.max(0, (drawnWidth - AVATAR_EDITOR_VIEWPORT) / 2);
  const maxOffsetY = Math.max(0, (drawnHeight - AVATAR_EDITOR_VIEWPORT) / 2);

  return {
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY)),
    zoom,
  };
}

async function loadAvatarImageMetrics(src: string): Promise<AvatarImageMetrics> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  return await new Promise<AvatarImageMetrics>((resolve, reject) => {
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => reject(new Error("Não foi possível carregar a foto atual para editar."));
    image.src = src;
  });
}

async function createEditedAvatarFile(
  src: string,
  metrics: AvatarImageMetrics,
  crop: AvatarCropState,
): Promise<File> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Não foi possível processar a foto atual."));
    image.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Não foi possível abrir o editor da foto.");
  }

  const baseScale = Math.max(AVATAR_EDITOR_VIEWPORT / metrics.width, AVATAR_EDITOR_VIEWPORT / metrics.height);
  const previewWidth = metrics.width * baseScale * crop.zoom;
  const previewHeight = metrics.height * baseScale * crop.zoom;
  const previewX = (AVATAR_EDITOR_VIEWPORT - previewWidth) / 2 + crop.offsetX;
  const previewY = (AVATAR_EDITOR_VIEWPORT - previewHeight) / 2 + crop.offsetY;
  const outputScale = AVATAR_OUTPUT_SIZE / AVATAR_EDITOR_VIEWPORT;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    previewX * outputScale,
    previewY * outputScale,
    previewWidth * outputScale,
    previewHeight * outputScale,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/png", 0.95);
  });

  if (!blob) {
    throw new Error("Não foi possível salvar a edição da foto.");
  }

  return new File([blob], "avatar.png", { type: "image/png" });
}

function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

function formatMonthYear(value: string): string {
  const [year, month] = value.split("-");
  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (!yearNumber || !monthNumber) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  })
    .format(new Date(yearNumber, monthNumber - 1, 1))
    .replace(".", "");
}

function formatPeriod(start: string, end: string, current: boolean, currentLabel = "Atual"): string {
  const formattedStart = formatMonthYear(start);
  const formattedEnd = current ? currentLabel : formatMonthYear(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }

  return formattedStart || formattedEnd || "Período não informado";
}

function getMonthSortValue(value: string): number {
  const [year, month] = value.split("-");
  const yearNumber = Number(year);
  const monthNumber = Number(month);

  if (!yearNumber || !monthNumber) {
    return 0;
  }

  return yearNumber * 12 + monthNumber;
}

function sortDraftChronologically(draft: ProfessionalDraft): ProfessionalDraft {
  const sorted = cloneDraft(draft);

  sorted.experiences.sort((a, b) => {
    if (a.atual !== b.atual) {
      return a.atual ? -1 : 1;
    }

    return Math.max(getMonthSortValue(b.fim), getMonthSortValue(b.inicio)) - Math.max(getMonthSortValue(a.fim), getMonthSortValue(a.inicio));
  });

  sorted.educations.sort((a, b) => {
    if (a.atual !== b.atual) {
      return a.atual ? -1 : 1;
    }

    return Math.max(getMonthSortValue(b.fim), getMonthSortValue(b.inicio)) - Math.max(getMonthSortValue(a.fim), getMonthSortValue(a.inicio));
  });

  sorted.certs.sort((a, b) => getMonthSortValue(b.data) - getMonthSortValue(a.data));

  return sorted;
}

function getSkillByLabel(label: string): Skill {
  const existing = SUGGESTIONS.find((skill) => skill.label === label);
  return existing || { label, type: "tech" };
}

function getCategorySkills(category: SkillCategory, selectedSkills: Skill[], query: string): Skill[] {
  const selectedLabels = new Set(selectedSkills.map((skill) => skill.label));
  const normalizedQuery = query.trim().toLowerCase();

  return category.skillLabels
    .map(getSkillByLabel)
    .filter((skill) => !selectedLabels.has(skill.label))
    .filter((skill) => !normalizedQuery || skill.label.toLowerCase().includes(normalizedQuery));
}

function getProfileSearchText(profile: ProfessionalProfile): string {
  return [
    profile.form.bio,
    ...profile.skills.map((skill) => skill.label),
    ...profile.experiences.map((experience) => `${experience.cargo} ${experience.descricao}`),
    ...profile.educations.map((education) => `${education.nome} ${education.instituicao}`),
    ...profile.certs.map((cert) => `${cert.name} ${cert.emissor}`),
  ]
    .join(" ")
    .toLowerCase();
}

function getMainArea(profileText: string): string {
  const areaScores = SKILL_CATEGORIES.map((category) => ({
    category,
    score: category.skillLabels.filter((skill) => profileText.includes(skill.toLowerCase())).length,
  })).sort((a, b) => b.score - a.score);

  return areaScores[0]?.score > 0 ? areaScores[0].category.label : "Tecnologia";
}

function generateProfileInsights(profile: ProfessionalProfile): ProfileInsights {
  const profileText = getProfileSearchText(profile);
  const mainArea = getMainArea(profileText);
  const selectedSkillCount = profile.skills.length;
  const score = Math.min(96, Math.max(54, 46 + selectedSkillCount * 5 + profile.experiences.length * 7 + profile.certs.length * 4 + profile.educations.length * 3));

  return {
    market: {
      role: mainArea,
      score,
      summary: `Seu perfil tem ${score}% de aderência estimada para trilhas de ${mainArea}. O cálculo considera competências, experiências, formação e certificações preenchidas no cadastro.`,
    },
  };
}

function getMissingFields(draft: ProfessionalDraft): string[] {
  const missing: string[] = [];

  if (!isFilled(draft.form.nome)) missing.push("nome completo");
  if (!isFilled(draft.form.bio)) missing.push("bio curta");
  if (!isFilled(draft.form.cidade) || !isFilled(draft.form.estado)) {
    missing.push("CEP (cidade/estado)");
  }
  if (draft.skills.length === 0) missing.push("competências");
  if (draft.experiences.length === 0) missing.push("experiência profissional");

  draft.experiences.forEach((experience, index) => {
    const label = `experiência ${index + 1}`;
    if (!isFilled(experience.cargo)) missing.push(`${label}: cargo`);
    if (!isFilled(experience.empresa)) missing.push(`${label}: empresa`);
    if (!isFilled(experience.inicio)) missing.push(`${label}: mês/ano inicial`);
    if (!experience.atual && !isFilled(experience.fim)) missing.push(`${label}: mês/ano final`);
    if (!isFilled(experience.descricao)) missing.push(`${label}: descrição`);
  });

  draft.educations.forEach((education, index) => {
    const label = `formação ${index + 1}`;
    if (!isFilled(education.nome)) missing.push(`${label}: curso`);
    if (!isFilled(education.instituicao)) missing.push(`${label}: instituição`);
    if (!isFilled(education.inicio)) missing.push(`${label}: mês/ano inicial`);
    if (!education.atual && !isFilled(education.fim)) missing.push(`${label}: mês/ano final`);
  });

  draft.certs.forEach((cert, index) => {
    const label = `certificação ${index + 1}`;
    if (!isFilled(cert.logo)) missing.push(`${label}: sigla`);
    if (!isFilled(cert.name)) missing.push(`${label}: nome`);
    if (!isFilled(cert.emissor)) missing.push(`${label}: emissor`);
    if (!isFilled(cert.data)) missing.push(`${label}: mês/ano`);
  });

  return missing;
}

function ProfileAvatar({
  avatarUrl,
  name,
  className,
  fallbackClassName,
}: {
  avatarUrl: string;
  name: string;
  className: string;
  fallbackClassName: string;
}) {
  if (avatarUrl) {
    return <img className={className} src={avatarUrl} alt={`Foto de perfil de ${name}`} />;
  }

  return <div className={fallbackClassName}>{getInitials(name)}</div>;
}

function HeaderAvatarButton({
  user,
  avatarUrl,
}: {
  user: AuthUser | null;
  avatarUrl: string;
}) {
  return (
    <button
      className={`ws-btn-primary${user ? " ws-profile-avatar" : ""}`}
      type="button"
      aria-label={user ? `Perfil de ${user.name}` : "Login"}
      title={user ? `Perfil de ${user.name}` : "Login"}
    >
      {avatarUrl ? (
        <img className="ws-profile-avatar-image" src={avatarUrl} alt="" aria-hidden="true" />
      ) : (
        user ? getInitials(user.name) : "Login"
      )}
    </button>
  );
}

function EditableAvatar({
  avatarUrl,
  name,
  imageClassName,
  fallbackClassName,
  shellClassName,
  isUploading,
  error,
  onFileSelect,
}: {
  avatarUrl: string;
  name: string;
  imageClassName: string;
  fallbackClassName: string;
  shellClassName: string;
  isUploading: boolean;
  error?: string;
  onFileSelect: (file: File | null) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dialogMode, setDialogMode] = useState<"actions" | "editor" | null>(null);
  const [editorError, setEditorError] = useState("");
  const [isPreparingEditor, setIsPreparingEditor] = useState(false);
  const [isSavingEditor, setIsSavingEditor] = useState(false);
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);
  const [imageMetrics, setImageMetrics] = useState<AvatarImageMetrics | null>(null);
  const [crop, setCrop] = useState<AvatarCropState>({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  });
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);

  const isEditorOpen = dialogMode === "editor";
  const editorSourceUrl = pendingFileUrl || avatarUrl;

  useEffect(() => {
    return () => {
      if (pendingFileUrl) {
        URL.revokeObjectURL(pendingFileUrl);
      }
    };
  }, [pendingFileUrl]);

  useEffect(() => {
    if (!isEditorOpen || !editorSourceUrl) {
      setImageMetrics(null);
      setEditorError("");
      setCrop({ offsetX: 0, offsetY: 0, zoom: 1 });
      return;
    }

    let cancelled = false;
    setIsPreparingEditor(true);
    setEditorError("");

    loadAvatarImageMetrics(editorSourceUrl)
      .then((metrics) => {
        if (cancelled) {
          return;
        }

        setImageMetrics(metrics);
        setCrop(clampAvatarOffset(0, 0, 1, metrics));
      })
      .catch((currentError) => {
        if (!cancelled) {
          setEditorError(currentError instanceof Error ? currentError.message : "Não foi possível abrir o editor da foto.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreparingEditor(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editorSourceUrl, isEditorOpen]);

  const chooseFileLabel = avatarUrl ? "Alterar foto" : "Escolher arquivo";
  const editorPreview = imageMetrics
    ? clampAvatarOffset(crop.offsetX, crop.offsetY, crop.zoom, imageMetrics)
    : crop;

  const previewStyle = useMemo(() => {
    if (!editorSourceUrl || !imageMetrics) {
      return undefined;
    }

    const baseScale = Math.max(AVATAR_EDITOR_VIEWPORT / imageMetrics.width, AVATAR_EDITOR_VIEWPORT / imageMetrics.height);
    const width = imageMetrics.width * baseScale * editorPreview.zoom;
    const height = imageMetrics.height * baseScale * editorPreview.zoom;
    const left = (AVATAR_EDITOR_VIEWPORT - width) / 2 + editorPreview.offsetX;
    const top = (AVATAR_EDITOR_VIEWPORT - height) / 2 + editorPreview.offsetY;

    return {
      width: `${width}px`,
      height: `${height}px`,
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [editorPreview, editorSourceUrl, imageMetrics]);

  const openFileExplorer = () => {
    setEditorError("");
    window.setTimeout(() => {
      inputRef.current?.click();
    }, 10);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (pendingFileUrl) {
      URL.revokeObjectURL(pendingFileUrl);
    }

    setPendingFileUrl(URL.createObjectURL(file));
    setEditorError("");
    setDialogMode("editor");
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageMetrics || isPreparingEditor || isSavingEditor) {
      return;
    }

    dragStateRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!imageMetrics || !dragStateRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.x;
    const deltaY = event.clientY - dragStateRef.current.y;
    dragStateRef.current = { x: event.clientX, y: event.clientY };

    setCrop((current) =>
      clampAvatarOffset(current.offsetX + deltaX, current.offsetY + deltaY, current.zoom, imageMetrics),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleZoomChange = (value: number) => {
    if (!imageMetrics) {
      return;
    }

    setCrop((current) => clampAvatarOffset(current.offsetX, current.offsetY, value, imageMetrics));
  };

  const handleApplyEditor = async () => {
    if (!editorSourceUrl || !imageMetrics || isSavingEditor) {
      return;
    }

    setIsSavingEditor(true);
    setEditorError("");

    try {
      const file = await createEditedAvatarFile(editorSourceUrl, imageMetrics, editorPreview);
      await onFileSelect(file);
      if (pendingFileUrl) {
        URL.revokeObjectURL(pendingFileUrl);
        setPendingFileUrl(null);
      }
      setDialogMode(null);
    } catch (currentError) {
      setEditorError(currentError instanceof Error ? currentError.message : "Não foi possível salvar a edição da foto.");
    } finally {
      setIsSavingEditor(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      return;
    }

    if (pendingFileUrl) {
      URL.revokeObjectURL(pendingFileUrl);
      setPendingFileUrl(null);
    }

    setDialogMode(null);
    setEditorError("");
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="wp-avatar-input"
        onChange={(event) => {
          void handleFileChange(event.target.files?.[0] || null);
          event.currentTarget.value = "";
        }}
      />

      <div className="wp-avatar-control">
        <div className={shellClassName}>
          <ProfileAvatar
            avatarUrl={avatarUrl}
            name={name}
            className={imageClassName}
            fallbackClassName={fallbackClassName}
          />
          <button
            type="button"
            className="wp-avatar-overlay"
            aria-label={avatarUrl ? "Editar foto de perfil" : "Adicionar foto de perfil"}
            onClick={() => setDialogMode("actions")}
            disabled={isUploading}
          >
            <span className="wp-avatar-overlay-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
          </button>
        </div>

        {(error || editorError) && <div className="wp-avatar-feedback">{error || editorError}</div>}
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={handleDialogChange}>
        <DialogContent className="wp-avatar-dialog">
          {dialogMode === "actions" ? (
            <>
              <DialogHeader className="wp-avatar-dialog-header">
                <DialogTitle className="wp-avatar-dialog-title">Foto de perfil</DialogTitle>
              </DialogHeader>
              <div className="wp-avatar-dialog-actions">
                {avatarUrl && (
                  <button
                    type="button"
                    className="wp-avatar-dialog-btn"
                    onClick={() => {
                      if (pendingFileUrl) {
                        URL.revokeObjectURL(pendingFileUrl);
                        setPendingFileUrl(null);
                      }
                      setDialogMode("editor");
                    }}
                    disabled={isUploading}
                  >
                    Editar foto
                  </button>
                )}
                <button
                  type="button"
                  className="wp-avatar-dialog-btn wp-avatar-dialog-btn-primary"
                  onClick={openFileExplorer}
                  disabled={isUploading}
                >
                  {isUploading ? "Enviando..." : chooseFileLabel}
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="wp-avatar-dialog-header">
                <DialogTitle className="wp-avatar-dialog-title">Editar foto</DialogTitle>
              </DialogHeader>
              <div className="wp-avatar-editor">
                <div
                  className={`wp-avatar-editor-frame${isPreparingEditor ? " is-loading" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {editorSourceUrl && previewStyle && (
                    <img
                      src={editorSourceUrl}
                      alt=""
                      aria-hidden="true"
                      className="wp-avatar-editor-image"
                      style={previewStyle}
                    />
                  )}
                </div>
                <div className="wp-avatar-editor-controls">
                  <label className="wp-avatar-editor-label" htmlFor="avatar-zoom-range">
                    Zoom
                  </label>
                  <input
                    id="avatar-zoom-range"
                    className="wp-avatar-editor-range"
                    type="range"
                    min="1"
                    max="2.6"
                    step="0.01"
                    value={editorPreview.zoom}
                    onChange={(event) => handleZoomChange(Number(event.target.value))}
                    disabled={!imageMetrics || isPreparingEditor || isSavingEditor}
                  />
                  <div className="wp-avatar-editor-hint">Arraste a foto para enquadrar.</div>
                  {editorError && <div className="wp-avatar-feedback">{editorError}</div>}
                </div>
                <div className="wp-avatar-dialog-actions">
                  <button
                    type="button"
                    className="wp-avatar-dialog-btn"
                    onClick={() => setDialogMode("actions")}
                    disabled={isSavingEditor}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="wp-avatar-dialog-btn wp-avatar-dialog-btn-primary"
                    onClick={() => void handleApplyEditor()}
                    disabled={!imageMetrics || isPreparingEditor || isSavingEditor}
                  >
                    {isSavingEditor ? "Salvando..." : "Atualizar foto"}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileNav({
  user,
  avatarUrl,
  isSigningOut,
  onNavigateHome,
  onSignOut,
}: {
  user: AuthUser | null;
  avatarUrl: string;
  isSigningOut: boolean;
  onNavigateHome: () => void;
  onSignOut: () => void;
}) {
  return (
    <SiteHeader
      onExploreClick={onNavigateHome}
      actions={
        <>
          <HeaderAvatarButton user={user} avatarUrl={avatarUrl} />
          <button className="ws-btn-ghost" type="button" onClick={onSignOut} disabled={isSigningOut}>
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </>
      }
    />
  );
}

function ProfileFooter() {
  return <SiteFooter />;
}

function ProfileSummary({
  user,
  avatarUrl,
  avatarError,
  isUploadingAvatar,
  isSigningOut,
  onAvatarSelect,
  onStart,
  onNavigateHome,
  onSignOut,
}: {
  user: AuthUser | null;
  avatarUrl: string;
  avatarError: string;
  isUploadingAvatar: boolean;
  isSigningOut: boolean;
  onAvatarSelect: (file: File | null) => void;
  onStart: () => void;
  onNavigateHome: () => void;
  onSignOut: () => void;
}) {
  const firstName = getUserFirstName(user);

  return (
    <>
      <style>{profileFormCss + avatarControlCss}</style>
      <div className="wp-root">
        <ProfileNav user={user} avatarUrl={avatarUrl} isSigningOut={isSigningOut} onNavigateHome={onNavigateHome} onSignOut={onSignOut} />
        <main className="wp-main">
          <div className="wp-hero">
            <h1 className="wp-hero-title">Olá, {firstName}.</h1>
            <p className="wp-hero-sub">
              Sua conta Worky já está criada. Complete suas informações profissionais para montar seu perfil completo.
            </p>
          </div>

          <section className="wp-section">
            <div className="wp-section-header">
              <div className="wp-section-title-wrap">
                <div className="wp-section-icon" style={{ background: "rgba(0,62,199,0.08)" }}>
                  <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" color="#003ec7" size={18} />
                </div>
                <h2 className="wp-section-title">Perfil básico</h2>
              </div>
            </div>

            <div className="wp-account-card">
              <EditableAvatar
                avatarUrl={avatarUrl}
                name={user?.name || "Worky"}
                imageClassName="wp-account-avatar-image"
                fallbackClassName="wp-account-avatar"
                shellClassName="wp-avatar-shell wp-account-avatar-shell"
                isUploading={isUploadingAvatar}
                error={avatarError}
                onFileSelect={onAvatarSelect}
              />
              <div>
                <div className="wp-account-name">{user?.name || "Usuário Worky"}</div>
                <div className="wp-account-mail">{user?.email || "E-mail não informado"}</div>
              </div>
            </div>

            <div className="wp-action-row">
              <p className="wp-action-note">
                Depois de preencher todos os campos profissionais, esta tela passa a mostrar seu perfil completo.
              </p>
              <div className="wp-action-btns">
                <button className="btn-finalize" type="button" onClick={onStart}>
                  Completar informações profissionais
                </button>
              </div>
            </div>
          </section>
        </main>
        <ProfileFooter />
      </div>
    </>
  );
}

function WorkyProfileForm({
  user,
  draft,
  avatarError,
  isUploadingAvatar,
  isSigningOut,
  submitAttempted,
  missingFields,
  profileError,
  isSavingProfile,
  onAvatarSelect,
  onDraftChange,
  onDiscard,
  onFinalize,
  onNavigateHome,
  onSignOut,
}: {
  user: AuthUser | null;
  draft: ProfessionalDraft;
  avatarError: string;
  isUploadingAvatar: boolean;
  isSigningOut: boolean;
  submitAttempted: boolean;
  missingFields: string[];
  profileError: string;
  isSavingProfile: boolean;
  onAvatarSelect: (file: File | null) => void;
  onDraftChange: (updater: (draft: ProfessionalDraft) => ProfessionalDraft) => void;
  onDiscard: () => void;
  onFinalize: () => void;
  onNavigateHome: () => void;
  onSignOut: () => void;
}) {
  const [skillSearch, setSkillSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSkillCategory, setActiveSkillCategory] = useState<string | null>(null);
  const [profileCep, setProfileCep] = useState("");
  const [cepError, setCepError] = useState("");
  const searchRef = useRef<HTMLDivElement | null>(null);
  const experienceListRef = useRef<HTMLDivElement | null>(null);
  const educationListRef = useRef<HTMLDivElement | null>(null);
  const certListRef = useRef<HTMLDivElement | null>(null);

  const selectedCategory = SKILL_CATEGORIES.find((category) => category.id === activeSkillCategory) || null;
  const categorySkills = selectedCategory ? getCategorySkills(selectedCategory, draft.skills, skillSearch) : [];
  const orderedDraft = useMemo(() => sortDraftChronologically(draft), [draft]);

  const updateForm = (field: keyof ProfileFormData, value: string) => {
    onDraftChange((current) => ({
      ...current,
      form: { ...current.form, [field]: value },
    }));
  };

  const locationLabel = [draft.form.cidade, draft.form.estado].filter(Boolean).join(", ");

  const addSkill = (skill: Skill) => {
    onDraftChange((current) => ({
      ...current,
      skills: [...current.skills, skill],
    }));
    setSkillSearch("");
  };

  const removeSkill = (label: string) => {
    onDraftChange((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.label !== label),
    }));
  };

  const scrollListToBottom = (ref: RefObject<HTMLDivElement>) => {
    window.setTimeout(() => {
      const element = ref.current;
      if (!element) {
        return;
      }

      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
      element.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  };

  const addExperience = () => {
    onDraftChange((current) => ({
      ...current,
      experiences: [...current.experiences, createBlankExperience()],
    }));
    scrollListToBottom(experienceListRef);
  };

  const updateExp = (id: number, field: keyof Experience, value: string | boolean) => {
    onDraftChange((current) => ({
      ...current,
      experiences: current.experiences.map((experience) =>
        field === "atual" && value === true
          ? experience.id === id
            ? { ...experience, atual: true, fim: "" }
            : { ...experience, atual: false }
          : experience.id === id
            ? { ...experience, [field]: value }
            : experience,
      ),
    }));
  };

  const removeExp = (id: number) => {
    onDraftChange((current) => ({
      ...current,
      experiences: current.experiences.filter((experience) => experience.id !== id),
    }));
  };

  const addEducation = () => {
    onDraftChange((current) => ({
      ...current,
      educations: [...current.educations, createBlankEducation()],
    }));
    scrollListToBottom(educationListRef);
  };

  const updateEducation = (id: number, field: keyof Education, value: string | boolean) => {
    onDraftChange((current) => ({
      ...current,
      educations: current.educations.map((education) =>
        education.id === id ? { ...education, [field]: value } : education,
      ),
    }));
  };

  const removeEducation = (id: number) => {
    onDraftChange((current) => ({
      ...current,
      educations: current.educations.filter((education) => education.id !== id),
    }));
  };

  const addCert = () => {
    onDraftChange((current) => ({
      ...current,
      certs: [...current.certs, createBlankCertification()],
    }));
    scrollListToBottom(certListRef);
  };

  const updateCert = (id: number, field: keyof Certification, value: string) => {
    onDraftChange((current) => ({
      ...current,
      certs: current.certs.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert,
      ),
    }));
  };

  const removeCert = (id: number) => {
    onDraftChange((current) => ({
      ...current,
      certs: current.certs.filter((cert) => cert.id !== id),
    }));
  };

  return (
    <>
      <style>{profileFormCss + avatarControlCss}</style>
      <div className="wp-root">
        <ProfileNav user={user} avatarUrl={draft.avatarUrl} isSigningOut={isSigningOut} onNavigateHome={onNavigateHome} onSignOut={onSignOut} />

        <main className="wp-main">
          <div className="wp-hero">
            <h1 className="wp-hero-title">Complete seu perfil.</h1>
            <p className="wp-hero-sub">
              Com o perfil preenchido, a Worky indica vagas e cursos mais alinhados à sua área.
            </p>
          </div>

          <div className="wp-sections">
            <section className="wp-section">
              <div className="wp-section-header">
                <div className="wp-section-title-wrap">
                  <div className="wp-section-icon" style={{ background: "rgba(0,62,199,0.08)" }}>
                    <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" color="#003ec7" size={18} />
                  </div>
                  <h2 className="wp-section-title">Informações Básicas</h2>
                </div>
              </div>

              <div className="wp-avatar-panel">
                <EditableAvatar
                  avatarUrl={draft.avatarUrl}
                  name={draft.form.nome || user?.name || "Worky"}
                  imageClassName="wp-avatar-panel-image"
                  fallbackClassName="wp-avatar-panel-fallback"
                  shellClassName="wp-avatar-shell wp-avatar-panel-shell"
                  isUploading={isUploadingAvatar}
                  error={avatarError}
                  onFileSelect={onAvatarSelect}
                />
                <div className="wp-avatar-panel-copy">
                  <div className="wp-avatar-panel-title">Foto de perfil</div>
                </div>
              </div>

              <div className="wp-grid">
                <div className="wp-field">
                  <label className="wp-label">Nome Completo *</label>
                  <input className="wp-input" type="text" placeholder="Ex: Lucas Silva" value={draft.form.nome} onChange={(event) => updateForm("nome", event.target.value)} />
                </div>
                <div className="wp-field">
                  <label className="wp-label">Bio Curta *</label>
                  <input className="wp-input" type="text" placeholder="Ex: Desenvolvedor Fullstack focado em IA" value={draft.form.bio} onChange={(event) => updateForm("bio", event.target.value)} />
                </div>
                <CepField
                  id="profile-cep"
                  className="wp-field"
                  label="CEP *"
                  value={profileCep}
                  locationLabel={locationLabel}
                  error={cepError}
                  inputClassName="wp-input"
                  onCepChange={(cep) => {
                    setProfileCep(cep);
                    setCepError("");
                  }}
                  onResolved={(_label, city, state) => {
                    onDraftChange((current) => ({
                      ...current,
                      form: { ...current.form, cidade: city, estado: state },
                    }));
                    setCepError("");
                  }}
                  onClearLocation={() => {
                    onDraftChange((current) => ({
                      ...current,
                      form: { ...current.form, cidade: "", estado: "" },
                    }));
                  }}
                />
                <div className="wp-field">
                  <label className="wp-label">Cidade (via CEP)</label>
                  <input className="wp-input" type="text" value={draft.form.cidade} readOnly placeholder="Preenchida pelo CEP" />
                </div>
                <div className="wp-field">
                  <label className="wp-label">Estado (via CEP)</label>
                  <input className="wp-input" type="text" value={draft.form.estado} readOnly placeholder="UF" />
                </div>
              </div>
            </section>

            <section className="wp-section">
              <div className="wp-section-header">
                <div className="wp-section-title-wrap">
                  <div className="wp-section-icon" style={{ background: "rgba(0,88,88,0.08)" }}>
                    <Ic d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" color="#005858" size={18} />
                  </div>
                  <h2 className="wp-section-title">Competências</h2>
                </div>
              </div>

              <div className="wp-search-wrap" ref={searchRef}>
                <div className="wp-search-icon">
                  <Ic d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" size={17} />
                </div>
                <input
                  className="wp-search-input"
                  placeholder={selectedCategory ? `Filtrar em ${selectedCategory.label}...` : "Clique para escolher uma área de competências..."}
                  value={skillSearch}
                  onChange={(event) => {
                    setSkillSearch(event.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
                {showDropdown && (
                  <div className="wp-search-dropdown">
                    {!selectedCategory ? (
                      SKILL_CATEGORIES.map((category) => {
                        const availableCount = getCategorySkills(category, draft.skills, "").length;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            className="wp-skill-category-button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setActiveSkillCategory(category.id);
                              setSkillSearch("");
                            }}
                          >
                            <span>
                              <span className="wp-skill-category-name">{category.label}</span>
                              <span className="wp-skill-category-desc">{category.description}</span>
                            </span>
                            <span className="wp-skill-count">{availableCount}</span>
                          </button>
                        );
                      })
                    ) : (
                      <>
                        <button
                          type="button"
                          className="wp-skill-back"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setActiveSkillCategory(null);
                            setSkillSearch("");
                          }}
                        >
                          Voltar para áreas
                        </button>
                        {categorySkills.length === 0 ? (
                          <div className="wp-empty-state">Nenhuma competência disponível nessa área.</div>
                        ) : (
                          categorySkills.map((suggestion) => (
                            <div key={suggestion.label} className="wp-search-item" onMouseDown={() => addSkill(suggestion)}>
                              <span
                                className="wp-search-item-type"
                                style={{
                                  background: suggestion.type === "tech" ? "rgba(0,82,255,0.1)" : "rgba(0,88,88,0.1)",
                                  color: suggestion.type === "tech" ? "#003ec7" : "#005858",
                                }}
                              >
                                {suggestion.type === "tech" ? "Tech" : "Soft"}
                              </span>
                              {suggestion.label}
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="wp-chips">
                {draft.skills.map((skill) => (
                  <div key={skill.label} className={`wp-chip ${skill.type}`}>
                    {skill.label}
                    <button className="wp-chip-x" type="button" onClick={() => removeSkill(skill.label)} aria-label={`Remover ${skill.label}`}>
                      <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="wp-section">
              <div className="wp-section-header">
                <div className="wp-section-title-wrap">
                  <div className="wp-section-icon" style={{ background: "rgba(0,62,199,0.08)" }}>
                    <Ic d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-3h2v3h-2z" color="#003ec7" size={18} />
                  </div>
                  <h2 className="wp-section-title">Experiência Profissional</h2>
                </div>
                <button className="wp-add-btn" type="button" onClick={addExperience}>
                  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Adicionar
                </button>
              </div>

              <div ref={experienceListRef} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {orderedDraft.experiences.length === 0 && (
                  <div className="wp-empty-state">
                    Nenhuma experiência adicionada. Clique em Adicionar para preencher cargo, empresa e período.
                  </div>
                )}
                {orderedDraft.experiences.map((experience) => (
                  <div key={experience.id} className="wp-exp-card">
                    <div className="wp-grid">
                      <div className="wp-field">
                        <label className="wp-label-upper">Cargo</label>
                        <input className="wp-inline-input" type="text" placeholder="Ex: Analista de Dados" value={experience.cargo} onChange={(event) => updateExp(experience.id, "cargo", event.target.value)} />
                      </div>
                      <div className="wp-field">
                        <label className="wp-label-upper">Empresa</label>
                        <input className="wp-inline-input" type="text" placeholder="Ex: Empresa XYZ" value={experience.empresa} onChange={(event) => updateExp(experience.id, "empresa", event.target.value)} />
                      </div>
                      <div className="wp-month-row">
                        <div className="wp-field">
                          <label className="wp-label-upper">Início</label>
                          <input className="wp-input" type="month" value={experience.inicio} onChange={(event) => updateExp(experience.id, "inicio", event.target.value)} />
                        </div>
                        <div className="wp-field">
                          <label className="wp-label-upper">Fim</label>
                          <input className="wp-input" type="month" value={experience.fim} disabled={experience.atual} onChange={(event) => updateExp(experience.id, "fim", event.target.value)} />
                        </div>
                        <div className="wp-check-row">
                          <input
                            id={`exp-current-${experience.id}`}
                            type="checkbox"
                            checked={experience.atual}
                            onChange={(event) => {
                              updateExp(experience.id, "atual", event.target.checked);
                              if (event.target.checked) {
                                updateExp(experience.id, "fim", "");
                              }
                            }}
                          />
                          <label htmlFor={`exp-current-${experience.id}`}>Atualmente</label>
                        </div>
                      </div>
                      <div className="wp-field">
                        <label className="wp-label-upper">Descrição</label>
                        <textarea className="wp-textarea" rows={2} placeholder="Descreva suas principais responsabilidades e resultados" value={experience.descricao} onChange={(event) => updateExp(experience.id, "descricao", event.target.value)} />
                      </div>
                    </div>
                    <button className="wp-exp-delete" type="button" onClick={() => removeExp(experience.id)} aria-label="Remover experiência">
                      <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="wp-bottom-grid">
              <section className="wp-section">
                <div className="wp-section-header">
                  <div className="wp-section-title-wrap">
                    <div className="wp-section-icon" style={{ background: "rgba(0,62,199,0.08)" }}>
                      <Ic d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" color="#003ec7" size={18} />
                    </div>
                    <h2 className="wp-section-title" style={{ fontSize: "1.1rem" }}>
                      Formação
                    </h2>
                  </div>
                  <button className="wp-add-btn" type="button" style={{ fontSize: "0.8rem" }} onClick={addEducation}>
                    Adicionar
                  </button>
                </div>
                <div ref={educationListRef} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {orderedDraft.educations.length === 0 && (
                    <div className="wp-empty-state">
                      Nenhuma formação adicionada. Clique em Adicionar para preencher curso, instituição e período.
                    </div>
                  )}
                  {orderedDraft.educations.map((education) => (
                    <div key={education.id} className="wp-exp-card">
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="wp-field">
                          <label className="wp-label-upper">Curso</label>
                          <input className="wp-inline-input" type="text" placeholder="Ex: Ciência da Computação" value={education.nome} onChange={(event) => updateEducation(education.id, "nome", event.target.value)} />
                        </div>
                        <div className="wp-field">
                          <label className="wp-label-upper">Instituição</label>
                          <input className="wp-inline-input" type="text" placeholder="Ex: USP" value={education.instituicao} onChange={(event) => updateEducation(education.id, "instituicao", event.target.value)} />
                        </div>
                        <div className="wp-month-row">
                          <div className="wp-field">
                            <label className="wp-label-upper">Início</label>
                            <input className="wp-input" type="month" value={education.inicio} onChange={(event) => updateEducation(education.id, "inicio", event.target.value)} />
                          </div>
                          <div className="wp-field">
                            <label className="wp-label-upper">Fim</label>
                            <input className="wp-input" type="month" value={education.fim} disabled={education.atual} onChange={(event) => updateEducation(education.id, "fim", event.target.value)} />
                          </div>
                          <div className="wp-check-row">
                            <input
                              id={`edu-current-${education.id}`}
                              type="checkbox"
                              checked={education.atual}
                              onChange={(event) => {
                                updateEducation(education.id, "atual", event.target.checked);
                                if (event.target.checked) {
                                  updateEducation(education.id, "fim", "");
                                }
                              }}
                            />
                            <label htmlFor={`edu-current-${education.id}`}>Cursando</label>
                          </div>
                        </div>
                      </div>
                      <button className="wp-exp-delete" type="button" onClick={() => removeEducation(education.id)} aria-label="Remover formação">
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="wp-section">
                <div className="wp-section-header">
                  <div className="wp-section-title-wrap">
                    <div className="wp-section-icon" style={{ background: "rgba(0,88,88,0.08)" }}>
                      <Ic d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" color="#005858" size={18} />
                    </div>
                    <h2 className="wp-section-title" style={{ fontSize: "1.1rem" }}>
                      Certificações
                    </h2>
                  </div>
                  <button className="wp-add-btn" type="button" style={{ fontSize: "0.8rem" }} onClick={addCert}>
                    Adicionar
                  </button>
                </div>
                <div ref={certListRef} className="wp-cert-editor-list">
                  {orderedDraft.certs.length === 0 && (
                    <div className="wp-empty-state">
                      Nenhuma certificação adicionada. Clique em Adicionar para preencher nome, emissor e data.
                    </div>
                  )}
                  {orderedDraft.certs.map((cert) => (
                    <div key={cert.id} className="wp-cert-editor-card">
                      <div className="wp-cert-editor-grid">
                        <div className="wp-field">
                          <label className="wp-label-upper">Sigla</label>
                          <input className="wp-inline-input" type="text" placeholder="Ex: AWS" value={cert.logo} onChange={(event) => updateCert(cert.id, "logo", event.target.value.toUpperCase())} />
                        </div>
                        <div className="wp-field">
                          <label className="wp-label-upper">Certificação</label>
                          <input className="wp-inline-input" type="text" placeholder="Ex: Solutions Architect" value={cert.name} onChange={(event) => updateCert(cert.id, "name", event.target.value)} />
                        </div>
                        <div className="wp-field">
                          <label className="wp-label-upper">Emissor</label>
                          <input className="wp-inline-input" type="text" placeholder="Ex: Amazon Web Services" value={cert.emissor} onChange={(event) => updateCert(cert.id, "emissor", event.target.value)} />
                        </div>
                        <div className="wp-field">
                          <label className="wp-label-upper">Data</label>
                          <input className="wp-input" type="month" value={cert.data} onChange={(event) => updateCert(cert.id, "data", event.target.value)} />
                        </div>
                      </div>
                      <button className="wp-exp-delete" type="button" onClick={() => removeCert(cert.id)} aria-label="Remover certificação">
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="wp-action-row">
              <p className={profileError || (submitAttempted && missingFields.length > 0) ? "wp-action-error" : "wp-action-note"}>
                {profileError
                  ? profileError
                  : submitAttempted && missingFields.length > 0
                  ? `Preencha: ${missingFields.slice(0, 4).join(", ")}${missingFields.length > 4 ? "..." : "."}`
                  : "Ao salvar, usamos seus dados para recomendações de vagas e cursos."}
              </p>
              <div className="wp-action-btns">
                <button className="btn-discard" type="button" onClick={onDiscard}>
                  Descartar
                </button>
                <button className="btn-finalize" type="button" onClick={onFinalize} disabled={isSavingProfile}>
                  {isSavingProfile ? "Salvando..." : "Finalizar Cadastro"}
                </button>
              </div>
            </div>
          </div>
        </main>

        <ProfileFooter />
      </div>
    </>
  );
}

function WorkyView({
  user,
  profile,
  avatarError,
  isUploadingAvatar,
  isSigningOut,
  headerAvatarUrl,
  onAvatarSelect,
  onEdit,
  onNavigateHome,
  onSignOut,
}: {
  user: AuthUser | null;
  profile: ProfessionalProfile;
  avatarError: string;
  isUploadingAvatar: boolean;
  isSigningOut: boolean;
  headerAvatarUrl: string;
  onAvatarSelect: (file: File | null) => void;
  onEdit: () => void;
  onNavigateHome: () => void;
  onSignOut: () => void;
}) {
  const techSkills = profile.skills.filter((skill) => skill.type === "tech");
  const softSkills = profile.skills.filter((skill) => skill.type === "soft");
  const location = [profile.form.cidade, profile.form.estado].filter(Boolean).join(", ");
  const insights = useMemo(() => generateProfileInsights(profile), [profile]);
  const [referralProgress, setReferralProgress] = useState(() => (user ? getReferralProgress(user.id) : 0));
  const [aiCourses, setAiCourses] = useState<ProfileCourseSuggestion[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setCourseError("");

      try {
        const courses = await profileService.getCourseSuggestions(profile);
        if (!cancelled) {
          setAiCourses(courses);
        }
      } catch (error) {
        if (!cancelled) {
          setAiCourses([]);
          setCourseError(error instanceof Error ? error.message : "Não foi possível sugerir cursos agora.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return (
    <>
      <style>{profileViewCss + avatarControlCss}</style>
      <div className="wv-root">
        <SiteHeader
          onExploreClick={onNavigateHome}
          actions={
            <>
              <HeaderAvatarButton user={user} avatarUrl={headerAvatarUrl} />
              <button className="ws-btn-primary" type="button" onClick={onEdit}>
                Editar perfil
              </button>
              <button className="ws-btn-ghost" type="button" onClick={onSignOut} disabled={isSigningOut}>
                {isSigningOut ? "Saindo..." : "Sair"}
              </button>
            </>
          }
        />

        <div className="wv-layout">
          <main className="wv-main">
            <div className="wv-bento">
              <div className="wv-profile-card">
                <div className="wv-avatar-wrap">
                  <EditableAvatar
                    avatarUrl={profile.avatarUrl}
                    name={profile.form.nome || user?.name || "Worky"}
                    imageClassName="wv-avatar"
                    fallbackClassName="wv-avatar-fallback"
                    shellClassName="wp-avatar-shell wv-avatar-shell"
                    isUploading={isUploadingAvatar}
                    error={avatarError}
                    onFileSelect={onAvatarSelect}
                  />
                </div>
                <div className="wv-profile-info">
                  <h1 className="wv-profile-name">{profile.form.nome || user?.name || "Usuário Worky"}</h1>
                  <p className="wv-profile-role">{profile.form.bio || "Profissional Worky"}</p>
                  <div className="wv-profile-tags">
                    {location && (
                      <span className="wv-tag-location">
                        <Ic d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" size={13} color="currentColor" />
                        {location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="wv-section">
              <div className="wv-section-header">
                <div className="wv-section-title">
                  <Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" sw={0} color="#1d4ed8" size={20} />
                  Cursos sugeridos
                </div>
                <span className="wv-ai-badge-sm">Com link</span>
              </div>
              <div className="wv-suggestions-grid">
                {isLoadingCourses && (
                  <div className="wv-suggest-card">
                    <div className="wv-suggest-icon" style={{ background: "#eff2ff" }}>
                      <Ic d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0-2.121-2.121M7.757 7.757 5.636 5.636" size={19} color="#1d4ed8" />
                    </div>
                    <div className="wv-suggest-title">Procurando cursos</div>
                    <div className="wv-suggest-text">Analisando competências e formação para sugerir cursos com link.</div>
                  </div>
                )}
                {!isLoadingCourses && courseError && (
                  <div className="wv-suggest-card">
                    <div className="wv-suggest-icon" style={{ background: "#fef3c7" }}>
                      <Ic d="M12 9v4m0 4h.01M10.29 3.86 1.82 14A2 2 0 0 0 3.71 21h16.58a2 2 0 0 0 1.89-2.64l-8.47-14a2 2 0 0 0-3.42 0z" size={19} color="#92400e" />
                    </div>
                    <div className="wv-suggest-title">Cursos indisponíveis agora</div>
                    <div className="wv-suggest-text">{courseError}</div>
                  </div>
                )}
                {!isLoadingCourses && !courseError && aiCourses.slice(0, 3).map((course) => (
                  <div key={`${course.plataforma}-${course.titulo}-${course.url}`} className="wv-suggest-card">
                    <div className="wv-suggest-icon" style={{ background: course.area === "Segurança" ? "#fef3c7" : course.area === "Dados" || course.area === "IA" ? "#e0f7f7" : "#eff2ff" }}>
                      <Ic d="M12 6.253v13M5.75 8.253v9.5A2.25 2.25 0 0 0 8 20h8a2.25 2.25 0 0 0 2.25-2.25v-9.5M3 6.75 12 3l9 3.75-9 3.75L3 6.75z" size={19} color={course.area === "Segurança" ? "#92400e" : course.area === "Dados" || course.area === "IA" ? "#005858" : "#1d4ed8"} />
                    </div>
                    <div className="wv-suggest-title">{course.titulo}</div>
                    <div className="wv-suggest-text">
                      <strong>{course.plataforma}</strong> • {course.motivo}
                    </div>
                    <a className="wv-suggest-action" href={course.url} target="_blank" rel="noreferrer">
                      Abrir curso
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="wv-section">
              <div className="wv-section-title" style={{ marginBottom: "1.25rem" }}>
                <Ic d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" color="#003ec7" size={20} />
                Competências
              </div>

              <div className="wv-comp-grid">
                <div className="wv-comp-left">
                  <div className="wv-skill-category">
                    <div className="wv-skill-label">Habilidades Técnicas</div>
                    <div className="wv-skills-wrap">
                      {techSkills.map((skill) => (
                        <span key={skill.label} className="wv-skill-chip-tech">
                          {skill.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="wv-skill-category" style={{ marginBottom: 0 }}>
                    <div className="wv-skill-label">Soft Skills</div>
                    <div className="wv-skills-wrap">
                      {softSkills.map((skill) => (
                        <span key={skill.label} className="wv-skill-chip-soft">
                          {skill.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wv-insight-col">
                  <div className="wv-insight-card">
                    <div className="wv-insight-header">
                      <span className="wv-ai-tag">Resumo</span>
                      <span className="wv-insight-title">Match de mercado: {insights.market.role}</span>
                    </div>
                    <p className="wv-insight-text">
                      <strong>{insights.market.score}% de aderência</strong>. {insights.market.summary}
                    </p>
                  </div>

                  {user && (
                    <ReferralCard
                      variant="invite"
                      link={getReferralLink(user.id)}
                      progress={referralProgress}
                      onCopied={() => setReferralProgress(registerReferralShare(user.id))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="wv-section">
              <div className="wv-section-title" style={{ marginBottom: "1.25rem" }}>
                <Ic d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-3h2v3h-2z" color="#1d4ed8" size={20} />
                Experiência Profissional
              </div>
              <div className="wv-exp-list">
                {profile.experiences.map((experience) => {
                  const isCurrent = experience.atual;
                  return (
                    <div key={experience.id} className="wv-exp-card">
                      <div className="wv-exp-icon">
                        <Ic
                          d={isCurrent
                            ? "M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"
                            : "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"}
                          color={isCurrent ? "#1d4ed8" : "#9ca3af"}
                          size={26}
                        />
                      </div>
                      <div className="wv-exp-body">
                        <div className="wv-exp-top">
                          <div className="wv-exp-title">{experience.cargo}</div>
                          {isCurrent && <span className="wv-exp-badge">Atual</span>}
                        </div>
                        <div className="wv-exp-company">{experience.empresa}</div>
                        <div className="wv-exp-period">{formatPeriod(experience.inicio, experience.fim, experience.atual)}</div>
                        <div className="wv-exp-desc">{experience.descricao}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="wv-bottom-grid">
              <div>
                <div className="wv-section-title" style={{ marginBottom: "1.25rem" }}>
                  <Ic d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" color="#1d4ed8" size={20} />
                  Certificações
                </div>
                <div className="wv-cert-grid">
                  {profile.certs.map((cert) => (
                    <div key={cert.id} className="wv-cert-card">
                      <div className="wv-cert-icon">
                        <Ic d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.82-9.63A9 9 0 0 0 3.5 11" size={20} color="#52525b" />
                      </div>
                      <div>
                        <div className="wv-cert-name">{cert.name}</div>
                        <div className="wv-cert-sub">
                          {[cert.emissor, formatMonthYear(cert.data)].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="wv-section-title" style={{ marginBottom: "1.25rem" }}>
                  <Ic d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" color="#1d4ed8" size={20} />
                  Formação
                </div>
                <div className="wv-edu-list">
                  {profile.educations.map((education) => (
                    <div key={education.id} className="wv-edu-item">
                      <div className="wv-edu-name">{education.nome}</div>
                      <div className="wv-edu-school">{education.instituicao}</div>
                      <div className="wv-edu-meta">{formatPeriod(education.inicio, education.fim, education.atual, "Cursando")}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
        <ProfileFooter />
      </div>
    </>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { profileAvatarUrl, refreshProfileAvatar, session, signOut, user, isCompanyAccount, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [mode, setMode] = useState<ProfileMode>("summary");
  const [draft, setDraft] = useState<ProfessionalDraft>(() => createInitialDraft(user));
  const [persistedDraft, setPersistedDraft] = useState<ProfessionalDraft | null>(null);
  const [savedProfile, setSavedProfile] = useState<ProfessionalProfile | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || !session?.accessToken) return;

    if (isCompanyAccount) {
      navigate("/empresa", { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const company = await fetchCompanyProfile(session.accessToken, user.id);
        if (!cancelled && company) {
          navigate("/empresa", { replace: true });
        }
      } catch {
        // candidato sem perfil RH: permanece no /perfil
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCompanyAccount, loading, navigate, session?.accessToken, user]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileError("");
      setAvatarError("");

      if (!user || !session?.accessToken) {
        setPersistedDraft(null);
        setSavedProfile(null);
        setDraft(createInitialDraft(user));
        setMode("summary");
        return;
      }

      if (isCompanyAccount) {
        return;
      }

      try {
        const storedRecord = await fetchStoredProfileRecord(user, session.accessToken);
        if (cancelled) {
          return;
        }

        if (storedRecord?.completedAt) {
          const profile = {
            ...storedRecord.draft,
            completedAt: storedRecord.completedAt,
          };
          setSavedProfile(profile);
          setPersistedDraft(cloneDraft(storedRecord.draft));
          setDraft(cloneDraft(profile));
          setMode("completed");
          return;
        }

        if (storedRecord) {
          setPersistedDraft(cloneDraft(storedRecord.draft));
          setSavedProfile(null);
          setDraft(cloneDraft(storedRecord.draft));
          setMode("summary");
          return;
        }

        setPersistedDraft(null);
        setSavedProfile(null);
        setDraft(createInitialDraft(user));
        setMode("summary");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPersistedDraft(null);
        setSavedProfile(null);
        setDraft(createInitialDraft(user));
        setMode("summary");
        setProfileError(error instanceof Error ? error.message : "Não foi possível carregar seu perfil profissional.");
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isCompanyAccount, session?.accessToken, user]);

  const missingFields = useMemo(() => getMissingFields(draft), [draft]);

  if (loading || isCompanyAccount) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
        <p className="text-neutral-700 font-medium">Redirecionando para o painel da empresa...</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDraftChange = (updater: (draft: ProfessionalDraft) => ProfessionalDraft) => {
    setDraft((current) => updater(cloneDraft(current)));
  };

  const handleStart = () => {
    setSubmitAttempted(false);
    setProfileError("");
    setAvatarError("");
    setDraft(savedProfile ? cloneDraft(savedProfile) : persistedDraft ? cloneDraft(persistedDraft) : createInitialDraft(user));
    setMode("edit");
  };

  const handleDiscard = () => {
    setSubmitAttempted(false);
    setProfileError("");
    setAvatarError("");
    if (savedProfile) {
      setDraft(cloneDraft(savedProfile));
      setMode("completed");
      return;
    }

    setDraft(persistedDraft ? cloneDraft(persistedDraft) : createInitialDraft(user));
    setMode("summary");
  };

  const handleAvatarSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    setAvatarError("");
    setIsUploadingAvatar(true);

    try {
      const nextAvatarUrl = await uploadProfileAvatar(user, session?.accessToken || null, file);
      const storedRecord = await persistProfileAvatar(user, session?.accessToken || null, nextAvatarUrl);
      setPersistedDraft(cloneDraft(storedRecord.draft));
      setDraft((current) => ({
        ...cloneDraft(current),
        avatarUrl: nextAvatarUrl,
      }));
      setSavedProfile((current) => (current ? { ...current, avatarUrl: nextAvatarUrl } : current));
      await refreshProfileAvatar();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Não foi possível atualizar a foto do perfil.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitAttempted(true);
    setProfileError("");
    if (missingFields.length > 0) {
      return;
    }

    const sortedDraft = sortDraftChronologically(draft);
    const profile: ProfessionalProfile = {
      ...sortedDraft,
      completedAt: new Date().toISOString(),
    };

    setIsSavingProfile(true);
    try {
      await saveProfessionalProfile(user, session?.accessToken || null, profile);
      setSavedProfile(profile);
      setPersistedDraft(cloneDraft(profile));
      setDraft(cloneDraft(profile));
      setSubmitAttempted(false);
      setMode("completed");
      await refreshProfileAvatar();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Não foi possível salvar seu perfil profissional no Supabase.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navigateHome = () => navigate("/");

  if (mode === "edit") {
    return (
      <WorkyProfileForm
        user={user}
        draft={draft}
        avatarError={avatarError}
        isUploadingAvatar={isUploadingAvatar}
        isSigningOut={isSigningOut}
        submitAttempted={submitAttempted}
        missingFields={missingFields}
        profileError={profileError}
        isSavingProfile={isSavingProfile}
        onAvatarSelect={handleAvatarSelect}
        onDraftChange={handleDraftChange}
        onDiscard={handleDiscard}
        onFinalize={handleFinalize}
        onNavigateHome={navigateHome}
        onSignOut={handleSignOut}
      />
    );
  }

  if (mode === "completed" && savedProfile) {
    return (
      <WorkyView
        user={user}
        profile={savedProfile}
        avatarError={avatarError}
        isUploadingAvatar={isUploadingAvatar}
        isSigningOut={isSigningOut}
        headerAvatarUrl={savedProfile.avatarUrl || profileAvatarUrl}
        onAvatarSelect={handleAvatarSelect}
        onEdit={handleStart}
        onNavigateHome={navigateHome}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <ProfileSummary
      user={user}
      avatarUrl={draft.avatarUrl || profileAvatarUrl}
      avatarError={avatarError}
      isUploadingAvatar={isUploadingAvatar}
      isSigningOut={isSigningOut}
      onAvatarSelect={handleAvatarSelect}
      onStart={handleStart}
      onNavigateHome={navigateHome}
      onSignOut={handleSignOut}
    />
  );
}
