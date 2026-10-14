"""Regression coverage for safe errors and mandatory Match response fields."""
import io
import json
import sys
import traceback
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import Mock, patch

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from career_ai import CareerAIAnalyzer, ProfileMatchError


class ErrorContractTests(unittest.TestCase):
    def setUp(self):
        self.analyzer = CareerAIAnalyzer()
        self.analyzer.api_key = 'fake-test-key'
        self.valid = {'pct': 73, 'matched': ['Python'], 'gaps': ['Docker'], 'explanation': 'Teste.'}

    def match(self, payload):
        response = Mock(status_code=200)
        response.json.return_value = {'choices': [{'message': {'content': json.dumps(payload)}}]}
        with patch('requests.post', return_value=response):
            return self.analyzer.calculate_profile_match({}, 'Python')

    def test_each_required_field_must_be_present(self):
        for field in self.valid:
            with self.subTest(field=field):
                invalid = {key: value for key, value in self.valid.items() if key != field}
                with self.assertRaises(ProfileMatchError):
                    self.match(invalid)

    def test_invalid_types_and_nonfinite_percentages_are_rejected(self):
        cases = {
            'pct': [None, True, False, '73', [], {}, float('nan'), float('inf'), -float('inf')],
            'matched': [None, 'Python', {}, [12], [None], [{}]],
            'gaps': [None, 'Docker', {}, [False], [[]]],
            'explanation': [None, 12, True, [], {}],
        }
        for field, values in cases.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    with self.assertRaises(ProfileMatchError):
                        self.match({**self.valid, field: value})

    def test_valid_percentages_preserve_conversion_limits_and_response(self):
        for value, expected in [(73, 73), (73.9, 73), (105, 100), (5, 10)]:
            with self.subTest(value=value):
                result = self.match({**self.valid, 'pct': value})
                self.assertEqual(result, {**self.valid, 'pct': expected})

    def test_transport_diagnostics_not_in_public_error_logs_or_traceback(self):
        marker = 'FAKE_PRIVATE_DIAGNOSTIC_NOT_A_REAL_SECRET'
        calls = [
            lambda: self.analyzer.calculate_profile_match({}, 'Python'),
            lambda: self.analyzer.analyze('Python', {}, []),
            lambda: self.analyzer.suggest_career_courses({'carreira': 'Python'}),
        ]
        for error in (requests.Timeout(marker), requests.ConnectionError(marker)):
            for call in calls:
                with self.subTest(error=type(error).__name__, call=call):
                    output = io.StringIO()
                    with redirect_stdout(output), redirect_stderr(output), patch('requests.post', side_effect=error):
                        try:
                            call()
                        except RuntimeError as exc:
                            public = str(exc)
                            trace = traceback.format_exc()
                        else:
                            self.fail('Transport error was not rejected')
                    self.assertNotIn(marker, public)
                    self.assertNotIn(marker, output.getvalue())
                    self.assertNotIn(marker, trace)


if __name__ == '__main__':
    unittest.main()
