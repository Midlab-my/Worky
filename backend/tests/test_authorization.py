import base64
import json
import time
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from security import authenticated_user
from fastapi import HTTPException
from recruitment import candidate_card


def jwt(aal='aal2', **overrides):
    claims = {'sub': 'user-a', 'exp': time.time() + 600, 'aal': aal, **overrides}
    payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=')
    return 'header.' + payload + '.signature'


class AuthorizationTests(unittest.TestCase):
    def test_no_token_does_not_query_auth(self):
        client = Mock()
        with self.assertRaises(HTTPException) as caught:
            authenticated_user(SimpleNamespace(headers={}), client)
        self.assertEqual(caught.exception.status_code, 401)
        client.auth.get_user.assert_not_called()

    def test_identity_comes_from_verified_auth(self):
        client = Mock()
        client.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id='user-a'))
        token = jwt()
        self.assertEqual(authenticated_user(SimpleNamespace(headers={'authorization': 'Bearer ' + token}), client), 'user-a')
        client.auth.get_user.assert_called_once_with(token)
        client.auth.set_session.assert_not_called()

    def test_aal1_and_missing_aal_are_forbidden(self):
        for aal in ('aal1', None, 'unexpected'):
            client = Mock()
            client.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id='user-a'))
            with self.assertRaises(HTTPException) as caught:
                authenticated_user(SimpleNamespace(headers={'authorization': 'Bearer ' + jwt(aal)}), client)
            self.assertEqual(caught.exception.status_code, 403)

    def test_mismatched_expired_and_malformed_tokens_are_rejected(self):
        for token in (jwt(sub='user-b'), jwt(exp=0), 'bad'):
            client = Mock()
            client.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id='user-a'))
            with self.assertRaises(HTTPException) as caught:
                authenticated_user(SimpleNamespace(headers={'authorization': 'Bearer ' + token}), client)
            self.assertEqual(caught.exception.status_code, 401)

    def test_forged_aal2_is_not_accepted_when_supabase_rejects_it(self):
        client = Mock()
        client.auth.get_user.side_effect = ValueError('invalid signature')
        with self.assertRaises(HTTPException) as caught:
            authenticated_user(SimpleNamespace(headers={'authorization': 'Bearer ' + jwt()}), client)
        self.assertEqual(caught.exception.status_code, 401)

    def test_invalid_token_is_rejected(self):
        client = Mock()
        client.auth.get_user.side_effect = ValueError('invalid')
        with self.assertRaises(HTTPException):
            authenticated_user(SimpleNamespace(headers={'authorization': 'Bearer bad'}), client)

    def test_recruitment_score_preserves_formula_and_hides_raw_profile(self):
        card = candidate_card({'user_id': 'private-uuid', 'profile_json': {
            'skills': [{'label': 'Python'}, {'label': 'SQL'}],
            'form': {'nome': 'Candidato fictício', 'cidade': 'Cidade fictícia'},
            'email': 'private@example.invalid', 'bio': 'Python SQL',
        }}, {'id': 'job', 'titulo': 'Python', 'requisitos': 'SQL', 'descricao': ''})
        self.assertEqual(card['match'], 98)
        self.assertNotIn('private@example.invalid', str(card))
        self.assertNotIn('private-uuid', str(card))


class RouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import importlib
        from fastapi.testclient import TestClient
        # No env secrets, clients, filesystem caches or logger DB are used.
        with patch('dotenv.load_dotenv'), patch('career_store.CareerStore', return_value=Mock(client=Mock())):
            cls.main = importlib.import_module('main')
        cls.client = TestClient(cls.main.app)

    def test_personal_routes_require_auth(self):
        for route in ('/perfil/cursos', '/carreira/match', '/carreira/cursos'):
            self.assertEqual(self.client.post(route, json={}).status_code, 401)

    def test_oversized_body_is_rejected_before_auth(self):
        self.assertEqual(self.client.post('/carreira/match', content=b'x' * 128001).status_code, 413)

    def test_match_uses_authenticated_profile_not_supplied_profile(self):
        owned = {'form': {'bio': 'Python'}, 'skills': []}
        result = {'pct': 85, 'matched': ['Python'], 'gaps': [], 'explanation': 'ok'}
        with patch.object(self.main, '_require_user', return_value='user-a'), patch.object(self.main, '_shared_limit'), \
             patch.object(self.main, '_own_profile', return_value=owned) as own, \
             patch.object(self.main, 'CareerAIAnalyzer') as analyzer, \
             patch.dict('os.environ', {'OPENAI_API_KEY': 'fake'}):
            analyzer.return_value.calculate_profile_match.return_value = result
            response = self.client.post('/carreira/match', json={'profile': {'user_id': 'user-b'}, 'carreira': 'Python'})
            self.assertEqual(response.status_code, 200, response.text)
            own.assert_called_once_with('user-a')
            analyzer.return_value.calculate_profile_match.assert_called_once_with(owned, 'Python')
            self.assertEqual(response.json()['match'], result)

    def test_bad_json_is_400(self):
        with patch.object(self.main, '_require_user', return_value='user-a'), patch.object(self.main, '_shared_limit'):
            self.assertEqual(self.client.post('/perfil/cursos', content='[').status_code, 400)
            self.assertEqual(self.client.post('/perfil/cursos', json=[]).status_code, 400)

    def test_foreign_job_is_denied_before_profiles_are_queried(self):
        database = Mock()
        database.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{'plan': 'pro'}]
        database.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        with patch.object(self.main, '_require_user', return_value='company-a'), patch.object(self.main, '_shared_limit'), \
             patch.object(self.main.career_store, 'client', database):
            response = self.client.get('/empresa/candidatos/11111111-1111-4111-8111-111111111111')
        self.assertEqual(response.status_code, 403)
        self.assertNotIn(('professional_profiles',), [call.args for call in database.table.call_args_list])

    def test_missing_security_rpc_fails_closed(self):
        with patch.object(self.main.career_store, 'client') as client:
            client.rpc.side_effect = RuntimeError('missing migration')
            with self.assertRaises(HTTPException) as caught:
                self.main._shared_limit('user-a')
        self.assertEqual(caught.exception.status_code, 503)

    def test_company_catalog_is_public(self):
        with patch.object(self.main, 'fetch_public_company_catalog', return_value=[]):
            response = self.client.get('/catalogo/empresas')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'empresas': []})

    def test_company_catalog_rejects_fake_ids(self):
        response = self.client.get('/catalogo/empresas/norte-tech')
        self.assertEqual(response.status_code, 422)

    def test_forwarded_ip_is_not_trusted_by_application(self):
        request = SimpleNamespace(headers={'x-forwarded-for': 'evil'}, client=SimpleNamespace(host='trusted-peer'))
        self.assertEqual(self.main._client_ip(request), 'trusted-peer')


if __name__ == '__main__':
    unittest.main()
