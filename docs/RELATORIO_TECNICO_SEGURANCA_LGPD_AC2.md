# 🛡️ RELATÓRIO TÉCNICO DE SEGURANÇA DA INFORMAÇÃO (SI), LGPD E ROBUSTEZ
## WORKY — SQUAD MINDLAB — AC2 – TAREFA 5

**Integrantes da Squad:**
- **André Vitor** - 237255 - PO / Desenvolvimento / UX / UI
- **Gabriela da Silva** - 240636 - Scrum Master
- **Guilherme Ferreira** - 234843 - Scrum Master / PO
- **Kaick Gomes** - 240328 - Desenvolvimento

**Instituição & Localidade:** Sorocaba – SP, 2026  
**Repositório do Projeto:** `https://github.com/Midlab-my/Worky.git`  
**Aplicação Publicada:** `https://workyy.vercel.app`  
**Data da Apresentação:** 22/10/2026  
**Versão do Documento:** 2.0 (Entrega Final Consolidada e Validada)  

---

## 1. Sumário Executivo

O presente documento consolida as implementações técnicas, arquiteturais e normativas de **Segurança da Informação (SI)**, conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)** e **Tolerância a Falhas** desenvolvidas para a plataforma **Worky**.

A plataforma foi submetida a um ciclo rigoroso de **Threat Modeling**, testes de intrusão preliminares, implementação de mecanismos de autenticação multifator (MFA), proteção ativa contra ataques de força bruta, controle de inatividade de sessão, tratamento genérico de erros e anonimização/minimização de dados pessoais no pipeline de Inteligência Artificial.

---

## 2. Threat Modeling & Mapeamento de Vulnerabilidades

### 2.1 Metodologia STRIDE Aplicada ao Worky

| Ameaça STRIDE | Vetor Potencial de Ataque | Impacto no Worky | Mitigação Implementada |
| :--- | :--- | :--- | :--- |
| **Spoofing (Falsificação de Identidade)** | Força bruta em senhas de candidatos ou sequestro de conta corporativa. | Alto | Autenticação bcrypt com salt dinâmico, bloqueio temporário após 5 erros, e MFA (TOTP). |
| **Tampering (Adulteração de Dados)** | Injeção de scripts (XSS) ou comandos SQL em formulários de currículo e vagas. | Crítico | Sanitização NFKC, regex de remoção de tags HTML/scripts em `input-security.ts` e projeção estrita em `ai_privacy.py`. |
| **Repudiation (Repúdio)** | Usuário ou empresa alegar não ter alterado plano, vaga ou dados de contato. | Médio | Tabela `worky_private.entitlement_audit` no Postgres e logs estruturados de auditoria no FastAPI. |
| **Information Disclosure (Vazamento de Informações)** | Exposição de stack traces, erros 500 do banco ou dados pessoais não anonimizados para a IA. | Crítico | Exception handler global com identificador seguro UUID (`error_id`), minimização de vocabulário e mascaramento de IP. |
| **Denial of Service (Negação de Serviço)** | Inundação de requisições em endpoints de login ou consumo massivo de IA. | Alto | Rate limiting por IP/operação no FastAPI e no PostgreSQL (`worky_rate_limit`), limite de payload de 128 KB. |
| **Elevation of Privilege (Elevação de Privilégio)** | Empresa no plano gratuito tentar acessar dados de candidatos ou alterar plano via requisições diretas. | Crítico | Row Level Security (RLS) no Supabase, trigger `worky_guard_company_plan` e schema `worky_private` protegido. |

---

### 2.2 Matriz de Correspondência com o Documento de Análise (F-01 a F-05)

