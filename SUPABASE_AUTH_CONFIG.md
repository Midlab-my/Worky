# Configuração Supabase Auth — Worky

## Implementação e pré-requisitos

O login e cadastro existentes continuam usando a API REST oficial Supabase Auth, com a chave pública e o armazenamento `worky.auth.session` já existente. Não é necessário instalar outro SDK. Recuperação usa `POST /recover`, `POST /verify` com `type: recovery` e `PUT /user`. MFA usa `/user` (fatores), `/factors`, `/factors/{id}/challenge` e `/factors/{id}/verify`.

As simulações anteriores de OTP, QR Code, códigos de backup e MFA em localStorage foram removidas. Elas não eram fatores reais do Supabase. Usuários que só tinham esse MFA simulado precisarão cadastrar um autenticador real. Nenhum usuário ou fator verificado é apagado. Somente inscrições TOTP não verificadas são descartadas ao solicitar um novo QR Code.

A sessão de recuperação fica apenas na memória do modal, sem autenticar o aplicativo. Recarregar a página exige solicitar outro OTP. Se a conta já possui TOTP, o autenticador também é exigido antes de atualizar a senha. Não há recuperação, remoção ou redefinição de MFA perdido. O logout após trocar a senha usa o escopo global padrão do Supabase, encerrando os refresh tokens das sessões anteriores; access tokens já emitidos continuam sujeitos à expiração nativa.

## 1. E-mail, OTP e senha

1. Abra o projeto correto no Dashboard Supabase. Em Authentication > Sign In / Providers > Email, mantenha o provedor de e-mail e senha habilitado e preserve a configuração atual de confirmação de cadastro.
2. Configure o comprimento do Email OTP para **6 dígitos** e a expiração para **600 segundos (10 minutos)**. Esses ajustes podem afetar outros códigos de e-mail do projeto; teste a confirmação de cadastro também.
3. Em Authentication > Email Templates > Reset Password, use assunto `Recupere sua senha Worky` e este HTML:

```html
<h2>Recuperação de senha Worky</h2>
<p>Digite este código na tela de recuperação:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>O código expira em 10 minutos e só pode ser utilizado uma vez.</p>
<p>Se você não solicitou a recuperação, ignore esta mensagem.</p>
```

4. Use `{{ .Token }}`, não `{{ .ConfirmationURL }}`: o fluxo implementado espera código digitado, não um link que injete sessão no navegador. Não use template de Magic Link nem `signInWithOtp` para recuperação.
5. Revise Authentication > Rate Limits para envio de e-mail e verificação de OTP/MFA. O contador local de tentativas de login existente é apenas UX; a proteção efetiva é do Supabase.
6. Preserve ou fortaleça a política de senha existente. Não desative proteções para contornar erros de atualização. A sessão de recuperação é recente; para usuários com MFA, o aplicativo a eleva a AAL2 antes da atualização.

## 2. SMTP e URLs

1. Em Authentication > SMTP Settings, configure um provedor SMTP de produção: host, porta, usuário, senha, remetente verificado e nome `Worky`. Credenciais SMTP ficam somente no Dashboard.
2. Configure SPF/DKIM e, conforme o provedor, DMARC do domínio remetente; valide entrega e pasta de spam. O SMTP padrão do Supabase tem restrições e não deve ser assumido como serviço de produção.
3. Em Authentication > URL Configuration, defina Site URL como a origem HTTPS de produção.
4. Na lista de Redirect URLs, inclua exatamente `https://SEU-DOMINIO/auth` e o endereço local real, por exemplo `http://localhost:5173/auth`. Inclua staging separadamente. Evite curingas amplos em produção.
5. A aplicação envia `window.location.origin + '/auth'` como redirect permitido, mas a recuperação ocorre digitando o código, sem depender de redirecionamento por link.
6. Se CAPTCHA estiver habilitado no projeto, a integração existente ainda precisa fornecer seu token nos pedidos de autenticação. Esta alteração não adiciona um widget CAPTCHA; não habilite esse requisito sem integrar e testar o widget.

## 3. MFA TOTP

