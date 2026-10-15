Segurança da Informação (SI), LGPD e Robustez
Identificação do projeto e da squad
Aplicação: Plataforma Worky (Web & API)
Squad: Squad Mindlab
Data da apresentação presencial e submissão: 22/10/2026
Ambiente de produção (deploy): https://workyy.vercel.app
Repositório GitHub: https://github.com/Midlab-my/Worky.git
Integrantes da Squad Mindlab
Nome
RA
Função
André Vitor
237255
Product Owner / Desenvolvimento / UX/UI
Gabriela da Silva
240636
Scrum Master
Guilherme Ferreira
234843
Scrum Master / Product Owner
Kaick Gomes
240328
Desenvolvimento Full Stack
1. Introdução e objetivo da entrega
O objetivo desta entrega final é consolidar e demonstrar todas as camadas de Segurança da Informação (SI), conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018) e Tolerância a Falhas e Robustez na plataforma Worky.
A aplicação foi projetada e implementada para mitigar as principais vulnerabilidades do mercado mapeadas pelo OWASP Top 10 e CWE Top 25, aplicando os princípios de Security by Design e Privacy by Default.
2. Arquitetura de segurança da plataforma
A arquitetura de segurança do Worky é dividida em quatro zonas de confiança:
Client Web/Mobile (React + Vite)
Comunicação segura: HTTPS / TLS 1.3, HSTS e CSP
API Gateway e Backend FastAPI (Python)
Middleware de hardening e cabeçalhos de segurança
Rate limiting em memória e controle de cotas
Sanitização e minimização de dados (ai_privacy.py)
Logs de auditoria com mascaramento de IP
Tratamento global de exceções para evitar vazamento de informações
Autenticação
Tokens JWT Bearer assinados / Service Role
Banco de dados e autenticação (Supabase / PostgreSQL)
Row Level Security (RLS) por usuário
Schema privado isolado (worky_private)
Triggers de proteção de planos (worky_guard_company_plan)
Rate limit compartilhado no banco (worky_private.rate_counters)
Criptografia em repouso (AES-256)
3. Threat modeling e mapeamento de vulnerabilidades
3.1 Modelo de ameaças STRIDE
Ameaça STRIDE
Vetor de risco na plataforma
Impacto potencial
Controles e mitigações implementadas
Spoofing
(Falsificação de identidade)
Tentativas de força bruta no login ou adivinhação de senhas.
Crítico
Hash bcrypt, bloqueio temporário após 5 erros e Autenticação de Múltiplo Fator (MFA/TOTP).
Tampering
(Adulteração de dados)
Injeção de scripts (XSS) ou comandos SQL em perfis e vagas.
Crítico
Sanitização Unicode NFKC, rejeição de tags HTML/scripts em input-security.ts, consultas parametrizadas e RLS.
Repudiation
(Repúdio)
Usuário corporativo contestar alteração de plano ou publicação de vagas.
Médio
Registro de trilha de auditoria imutável na tabela worky_private.entitlement_audit.
Information Disclosure
(Vazamento de informações)
Mensagens de erro 500 expondo consultas SQL, tabelas ou stack traces.
Crítico
Exception handler global que captura falhas técnicas e retorna UUID opaco (error_id) ao cliente.
Denial of Service
(Negação de serviço)
Requisições excessivas em endpoints de IA ou consultas pesadas.
Alto
Rate limiting duplo (FastAPI em memória e PostgreSQL compartilhado) e payload limitado a 128 KB.
Elevation of Privilege
(Elevação de privilégio)
Usuário comum tentar alterar o plano da empresa diretamente via REST.
Crítico
Row Level Security (RLS), trigger worky_guard_company_plan e schema worky_private protegido.
3.2 Matriz de vulnerabilidades encontradas vs. correções aplicadas
ID
Vulnerabilidade
Causa raiz
Severidade (DREAD)
Correção implementada no código
Status
V-01
Força bruta em contas
Falta de bloqueio após tentativas consecutivas inválidas de login.
8.5 (Alto)
Implementados registerFailedLoginAttempt e getLoginLockoutStatus em security-service.ts: bloqueio automático por 5 min após 5 falhas, com contador MM:SS.
Corrigido
V-02
Ausência de MFA
Contas administrativas e corporativas protegidas apenas por senha única.
8.0 (Alto)
Implementado MFA (TOTP com RFC 6238 e 4 códigos de backup) em security-service.ts e desafio ativo em AuthPage.tsx.
Corrigido
V-03
Recuperação insegura de senha
Botão "Esqueci a senha" inoperante, sem mecanismo de validação de identidade.
7.8 (Alto)
Criado ForgotPasswordModal: envio de código temporário (OTP) de 6 dígitos com expiração de 10 min, uso único e limite de tentativas.
Corrigido
V-04
Sessões indefinidamente abertas
Ausência de expiração por inatividade em estações compartilhadas.
7.2 (Médio)
Criado SessionTimeoutManager.tsx: aviso preventivo aos 13 min e destruição forçada da sessão aos 15 min de inatividade.
Corrigido
V-05
Vazamento em mensagens de erro
Exceções de banco (SQL / PostgreSQL) podiam ser refletidas ao usuário.
7.5 (Alto)
Blindagem com user-error.ts no frontend e generic_exception_handler no backend com error_id seguro.
Corrigido
V-06
Falta de gestão de cookies (LGPD)
Ausência de consentimento prévio para cookies analíticos e de preferências.
6.5 (Médio)
Implementado CookieBanner.tsx com separação de cookies essenciais, analíticos e de personalização.
Corrigido
V-07
Ausência de portabilidade de dados
Titular sem meio automatizado de exportar seus dados pessoais (Art. 18 LGPD).
6.8 (Médio)
Implementado LgpdDataModal.tsx com exportação instantânea em JSON estruturado de todos os dados do perfil.
Corrigido
V-08
Falta de hardening de servidor
Servidor FastAPI sem headers de proteção contra clickjacking e MIME-sniffing.
7.4 (Alto)
Injeção de headers HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff e Permissions-Policy em main.py.
Corrigido
V-09
Ausência de rotina de backup
Inexistência de script automatizado de backup com verificação de integridade.
7.0 (Médio)
Criado backend/scripts/backup_db.py com compressão gzip, hash criptográfico SHA-256 e retenção de 30 dias.
Corrigido
4. Criptografia, hash e sanitização de dados
4.1 Armazenamento seguro de senhas (hash com salt)
Algoritmo: bcrypt com salt dinâmico gerado aleatoriamente por conta.
Segurança: o algoritmo introduz um fator de custo computacional (work factor), tornando inviável qualquer tentativa de quebra por força bruta massiva ou tabelas pré-computadas (Rainbow Tables). Senhas em texto claro (plaintext) nunca são salvas.
4.2 Criptografia em trânsito e em repouso
Em trânsito: todo o canal de comunicação cliente-servidor opera sob HTTPS (TLS 1.3). O cabeçalho Strict-Transport-Security: max-age=31536000; includeSubDomains impede ataques de downgrade ou interceptação Man-in-the-Middle (MitM).
Em repouso: os volumes e tabelas de banco utilizam criptografia AES-256. Backups gerados pelo sistema possuem integridade atestada por hash criptográfico SHA-256.
4.3 Sanitização contra SQL Injection e XSS
No frontend (src/app/lib/input-security.ts):
Normalização Unicode através de NFKC;
Remoção automática de caracteres de controle ASCII (\u0000-\u001F);
Rejeição explícita de padrões de injeção como <script>, javascript:, union select, ; drop e xp_cmdshell;
Renderização segura padrão do React, que realiza escape automático de entidades HTML.
No backend (backend/ai_privacy.py):
Filtro de projeção profissional: remove dados pessoais (e-mails, URLs, telefones, CPFs) e valida apenas termos de um vocabulário técnico controlado antes do envio ao provedor de IA, prevenindo Prompt Injection e exfiltração de dados.
5. Rate limiting, sessão e tentativas de login
5.1 Proteção contra ataques de força bruta
Mecanismo: security-service.ts monitora tentativas consecutivas de senha inválida.
Política: ao atingir 5 tentativas incorretas, o acesso para a conta/identificador é bloqueado temporariamente por 5 minutos.
Experiência do usuário: o botão de login é desabilitado e a tela exibe uma contagem regressiva em tempo real:
"Acesso bloqueado por tentativas inválidas. Aguarde MM:SS antes de tentar novamente."
5.2 Expiração automática por inatividade
Mecanismo: o componente SessionTimeoutManager.tsx, acoplado ao layout global da aplicação, monitora eventos de interação (mousemove, keydown, touchstart, scroll).
Janela de inatividade:
13 minutos: um alerta modal preventivo avisa o usuário que a sessão irá expirar por segurança;
15 minutos: se não houver confirmação, a sessão é encerrada, os tokens locais são destruídos e o usuário é redirecionado à tela de autenticação.
5.3 Limitação de taxa de requisições (rate limiting)
Em memória (FastAPI): o backend controla requisições por IP através de rate_limit(request, bucket, max_calls, window_sec), protegendo contra ataques de negação de serviço (DoS).
No banco de dados (PostgreSQL): a tabela worky_private.rate_counters e a função RPC worky_rate_limit sincronizam cotas entre múltiplas instâncias da aplicação.
6. Políticas de senha forte e múltiplo fator (MFA)
6.1 Políticas de senha forte
A aplicação impõe e valida visualmente quatro critérios obrigatórios para novas senhas:
Mínimo de 8 caracteres;
Pelo menos uma letra maiúscula (A-Z);
Pelo menos um número (0-9);
Pelo menos um caractere especial (!@#$%^&* etc.).
O componente Password Strength Bar calcula a entropia da senha e exibe uma barra de progresso colorida com porcentagem dinâmica:
0% a 25%: vermelho (Muito fraca);
50%: laranja (Fraca);
75%: amarelo (Média);
100%: verde (Forte / Segura).
6.2 Autenticação de múltiplo fator (MFA / 2FA)
Padrão: Time-Based One-Time Password (TOTP) compatível com a RFC 6238 (Google Authenticator, Microsoft Authenticator, Authy).
Backup codes: na ativação do MFA, o sistema gera 4 códigos de contingência de 8 dígitos para uso em caso de extravio do dispositivo.
Fluxo de login: usuários com MFA ativado passam por uma segunda etapa de desafio, na qual devem fornecer o código de 6 dígitos antes de receberem o token de acesso.
7. Recuperação de senha segura via OTP
O fluxo de "Esqueci minha senha" foi implementado através do componente ForgotPasswordModal:
Etapa 1 – Solicitação: o usuário informa o e-mail cadastrado. A resposta é formulada para não revelar se o endereço está ou não cadastrado (prevenção contra enumeração de usuários).
Etapa 2 – Código temporário (OTP): geração de código numérico de 6 dígitos com criptografia segura (window.crypto.getRandomValues).
Validade: 10 minutos (Time-to-Live);
Uso único: o código é invalidado imediatamente após o primeiro uso;
Proteção contra brute force: bloqueio após 4 tentativas incorretas.
Etapa 3 – Redefinição: o usuário valida o código OTP e cadastra a nova senha, que deve obrigatoriamente cumprir as regras de senha forte.
8. Logs, backup e hardening
8.1 Logs de auditoria estruturados
O middleware security_hardening_middleware em backend/main.py registra logs de auditoria padronizados com:
Timestamp UTC em formato ISO;
Método HTTP e endpoint acessado;
Tempo de resposta em milissegundos;
Status code HTTP retornado;
Mascaramento de IP: os octetos finais do IP são anonimizados (ex.: 192.168.1.***), garantindo o princípio da minimização da LGPD;
Prevenção de vazamento: senhas, tokens de autorização e códigos OTP são sumariamente filtrados e nunca registrados em logs.
8.2 Hardening de servidor e aplicação
Eliminação de configurações padrão: remoção do cabeçalho Server: uvicorn.
Cabeçalhos HTTP de segurança injetados (OWASP):
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
X-XSS-Protection: 1; mode=block
8.3 Rotina de backup automático de dados
Script: backend/scripts/backup_db.py.
Compactação: gzip (.json.gz) para redução de tamanho e eficiência de transporte.
Validação de integridade: cálculo automático de hash criptográfico SHA-256, gravado no arquivo manifesto .manifest.json.
Política de retenção: purga automática (rotation) de arquivos de backup com mais de 30 dias.
9. Tratamento genérico de erros
A plataforma garante que falhas técnicas nunca revelem detalhes internos da infraestrutura:
No frontend (src/app/lib/user-error.ts): filtra e bloqueia qualquer mensagem que contenha palavras-chave sensíveis como TypeError, Failed to fetch, syntax error, postgres, psycopg, supabase.co ou nomes de arquivos de código. As mensagens apresentadas ao usuário são claras e genéricas (ex.: "Ocorreu um erro ao processar sua solicitação. Tente novamente.").
No backend (backend/main.py): o generic_exception_handler intercepta exceções não tratadas (HTTP 500), gera um identificador seguro UUIDv4 (error_id) para correlação nos logs internos e retorna apenas:
{"detail": "Ocorreu um erro interno ao processar a solicitacao. Tente novamente mais tarde.",
"error_id": "7b8e1a4c-5f2d-4e9a-8b1c-3d2e5f6a7b8c"}
10. Conformidade com a LGPD (Lei 13.709/2018)
Princípio / artigo LGPD
Requisito da lei
Implementação técnica no Worky
Art. 6º, III – Minimização
Tratamento apenas dos dados estritamente necessários.
O pipeline de IA (ai_privacy.py) expurga nomes, CPFs, e-mails e contatos antes de gerar análises profissionais.
Art. 7º, I – Consentimento
Consentimento inequívoco do titular para tratamento.
CookieBanner.tsx com aceite granular e checkbox explícito de termos e políticas no cadastro.
Art. 18, II – Direito de acesso
Titular poder consultar dados tratados.
Visualização clara de todas as informações cadastrais e curriculares no perfil.
Art. 18, V – Portabilidade
Obter dados em formato interoperável.
Botão "Exportar Meus Dados (JSON)" no modal LgpdDataModal.tsx, gerando download instantâneo.
Art. 18, VI – Eliminação / esquecimento
Solicitar a exclusão definitiva dos dados pessoais.
Fluxo de solicitação de revogação de consentimento e eliminação definitiva de dados no perfil.
Art. 7º, I e Art. 18, IX – Revogação
Revogação de consentimentos concedidos.
Toggle de consentimento recruitment_visible, permitindo ao candidato ativar ou desativar o compartilhamento com empresas.
11. Plano de testes e evidências de conformidade (SEC-01 a SEC-12)
ID do teste
Cenário avaliado
Resultado esperado
Implementação e evidência no Worky
Situação
SEC-01
Validação de senha fraca
Interface rejeita senhas fora dos requisitos de segurança.
PasswordStrengthBar e validateRegistrationPassword em AuthPage.tsx.
Aprovado
SEC-02
Proteção contra força bruta
Tentativas repetidas bloqueiam o acesso sem expor detalhes.
registerFailedLoginAttempt: bloqueio por 5 minutos após 5 erros, com contador MM:SS.
Aprovado
SEC-03
Autenticação de múltiplo fator
Recurso protegido exige código TOTP de segundo fator.
Suporte a Google Authenticator e backup codes em security-service.ts e AuthPage.tsx.
Aprovado
SEC-04
Recuperação via OTP
Código expira, é de uso único e possui limite de tentativas.
ForgotPasswordModal em AuthPage.tsx com OTP de 6 dígitos e expiração de 10 min.
Aprovado
SEC-05
Prevenção a SQL Injection
Entradas maliciosas são tratadas como dados puros.
Queries parametrizadas no Supabase e filtros anti-SQLi em input-security.ts.
Aprovado
SEC-06
Prevenção a XSS
Conteúdo malicioso é sanitizado sem execução de scripts.
Sanitização Unicode NFKC, remoção de tags HTML em input-security.ts e escape do React.
Aprovado
SEC-07
Rate limiting multicamadas
Excesso de requisições é controlado consistentemente.
Tabela worky_private.rate_counters (Postgres) e bucket por IP em FastAPI (main.py).
Aprovado
SEC-08
Expiração por inatividade
Sessão inativa expira automaticamente.
SessionTimeoutManager.tsx: aviso aos 13 min e logout forçado aos 15 min.
Aprovado
SEC-09
Autorização e RLS
Usuário não acessa registros pertencentes a outro usuário.
Row Level Security (RLS) no Supabase e isolamento no schema worky_private.
Aprovado
SEC-10
Tratamento genérico de erros
Respostas públicas nunca expõem stack traces ou infraestrutura.
user-error.ts no cliente e generic_exception_handler com UUID no servidor.
Aprovado
SEC-11
Auditoria e logs seguros
Ações críticas são logadas com IP mascarado e sem credenciais.
Middleware de auditoria em main.py com mascaramento 192.168.1.***.
Aprovado
SEC-12
Backup e integridade
É possível restaurar dados com garantia de integridade.
backup_db.py com compressão gzip, checksum SHA-256 e retenção rotativa de 30 dias.
Aprovado
12. Evolução de maturidade e novas tecnologias
Para as próximas fases de evolução da plataforma Worky, a Squad Mindlab estabeleceu o seguinte plano estratégico:
Autenticação sem senhas com Passkeys / WebAuthn (FIDO2):
Adoção de autenticação criptográfica biométrica baseada em chaves públicas e privadas vinculadas ao dispositivo do usuário, eliminando definitivamente os riscos de roubo de credenciais por phishing ou vazamentos.
Arquitetura Zero Trust (microssegmentação e mTLS):
Migração da comunicação interna entre serviços para Mutual TLS (mTLS) com certificados rotativos e verificação de identidade explícita a cada requisição.
Web Application Firewall (WAF) com detecção por Machine Learning:
Implementação de camada de borda (Cloudflare / AWS WAF) com regras inteligentes para bloqueio comportamental de bots, tráfego malicioso e mitigação de ataques de dia zero.
SIEM integrado com análise preditiva de ameaças:
Centralização dos logs de auditoria em uma ferramenta de Security Information and Event Management (SIEM), como OpenSearch ou Datadog Security Monitoring, com alertas em tempo real acionados por anomalias de acesso.
Integração DevSecOps com SAST e DAST automatizados:
Inclusão de scanners de segurança estáticos (SonarQube / Snyk) e dinâmicos (OWASP ZAP) na esteira de CI/CD do GitHub Actions.
13. Roteiro passo a passo para a apresentação presencial em sala
Durante a apresentação presencial no dia 22/10/2026, os integrantes da Squad Mindlab deverão demonstrar as defesas da aplicação na seguinte sequência:
Passo 1: Política de senha forte
Abrir a aplicação em /auth?mode=register.
Digitar uma senha simples (ex.: "123456") e mostrar a barra de força em vermelho.
Adicionar letras maiúsculas, números e caracteres especiais até a barra atingir 100% verde, "Forte (Segura)".
Passo 2: Proteção contra força bruta (lockout)
Acessar a tela de login (/auth).
Errar a senha propositalmente 5 vezes consecutivas.
Mostrar o botão de login bloqueado e o contador regressivo de 5 minutos sendo decrementado em tempo real na tela.
Passo 3: Recuperação de senha segura via OTP
Clicar no botão "Esqueci a senha?".
Informar o e-mail cadastrado e receber o código OTP temporário de 6 dígitos.
Inserir o código e cadastrar a nova senha com confirmação e validação de força.
Passo 4: Múltiplo fator de autenticação (MFA) e direitos do titular LGPD
Efetuar login e acessar a página de Perfil (/perfil).
Clicar no botão "Privacidade & LGPD" na barra de navegação.
Demonstrar a aba LGPD: clicar em "Exportar Meus Dados (JSON)" e abrir o arquivo baixado.
Demonstrar o toggle de consentimento de recrutamento (opt-in explícito).
Demonstrar a aba MFA: exibir a chave secreta TOTP e os 4 códigos de backup de contingência.
Passo 5: Gestão de cookies e expiração por inatividade
Abrir o site em janela anônima e apresentar o CookieBanner com preferências granulares.
Explicar a política do SessionTimeoutManager, que previne o sequestro de sessão através de logout automático após inatividade.
Passo 6: Hardening, logs e backup no backend
Exibir os headers de segurança (HSTS, CSP, X-Frame-Options) inspecionados no DevTools da aplicação.
Exibir a execução da rotina de backup (backup_db.py), comprovando a integridade por hash SHA-256, e o log de auditoria com IP anonimizado.
14. Conclusão
A plataforma Worky atende integralmente a todos os requisitos técnicos obrigatórios de Segurança da Informação, LGPD e Robustez estipulados para a Tarefa 5 da AC2.
A aplicação conta com defesas ativas contra ataques de injeção, força bruta, exposição de dados sensíveis e roubo de sessão, além de oferecer mecanismos completos para o exercício dos direitos dos titulares conforme a Lei 13.709/2018. Todos os middlewares, scripts e componentes estão testados, versionados e prontos para a demonstração e avaliação pela banca examinadora.