| ID | Ponto de Atenção do Documento | Risco / Ação Recomendada no PDF | Implementação e Status no Worky |
| :---: | :--- | :--- | :--- |
| **F-01** | **Quota de busca** | Se a verificação falhar, aplicar política *fail-closed* e retornar erro genérico. | **Atendido:** RLS e RPC `worky_acquire` em `20261013_security.sql` bloqueiam a operação com *fail-closed* imediato se a cota for violada ou indisponível. |
| **F-02** | **Detalhes de exceções** | Evitar devolver mensagens internas ou detalhes de infraestrutura; usar logs protegidos com correlação. | **Atendido:** `user-error.ts` no frontend e `generic_exception_handler` com UUID `error_id` em `main.py` blindam respostas 500 ao cliente. |
| **F-03** | **Rate limiting local** | Usar controle centralizado/compartilhado para operações sensíveis. | **Atendido:** Tabela compartilhada `worky_private.rate_counters` com RPC `worky_rate_limit` no banco, além de bucket por IP no FastAPI. |
| **F-04** | **Migração de segurança** | Conferir execução, políticas RLS e permissões efetivas no banco. | **Atendido:** Schema `worky_private` isolado (`REVOKE ALL`), funções restritas ao `service_role` e trigger `worky_guard_company_plan`. |
| **F-05** | **Autenticação e sessão** | Validar expiração, MFA, recuperação por OTP, revogação e proteção contra tentativas automatizadas. | **Atendido:** Lockout temporário de 5 min após 5 erros, recuperação OTP em 3 etapas, MFA (TOTP) e expiração por inatividade de 15 min. |

---

### 2.3 Matriz de Vulnerabilidades Encontradas vs. Correções Aplicadas

| ID | Vulnerabilidade Identificada | Severidade (DREAD) | Correção Técnica Aplicada | Status |
| :---: | :--- | :---: | :--- | :---: |
| **VULN-01** | Ausência de limite em tentativas de senha (ataque de dicionário). | 8.2 (Alto) | Implementado lockout em `security-service.ts`: bloqueio automático por 5 minutos após 5 erros consecutivos, com contador regressivo em tempo real. | **Resolvido** |
| **VULN-02** | Botão "Esqueci minha senha" inoperante no login. | 7.8 (Alto) | Desenvolvido fluxo completo de recuperação via OTP de 6 dígitos com expiração de 10 min e redefinição de senha forte. | **Resolvido** |
| **VULN-03** | Sessão mantida aberta indefinidamente em navegadores compartilhados. | 7.0 (Médio) | Implementado `SessionTimeoutManager`: monitoramento de inatividade com aviso aos 13 minutos e logout aos 15 minutos. | **Resolvido** |
| **VULN-04** | Ausência de segundo fator de autenticação para contas críticas. | 8.0 (Alto) | Implementado suporte a MFA (TOTP com RFC 6238 e códigos de backup de emergência) configurável no perfil e exigido no login. | **Resolvido** |
| **VULN-05** | Falta de gestão de consentimento de cookies conforme a LGPD. | 6.5 (Médio) | Criado `CookieBanner` interativo com separação de cookies essenciais, analíticos e de preferências. | **Resolvido** |
| **VULN-06** | Titular sem mecanismo visual de portabilidade de dados pessoais. | 6.8 (Médio) | Desenvolvido modal `LgpdDataModal` com botão de download imediato em JSON estruturado (Art. 18 da LGPD). | **Resolvido** |
| **VULN-07** | Ausência de headers HTTP de segurança no servidor. | 7.4 (Alto) | Injetados headers HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff e Permissions-Policy em `main.py`. | **Resolvido** |
| **VULN-08** | Risco de exposição de detalhes do backend em erros não tratados (500). | 7.5 (Alto) | Handler global em FastAPI que oculta detalhes técnicos e gera referência única UUID para suporte. | **Resolvido** |

---

## 3. Criptografia, Hash e Sanitização

### 3.1 Criptografia em Trânsito e em Repouso
- **Em Trânsito:** Todo o tráfego é encapsulado em **TLS 1.3 / HTTPS**, com cabeçalho `Strict-Transport-Security: max-age=31536000; includeSubDomains` para impedir ataques de *downgrade* ou *SSL Strip*.
- **Em Repouso:** Dados persistidos em disco e banco são criptografados com padrão **AES-256**. Backups gerados pela rotina automatizada recebem validação de integridade por hash criptográfico **SHA-256**.

### 3.2 Algoritmo de Hash para Senhas
- As senhas nunca são armazenadas em formato texto claro (*plaintext*).
- É utilizado o algoritmo **bcrypt** com fator de custo configurado e salt aleatório de 16 bytes gerado por credencial, inviabilizando ataques por Rainbow Tables.

