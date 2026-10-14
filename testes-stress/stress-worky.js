
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// ===================================================
// WORKY - TESTES DE ESTRESSE E RESILIENCIA
// AC2 - MODULO DE INTELIGENCIA ARTIFICIAL
// ===================================================

// CONFIGURACOES
const VUS = Number(__ENV.VUS || 1);
const ITERATIONS = Number(__ENV.ITERS || VUS);

const URL = 'http://127.0.0.1:8080/carreira/match';

// Tokens de contas ficticias do Supabase de teste
const TOKENS = (__ENV.TEST_TOKENS || '')
  .split(';')
  .map(token => token.trim())
  .filter(Boolean);

// VALIDACOES DE SEGURANCA
if (
  !Number.isInteger(VUS) ||
  VUS < 1 ||
  VUS > 5
) {
  throw new Error(
    'Configure de 1 a 5 usuarios virtuais.'
  );
}

if (
  !Number.isInteger(ITERATIONS) ||
  ITERATIONS < VUS ||
  ITERATIONS > 30 ||
  ITERATIONS % VUS !== 0
) {
  throw new Error(
    'ITERS deve ser multiplo de VUS, entre VUS e 30.'
  );
}

if (TOKENS.length < VUS) {
  throw new Error(
    `Configure ${VUS} tokens de contas de teste diferentes.`
  );
}

if (new Set(TOKENS.slice(0, VUS)).size !== VUS) {
  throw new Error(
    'Cada usuario virtual deve ter um token diferente.'
  );
}

// CARREGAR PAYLOAD
const PAYLOAD = open('./payload-teste.json');

// Validar o arquivo antes dos testes
try {
  JSON.parse(PAYLOAD);
} catch (error) {
  throw new Error(
    'O arquivo payload-teste.json nao contem JSON valido.'
  );
}

// ===================================================
// CONFIGURACAO DOS TESTES
// ===================================================

export const options = {
  scenarios: {
    match: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: ITERATIONS / VUS,
      maxDuration: '60s',
    },
  },

  thresholds: {
    'checks': ['rate==1'],
    'http_req_duration': ['p(95)<10000'],
  },
};

// ===================================================
// METRICAS PERSONALIZADAS
// ===================================================

const sucesso = new Counter('worky_sucesso');

const erro400 = new Counter('worky_erro_400');
const erro401 = new Counter('worky_erro_401');
const erro403 = new Counter('worky_erro_403');
const erro422 = new Counter('worky_erro_422');
const erro429 = new Counter('worky_erro_429');

const erroServidor = new Counter(
  'worky_erro_servidor'
);

const erroConexao = new Counter(
  'worky_erro_conexao'
);

const outrosErros = new Counter(
  'worky_outros_erros'
);

// ===================================================
// TRATAMENTO SEGURO DAS MENSAGENS DE ERRO
// ===================================================

function sanitizarMensagem(valor) {
  return String(valor)
    // Remover tokens JWT
    .replace(
      /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,
      '[TOKEN]'
    )

    // Remover e-mails
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      '[EMAIL]'
    )

    // Remover UUIDs
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      '[UUID]'
    )

    // Remover CPF formatado
    .replace(
      /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
      '[CPF]'
    )

    .slice(0, 200);
}

function obterErroSeguro(response) {
  if (!response.body) {
    return 'Resposta sem corpo.';
  }

  try {
    const dados = response.json();

    // Erros de validacao FastAPI
    if (Array.isArray(dados.detail)) {
      return dados.detail
        .map(erro => {
          const campo = Array.isArray(erro.loc)
            ? erro.loc.join('.')
            : 'desconhecido';

          const tipo = erro.type || 'erro';

          return `${campo}: ${tipo}`;
        })
        .join(' | ')
        .slice(0, 200);
    }

    // Mensagens padronizadas
    if (typeof dados.detail === 'string') {
      return sanitizarMensagem(dados.detail);
    }

    if (typeof dados.message === 'string') {
      return sanitizarMensagem(dados.message);
    }

    return 'Erro sem descricao padronizada.';
  } catch (error) {
    return 'Resposta nao esta em formato JSON.';
  }
}

// ===================================================
// EXECUCAO DO TESTE
// ===================================================

export default function () {

  // Cada VU utiliza seu proprio token
  const token = TOKENS[__VU - 1];

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const inicio = Date.now();

  const response = http.post(
    URL,
    PAYLOAD,
    {
      headers,
      timeout: '30s',
    }
  );

  const tempoTotal = Date.now() - inicio;

  // =================================================
  // CLASSIFICAR RESULTADOS
  // =================================================

  if (response.status === 200) {
    sucesso.add(1);

  } else if (response.status === 400) {
    erro400.add(1);

  } else if (response.status === 401) {
    erro401.add(1);

  } else if (response.status === 403) {
    erro403.add(1);

  } else if (response.status === 422) {
    erro422.add(1);

  } else if (response.status === 429) {
    erro429.add(1);

  } else if (response.status === 0) {
    erroConexao.add(1);

  } else if (response.status >= 500) {
    erroServidor.add(1);

  } else {
    outrosErros.add(1);
  }

  // =================================================
  // VALIDACAO DO MATCH
  // =================================================

  check(response, {
    'Match executado com sucesso': r =>
      r.status === 200,

    'Servidor respondeu': r =>
      r.status > 0,

    'Sem erro interno HTTP 5xx': r =>
      r.status < 500 && r.status > 0,
  });

  // =================================================
  // LOGS
  // =================================================

  console.log(
    `VU ${__VU} | HTTP ${response.status} | ` +
    `${tempoTotal} ms`
  );

  // Mostrar motivo quando houver erro
  if (response.status !== 200) {

    const detalhe = obterErroSeguro(response);

    console.log(
      `VU ${__VU} | Motivo: ${detalhe}`
    );

  }

  // Pequena pausa entre requisicoes
  sleep(1);
}