1. Em Authentication > Multi-Factor Authentication, permita enrollment e verification para **TOTP / App Authenticator**. Os nomes das seções podem variar conforme o Dashboard.
2. Preserve limites de fatores adequados. Não habilite SMS ou recovery codes para este fluxo.
3. Não gere segredos manualmente no Dashboard: após o login, o usuário clica em `Configurar autenticador`; o Supabase gera o QR Code e a chave de configuração manual.
4. Escaneie com Google Authenticator ou Microsoft Authenticator (conta de terceiros), ou digite a chave manualmente. Mantenha data/hora automática no celular.
5. Confirme com um código de seis dígitos. Somente a resposta de verificação com `aal2` libera a aplicação. Fatores já verificados são reutilizados e nunca removidos pelo aplicativo.
6. O QR Code é renderizado localmente a partir da resposta do Supabase; o segredo não é enviado a um gerador externo nem gravado em localStorage.

## 4. Banco, RLS, Storage e RPCs — obrigatório antes de produção

1. Faça backup e teste em staging com contas de candidato e empresa. Não execute novamente scripts-base em produção sem revisar: eles podem recriar funções e políticas.
2. Confirme que os schemas existentes e as migrações `backend/20261013_security.sql` e `backend/20261014_search_quota.sql` já foram aplicados. Em uma instalação nova, siga primeiro a instalação existente do banco.
3. Abra SQL Editor e execute **todo o arquivo `backend/20261022_mandatory_mfa.sql`**, depois das migrações anteriores. O arquivo usa transação e pode ser reaplicado.
4. Ele mantém RLS habilitado e acrescenta políticas **RESTRICTIVE** às tabelas `career_analyses`, `professional_profiles`, `company_profiles` e `company_jobs`. A exigência `auth.jwt()->>'aal' = 'aal2'` é combinada com as permissões de propriedade existentes; não concede acesso adicional.
5. Upload, atualização e exclusão de `profile-avatars` exigem AAL2. A leitura pública de avatares e os catálogos públicos existentes são preservados. Não armazene documentos sensíveis no bucket público de avatares.
6. A RPC `worky_candidates_for_job`, por ser SECURITY DEFINER, verifica AAL2 explicitamente e mantém plano, propriedade da vaga e consentimento. As outras RPCs privadas continuam restritas ao backend/service_role pelas migrações anteriores.
7. Faça inventário de tabelas, views, buckets e RPCs adicionais que existam só no projeto remoto. A migração cobre os objetos deste repositório. Para tabelas sensíveis adicionais, acrescente a mesma política restritiva, mantenha RLS e revise as permissões de `anon`. Views devem respeitar RLS (por exemplo `security_invoker`); funções SECURITY DEFINER precisam verificar AAL2 explicitamente.
8. Publique também o backend atualizado: ele valida o token remoto com Supabase e exige AAL2 antes de acessar os dados com privilégios de servidor. Publicar só o frontend não protege APIs antigas.

Auditoria após aplicar:

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where policyname like 'worky_%aal2%';

select relname, relrowsecurity
from pg_class
where oid in ('public.career_analyses'::regclass,
              'public.professional_profiles'::regclass,
              'public.company_profiles'::regclass,
              'public.company_jobs'::regclass);
```

Não adicione uma política permissiva de AAL2 como substituta: políticas permissivas são combinadas por OR e uma política de propriedade existente poderia liberar AAL1. Não desabilite RLS. Nunca use service_role no navegador para resolver erros de permissão.

## 5. Variáveis e publicação

Frontend (já existentes em `.env.example`):

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON
```

Nenhuma nova variável é necessária. O frontend existente usa a chave anon pública. Nunca coloque service_role, chave secreta, senha SMTP ou segredo JWT em variáveis `VITE_*`.

Mantenha as variáveis de Supabase e demais integrações do backend conforme a implantação atual. Credenciais administrativas ficam somente no ambiente do backend. Use o mesmo projeto Supabase nos dois lados. Refaça o build após ajustar variáveis Vite; configure fallback SPA para `/auth` e demais rotas.

Ordem sugerida: validar staging, aplicar SQL, publicar backend e frontend na mesma janela e testar. Sessões AAL1 antigas continuam identificando o usuário, mas agora exigem MFA antes do acesso; sessões AAL2 válidas permanecem aceitas. Perfis de empresa são inicializados após AAL2 usando os metadados já existentes.