### 3.3 Sanitização e Prevenção contra Injeção (SQLi / XSS)
1. **Frontend (`src/app/lib/input-security.ts`):**
   - Normalização Unicode NFKC.
   - Remoção de caracteres de controle invisíveis (`\u0000-\u001F`).
   - Rejeição de padrões típicos de injeção (`<script>`, `javascript:`, `union select`, `; drop`, `xp_cmdshell`).
2. **Backend (`backend/ai_privacy.py`):**
   - Projeção profissional estrita: apenas termos validados de vocabulário profissional previamente aprovado chegam ao motor de IA, impedindo *Prompt Injection* e vazamento de dados sensíveis.

---

## 4. Rate Limiting, Sessão e Tentativas de Login

### 4.1 Bloqueio de Tentativas Inválidas (Proteção de Força Bruta)
- **Regra:** Máximo de 5 tentativas consecutivas com credenciais incorretas por usuário/IP.
- **Sanção:** Bloqueio temporário imediato por **5 minutos**.
- **Interface:** O botão de login é desativado e um banner dinâmico exibe a contagem regressiva `MM:SS`.

### 4.2 Expiração Automática por Inatividade
- Componente `SessionTimeoutManager` monitora eventos do usuário (`mousemove`, `keydown`, `touchstart`, `scroll`).
- **Aviso preventivo:** Aos **13 minutos** de inatividade, um diálogo avisa que a sessão será encerrada em 2 minutos.
- **Encerramento forçado:** Aos **15 minutos**, a sessão é destruída, o token local é expurgado e o usuário é redirecionado para login seguro.

### 4.3 Rate Limiting em Nível de API
- Middleware `_rate_limit` em memória no FastAPI e rotina `worky_rate_limit` no PostgreSQL controlam chamadas por minuto e por dia, mitigando ataques de *DDoS* e exaustão de recursos.

---

## 5. Políticas de Senha Forte & Múltiplo Fator (MFA)

### 5.1 Regras de Senha Forte e Validador Visual
A senha deve conter obrigatoriamente:
1. Mínimo de 8 caracteres;
2. Pelo menos uma letra maiúscula (`A-Z`);
3. Pelo menos um número (`0-9`);
4. Pelo menos um caractere especial (`!@#$%^&*...`).

O componente `PasswordStrengthBar` calcula a entropia da senha e exibe:
- Barra de progresso com porcentagem dinâmica (0% a 100%);
- Classificação por cores: Vermelho (Muito Fraca / Fraca), Amarelo (Média) e Verde (Forte/Segura).

### 5.2 Autenticação de Múltiplo Fator (MFA)
- Suporte a aplicativos autenticadores padrão (Google Authenticator, Microsoft Authenticator, Authy, 1Password) via chave secreta TOTP de 16 caracteres Base32.
- Geração de **4 códigos de backup de emergência** para contingência em caso de perda do dispositivo.
- Validação no login: se o usuário tiver MFA ativado, após o preenchimento da senha o sistema exige o código de 6 dígitos antes de autorizar a emissão do token final de acesso.

---

## 6. Recuperação de Senha Segura via OTP

O sistema disponibiliza o modal `ForgotPasswordModal` com fluxo seguro em três etapas:
1. **Solicitação:** O usuário informa o e-mail cadastrado.
2. **Emissão do OTP:** Geração de código numérico de 6 dígitos com entropia criptográfica (`window.crypto.getRandomValues`), com tempo de vida limitado a **10 minutos** e limite de 4 tentativas de validação.
3. **Confirmação e Redefinição:** O usuário valida o código OTP recebido e define uma nova senha respeitando a política de senha forte.
4. **Finalização:** O código OTP é imediatamente descartado (*single-use*) e as tentativas anteriores de erro são limpas.

---

## 7. Logs, Backup e Hardening

### 7.1 Auditoria Estruturada
- O middleware `security_hardening_middleware` no FastAPI registra em log seguro todas as requisições, mascarando os octetos finais do endereço IP (ex: `192.168.1.***`) para cumprir o princípio da minimização da LGPD.
- Informações sensíveis como senhas, tokens de acesso ou números de cartão nunca são registradas em logs.

### 7.2 Hardening de Servidor e Aplicação
- Injeção obrigatória dos seguintes cabeçalhos HTTP de segurança em todas as respostas:
  - `X-Content-Type-Options: nosniff` (impede MIME sniffing);
  - `X-Frame-Options: DENY` (previne ataques de Clickjacking);
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (força HTTPS);
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

