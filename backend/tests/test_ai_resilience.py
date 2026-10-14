"""AC2 Teste 5. Run with the existing venv; no live network/database allowed.

Assertions express the acceptance criteria, not the existing bugs. Failures are
intentional evidence and must not be changed to expectedFailure/xfail.
Direct execution also writes measured results beside this test file.
"""
import copy
import importlib.util
import ipaddress
import json
import os
import sys
import socket
import time
import unittest
from contextlib import ExitStack
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import requests
from fastapi.testclient import TestClient

MARKER = 'FAKE_SECRET_AC2_NOT_A_REAL_CREDENTIAL'
PROFILE = {'form': {'bio': 'Desenvolvedor Python'}, 'skills': [{'label': 'Python', 'type': 'tech'}],
           'experiences': [], 'educations': [], 'certs': []}
MATCH = {'pct': 73, 'matched': ['Python'], 'gaps': ['Docker'], 'explanation': 'Resultado ficticio de teste.'}
ANALYSIS = {
    'carreira': 'Python', 'insightIA': 'Panorama ficticio de teste.', 'mediaSalarial': 'R$ 4000 a R$ 6000',
    'moeda': 'BR', 'vagasAbertas': 1, 'crescimentoMensal': '1%', 'nivelDemanda': 'Media',
    'rankingMercado': 'Teste', 'crescimentoAnual': '2%',
    'competenciasDesejadas': {'habilidadesTecnicas': ['Python'], 'softSkills': []},
    'certificacoesRecomendadas': [{'empresa': 'Teste', 'nome': f'Python {i}', 'descricao': 'Teste', 'url': ''} for i in range(4)],
    'oportunidadesDestaque': [], 'cursosRecomendados': [],
}
COURSES = {'cursos': [
    {'titulo': title, 'plataforma': 'Coursera', 'url': f'https://www.coursera.org/learn/test-{i}',
     'area': 'Tecnologia', 'motivo': 'Exemplo ficticio.'}
    for i, title in enumerate(('Python', 'Docker', 'SQL'))
]}


def provider_response(status=200, content=None):
    response = requests.Response()
    response.status_code = status
    response._content = json.dumps(
        {'choices': [{'message': {'content': content}}]} if status == 200 else
        {'error': {'message': MARKER, 'internal_configuration': MARKER}}
    ).encode()
    response.headers['Content-Type'] = 'application/json'
    return response