## 6. Roteiro de testes em staging

- Login com senha errada, conta não confirmada e tipo de conta incorreto mantém os erros existentes.
- Candidato e empresa sem TOTP: entrar, gerar QR Code, confirmar código; verificar que o perfil/painel só aparece depois. Testar também cadastro novo com e sem confirmação de e-mail.
- Conta com TOTP: novo login pede código, sem gerar outro fator. Código errado/expirado não libera; código válido produz JWT com `aal2`. Testar seleção quando houver mais de um TOTP.
- Cancelar inscrição e entrar de novo: gerar novo QR Code; apenas inscrições não verificadas antigas são substituídas. Testar falha de rede e duplo clique.
- Antes de validar MFA, abrir `/perfil`, `/empresa` e recarregar a página: permanecer no fluxo de MFA. Editar flags locais ou códigos simulados não concede acesso às APIs/dados.
- Recuperar senha: solicitar OTP, testar inválido, expirado, reenvio e reutilização. Confirmar que o e-mail mostra exatamente seis dígitos e não revela o código na interface/logs.
- Conta sem MFA: OTP válido permite nova senha; depois voltar ao login e cadastrar TOTP obrigatório. Conta com MFA: OTP válido exige também o autenticador antes de trocar a senha; o fator original permanece ativo.
- Confirmar senhas diferentes, senha fraca, senha nova correta e falha da senha antiga. Fechar/recarregar o modal não libera o sistema nem persiste a sessão de recuperação.
- Com token AAL1 real, chamar APIs privadas diretamente: esperar 403. Sem token: 401. Token adulterado: 401. Com AAL2, validar as permissões de candidato/empresa existentes.
- Com chave anon e JWT AAL1, acessar cada tabela sensível pela REST API: nenhuma linha sensível deve retornar e escritas devem falhar ou não afetar linhas. Chamar a RPC de recrutamento deve falhar. Repetir com AAL2 e outro usuário: isolamento de propriedade e plano devem continuar valendo.
- Testar Storage com AAL1 (escrita negada), AAL2 dono (permitida), outro usuário (negada); leitura pública de avatares continua funcionando.
- Testar refresh/expiração da sessão e logout; nenhuma tela privada deve ser liberada com sessão expirada ou rebaixada para AAL1.

Comandos locais:

```sh
npm run build
node --test tests/auth.test.mjs
python -m unittest discover -s backend/tests -p test_authorization.py
npx --package typescript tsc --noEmit
```

Os testes automatizados usam respostas simuladas; não substituem envio SMTP, leitura do QR Code, validação real do TOTP nem execução das políticas em staging. A migração não foi aplicada automaticamente ao seu projeto remoto.

## Referências oficiais

- [API REST Supabase Auth](https://github.com/supabase/auth/blob/master/openapi.yaml)
- [TOTP e fluxo de inscrição](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [MFA e níveis de garantia](https://supabase.com/docs/guides/auth/auth-mfa)
- [Templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls)

## Validação realizada nesta alteração

- Build Vite: aprovado (aviso de tamanho do bundle).
- `tests/auth.test.mjs`: 7 testes aprovados com respostas simuladas do Supabase.
- `backend/tests/test_authorization.py`: 16 testes aprovados, incluindo AAL1, AAL ausente, token malformado, expirado, adulterado e identidade divergente.
- TypeScript: dois erros preexistentes em `src/app/pages/Profile.tsx:4787` e `:4802` (`string | null` passado como `string`). Nenhum erro reportado nos arquivos alterados.
- SMTP, TOTP real e migração SQL: pendentes de validação no projeto Supabase.

Arquivos desta implementação:

- `src/app/services/auth.ts`
- `src/app/context/AuthContext.tsx`
- `src/app/layouts/Root.tsx`
- `src/app/pages/AuthPage.tsx`
- `src/app/components/MfaChallenge.tsx` (novo)
- `src/app/components/LgpdDataModal.tsx`
- `src/app/lib/security-service.ts`
- `backend/security.py`
- `backend/20261022_mandatory_mfa.sql` (novo)
- `backend/tests/test_authorization.py`
- `tests/auth.test.mjs` (novo)
- `SUPABASE_AUTH_CONFIG.md` (novo)