### 7.3 Rotina de Backup Automático
- Script em `backend/scripts/backup_db.py`:
  - Execução de backup estruturado em formato comprimido `.json.gz`;
  - Cálculo automático de checksum **SHA-256** para verificação de integridade;
  - Política de retenção com purga automática de arquivos com mais de **30 dias**.

---

## 8. Tratamento Genérico de Erros

- **Frontend (`src/app/lib/user-error.ts`):** Filtra e bloqueia qualquer mensagem que contenha nomes de arquivos de código, referências de classes (`TypeError`, `ReferenceError`), termos de banco (`Postgres`, `SQL`, `Supabase`, `relation does not exist`) ou URLs internas.
- **Backend (`backend/main.py`):** O `generic_exception_handler` intercepta exceções não tratadas (HTTP 500), gera um identificador seguro UUID (`error_id`) para consulta interna da equipe técnica e retorna ao cliente apenas a mensagem padronizada:
  ```json
  {
    "detail": "Ocorreu um erro interno ao processar a solicitacao. Tente novamente mais tarde.",
    "error_id": "4a7b9c1d-8f2e-4e3b-9a1c-5d8f6e7b2a1c"
  }
  ```

---

## 9. Conformidade com a LGPD (Lei 13.709/2018)

| Princípio / Artigo LGPD | Requisito Legal | Implementação no Worky |
| :--- | :--- | :--- |
| **Art. 6º, III — Minimização** | Coleta apenas dos dados estritamente necessários. | Em `ai_privacy.py`, dados de identificação pessoal (CPF, e-mail, telefone) são removidos antes do processamento de carreira. |
| **Art. 7º, I — Consentimento** | Consentimento claro e inequívoco para tratamento. | Checkbox de consentimento no cadastro, `CookieBanner` para escolha de cookies e controle `recruitment_visible` no perfil. |
| **Art. 18, II — Acesso aos Dados** | Direito de consultar a totalidade dos dados cadastrados. | Disponibilizado no portal de privacidade dentro do perfil do candidato/empresa. |
| **Art. 18, V — Portabilidade** | Obter dados em formato interoperável. | Botão "Exportar Meus Dados (JSON)" no modal LGPD, gerando arquivo estruturado para download. |
| **Art. 18, VI — Eliminação / Esquecimento** | Solicitar a exclusão definitiva dos dados pessoais. | Fluxo de solicitação de revogação e exclusão permanente de dados pessoais disponível no perfil. |
| **Art. 46 — Segurança e Boas Práticas** | Medidas técnicas para proteger dados pessoais. | Criptografia em trânsito e repouso, rotina de backup com SHA-256, controle de sessão e MFA. |

---

## 10. Evolução de Maturidade e Novas Tecnologias

Para as fases futuras de evolução da plataforma, o plano de maturidade de SI contempla:
1. **Passkeys / WebAuthn (FIDO2):** Substituição progressiva de senhas por biometria e chaves de segurança de hardware.
2. **Zero Trust Architecture:** Implementação de microssegmentação onde nenhum serviço confia no outro sem autenticação contínua mTLS.
3. **Web Application Firewall (WAF) com IA:** Mitigação avançada de bots, ataques DDoS volumétricos e inspeção de payloads na borda (Cloudflare / AWS WAF).
4. **SIEM Integrado com Análise de Anomalias:** Centralização de telemetria de segurança (OpenSearch / Datadog Security Monitoring) com alarmes preditivos de comportamento incomum de acesso.

---

## 11. Resultados da Execução do Plano de Testes (SEC-01 a SEC-12)

Conforme estabelecido na **Seção 8 do documento de análise preliminar**, todos os 12 cenários de teste foram validados na versão corrente da aplicação:

| ID | Cenário de Teste | Resultado Esperado pelo Documento | Implementação e Evidência no Código | Status |
| :---: | :--- | :--- | :--- | :---: |
| **SEC-01** | **Senha fraca** | A interface informa os requisitos e o servidor rejeita senhas que não atendem à política. | `PasswordStrengthBar` e `validateRegistrationPassword` em `AuthPage.tsx` exigem 8 chars, maiúscula, número e caractere especial. | **Aprovado** |
| **SEC-02** | **Tentativas de login** | Tentativas repetidas acionam limite ou atraso sem expor detalhes da conta. | `registerFailedLoginAttempt` em `security-service.ts` impõe bloqueio de 5 min após 5 erros com resposta genérica e contador `MM:SS`. | **Aprovado** |
| **SEC-03** | **MFA** | O acesso ao recurso protegido exige o segundo fator configurado. | Desafio TOTP de 6 dígitos no login e gestão de 2FA/backup codes no `LgpdDataModal.tsx`. | **Aprovado** |
| **SEC-04** | **Recuperação OTP** | Código expira, é de uso único e possui limite de tentativas. | `ForgotPasswordModal` em `AuthPage.tsx` e `security-service.ts`: OTP de 6 dígitos expira em 10 min e bloqueia após 4 falhas. | **Aprovado** |
| **SEC-05** | **SQL Injection** | Entradas maliciosas são tratadas como dados e não alteram a consulta. | Queries parametrizadas no Supabase e filtros anti-SQLi (`union select`, `; drop`) em `input-security.ts`. | **Aprovado** |
| **SEC-06** | **XSS** | Conteúdo de teste é exibido como texto seguro e não executa scripts. | Sanitização com normalização NFKC, remoção de tags HTML/scripts em `input-security.ts` e React DOM escape. | **Aprovado** |
| **SEC-07** | **Rate limiting** | Excesso de requisições é limitado de forma consistente entre instâncias. | Tabela `worky_private.rate_counters` com `worky_rate_limit` no Postgres + bucket por IP no FastAPI. | **Aprovado** |
| **SEC-08** | **Expiração de sessão** | Sessão inativa expira conforme o tempo definido. | `SessionTimeoutManager.tsx`: aviso aos 13 min e logout automático aos 15 min de inatividade com revogação de tokens. | **Aprovado** |
| **SEC-09** | **Autorização / RLS** | Um usuário não acessa registros pertencentes a outro usuário. | Row Level Security (RLS) no Supabase, trigger `worky_guard_company_plan` e schema `worky_private` protegido. | **Aprovado** |
| **SEC-10** | **Erros** | Respostas públicas não contêm stack trace ou segredo. | `user-error.ts` no frontend e `generic_exception_handler` em `main.py` com UUID `error_id` opaco para suporte. | **Aprovado** |
| **SEC-11** | **Auditoria** | Eventos críticos são registrados sem tokens ou senhas. | Middleware de auditoria em `main.py` com IP mascarado (`192.168.1.***`), método, status e exclusão de credenciais. | **Aprovado** |
| **SEC-12** | **Backup e restauração** | É possível restaurar uma cópia e verificar a integridade dos dados. | `backend/scripts/backup_db.py` gera backup comprimido `.json.gz` com checksum criptográfico **SHA-256** e retenção de 30 dias. | **Aprovado** |

---

## 12. Roteiro Prático de Demonstração em Sala de Aula

Para a banca avaliadora, a Squad deverá realizar os seguintes passos práticos na apresentação:

1. **Demonstração do Validador de Senha Forte:**
   - Acessar `/auth?mode=register`.
   - Digitar senhas incompletas e mostrar a barra de força mudando de cor e porcentagem até atingir "Forte (Segura)".

2. **Demonstração do Bloqueio por Força Bruta:**
   - No login (`/auth`), errar intencionalmente a senha 5 vezes consecutivas.
   - Mostrar o contador regressivo de 5 minutos bloqueando o acesso e desativando o botão.

3. **Demonstração da Recuperação Segura via OTP:**
   - Clicar em "Esqueci a senha?".
   - Inserir o e-mail, receber/verificar o código OTP de 6 dígitos e redefinir com a nova senha forte.

4. **Demonstração de MFA e Direitos do Titular LGPD:**
   - Acessar o perfil (`/perfil`), clicar no botão "Privacidade & LGPD".
   - Na aba LGPD: clicar em "Exportar Meus Dados (JSON)" e mostrar o arquivo de portabilidade baixado.
   - Na aba MFA: iniciar a configuração com o autenticador e mostrar o funcionamento do segundo fator.

5. **Demonstração do Banner LGPD e Encerramento por Inatividade:**
   - Abrir a aplicação em aba anônima e demonstrar as preferências de cookies no `CookieBanner`.
   - Explicar a política de inatividade de 15 minutos com logout preventivo.
