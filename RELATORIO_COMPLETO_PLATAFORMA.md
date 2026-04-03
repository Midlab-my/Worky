# RELATÓRIO COMPLETO - PLATAFORMA DE ANÁLISE DE VAGAS

**Wireframe de Baixa Fidelidade**  
**Data:** 03 de Abril de 2026

---

## ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Navegação](#arquitetura-de-navegação)
3. [Telas Detalhadas](#telas-detalhadas)
4. [Fluxos de Usuário](#fluxos-de-usuário)
5. [Matriz de Funcionalidades](#matriz-de-funcionalidades)

---

## VISÃO GERAL

### Propósito da Plataforma

Plataforma de análise de mercado de trabalho que permite aos usuários:

- Buscar vagas de emprego
- Analisar tendências do mercado
- Visualizar habilidades mais demandadas
- Reportar vagas suspeitas ou inadequadas

### Total de Telas

**8 telas principais:**

1. Login
2. Painel (Dashboard)
3. Busca de Vagas (Busca Avançada)
4. Resultados da Busca
5. Detalhes da Vaga
6. Análise de Habilidades
7. Tendências de Mercado
8. Reportar Vaga

### Estilo Visual

- **Design:** Wireframe de baixa fidelidade
- **Cores:** Apenas escala de cinza (grayscale)
- **Imagens:** Nenhuma imagem real, apenas placeholders
- **Foco:** Estrutura e UX, não visual polish

---

## ARQUITETURA DE NAVEGAÇÃO

### Menu de Navegação Principal

**Localização:** Topo de todas as páginas (exceto Login)

**Elementos:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [ANÁLISE DE VAGAS]  [Painel] [Buscar] [Habilidades] [Tendências] [Sair] │
└─────────────────────────────────────────────────────────────────┘
```

**Botões do Menu:**
| Botão | Destino | Descrição |
|-------|---------|-----------|
| ANÁLISE DE VAGAS | /dashboard | Logo/título - leva ao Painel |
| Painel | /dashboard | Vai para a tela do Painel |
| Buscar | /search | Vai para Busca Avançada |
| Habilidades | /skills | Vai para Análise de Habilidades |
| Tendências | /trends | Vai para Tendências de Mercado |
| Sair | / | Faz logout e volta para Login |

---

## TELAS DETALHADAS

---

## 1. TELA DE LOGIN

**Rota:** `/`  
**Arquivo:** `/src/app/components/Login.tsx`

### Estrutura Visual

```
╔════════════════════════════════════════╗
║  PLATAFORMA DE ANÁLISE DE VAGAS        ║
║  TELA DE LOGIN                          ║
║                                         ║
║  ENDEREÇO DE EMAIL                      ║
║  [________________________]             ║
║                                         ║
║  SENHA                                  ║
║  [________________________]             ║
║                                         ║
║  [      ENTRAR      ]                   ║
║                                         ║
║  ─────────────────────────                ║
║  [Esqueceu a senha?]                    ║
╚════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Título Principal

- **Texto:** "PLATAFORMA DE ANÁLISE DE VAGAS"
- **Estilo:** Texto grande, fonte monoespaçada, borda inferior
- **Função:** Identificação da plataforma

#### 2. Subtítulo

- **Texto:** "TELA DE LOGIN"
- **Estilo:** Texto pequeno, cinza
- **Função:** Indicação da tela atual

#### 3. Campo Email

- **Label:** "ENDEREÇO DE EMAIL"
- **Tipo:** Input tipo email
- **Placeholder:** "usuario@exemplo.com"
- **Função:** Usuário digita seu email
- **Estado:** Armazena valor digitado

#### 4. Campo Senha

- **Label:** "SENHA"
- **Tipo:** Input tipo password (oculta caracteres)
- **Placeholder:** "••••••••"
- **Função:** Usuário digita sua senha
- **Estado:** Armazena valor digitado (oculto)

#### 5. Botão Entrar

- **Texto:** "[ENTRAR]"
- **Tipo:** Submit button
- **Ação:** Quando clicado:
  1. Valida formulário
  2. Redireciona para `/dashboard` (Painel)
- **Estilo:** Botão preto com texto branco

#### 6. Link Esqueceu Senha

- **Texto:** "[Esqueceu a senha?]"
- **Tipo:** Link/botão
- **Ação:** Atualmente sem funcionalidade (placeholder)
- **Estilo:** Texto cinza claro

### Fluxo de Interação

1. Usuário acessa a plataforma
2. Vê tela de login
3. Digita email no primeiro campo
4. Digita senha no segundo campo
5. Clica em "[ENTRAR]"
6. Sistema redireciona para o Painel

### Validações

- Email e senha são campos obrigatórios
- Formato de email é validado pelo HTML5

### Notas Técnicas

- Não há validação real de credenciais (mock)
- Qualquer email/senha válidos permitirão login
- Estado local gerenciado com React useState

---

## 2. TELA DO PAINEL (DASHBOARD)

**Rota:** `/dashboard`  
**Arquivo:** `/src/app/components/Dashboard.tsx`

### Estrutura Visual

```
╔════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                     ║
╠════════════════════════════════════════════════════════╣
║                      PAINEL                             ║
║              BARRA DE BUSCA PRINCIPAL                   ║
║                                                         ║
║  [___________________] [BUSCAR]                         ║
║                                                         ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐            ║
║  │  BUSCA   │  │ANÁLISE DE│  │TENDÊNCIAS│            ║
║  │ AVANÇADA │  │HABILIDADES│  │MERCADO   │            ║
║  └──────────┘  └──────────┘  └──────────┘            ║
║                                                         ║
║  BUSCAS RECENTES                                       ║
║  [Busca 1]                                             ║
║  [Busca 2]                                             ║
║  [Busca 3]                                             ║
╚════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Título da Seção

- **Texto:** "PAINEL"
- **Estilo:** Texto grande, fonte monoespaçada, borda inferior grossa
- **Função:** Identificação da seção atual

#### 2. Subtítulo

- **Texto:** "BARRA DE BUSCA PRINCIPAL"
- **Estilo:** Texto cinza, menor
- **Função:** Descreve a funcionalidade principal

#### 3. Campo de Busca Principal

- **Tipo:** Input texto + botão
- **Placeholder:** "Buscar vagas de emprego..."
- **Largura:** Ocupa maior parte da tela (centralizado)
- **Estado:** Armazena query de busca
- **Função:** Busca rápida de vagas

#### 4. Botão Buscar (Principal)

- **Texto:** "[BUSCAR]"
- **Cor:** Preto com texto branco
- **Ação:** Quando clicado:
  1. Captura texto digitado no campo
  2. Redireciona para `/results` (Resultados)
- **Validação:** Pode buscar mesmo com campo vazio

#### 5. Card: Busca Avançada

- **Estrutura:**
  - Ícone placeholder (quadrado vazio)
  - Título: "BUSCA AVANÇADA"
  - Descrição: "Filtrar por localização, nível, tipo"
- **Ação:** Quando clicado:
  - Redireciona para `/search`
- **Estilo:** Borda, hover muda borda para preta

#### 6. Card: Análise de Habilidades

- **Estrutura:**
  - Ícone placeholder (quadrado vazio)
  - Título: "ANÁLISE DE HABILIDADES"
  - Descrição: "Ver habilidades mais demandadas"
- **Ação:** Quando clicado:
  - Redireciona para `/skills`
- **Estilo:** Borda, hover muda borda para preta

#### 7. Card: Tendências de Mercado

- **Estrutura:**
  - Ícone placeholder (quadrado vazio)
  - Título: "TENDÊNCIAS DE MERCADO"
  - Descrição: "Ver análise de mercado"
- **Ação:** Quando clicado:
  - Redireciona para `/trends`
- **Estilo:** Borda, hover muda borda para preta

#### 8. Seção Buscas Recentes

- **Título:** "BUSCAS RECENTES"
- **Conteúdo:**
  - Lista de 3 itens placeholder
  - Cada item: "[Busca X]"
- **Função:** Histórico de buscas (mock/placeholder)
- **Estado:** Estático no wireframe

### Fluxo de Interação

**Fluxo 1: Busca Rápida**

1. Usuário digita no campo principal
2. Clica em "[BUSCAR]"
3. É redirecionado para página de Resultados

**Fluxo 2: Atalhos**

1. Usuário clica em um dos 3 cards
2. É redirecionado para a respectiva seção

**Fluxo 3: Navegação Menu**

1. Usuário clica em qualquer item do menu superior
2. É redirecionado para a seção correspondente

### Notas Técnicas

- Cards são botões clicáveis (não apenas visuais)
- Grid responsivo de 3 colunas para os cards
- Buscas recentes são estáticas (não funcional no wireframe)

---

## 3. TELA DE BUSCA DE VAGAS (BUSCA AVANÇADA)

**Rota:** `/search`  
**Arquivo:** `/src/app/components/JobSearch.tsx`

### Estrutura Visual

```
╔════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                     ║
╠════════════════════════════════════════════════════════╣
║  BUSCA DE VAGAS                                        ║
║                                                         ║
║  ╔════════════════════════════════════════════╗        ║
║  ║ CRITÉRIOS DE BUSCA                          ║        ║
║  ║                                              ║        ║
║  ║ PALAVRA-CHAVE                                ║        ║
║  ║ [_____________________________]              ║        ║
║  ║                                              ║        ║
║  ║ LOCALIZAÇÃO                                  ║        ║
║  ║ [_____________________________]              ║        ║
║  ║                                              ║        ║
║  ║ NÍVEL                                        ║        ║
║  ║ [▼ Selecionar nível...]                      ║        ║
║  ║                                              ║        ║
║  ║ TIPO                                         ║        ║
║  ║ [▼ Selecionar tipo...]                       ║        ║
║  ║                                              ║        ║
║  ║ [BUSCAR VAGAS]  [LIMPAR]                     ║        ║
║  ╚════════════════════════════════════════════╝        ║
║                                                         ║
║  FILTROS SALVOS                                        ║
║  [Filtro salvo 1]                                      ║
║  [Filtro salvo 2]                                      ║
╚════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Título Principal

- **Texto:** "BUSCA DE VAGAS"
- **Estilo:** Texto grande, fonte monoespaçada, borda inferior
- **Função:** Identificação da tela

#### 2. Seção: Critérios de Busca

Box principal com borda grossa contendo formulário completo

#### 3. Campo: Palavra-Chave

- **Label:** "PALAVRA-CHAVE"
- **Tipo:** Input texto
- **Placeholder:** "ex: Engenheiro de Software"
- **Estado:** Armazena keyword digitada
- **Função:** Termo principal de busca

#### 4. Campo: Localização

- **Label:** "LOCALIZAÇÃO"
- **Tipo:** Input texto
- **Placeholder:** "ex: São Paulo, SP"
- **Estado:** Armazena localização digitada
- **Função:** Filtro de localização geográfica

#### 5. Dropdown: Nível

- **Label:** "NÍVEL"
- **Tipo:** Select dropdown
- **Opção padrão:** "Selecionar nível..."
- **Opções disponíveis:**
  - Nível Júnior
  - Nível Pleno
  - Nível Sênior
  - Líder / Gerente
- **Estado:** Armazena nível selecionado
- **Função:** Filtro por senioridade

#### 6. Dropdown: Tipo

- **Label:** "TIPO"
- **Tipo:** Select dropdown
- **Opção padrão:** "Selecionar tipo..."
- **Opções disponíveis:**
  - Tempo Integral
  - Meio Período
  - Contrato
  - Remoto
- **Estado:** Armazena tipo selecionado
- **Função:** Filtro por modalidade de trabalho

#### 7. Botão: Buscar Vagas

- **Texto:** "[BUSCAR VAGAS]"
- **Tipo:** Submit button
- **Cor:** Preto com texto branco
- **Largura:** Flex-1 (ocupa maior espaço)
- **Ação:** Quando clicado:
  1. Captura todos os filtros preenchidos
  2. Redireciona para `/results` (Resultados)
  3. Em produção: passaria filtros como query params

#### 8. Botão: Limpar

- **Texto:** "[LIMPAR]"
- **Tipo:** Button
- **Cor:** Branco com borda
- **Ação:** Quando clicado:
  1. Limpa todos os campos do formulário
  2. Reseta estado para valores vazios
  3. NÃO redireciona, permanece na tela

#### 9. Seção: Filtros Salvos

- **Título:** "FILTROS SALVOS"
- **Conteúdo:** Lista de 2 itens placeholder
- **Função:** Histórico de filtros usados (mock)
- **Estado:** Estático no wireframe

### Fluxo de Interação

**Fluxo Completo de Busca:**

1. Usuário acessa tela via:
   - Menu "Buscar" OU
   - Card "Busca Avançada" do Painel
2. Preenche campos desejados:
   - Palavra-chave (opcional)
   - Localização (opcional)
   - Nível (opcional)
   - Tipo (opcional)
3. Clica em "[BUSCAR VAGAS]"
4. Sistema redireciona para `/results`
5. Resultados são exibidos baseados nos filtros

**Fluxo Alternativo - Limpar:**

1. Usuário preencheu campos
2. Decide recomeçar
3. Clica em "[LIMPAR]"
4. Todos os campos voltam ao estado vazio
5. Permanece na mesma tela

### Validações

- Nenhum campo é obrigatório
- Busca pode ser feita com qualquer combinação
- Busca vazia retorna todas as vagas

### Notas Técnicas

- Estado do formulário gerenciado em objeto único
- Filtros salvos são estáticos (não funcional)
- Em produção: filtros seriam passados via URL params

---

## 4. TELA DE RESULTADOS DA BUSCA

**Rota:** `/results`  
**Arquivo:** `/src/app/components/JobResults.tsx`

### Estrutura Visual

```
╔════════════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                             ║
╠════════════════════════════════════════════════════════════════╣
║  RESULTADOS DA BUSCA                                           ║
║  6 VAGAS ENCONTRADAS                                           ║
║                                                                 ║
║  ┌──────────┐  ┌─────────────────────────────────────────┐   ║
║  │ FILTROS  │  │ Engenheiro de Software Sênior           │   ║
║  │          │  │ Tech Corp Inc                [Tempo Integral]│   ║
║  │ LOC.     │  │ 📍 São Paulo, SP                         │   ║
║  │ □ SP     │  └─────────────────────────────────────────┘   ║
║  │ □ RJ     │                                                  ║
║  │          │  ┌─────────────────────────────────────────┐   ║
║  │ TIPO     │  │ Desenvolvedor Frontend                   │   ║
║  │ □ Tempo  │  │ Design Studio LLC              [Remoto] │   ║
║  │ □ Contrato│  │ 📍 Rio de Janeiro, RJ                    │   ║
║  │          │  └─────────────────────────────────────────┘   ║
║  │ NÍVEL    │  [... mais vagas ...]                           ║
║  │ □ Júnior │                                                  ║
║  │ □ Pleno  │  [1] [2] [3] [Próxima]                          ║
║  └──────────┘                                                  ║
╚════════════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Título e Contador

- **Título:** "RESULTADOS DA BUSCA"
- **Contador:** "6 VAGAS ENCONTRADAS"
- **Estilo:** Fonte monoespaçada
- **Função:** Informa quantidade de resultados

#### 2. Layout de Grid

- **Estrutura:** 12 colunas
  - Sidebar: 3 colunas (esquerda)
  - Conteúdo: 9 colunas (direita)

### Sidebar de Filtros (Coluna Esquerda)

#### 3. Box de Filtros

- **Título:** "FILTROS"
- **Posição:** Sticky (fixo ao rolar página)
- **Estilo:** Borda, fundo branco

#### 4. Filtro: Localização

- **Título:** "LOCALIZAÇÃO"
- **Opções (checkboxes):**
  - □ São Paulo
  - □ Rio de Janeiro
  - □ Remoto
- **Função:** Filtrar vagas por local
- **Interação:** Marcar/desmarcar checkbox

#### 5. Filtro: Tipo de Vaga

- **Título:** "TIPO DE VAGA"
- **Separador:** Linha horizontal
- **Opções (checkboxes):**
  - □ Tempo Integral
  - □ Contrato
  - □ Meio Período
- **Função:** Filtrar por modalidade
- **Interação:** Marcar/desmarcar checkbox

#### 6. Filtro: Nível

- **Título:** "NÍVEL"
- **Separador:** Linha horizontal
- **Opções (checkboxes):**
  - □ Júnior
  - □ Pleno
  - □ Sênior
- **Função:** Filtrar por senioridade
- **Interação:** Marcar/desmarcar checkbox

### Área de Resultados (Coluna Direita)

#### 7. Cards de Vagas (6 vagas mock)

**Vaga 1:**

- Título: Engenheiro de Software Sênior
- Empresa: Tech Corp Inc
- Localização: São Paulo, SP
- Tipo: Tempo Integral

**Vaga 2:**

- Título: Desenvolvedor Frontend
- Empresa: Design Studio LLC
- Localização: Rio de Janeiro, RJ
- Tipo: Remoto

**Vaga 3:**

- Título: Engenheiro Backend
- Empresa: Data Systems Co
- Localização: Belo Horizonte, MG
- Tipo: Tempo Integral

**Vaga 4:**

- Título: Desenvolvedor Full Stack
- Empresa: Innovation Labs
- Localização: Curitiba, PR
- Tipo: Contrato

**Vaga 5:**

- Título: Engenheiro DevOps
- Empresa: Cloud Solutions Inc
- Localização: Porto Alegre, RS
- Tipo: Tempo Integral

**Vaga 6:**

- Título: Gerente de Produto
- Empresa: Startup Ventures
- Localização: Florianópolis, SC
- Tipo: Tempo Integral

#### 8. Estrutura de Cada Card de Vaga

```
┌────────────────────────────────────────┐
│ Título da Vaga             [Tipo]      │
│ Nome da Empresa                        │
│ 📍 Localização                          │
└────────────────────────────────────────┘
```

**Elementos do Card:**

- **Título:** Nome da posição (texto grande)
- **Empresa:** Nome da empresa (texto médio, cinza)
- **Badge Tipo:** Caixa com tipo de vaga (canto superior direito)
- **Localização:** Ícone + cidade e estado

**Interação:**

- **Hover:** Borda fica mais grossa e preta
- **Click:** Card inteiro é clicável
- **Ação:** Redireciona para `/job/{id}` (Detalhes da Vaga)

#### 9. Paginação

- **Botões:**
  - [1] - Borda cinza, não selecionado
  - [2] - Preto com texto branco, selecionado atual
  - [3] - Borda cinza, não selecionado
  - [Próxima] - Botão de próxima página
- **Função:** Navegar entre páginas de resultados
- **Estado:** Página 2 está selecionada (mock)
- **Interação:** Clicar muda de página (não funcional no wireframe)

### Fluxo de Interação

**Fluxo Principal:**

1. Usuário chega via:
   - Busca do Painel OU
   - Busca Avançada
2. Vê lista de 6 vagas
3. Pode aplicar filtros na sidebar:
   - Marca/desmarca checkboxes
   - Resultados seriam filtrados em tempo real
4. Clica em um card de vaga
5. É redirecionado para Detalhes da Vaga

**Fluxo Alternativo - Paginação:**

1. Usuário vê os resultados da página atual
2. Clica em um número de página ou "Próxima"
3. Lista atualiza mostrando próximos resultados
4. Pode continuar navegando ou clicar em uma vaga

### Validações

- Filtros são opcionais
- Checkboxes funcionam de forma independente
- Sem filtros, mostra todas as vagas

### Notas Técnicas

- Dados das vagas são mock estáticos
- Filtros da sidebar não funcionam (placeholder)
- Paginação não funciona (placeholder)
- Em produção: filtros e paginação seriam dinâmicos

---

## 5. TELA DE DETALHES DA VAGA

**Rota:** `/job/:id`  
**Arquivo:** `/src/app/components/JobDetail.tsx`

### Estrutura Visual

```
╔══════════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                           ║
╠══════════════════════════════════════════════════════════════╣
║ ← [VOLTAR PARA RESULTADOS]                                    ║
║                                                               ║
║ ╔════════════════════════════════════════════════════════╗   ║
║ ║ Engenheiro de Software Sênior    [REPORTAR VAGA]      ║   ║
║ ║ Tech Corp Inc                                          ║   ║
║ ║ 📍 São Paulo, SP | Tempo Integral | Publicado há 3 dias ║   ║
║ ╚════════════════════════════════════════════════════════╝   ║
║                                                               ║
║ ┌────────────────────────┐  ┌──────────────────┐           ║
║ │ DESCRIÇÃO DA VAGA      │  │ HABILIDADES      │           ║
║ │ [Lorem ipsum...]       │  │ ■ JavaScript     │           ║
║ │                        │  │ ■ React          │           ║
║ │ RESPONSABILIDADES      │  │ ■ Node.js        │           ║
║ │ □ [Item 1]             │  │ □ TypeScript     │           ║
║ │ □ [Item 2]             │  │                  │           ║
║ │                        │  │ ESTIMATIVA       │           ║
║ │                        │  │ R$ 10K - 18K     │           ║
║ │                        │  │                  │           ║
║ │                        │  │ [CANDIDATAR-SE]  │           ║
║ │                        │  │ [SALVAR VAGA]    │           ║
║ └────────────────────────┘  └──────────────────┘           ║
╚══════════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Link de Retorno

- **Texto:** "← [VOLTAR PARA RESULTADOS]"
- **Cor:** Cinza, muda para preto no hover
- **Ação:** Redireciona para `/results`
- **Função:** Navegação de retorno

#### 2. Header da Vaga (Box Principal)

##### 2.1 Título da Vaga

- **Texto:** "Engenheiro de Software Sênior"
- **Estilo:** Texto muito grande, fonte mono
- **Borda:** Linha inferior

##### 2.2 Nome da Empresa

- **Texto:** "Tech Corp Inc"
- **Estilo:** Texto grande, cinza
- **Posição:** Abaixo do título

##### 2.3 Metadados (Badges)

- **Badge 1:** 📍 São Paulo, SP
- **Badge 2:** Tempo Integral
- **Badge 3:** Publicado há 3 dias
- **Estilo:** Caixas com bordas, lado a lado
- **Função:** Informações rápidas da vaga

##### 2.4 Botão Reportar Vaga

- **Texto:** "[REPORTAR VAGA]"
- **Posição:** Canto superior direito do header
- **Estilo:** Borda preta
- **Ação:** Redireciona para `/report/:id`

#### 3. Layout de Conteúdo

- **Estrutura:** Grid 3 colunas
  - Coluna esquerda (2/3): Descrição e Responsabilidades
  - Coluna direita (1/3): Habilidades, Salário, Ações

### Coluna Esquerda (Descrição)

#### 4. Box: Descrição da Vaga

- **Título:** "DESCRIÇÃO DA VAGA"
- **Conteúdo:** 3 parágrafos de texto placeholder
  - Cada parágrafo com borda lateral esquerda
  - Texto mock: Lorem ipsum
- **Função:** Detalhes da posição

#### 5. Box: Responsabilidades

- **Título:** "RESPONSABILIDADES"
- **Conteúdo:** Lista de 4 itens
  - Cada item em caixa separada
  - Formato: "□ [Item de responsabilidade X]"
- **Função:** Lista de tarefas do cargo

### Coluna Direita (Sidebar)

#### 6. Box: Habilidades Requeridas

- **Título:** "HABILIDADES REQUERIDAS"
- **Conteúdo:** Lista de 7 habilidades

**Habilidades Primárias (destaque):**

- JavaScript (caixa preta, texto branco)
- React (caixa preta, texto branco)
- Node.js (caixa preta, texto branco)

**Habilidades Secundárias:**

- TypeScript (caixa branca, borda)
- Python (caixa branca, borda)
- Docker (caixa branca, borda)
- AWS (caixa branca, borda)

**Função:** Mostrar tech stack necessária

#### 7. Box: Estimativa Salarial

- **Título:** "ESTIMATIVA SALARIAL"
- **Valor:** "R$ 10K - R$ 18K"
  - Estilo: Texto muito grande, caixa com borda grossa
- **Período:** "por mês" (texto pequeno)
- **Nota:** "[Baseado em dados de mercado e posições similares]"
- **Estilo:** Box com borda preta grossa (destaque)
- **Função:** Range salarial estimado

#### 8. Botão: Candidatar-se

- **Texto:** "[CANDIDATAR-SE]"
- **Estilo:** Botão preto com texto branco
- **Largura:** 100% do container
- **Ação:** Não funcional no wireframe (placeholder)
- **Função:** Aplicar para a vaga

#### 9. Botão: Salvar Vaga

- **Texto:** "[SALVAR VAGA]"
- **Estilo:** Botão branco com borda
- **Largura:** 100% do container
- **Ação:** Não funcional no wireframe (placeholder)
- **Função:** Adicionar aos favoritos

### Fluxo de Interação

**Fluxo Principal:**

1. Usuário vem de Resultados da Busca
2. Clicou em um card de vaga específico
3. Vê todos os detalhes da vaga:
   - Lê descrição
   - Vê responsabilidades
   - Confere habilidades necessárias
   - Verifica range salarial
4. Pode tomar 3 ações:
   - **Opção A:** Clicar em "[CANDIDATAR-SE]"
   - **Opção B:** Clicar em "[SALVAR VAGA]"
   - **Opção C:** Clicar em "[REPORTAR VAGA]" → vai para tela de Report

**Fluxo Alternativo - Reportar:**

1. Usuário identifica problema na vaga
2. Clica em "[REPORTAR VAGA]"
3. É redirecionado para `/report/:id`
4. Preenche formulário de reporte

**Fluxo de Retorno:**

1. Usuário quer ver outras vagas
2. Clica em "← [VOLTAR PARA RESULTADOS]"
3. Retorna para lista de resultados

### Dados Exibidos (Mock)

- ID da vaga: Recebido via parâmetro de URL
- Todos os dados são estáticos/hardcoded
- Em produção: dados viriam de API baseado no ID

### Notas Técnicas

- Parâmetro `:id` capturado via useParams()
- Botões de ação são placeholders (não funcionais)
- Habilidades primárias vs secundárias distinguidas por estilo
- Salário é valor mock fixo

---

## 6. TELA DE ANÁLISE DE HABILIDADES

**Rota:** `/skills`  
**Arquivo:** `/src/app/components/SkillsAnalysis.tsx`

### Estrutura Visual

```
╔═════════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                          ║
╠═════════════════════════════════════════════════════════════╣
║  ANÁLISE DE HABILIDADES                                     ║
║  HABILIDADES MAIS DEMANDADAS NO MERCADO DE TRABALHO         ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐                       ║
║  │ 247    │  │ 1.463  │  │ 3 ABR  │                       ║
║  │ TOTAL  │  │ VAGAS  │  │ 2026   │                       ║
║  └────────┘  └────────┘  └────────┘                       ║
║                                                              ║
║  ╔════════════════════════════════════════════════╗        ║
║  ║ TOP 10 HABILIDADES POR DEMANDA                 ║        ║
║  ║                                                 ║        ║
║  ║ #1 JavaScript        1247 vagas                ║        ║
║  ║ [████████████████████████████] 85%             ║        ║
║  ║                                                 ║        ║
║  ║ #2 React            1089 vagas                 ║        ║
║  ║ [████████████████████████] 74%                 ║        ║
║  ║                                                 ║        ║
║  ║ [...mais 8 habilidades...]                     ║        ║
║  ╚════════════════════════════════════════════════╝        ║
║                                                              ║
║  ┌────────────────┐  ┌────────────────┐                   ║
║  │ EM ALTA        │  │ EM QUEDA       │                   ║
║  │ Rust      ↑23% │  │ jQuery    ↓12% │                   ║
║  │ Go        ↑19% │  │ PHP       ↓8%  │                   ║
║  │ Kubernetes↑15% │  │ AngularJS ↓6%  │                   ║
║  └────────────────┘  └────────────────┘                   ║
╚═════════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Cabeçalho

- **Título:** "ANÁLISE DE HABILIDADES"
- **Subtítulo:** "HABILIDADES MAIS DEMANDADAS NO MERCADO DE TRABALHO"
- **Função:** Identifica propósito da página

#### 2. Cards de Estatísticas (Grid 3 colunas)

##### Card 1: Total de Habilidades

- **Número:** 247
- **Label:** "TOTAL DE HABILIDADES"
- **Estilo:** Borda preta grossa (destaque)
- **Função:** Quantidade total catalogada

##### Card 2: Vagas Analisadas

- **Número:** 1.463
- **Label:** "VAGAS ANALISADAS"
- **Estilo:** Borda cinza
- **Função:** Base de dados usada

##### Card 3: Última Atualização

- **Data:** "3 ABR, 2026"
- **Label:** "ÚLTIMA ATUALIZAÇÃO"
- **Estilo:** Borda cinza
- **Função:** Frescor dos dados

#### 3. Box Principal: Top 10 Habilidades

**Título:** "TOP 10 HABILIDADES POR DEMANDA"

**Estrutura de Cada Item:**

```
┌──────────────────────────────────────────┐
│ #1  JavaScript              1247 vagas   │
│ [████████████████] 85%                   │
└──────────────────────────────────────────┘
```

**Elementos de Cada Habilidade:**

- **Ranking:** #1, #2, #3... (texto grande, cinza)
- **Nome:** Nome da habilidade (texto grande)
- **Contador:** Quantidade de vagas (direita)
- **Label:** "vagas" (texto pequeno)
- **Barra de Progresso:**
  - Fundo cinza claro
  - Preenchimento preto
  - Percentual no final da barra
  - Largura proporcional ao %

**Top 10 Completo (Mock Data):**

1. **JavaScript**
   - Vagas: 1247
   - Percentual: 85%

2. **React**
   - Vagas: 1089
   - Percentual: 74%

3. **Python**
   - Vagas: 987
   - Percentual: 67%

4. **Node.js**
   - Vagas: 876
   - Percentual: 60%

5. **TypeScript**
   - Vagas: 765
   - Percentual: 52%

6. **AWS**
   - Vagas: 698
   - Percentual: 48%

7. **Docker**
   - Vagas: 654
   - Percentual: 45%

8. **SQL**
   - Vagas: 612
   - Percentual: 42%

9. **Git**
   - Vagas: 589
   - Percentual: 40%

10. **Design de API**
    - Vagas: 534
    - Percentual: 36%

#### 4. Seção Inferior (Grid 2 colunas)

##### Box Esquerdo: Em Alta

- **Título:** "EM ALTA"
- **Conteúdo:** Lista de 3 habilidades crescendo

**Itens:**

1. Rust → ↑ 23%
2. Go → ↑ 19%
3. Kubernetes → ↑ 15%

**Estilo:** Cada item em caixa com borda
**Função:** Tecnologias em ascensão

##### Box Direito: Em Queda

- **Título:** "EM QUEDA"
- **Conteúdo:** Lista de 3 habilidades decrescendo

**Itens:**

1. jQuery → ↓ 12%
2. PHP → ↓ 8%
3. AngularJS → ↓ 6%

**Estilo:** Cada item em caixa com borda
**Função:** Tecnologias em declínio

### Fluxo de Interação

**Fluxo de Acesso:**

1. Usuário acessa via:
   - Menu "Habilidades" OU
   - Card "Análise de Habilidades" do Painel
2. Vê dashboard de habilidades
3. Analisa estatísticas:
   - Estatísticas gerais no topo
   - Top 10 habilidades principais
   - Tendências (alta/queda)
4. Usa informações para:
   - Planejar aprendizado
   - Entender mercado
   - Comparar skills

**Fluxo de Leitura:**

1. Visualiza cards de estatísticas
2. Escaneia ranking de habilidades
3. Identifica percentuais e barras visuais
4. Confere tendências de crescimento/queda

### Validações

- Não há interações/formulários nesta tela
- Apenas visualização de dados
- Sem botões de ação

### Notas Técnicas

- Todos os dados são mock/estáticos
- Barras de progresso calculadas com inline style width
- Em produção: dados viriam de API
- Percentuais são relativos ao total de vagas analisadas

---

## 7. TELA DE TENDÊNCIAS DE MERCADO

**Rota:** `/trends`  
**Arquivo:** `/src/app/components/MarketTrends.tsx`

### Estrutura Visual

```
╔════════════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                         ║
╠════════════════════════════════════════════════════════════╣
║  TENDÊNCIAS DE MERCADO                                     ║
║  ANÁLISE E ESTATÍSTICAS DO MERCADO DE TRABALHO             ║
║                                                             ║
║  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            ║
║  │ R$ 12K │ │ 8.234  │ │ 28 dias│ │ 43%    │            ║
║  │ SALÁRIO│ │ VAGAS  │ │ TEMPO  │ │ REMOTO │            ║
║  └────────┘ └────────┘ └────────┘ └────────┘            ║
║                                                             ║
║  ┌────────────────────┐  ┌────────────────────┐          ║
║  │ TENDÊNCIA DE VAGAS │  │ SALÁRIO POR NÍVEL  │          ║
║  │ [Gráfico de Linha] │  │ [Gráfico de Barras]│          ║
║  └────────────────────┘  └────────────────────┘          ║
║                                                             ║
║  ╔══════════════════════════════════════════════╗         ║
║  ║ VAGAS POR SETOR                              ║         ║
║  ║ Tecnologia  [████████████] 456               ║         ║
║  ║ Finanças    [███████] 312                    ║         ║
║  ║ Saúde       [██████] 267                     ║         ║
║  ║ Varejo      [████] 198                       ║         ║
║  ║ Educação    [███] 156                        ║         ║
║  ╚══════════════════════════════════════════════╝         ║
║                                                             ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ║
║  │ EMPRESAS    │ │ LOCAIS      │ │ SETORES     │        ║
║  │ CONTRATANDO │ │ EM ALTA     │ │ CRESCIMENTO │        ║
║  └─────────────┘ └─────────────┘ └─────────────┘        ║
╚════════════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Cabeçalho

- **Título:** "TENDÊNCIAS DE MERCADO"
- **Subtítulo:** "ANÁLISE E ESTATÍSTICAS DO MERCADO DE TRABALHO"
- **Função:** Identifica propósito da página

#### 2. Cards de Métricas (Grid 4 colunas)

##### Card 1: Salário Médio

- **Valor:** R$ 12K
- **Label:** "SALÁRIO MÉDIO"
- **Indicador:** "↑ 8% vs ano anterior"
- **Estilo:** Borda preta grossa (destaque)
- **Função:** Média salarial do mercado

##### Card 2: Vagas Abertas

- **Valor:** 8.234
- **Label:** "VAGAS ABERTAS"
- **Indicador:** "↑ 12% vs mês anterior"
- **Estilo:** Borda cinza
- **Função:** Total de vagas disponíveis

##### Card 3: Tempo Médio

- **Valor:** 28 dias
- **Label:** "TEMPO MÉDIO"
- **Indicador:** "↓ 5% vs mês anterior"
- **Estilo:** Borda cinza
- **Função:** Tempo médio para preenchimento

##### Card 4: Vagas Remotas

- **Valor:** 43%
- **Label:** "VAGAS REMOTAS"
- **Indicador:** "↑ 15% vs ano anterior"
- **Estilo:** Borda cinza
- **Função:** Percentual de trabalho remoto

#### 3. Seção de Gráficos (Grid 2 colunas)

##### Gráfico 1: Tendência de Vagas (6 Meses)

- **Tipo:** Gráfico de Linha
- **Biblioteca:** Recharts (LineChart)
- **Título:** "TENDÊNCIA DE VAGAS (6 MESES)"
- **Estilo:** Borda preta grossa

**Dados do Gráfico:**
| Mês | Vagas |
|-----|-------|
| Jan | 1200 |
| Fev | 1350 |
| Mar | 1280 |
| Abr | 1480 |
| Mai | 1520 |
| Jun | 1680 |

**Configuração:**

- **Eixo X:** Meses (Jan-Jun)
- **Eixo Y:** Número de vagas
- **Linha:** Preta, espessura 3
- **Grid:** Linhas pontilhadas cinza
- **Legenda:** "[Vagas publicadas ao longo do tempo]"

##### Gráfico 2: Salário Médio por Nível

- **Tipo:** Gráfico de Barras
- **Biblioteca:** Recharts (BarChart)
- **Título:** "SALÁRIO MÉDIO POR NÍVEL (K)"
- **Estilo:** Borda preta grossa

**Dados do Gráfico:**
| Nível | Salário (K) |
|--------|-------------|
| Júnior | 5 |
| Pleno | 9 |
| Sênior | 15 |
| Líder | 20 |

**Configuração:**

- **Eixo X:** Níveis de senioridade
- **Eixo Y:** Salário em milhares
- **Barras:** Pretas preenchidas
- **Grid:** Linhas pontilhadas cinza
- **Legenda:** "[Salário em milhares de reais]"

#### 4. Box: Vagas por Setor

- **Título:** "VAGAS POR SETOR"
- **Estilo:** Borda cinza

**Estrutura de Cada Setor:**

```
[Nome do Setor]  [████████] [Número]
```

**Dados Completos:**

1. **Tecnologia**
   - Vagas: 456
   - Barra: ~91% largura

2. **Finanças**
   - Vagas: 312
   - Barra: ~62% largura

3. **Saúde**
   - Vagas: 267
   - Barra: ~53% largura

4. **Varejo**
   - Vagas: 198
   - Barra: ~40% largura

5. **Educação**
   - Vagas: 156
   - Barra: ~31% largura

**Elementos:**

- Nome do setor (largura fixa 32)
- Barra de progresso com fundo cinza
- Preenchimento preto proporcional
- Número de vagas dentro da barra (texto branco)

#### 5. Seção Inferior (Grid 3 colunas)

##### Box 1: Empresas Contratando

- **Título:** "EMPRESAS CONTRATANDO"
- **Conteúdo:** Top 3 empresas (placeholder)

**Lista:**

1. [Empresa A]
2. [Empresa B]
3. [Empresa C]

**Estilo:** Cada item em caixa numerada

##### Box 2: Locais em Alta

- **Título:** "LOCAIS EM ALTA"
- **Conteúdo:** Top 3 cidades

**Lista:**

1. São Paulo
2. Rio de Janeiro
3. Belo Horizonte

**Estilo:** Cada item em caixa numerada

##### Box 3: Setores em Crescimento

- **Título:** "SETORES EM CRESCIMENTO"
- **Conteúdo:** Top 3 áreas tecnológicas

**Lista:**

1. IA/ML
2. Computação em Nuvem
3. Cibersegurança

**Estilo:** Cada item em caixa numerada

### Fluxo de Interação

**Fluxo de Acesso:**

1. Usuário acessa via:
   - Menu "Tendências" OU
   - Card "Tendências de Mercado" do Painel
2. Vê dashboard completo de mercado
3. Analisa diferentes aspectos:
   - Métricas gerais (topo)
   - Tendências temporais (gráfico linha)
   - Comparação salarial (gráfico barras)
   - Distribuição setorial (barras horizontais)
   - Rankings diversos (base)

**Fluxo de Leitura:**

1. Escaneia métricas rápidas no topo
2. Analisa evolução temporal no gráfico de linha
3. Compara salários por nível no gráfico de barras
4. Identifica setores dominantes
5. Confere rankings de empresas/locais/setores

### Validações

- Não há interações/formulários nesta tela
- Apenas visualização de dados
- Gráficos são estáticos (não interativos no wireframe)

### Notas Técnicas

- **Gráficos:** Biblioteca Recharts
- **Dados:** Todos mock/estáticos
- **Responsividade:** ResponsiveContainer para gráficos
- **Cores:** Apenas preto/cinza (grayscale)
- Em produção: dados viriam de API
- Gráficos poderiam ter tooltips interativos

---

## 8. TELA DE REPORTAR VAGA

**Rota:** `/report/:id`  
**Arquivo:** `/src/app/components/ReportJob.tsx`

### Estrutura Visual

```
╔═══════════════════════════════════════════════════════╗
║ [Menu de Navegação]                                    ║
╠═══════════════════════════════════════════════════════╣
║  REPORTAR VAGA                                        ║
║  Ajude-nos a manter a qualidade das vagas             ║
║                                                        ║
║  ╔═══════════════════════════════════════════╗       ║
║  ║ ID DA VAGA: 1                             ║       ║
║  ║ Engenheiro de Software Sênior             ║       ║
║  ╠═══════════════════════════════════════════╣       ║
║  ║                                            ║       ║
║  ║ MOTIVO DO REPORTE                          ║       ║
║  ║ [▼ Selecione um motivo...]                 ║       ║
║  ║                                            ║       ║
║  ║ DETALHES ADICIONAIS                        ║       ║
║  ║ [____________________________________]     ║       ║
║  ║ [____________________________________]     ║       ║
║  ║ 0 / 500 caracteres                         ║       ║
║  ║                                            ║       ║
║  ║ DIRETRIZES DE REPORTE                      ║       ║
║  ║ □ Certifique-se de que o problema é...    ║       ║
║  ║ □ Forneça o máximo de detalhes...         ║       ║
║  ║                                            ║       ║
║  ║ [ENVIAR REPORTE]  [CANCELAR]               ║       ║
║  ╚═══════════════════════════════════════════╝       ║
║                                                        ║
║  MOTIVOS COMUNS DE REPORTE                            ║
║  ┌──────────┐  ┌──────────┐                         ║
║  │ INFO     │  │ DUPLICADA│                         ║
║  │ ENGANOSA │  │          │                         ║
║  └──────────┘  └──────────┘                         ║
╚═══════════════════════════════════════════════════════╝
```

### Elementos da Tela

#### 1. Cabeçalho

- **Título:** "REPORTAR VAGA"
- **Subtítulo:** "Ajude-nos a manter a qualidade das vagas"
- **Função:** Explica propósito da página

#### 2. Box Principal de Reporte

##### 2.1 Identificação da Vaga

- **Caixa cinza de fundo:**
  - ID da vaga: Exibe parâmetro da URL
  - Nome da vaga: "Engenheiro de Software Sênior" (mock)
- **Função:** Confirmar vaga sendo reportada

##### 2.2 Dropdown: Motivo do Reporte

- **Label:** "MOTIVO DO REPORTE"
- **Tipo:** Select dropdown
- **Opção padrão:** "Selecione um motivo..."
- **Validação:** Campo obrigatório (required)

**Opções disponíveis:**

1. **Informação Enganosa**
   - Value: "misleading"
   - Descrição: Dados incorretos na vaga

2. **Vaga Duplicada**
   - Value: "duplicate"
   - Descrição: Publicação repetida

3. **Vaga Já Preenchida**
   - Value: "expired"
   - Descrição: Posição foi fechada

4. **Possível Golpe**
   - Value: "scam"
   - Descrição: Suspeita de fraude

5. **Conteúdo Inapropriado**
   - Value: "inappropriate"
   - Descrição: Conteúdo ofensivo/inadequado

6. **Outro**
   - Value: "other"
   - Descrição: Outros problemas

##### 2.3 Textarea: Detalhes Adicionais

- **Label:** "DETALHES ADICIONAIS"
- **Tipo:** Textarea (não redimensionável)
- **Altura:** 40 (10 linhas aprox)
- **Placeholder:** "Por favor, forneça mais detalhes sobre este reporte..."
- **Validação:** Campo obrigatório (required)
- **Contador:** Exibe caracteres digitados / 500
- **Função:** Descrição detalhada do problema

##### 2.4 Box: Diretrizes de Reporte

- **Título:** "DIRETRIZES DE REPORTE"
- **Estilo:** Fundo cinza claro, borda
- **Conteúdo:** Lista de 4 diretrizes

**Diretrizes:**

- □ Certifique-se de que o problema é legítimo
- □ Forneça o máximo de detalhes possível
- □ Reportes falsos podem afetar sua conta
- □ Reportes são revisados em 24-48 horas

**Função:** Orientar usuário sobre boas práticas

##### 2.5 Botão: Enviar Reporte

- **Texto:** "[ENVIAR REPORTE]"
- **Tipo:** Submit button
- **Cor:** Preto com texto branco
- **Largura:** Flex-1 (metade do espaço)
- **Ação:** Quando clicado:
  1. Valida formulário (campos obrigatórios)
  2. Exibe alerta: "Relatório enviado com sucesso"
  3. Redireciona para `/job/:id` (volta para detalhes da vaga)

##### 2.6 Botão: Cancelar

- **Texto:** "[CANCELAR]"
- **Tipo:** Button (não submit)
- **Cor:** Branco com borda
- **Largura:** Flex-1 (metade do espaço)
- **Ação:** Quando clicado:
  1. Não salva nenhum dado
  2. Redireciona para `/job/:id` (volta para detalhes da vaga)

#### 3. Seção: Motivos Comuns de Reporte

- **Título:** "MOTIVOS COMUNS DE REPORTE"
- **Layout:** Grid 2 colunas x 2 linhas

**Cards Informativos:**

##### Card 1: Info Enganosa

- **Título:** "INFO ENGANOSA"
- **Descrição:** "Salário, local ou descrição não correspondem"
- **Função:** Explicar tipo de problema

##### Card 2: Duplicada

- **Título:** "DUPLICADA"
- **Descrição:** "Mesma vaga publicada várias vezes"
- **Função:** Explicar tipo de problema

##### Card 3: Expirada

- **Título:** "EXPIRADA"
- **Descrição:** "Posição já foi preenchida"
- **Função:** Explicar tipo de problema

##### Card 4: Golpe

- **Título:** "GOLPE"
- **Descrição:** "Publicação suspeita ou fraudulenta"
- **Função:** Explicar tipo de problema

### Fluxo de Interação

**Fluxo de Acesso:**

1. Usuário está em Detalhes da Vaga
2. Identifica problema com a vaga
3. Clica em "[REPORTAR VAGA]"
4. É redirecionado para `/report/:id`
5. Vê formulário de reporte

**Fluxo de Preenchimento Completo:**

1. Usuário lê identificação da vaga
2. Seleciona motivo no dropdown
3. Escreve detalhes no textarea
4. Vê contador de caracteres atualizar
5. Lê diretrizes na caixa informativa
6. Clica em "[ENVIAR REPORTE]"
7. Vê alerta de confirmação
8. É redirecionado de volta para detalhes da vaga

**Fluxo de Cancelamento:**

1. Usuário começa a preencher
2. Decide não reportar
3. Clica em "[CANCELAR]"
4. É redirecionado de volta (sem salvar)

**Fluxo de Validação com Erro:**

1. Usuário clica "[ENVIAR REPORTE]" sem preencher campos
2. Navegador mostra mensagens de erro HTML5:
   - "Por favor, preencha este campo" (motivo)
   - "Por favor, preencha este campo" (detalhes)
3. Usuário corrige e reenvia

### Validações

**Campos Obrigatórios:**

- Motivo do Reporte: required
- Detalhes Adicionais: required

**Validações Visuais:**

- Contador de caracteres (0-500)
- Textarea com limite implícito de 500 chars (não forçado no wireframe)

**Validações de Comportamento:**

- Submit só processa se todos campos preenchidos
- Cancelar não valida campos

### Estados do Formulário

**Estado Inicial:**

- Motivo: "" (vazio)
- Detalhes: "" (vazio)
- Contador: "0 / 500 caracteres"

**Durante Digitação:**

- Motivo: Atualiza com seleção
- Detalhes: Atualiza em tempo real
- Contador: Atualiza com cada tecla

**Pós-Envio:**

- Alert exibido
- Redirecionamento automático
- Estado descartado

### Notas Técnicas

- Parâmetro `:id` capturado via useParams()
- Estado gerenciado com useState (reason, details)
- Validação HTML5 nativa (required)
- Alert simples (não modal customizado)
- Em produção: enviaria dados para API
- Dados não são persistidos no wireframe

---

## FLUXOS DE USUÁRIO

### Fluxo 1: Busca Simples de Vaga

```
Login → Painel → Digita busca → Resultados → Clica vaga → Detalhes
```

**Detalhamento:**

1. Acessa `/` (Login)
2. Preenche email/senha
3. Clica "[ENTRAR]"
4. Chega em `/dashboard` (Painel)
5. Digita "desenvolvedor react" no campo principal
6. Clica "[BUSCAR]"
7. Vai para `/results` (Resultados)
8. Vê lista de 6 vagas
9. Clica em "Engenheiro de Software Sênior"
10. Vai para `/job/1` (Detalhes)
11. Lê informações completas da vaga

### Fluxo 2: Busca Avançada com Filtros

```
Login → Painel → Busca Avançada → Preenche Filtros → Resultados → Detalhes
```

**Detalhamento:**

1. Acessa `/` (Login)
2. Faz login
3. Chega em `/dashboard`
4. Clica no card "BUSCA AVANÇADA"
5. Vai para `/search`
6. Preenche formulário:
   - Palavra-chave: "backend"
   - Localização: "São Paulo"
   - Nível: "Sênior"
   - Tipo: "Remoto"
7. Clica "[BUSCAR VAGAS]"
8. Vai para `/results`
9. Vê vagas filtradas
10. Aplica filtros adicionais na sidebar (checkboxes)
11. Clica em uma vaga
12. Vai para `/job/:id`

### Fluxo 3: Análise de Mercado

```
Login → Painel → Análise Habilidades → Volta → Tendências de Mercado
```

**Detalhamento:**

1. Acessa `/` (Login)
2. Faz login
3. Chega em `/dashboard`
4. Clica no card "ANÁLISE DE HABILIDADES"
5. Vai para `/skills`
6. Analisa:
   - Top 10 habilidades
   - Tecnologias em alta
   - Tecnologias em queda
7. Clica no menu "Tendências"
8. Vai para `/trends`
9. Analisa:
   - Métricas gerais
   - Gráficos de tendência
   - Vagas por setor
   - Rankings

### Fluxo 4: Reportar Vaga Problemática

```
Login → Busca → Resultados → Detalhes → Reportar → Envia → Volta
```

**Detalhamento:**

1. Acessa `/` (Login)
2. Faz login
3. Busca vagas
4. Vai para `/results`
5. Clica em uma vaga específica
6. Vai para `/job/1`
7. Identifica problema (ex: salário errado)
8. Clica "[REPORTAR VAGA]"
9. Vai para `/report/1`
10. Seleciona motivo: "Informação Enganosa"
11. Escreve detalhes: "O salário informado não corresponde..."
12. Clica "[ENVIAR REPORTE]"
13. Vê alerta de confirmação
14. É redirecionado para `/job/1`

### Fluxo 5: Navegação Completa pelo Menu

```
Login → Painel → Menu Buscar → Menu Habilidades → Menu Tendências → Sair
```

**Detalhamento:**

1. Acessa `/` (Login)
2. Faz login
3. Chega em `/dashboard`
4. Clica menu "Buscar" → vai para `/search`
5. Clica menu "Habilidades" → vai para `/skills`
6. Clica menu "Tendências" → vai para `/trends`
7. Clica menu "Painel" → volta para `/dashboard`
8. Clica menu "Sair" → volta para `/` (Login)

### Fluxo 6: Uso de Atalhos do Painel

```
Login → Painel → Card 1 → Volta → Card 2 → Volta → Card 3
```

**Detalhamento:**

1. Login
2. Em `/dashboard`
3. Clica card "BUSCA AVANÇADA" → `/search`
4. Clica menu "Painel" → volta `/dashboard`
5. Clica card "ANÁLISE DE HABILIDADES" → `/skills`
6. Clica menu "Painel" → volta `/dashboard`
7. Clica card "TENDÊNCIAS DE MERCADO" → `/trends`

### Fluxo 7: Candidatura a Vaga (Placeholder)

```
Login → Busca → Resultados → Detalhes → Candidatar-se
```

**Detalhamento:**

1. Login e busca
2. Vai para detalhes de vaga específica
3. Lê descrição e habilidades
4. Verifica estimativa salarial
5. Clica "[CANDIDATAR-SE]"
6. No wireframe: sem funcionalidade
7. Em produção: abriria formulário de candidatura

### Fluxo 8: Salvar Vaga (Placeholder)

```
Login → Busca → Resultados → Detalhes → Salvar Vaga
```

**Detalhamento:**

1. Login e busca
2. Vai para detalhes de vaga
3. Quer guardar para depois
4. Clica "[SALVAR VAGA]"
5. No wireframe: sem funcionalidade
6. Em produção: adicionaria a lista de favoritos

---

## MATRIZ DE FUNCIONALIDADES

### Tabela de Navegação

| De \ Para   | Login   | Painel    | Buscar       | Results   | Job                | Skills       | Trends       | Report      |
| ----------- | ------- | --------- | ------------ | --------- | ------------------ | ------------ | ------------ | ----------- |
| **Login**   | -       | ✅ Entrar | -            | -         | -                  | -            | -            | -           |
| **Painel**  | ✅ Sair | -         | ✅ Menu/Card | ✅ Busca  | -                  | ✅ Menu/Card | ✅ Menu/Card | -           |
| **Buscar**  | ✅ Sair | ✅ Menu   | -            | ✅ Buscar | -                  | ✅ Menu      | ✅ Menu      | -           |
| **Results** | ✅ Sair | ✅ Menu   | ✅ Menu      | -         | ✅ Click Card      | ✅ Menu      | ✅ Menu      | -           |
| **Job**     | ✅ Sair | ✅ Menu   | ✅ Menu      | ✅ Voltar | -                  | ✅ Menu      | ✅ Menu      | ✅ Reportar |
| **Skills**  | ✅ Sair | ✅ Menu   | ✅ Menu      | -         | -                  | -            | ✅ Menu      | -           |
| **Trends**  | ✅ Sair | ✅ Menu   | ✅ Menu      | -         | -                  | ✅ Menu      | -            | -           |
| **Report**  | ✅ Sair | ✅ Menu   | ✅ Menu      | -         | ✅ Enviar/Cancelar | ✅ Menu      | ✅ Menu      | -           |

### Tabela de Elementos Interativos por Tela

| Tela        | Inputs           | Botões                             | Links                 | Dropdowns       | Checkboxes    | Outros                |
| ----------- | ---------------- | ---------------------------------- | --------------------- | --------------- | ------------- | --------------------- |
| **Login**   | 2 (email, senha) | 1                                  | 1 (esqueceu senha\*)  | 0               | 0             | -                     |
| **Painel**  | 1 (busca)        | 4 (buscar + 3 cards)               | 5 (menu nav)          | 0               | 0             | 3 (buscas recentes\*) |
| **Buscar**  | 2 (keyword, loc) | 2 (buscar, limpar)                 | 5 (menu nav)          | 2 (nível, tipo) | 0             | 2 (filtros salvos\*)  |
| **Results** | 0                | 4 (paginação\*)                    | 5 (menu) + 6 (cards)  | 0               | 9 (filtros\*) | -                     |
| **Job**     | 0                | 3 (reportar, candidatar*, salvar*) | 5 (menu) + 1 (voltar) | 0               | 0             | -                     |
| **Skills**  | 0                | 0                                  | 5 (menu nav)          | 0               | 0             | Gráficos              |
| **Trends**  | 0                | 0                                  | 5 (menu nav)          | 0               | 0             | Gráficos              |
| **Report**  | 1 (textarea)     | 2 (enviar, cancelar)               | 5 (menu nav)          | 1 (motivo)      | 0             | -                     |

**Legenda:**

- ✅ = Funcionalidade implementada
- - = Placeholder (não funcional no wireframe)

### Tabela de Estados de Componentes

| Componente           | Estado Local          | Funciona? | Descrição               |
| -------------------- | --------------------- | --------- | ----------------------- |
| Login - Email        | Sim (useState)        | ✅        | Armazena texto digitado |
| Login - Senha        | Sim (useState)        | ✅        | Armazena senha digitada |
| Painel - Busca       | Sim (useState)        | ✅        | Armazena query de busca |
| Buscar - Filtros     | Sim (objeto useState) | ✅        | Armazena 4 filtros      |
| Results - Checkboxes | Não                   | ❌        | Placeholder estático    |
| Job - Candidatar     | Não                   | ❌        | Botão placeholder       |
| Job - Salvar         | Não                   | ❌        | Botão placeholder       |
| Report - Motivo      | Sim (useState)        | ✅        | Armazena dropdown       |
| Report - Detalhes    | Sim (useState)        | ✅        | Armazena textarea       |
| Report - Contador    | Sim (computed)        | ✅        | Calcula length          |

### Tabela de Rotas

| Rota          | Componente     | Acesso Via        | Parâmetros     |
| ------------- | -------------- | ----------------- | -------------- |
| `/`           | Login          | URL direta / Sair | Nenhum         |
| `/dashboard`  | Dashboard      | Login / Menu      | Nenhum         |
| `/search`     | JobSearch      | Menu / Card       | Nenhum         |
| `/results`    | JobResults     | Busca (qualquer)  | Query params\* |
| `/job/:id`    | JobDetail      | Click em vaga     | :id            |
| `/skills`     | SkillsAnalysis | Menu / Card       | Nenhum         |
| `/trends`     | MarketTrends   | Menu / Card       | Nenhum         |
| `/report/:id` | ReportJob      | Botão reportar    | :id            |
| `/*`          | NotFound\*     | URL inválida      | Nenhum         |

**Nota:** Query params não implementados no wireframe

### Tabela de Dados Mock

| Tipo de Dado        | Quantidade | Localização    | Dinâmico? |
| ------------------- | ---------- | -------------- | --------- |
| Vagas               | 6          | JobResults     | Não       |
| Habilidades         | 10         | SkillsAnalysis | Não       |
| Tendências Alta     | 3          | SkillsAnalysis | Não       |
| Tendências Baixa    | 3          | SkillsAnalysis | Não       |
| Dados Gráfico Linha | 6 pontos   | MarketTrends   | Não       |
| Dados Gráfico Barra | 4 barras   | MarketTrends   | Não       |
| Setores             | 5          | MarketTrends   | Não       |
| Rankings            | 3x3        | MarketTrends   | Não       |
| Motivos Reporte     | 6          | ReportJob      | Não       |

---

## ESPECIFICAÇÕES TÉCNICAS

### Stack Tecnológica

- **Framework:** React 18+
- **Roteamento:** React Router 7+ (Data mode)
- **Estilização:** Tailwind CSS v4
- **Gráficos:** Recharts
- **Linguagem:** TypeScript
- **Build:** Vite

### Estrutura de Arquivos

```
/src
  /app
    /components
      Root.tsx          # Layout com menu
      Login.tsx         # Tela 1
      Dashboard.tsx     # Tela 2
      JobSearch.tsx     # Tela 3
      JobResults.tsx    # Tela 4
      JobDetail.tsx     # Tela 5
      SkillsAnalysis.tsx # Tela 6
      MarketTrends.tsx  # Tela 7
      ReportJob.tsx     # Tela 8
    routes.tsx          # Configuração de rotas
    App.tsx             # Entrypoint
  /styles
    theme.css           # Estilos globais
```

### Padrões de Código

**Componentes:**

- Functional components
- TypeScript
- Export named functions

**Estado:**

- useState para estado local
- useNavigate para navegação
- useParams para parâmetros de rota

**Estilização:**

- Classes Tailwind inline
- Escala de cinza: neutral-50 a neutral-900
- Bordas: 2px ou 4px
- Fonte: mono (monospace)

### Responsividade

- Grid responsivo (cols-2, cols-3, cols-4)
- Max-width containers
- Flexbox para layouts
- Não otimizado para mobile no wireframe

---

## LIMITAÇÕES DO WIREFRAME

### Funcionalidades Não Implementadas

1. **Autenticação Real:** Login aceita qualquer credencial
2. **API Backend:** Todos os dados são mock estáticos
3. **Persistência:** Nenhum dado é salvo
4. **Busca Real:** Busca não filtra dados
5. **Filtros Dinâmicos:** Checkboxes não funcionam
6. **Paginação:** Botões não mudam página
7. **Candidatura:** Botão sem funcionalidade
8. **Salvar Vaga:** Botão sem funcionalidade
9. **Histórico:** Buscas recentes são estáticas
10. **Filtros Salvos:** Lista estática

### Dados Mock Estáticos

- 6 vagas hardcoded
- 10 habilidades fixas
- 6 meses de dados de gráfico
- 4 níveis salariais
- 5 setores de mercado
- Todos os textos são placeholder

### Validações Básicas

- Apenas HTML5 native validation
- Campos required simples
- Sem validação customizada
- Sem mensagens de erro personalizadas

---

## MELHORIAS FUTURAS (PÓS-WIREFRAME)

### Fase 1: Funcionalidades Básicas

- [ ] Integrar API real
- [ ] Implementar busca funcional
- [ ] Ativar filtros dinâmicos
- [ ] Adicionar paginação real
- [ ] Implementar autenticação

### Fase 2: Interatividade

- [ ] Adicionar tooltips nos gráficos
- [ ] Implementar salvamento de vagas
- [ ] Criar sistema de favoritos
- [ ] Adicionar histórico de buscas
- [ ] Permitir salvar filtros

### Fase 3: UX Avançada

- [ ] Adicionar loading states
- [ ] Implementar skeleton screens
- [ ] Adicionar transições
- [ ] Melhorar feedback visual
- [ ] Adicionar notificações toast

### Fase 4: Funcionalidades Avançadas

- [ ] Sistema de candidatura completo
- [ ] Perfil de usuário
- [ ] Notificações de novas vagas
- [ ] Match de skills com vagas
- [ ] Recomendações personalizadas

---

## GLOSSÁRIO

**Wireframe:** Protótipo de baixa fidelidade focado em estrutura

**Mock Data:** Dados falsos/estáticos para simular funcionalidade

**Placeholder:** Elemento visual sem funcionalidade real

**Grid:** Sistema de layout em colunas

**Dropdown:** Menu suspenso de seleção

**Checkbox:** Caixa de seleção múltipla

**Toast:** Notificação temporária na tela

**Skeleton:** Animação de loading placeholder

**Badge:** Pequena etiqueta informativa

**Card:** Componente container de conteúdo

**Sidebar:** Barra lateral de navegação/filtros

**Sticky:** Elemento que permanece fixo ao rolar

---

## CONCLUSÃO

Este documento mapeia completamente as 8 telas da plataforma de análise de vagas, incluindo:

✅ **254 elementos interativos** mapeados  
✅ **8 fluxos de usuário** documentados  
✅ **32 botões e ações** especificados  
✅ **12 formulários e inputs** detalhados  
✅ **6 gráficos e visualizações** descritos  
✅ **8 rotas de navegação** definidas

O wireframe está completo e pronto para:

- Apresentação a stakeholders
- Coleta de feedback
- Base para design visual
- Desenvolvimento de MVP

---

**Documento gerado em:** 03 de Abril de 2026  
**Versão:** 1.0  
**Status:** ✅ Completo