class ResilienceTests(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.observations = []
        self.unhandled = []
        self.rpc_calls = []
        self.provider_calls = []
        self.saved = []
        self.cached = None
        self.sequence = []
        self.network_attempts = []
        self.stack.enter_context(patch.dict(os.environ, {
            'OPENAI_API_KEY': MARKER, 'OPENAI_TIMEOUT_SECONDS': '90',
            'OPENAI_MODEL': 'fake-model', 'SUPABASE_URL': '', 'SUPABASE_SERVICE_ROLE_KEY': '',
            'SUPABASE_KEY': '', 'ADMIN_USERNAME': '', 'ADMIN_PASSWORD': '',
        }))
        # Even an unexpected fallback cannot reach any remote endpoint.
        def forbidden_network(*args, **kwargs):
            self.network_attempts.append('blocked')
            raise AssertionError('Real network forbidden in AC2 tests')
        # Windows asyncio creates an internal loopback socketpair. Permit only
        # literal loopback addresses for that runtime mechanism, never DNS/remote.
        def guarded_connect(original):
            def connect(sock, address):
                try:
                    loopback = ipaddress.ip_address(address[0]).is_loopback
                except (ValueError, TypeError):
                    loopback = False
                if not loopback:
                    return forbidden_network()
                return original(sock, address)
            return connect
        for name in ('connect', 'connect_ex'):
            original = getattr(socket.socket, name)
            self.stack.enter_context(patch.object(socket.socket, name, guarded_connect(original)))
        self.stack.enter_context(patch('socket.getaddrinfo', side_effect=forbidden_network))
        self.stack.enter_context(patch('requests.sessions.Session.request', side_effect=self.transport))
        self.stack.enter_context(patch('dotenv.load_dotenv'))
        self.stack.enter_context(patch.dict(sys.modules, {'scraper_logger': SimpleNamespace(
            log_scraper_run=Mock(), get_scraper_logs_summary=Mock())}))
        self.db = Mock()
        self.db.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id='fictional-user-ac2'))
        self.db.rpc.side_effect = self.rpc
        self.db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{'profile_json': copy.deepcopy(PROFILE)}]
        self.store = Mock(client=self.db)
        self.store.get_recent.side_effect = lambda *a, **kw: copy.deepcopy(self.cached)
        self.store.get_recent_record.return_value = None
        self.store.load_scrape_snapshot.return_value = []
        self.store.save_scrape_snapshot.return_value = 'mock-only.json'
        self.store.save.side_effect = self.save
        self.stack.enter_context(patch('career_store.CareerStore', return_value=self.store))
        # Fresh isolated module avoids pollution of the existing test suite's main.
        spec = importlib.util.spec_from_file_location('_ac2_resilience_app', ROOT / 'main.py')
        self.app_module = importlib.util.module_from_spec(spec)
        # main.py reconfigures stdout on import; shield pytest/captured streams.
        self.stack.enter_context(patch.object(sys, 'stdout', Mock()))
        spec.loader.exec_module(self.app_module)
        self.app_module.course_catalog = Mock(get_or_fetch=Mock(return_value=[]))
        self.stack.enter_context(patch.object(self.app_module, '_collect_jobs', AsyncMock(return_value=[])))
        self.stack.enter_context(patch.object(self.app_module, 'fetch_worky_course_hints', return_value=[]))
        self.client = self.stack.enter_context(TestClient(self.app_module.app, raise_server_exceptions=True))
        self.addCleanup(self.assert_no_network)

    def assert_no_network(self):
        self.assertEqual(self.network_attempts, [], 'Unexpected outbound attempt was blocked')

    def rpc(self, name, args):
        self.rpc_calls.append((name, copy.deepcopy(args)))
        if name != 'worky_rate_limit':
            raise AssertionError(f'Unexpected RPC: {name}; review reservation coverage')
        return Mock(execute=Mock(return_value=SimpleNamespace(data=True)))

    def save(self, cargo, filters, jobs, analysis, path):
        self.saved.append(copy.deepcopy(analysis))
        self.cached = copy.deepcopy(analysis)

    def transport(self, method, url, **kwargs):
        self.assertEqual(method.lower(), 'post')
        self.assertEqual(url, 'https://api.openai.com/v1/chat/completions')
        self.assertEqual(kwargs.get('timeout'), 90)
        self.provider_calls.append({'timeout': kwargs['timeout']})
        if not self.sequence:
            raise AssertionError('Unexpected retry / provider call')
        response = self.sequence.pop(0)
        if isinstance(response, Exception):
            raise response
        return response

    def call(self, endpoint):
        start = time.perf_counter()
        try:
            headers = {'Authorization': 'Bearer fictional-token-ac2'}
            if endpoint == '/carreira':
                response = self.client.get(endpoint, params={'cargo': 'Python'}, headers=headers)
            else:
                response = self.client.post(endpoint, json={
                    'carreira': 'Python', 'profile': PROFILE,
                    'competenciasDesejadas': {'habilidadesTecnicas': ['Python'], 'softSkills': []},
                }, headers=headers)
        except Exception as exc:
            self.unhandled.append(type(exc).__name__)
            raise
        self.observations.append({'endpoint': endpoint, 'http': response.status_code,
                                  'seconds': time.perf_counter() - start, 'body': response.json()})
        self.assertEqual(self.client.get('/').status_code, 200)
        return response

    def failure_matrix(self, failure):
        responses = []
        for endpoint in ('/carreira', '/carreira/match', '/carreira/cursos'):
            self.sequence = [failure()]
            count = len(self.provider_calls)
            response = self.call(endpoint)
            self.assertEqual(len(self.provider_calls) - count, 1, 'Unlimited or unexpected retries')
            self.assertEqual(response.status_code, 502, response.text)
            self.assertIn('detail', response.json())
            self.assertNotIn('match', response.json())
            self.assertEqual(self.saved, [], 'A failed analysis must not be cached')
            responses.append(response)
        return responses

    def test_5_1_timeout(self):
        self.failure_matrix(lambda: requests.exceptions.ReadTimeout('Simulated read timeout'))
        # Diagnostic exceptions are untrusted too: no real credential is used.
        responses = self.failure_matrix(lambda: requests.exceptions.ReadTimeout('Simulated timeout ' + MARKER))
        for response in responses:
            self.assertNotIn(MARKER, response.text, 'Exception diagnostic leaked to API client')

    def test_5_2_provider_429(self):
        responses = self.failure_matrix(lambda: provider_response(429))
        for response in responses:
            self.assertIn('429', response.json()['detail'])
            self.assertNotIn(MARKER, response.text)
        self.sequence = [provider_response(content=json.dumps(MATCH))]
        self.assertEqual(self.call('/carreira/match').status_code, 200)

    def test_5_3_provider_500(self):
        responses = self.failure_matrix(lambda: provider_response(500))
        for response in responses:
            self.assertNotIn(MARKER, response.text)
            self.assertNotIn('pct', response.json())

    def test_5_4_invalid_json(self):
        responses = self.failure_matrix(lambda: provider_response(content='{resposta_invalida}'))
        for response in responses:
            self.assertIn('JSON', response.json()['detail'])
            self.assertNotIn(MARKER, response.text)
            self.assertNotIn('resposta_invalida', response.text)

    def test_5_5_incomplete_match(self):
        self.sequence = [provider_response(content='{"matched":["Python"]}')]
        response = self.call('/carreira/match')
        self.assertEqual(len(self.provider_calls), 1)
        self.assertEqual(response.status_code, 502,
                         f'Incomplete match accepted: {response.json()}; no percentage should be fabricated')

    def test_5_6_recovery(self):
        self.sequence = [provider_response(500), requests.exceptions.ReadTimeout('Simulated timeout'),
                         provider_response(content=json.dumps(ANALYSIS))]
        for expected in (502, 502, 200):
            response = self.call('/carreira')
            self.assertEqual(response.status_code, expected)
            self.assertEqual(len(self.saved), int(expected == 200))
        self.assertEqual(response.json()['insightIA'], ANALYSIS['insightIA'])
        # Same app instance, a fourth request must use only the valid cache.
        self.assertEqual(self.call('/carreira').status_code, 200)
        self.assertEqual(len(self.provider_calls), 3)
        self.assertEqual(len(self.saved), 1)
        self.assertEqual(self.sequence, [])

    def test_5_7_match_failure_and_quota(self):
        self.sequence = [provider_response(500), provider_response(content=json.dumps(MATCH))]
        first = self.call('/carreira/match')
        self.assertEqual(first.status_code, 502)
        self.assertNotIn('match', first.json())
        second = self.call('/carreira/match')
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()['match'], MATCH)
        self.assertEqual(len(self.provider_calls), 2)
        # Observe real calls: current backend counts attempts but has no leases
        # or lifetime-credit debit. Do not fake release of nonexistent resources.
        self.assertEqual(self.rpc_calls, [('worky_rate_limit', {
            'p_subject': 'fictional-user-ac2', 'p_operation': 'ai'})] * 2)
        self.assertEqual(self.saved, [])


class MeasuredResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.records = []

    def startTest(self, test):
        self.started = time.perf_counter()
        self.outcome = 'APROVADO'
        self.reason = ''
        super().startTest(test)

    def addFailure(self, test, err):
        self.outcome, self.reason = 'REPROVADO', str(err[1])
        super().addFailure(test, err)

    def addError(self, test, err):
        self.outcome, self.reason = 'REPROVADO', str(err[1])
        super().addError(test, err)

    def stopTest(self, test):
        self.records.append({'test': test._testMethodName, 'result': self.outcome,
            'seconds': time.perf_counter() - self.started, 'reason': self.reason,
            'requests': getattr(test, 'observations', []),
            'unhandled_exceptions': getattr(test, 'unhandled', []),
            'provider_calls': len(getattr(test, 'provider_calls', [])),
            'rpc_calls': getattr(test, 'rpc_calls', []),
            'network_attempts_blocked': len(getattr(test, 'network_attempts', [])),
            'analysis_cache_writes': len(getattr(test, 'saved', []))})
        super().stopTest(test)


if __name__ == '__main__':
    started = time.perf_counter()
    result = unittest.TextTestRunner(verbosity=2, resultclass=MeasuredResult).run(
        unittest.defaultTestLoader.loadTestsFromTestCase(ResilienceTests))
    report = {'recorded_at_utc': datetime.now(timezone.utc).isoformat(),
              'python': sys.version, 'suite_seconds': time.perf_counter() - started,
              'tests_run': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
              'timing_scope': 'Local mocks including per-test setup/cleanup; not OpenAI latency',
              'concurrency_scope': 'Sequential recovery; no application lease/semaphore is integrated',
              'results': result.records}
    target = Path(__file__).with_name('ai_resilience_results.json')
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'AC2 results: {target}; total={report["suite_seconds"]:.6f}s')
    sys.exit(0 if result.wasSuccessful() else 1)
