"""Score local de compatibilidade RH e cartao minimo do candidato."""
import hashlib
import math
import re


def _tokens(*parts: str) -> set[str]:
    return {t for t in re.split(r'[^a-z0-9+#.\u00c0-\u024f]+', ' '.join(parts).lower()) if len(t) > 1}


def candidate_card(row: dict, job: dict) -> dict:
    profile = row.get('profile_json') or {}
    raw = profile.get('skills') or []
    skills = [s if isinstance(s, str) else str(s.get('label') or '') for s in raw if isinstance(s, (str, dict))]
    skills = [s for s in skills if s]
    headline = str(profile.get('headline') or profile.get('title') or profile.get('cargo') or job['titulo'])
    about = str(profile.get('about') or profile.get('bio') or profile.get('summary') or '')
    job_tokens = _tokens(job['titulo'], job.get('requisitos', ''), job.get('descricao', ''))
    profile_tokens = _tokens(headline, about, ' '.join(skills))
    base = math.floor(len(job_tokens & profile_tokens) / len(job_tokens) * 100 + .5) if job_tokens else 70
    match = max(55, min(98, base + min(len(skills), 8)))
    form = profile.get('form') or {}
    # Bio/contato entram so no score local; resposta ja sai projetada.
    from ai_privacy import professional_text, concepts
    return {
        'id': hashlib.sha256(f"{job['id']}:{row['user_id']}".encode()).hexdigest(),
        'name': str(form.get('nome') or profile.get('name') or 'Candidato')[:120],
        'location': str(form.get('cidade') or profile.get('location') or '')[:100],
        'role': professional_text(headline), 'match': match,
        'skills': [term for skill in skills[:4] for term in concepts(skill)],
        'summary': professional_text(about), 'email': '', 'locked': False,
    }
