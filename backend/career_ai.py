import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import requests


OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL = "gpt-4o-mini"
FALLBACK_INSIGHT = (
    "Nao foi possivel gerar um insight detalhado com os dados disponiveis. "
    "Use as vagas coletadas como referencia inicial para esta carreira."
)
REQUIRED_ANALYSIS_KEYS = {
    "carreira",
    "insightIA",
    "mediaSalarial",
    "moeda",
    "vagasAbertas",
    "crescimentoMensal",
    "nivelDemanda",
    "rankingMercado",
    "crescimentoAnual",
    "competenciasDesejadas",
    "certificacoesRecomendadas",
    "oportunidadesDestaque",
    "cursosRecomendados",
}


class CareerAnalysisError(RuntimeError):
    pass


class ProfileCourseSuggestionError(RuntimeError):
    pass


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if value in (None, ""):
        return []
    return [value]


def _normalize_demand(value: Any, count: int) -> str:
    text = _clean_text(value).lower()
    if text in {"baixa", "baixo"}:
        return "Baixa"
    if text in {"media", "média", "medio", "médio"}:
        return "Média"
    if text in {"alta", "alto"}:
        return "Alta"
    if count >= 15:
        return "Alta"
    if count >= 6:
        return "Média"
    return "Baixa"


def _job_to_opportunity(job: dict[str, Any]) -> dict[str, str]:
    return {
        "titulo": _clean_text(job.get("titulo")),
        "empresa": _clean_text(job.get("empresa")) or "Confidencial",
        "localidade": _clean_text(job.get("local")),
        "modalidade": _clean_text(job.get("modalidade")),
        "salario": _clean_text(job.get("salario") or job.get("remuneracao") or job.get("faixaSalarial")),
        "tipoContrato": _clean_text(job.get("tipoContrato") or job.get("tipo") or job.get("contrato")),
        "link": _clean_text(job.get("link")),
    }


def build_fallback_analysis(
    cargo: str,
    vagas: list[dict[str, Any]],
    reason: str,
    ai_error: str | None = None,
) -> dict[str, Any]:
    todas = [_job_to_opportunity(job) for job in vagas]
    return {
        "carreira": cargo,
        "insightIA": (
            "A análise por IA não pôde ser concluída neste momento. "
            "Os dados abaixo foram estruturados a partir das vagas reais coletadas pelo scraper."
        ),
        "mediaSalarial": "",
        "moeda": "BR",
        "vagasAbertas": len(vagas),
        "crescimentoMensal": "",
        "nivelDemanda": _normalize_demand(None, len(vagas)),
        "rankingMercado": "",
        "crescimentoAnual": "",
        "competenciasDesejadas": {
            "habilidadesTecnicas": [],
            "softSkills": [],
        },
        "certificacoesRecomendadas": [],
        "oportunidadesDestaque": todas,
        "todasVagas": todas,
        "cursosRecomendados": [],
        "metadata": {
            "fonteAnalise": "fallback",
            "motivoFallback": reason,
            "erroIA": ai_error,
            "vagasColetadas": len(vagas),
            "geradoEm": datetime.now(timezone.utc).isoformat(),
            "cache": False,
            "schemaVersion": 3,
        },
    }


def _extract_json(text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise ValueError("A resposta da IA não retornou um objeto JSON.")
    return parsed


def _unwrap_analysis_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if REQUIRED_ANALYSIS_KEYS.issubset(payload.keys()):
        return payload

    for key in ("schemaObrigatorio", "retorneExatamenteEsteObjeto", "analysis", "resultado", "dados", "careerAnalysis"):
        nested = payload.get(key)
        if isinstance(nested, dict) and any(field in nested for field in REQUIRED_ANALYSIS_KEYS):
            return nested

    return payload


def _url_looks_valid(url: str) -> bool:
    return url.startswith("https://") and "." in url.split("https://", 1)[1]


def _tokenize_similarity_text(value: str) -> set[str]:
    normalized = re.sub(r"[^a-z0-9Ã¡Ã Ã£Ã¢Ã©ÃªÃ­Ã³Ã´ÃµÃºÃ§+#. ]+", " ", value.lower())
    stopwords = {
        "curso",
        "course",
        "certification",
        "certificado",
        "certificacao",
        "certificaÃ§Ã£o",
        "professional",
        "especializacao",
        "especializaÃ§Ã£o",
        "fundamentals",
        "essentials",
        "advanced",
        "basico",
        "bÃ¡sico",
        "para",
        "com",
        "and",
        "the",
        "de",
        "da",
        "do",
        "em",
    }
    return {token for token in normalized.split() if len(token) > 2 and token not in stopwords}


def _is_similar_learning_item(left: str, right: str) -> bool:
    left_tokens = _tokenize_similarity_text(left)
    right_tokens = _tokenize_similarity_text(right)

    if not left_tokens or not right_tokens:
        return False

    intersection = left_tokens & right_tokens
    smaller_size = min(len(left_tokens), len(right_tokens))
    union_size = len(left_tokens | right_tokens)

    return (
        len(intersection) >= 2 and len(intersection) / smaller_size >= 0.6
    ) or (
        union_size > 0 and len(intersection) / union_size >= 0.5
    )


def _profile_completed_learning_terms(profile: dict[str, Any]) -> list[str]:
    terms: list[str] = []

    for cert in _normalize_list(profile.get("certs")):
        if isinstance(cert, dict):
            terms.append(" ".join([
                _clean_text(cert.get("name")),
                _clean_text(cert.get("emissor") or cert.get("sub")),
                _clean_text(cert.get("logo")),
            ]))

    for education in _normalize_list(profile.get("educations")):
        if isinstance(education, dict):
            terms.append(" ".join([
                _clean_text(education.get("nome")),
                _clean_text(education.get("instituicao") or education.get("info")),
            ]))

    return [term for term in terms if term.strip()]


def _is_probably_reachable_url(url: str) -> bool:
    if not _url_looks_valid(url):
        return False

    try:
        response = requests.head(
            url,
            allow_redirects=True,
            timeout=8,
            headers={"User-Agent": "Worky/1.0 (+https://worky.local)"},
        )
        if response.status_code and response.status_code != 404 and response.status_code < 500:
            return True
    except requests.RequestException:
        pass

    try:
        response = requests.get(
            url,
            allow_redirects=True,
            timeout=10,
            headers={"User-Agent": "Worky/1.0 (+https://worky.local)"},
        )
        return response.status_code != 404 and response.status_code < 500
    except requests.RequestException:
        return True


def validate_profile_course_suggestions(payload: dict[str, Any], profile: dict[str, Any]) -> list[dict[str, str]]:
    raw_courses = payload.get("cursos") or payload.get("courses") or payload.get("recomendacoes")
    courses = []
    completed_terms = _profile_completed_learning_terms(profile)

    for item in _normalize_list(raw_courses):
        if not isinstance(item, dict):
            continue

        title = _clean_text(item.get("titulo") or item.get("nome") or item.get("title"))
        provider = _clean_text(item.get("plataforma") or item.get("provedor") or item.get("provider"))
        url = _clean_text(item.get("url") or item.get("link"))
        area = _clean_text(item.get("area"))
        reason = _clean_text(item.get("motivo") or item.get("descricao") or item.get("reason"))

        if not title or not provider or not url or not _is_probably_reachable_url(url):
            continue

        comparable_title = f"{title} {provider}"
        if any(_is_similar_learning_item(comparable_title, term) for term in completed_terms):
            continue

        if any(_is_similar_learning_item(comparable_title, f"{course['titulo']} {course['plataforma']}") for course in courses):
            continue

        courses.append(
            {
                "titulo": title,
                "plataforma": provider,
                "url": url,
                "area": area or "Tecnologia",
                "motivo": reason or "Curso recomendado pela IA com base nas competencias e experiencia do perfil.",
            }
        )

    return courses[:3]


def validate_career_analysis(
    payload: dict[str, Any],
    cargo: str,
    vagas: list[dict[str, Any]],
    used_ai: bool,
) -> dict[str, Any]:
    payload = _unwrap_analysis_payload(payload)
    todas_vagas = [_job_to_opportunity(job) for job in vagas]
    oportunidades = todas_vagas

    competencias = payload.get("competenciasDesejadas")
    if not isinstance(competencias, dict):
        competencias = {}

    certificacoes = [
        {
            "empresa": _clean_text(item.get("empresa")),
            "nome": _clean_text(item.get("nome")),
            "descricao": _clean_text(item.get("descricao")),
        }
        for item in _normalize_list(payload.get("certificacoesRecomendadas"))
        if isinstance(item, dict)
    ]

    cursos = [
        {
            "plataforma": _clean_text(item.get("plataforma")),
            "nome": _clean_text(item.get("nome")),
            "preco": _clean_text(item.get("preco")),
            "url": _clean_text(item.get("url") or item.get("link")),
            "area": _clean_text(item.get("area")),
            "motivo": _clean_text(item.get("motivo") or item.get("descricao") or item.get("reason")),
        }
        for item in _normalize_list(payload.get("cursosRecomendados"))
        if isinstance(item, dict)
        and _clean_text(item.get("plataforma"))
        and _clean_text(item.get("nome"))
        and _url_looks_valid(_clean_text(item.get("url") or item.get("link")))
    ]

    analysis = {
        "carreira": _clean_text(payload.get("carreira")) or cargo,
        "insightIA": _clean_text(payload.get("insightIA")),
        "mediaSalarial": _clean_text(payload.get("mediaSalarial")),
        "moeda": _clean_text(payload.get("moeda")) or "BR",
        "vagasAbertas": int(payload.get("vagasAbertas") or len(vagas)),
        "crescimentoMensal": _clean_text(payload.get("crescimentoMensal")),
        "nivelDemanda": _normalize_demand(payload.get("nivelDemanda"), len(vagas)),
        "rankingMercado": _clean_text(payload.get("rankingMercado")),
        "crescimentoAnual": _clean_text(payload.get("crescimentoAnual")),
        "competenciasDesejadas": {
            "habilidadesTecnicas": [
                _clean_text(item)
                for item in _normalize_list(competencias.get("habilidadesTecnicas"))
                if _clean_text(item)
            ],
            "softSkills": [
                _clean_text(item)
                for item in _normalize_list(competencias.get("softSkills"))
                if _clean_text(item)
            ],
        },
        "certificacoesRecomendadas": certificacoes,
        "oportunidadesDestaque": oportunidades,
        "todasVagas": todas_vagas,
        "cursosRecomendados": cursos,
        "metadata": {
            "fonteAnalise": "openai" if used_ai else "fallback",
            "vagasColetadas": len(vagas),
            "geradoEm": datetime.now(timezone.utc).isoformat(),
            "cache": False,
            "schemaVersion": 3,
        },
    }

    if not analysis["insightIA"]:
        analysis["insightIA"] = FALLBACK_INSIGHT

    return analysis


class CareerAIAnalyzer:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
        self.timeout = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "90"))

    def analyze(
        self,
        cargo: str,
        filtros: dict[str, Any],
        vagas: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not self.api_key:
            raise CareerAnalysisError("OPENAI_API_KEY ausente")

        try:
            print("Enviando dados para a IA da OpenAI processar...")
            raw_payload = self._call_openai(cargo, filtros, vagas)
            print("Dados recebidos da IA com sucesso!")
        except Exception as exc:
            raise CareerAnalysisError(f"Falha de conexão com a OpenAI: {exc}") from exc
            
        try:
            parsed = _extract_json(raw_payload)
        except Exception as exc:
            raise CareerAnalysisError(f"JSON inválido retornado pela IA: {exc}") from exc

        return validate_career_analysis(parsed, cargo, vagas, used_ai=True)

    def suggest_profile_courses(self, profile: dict[str, Any]) -> list[dict[str, str]]:
        if not self.api_key:
            raise ProfileCourseSuggestionError("OPENAI_API_KEY ausente")

        try:
            print("Gerando cursos reais para o perfil profissional...")
            raw_payload = self._call_openai_for_profile_courses(profile)
            print("Cursos recebidos da IA com sucesso!")
        except Exception as exc:
            raise ProfileCourseSuggestionError(f"Falha ao gerar cursos com a OpenAI: {exc}") from exc

        try:
            parsed = _extract_json(raw_payload)
            courses = validate_profile_course_suggestions(parsed, profile)
        except Exception as exc:
            raise ProfileCourseSuggestionError(f"JSON invalido retornado pela IA: {exc}") from exc

        if len(courses) != 3:
            raise ProfileCourseSuggestionError("A IA nao retornou exatamente 3 cursos reais, novos e com links validos.")

        return courses

    def suggest_career_courses(self, career_context: dict[str, Any]) -> list[dict[str, str]]:
        if not self.api_key:
            raise ProfileCourseSuggestionError("OPENAI_API_KEY ausente")

        try:
            print("Gerando cursos reais para a carreira analisada...")
            raw_payload = self._call_openai_for_career_courses(career_context)
            print("Cursos da carreira recebidos da IA com sucesso!")
        except Exception as exc:
            raise ProfileCourseSuggestionError(f"Falha ao gerar cursos da carreira com a OpenAI: {exc}") from exc

        try:
            parsed = _extract_json(raw_payload)
            courses = validate_profile_course_suggestions(parsed, career_context)
        except Exception as exc:
            raise ProfileCourseSuggestionError(f"JSON invalido retornado pela IA: {exc}") from exc

        if len(courses) != 3:
            raise ProfileCourseSuggestionError("A IA nao retornou exatamente 3 cursos reais com links validos.")

        return courses

    def _call_openai_for_profile_courses(self, profile: dict[str, Any]) -> str:
        system_prompt = (
            "Voce e um orientador de carreira no Brasil. "
            "Sua tarefa e recomendar cursos reais, publicos e acessiveis na web com URL direta. "
            "Use o perfil do usuario como base principal: carreira desejada, competencias, experiencias, formacao e certificacoes. "
            "Nao invente cursos, plataformas, certificados ou links. Se nao souber uma URL direta, escolha outro curso real. "
            "Prefira paginas oficiais de provedores reconhecidos como Microsoft Learn, AWS Skill Builder, Google Cloud Skills Boost, "
            "Coursera, edX, Cisco Networking Academy, freeCodeCamp, DeepLearning.AI, Udacity, Alura, Rocketseat, SENAI, Sebrae, FGV ou Escola Virtual Gov. "
            "Retorne somente JSON valido, sem markdown."
        )
        user_prompt = {
            "perfilUsuario": profile,
            "regras": [
                "Recomende exatamente 3 cursos reais.",
                "Cada item precisa ter titulo, plataforma, url https, area e motivo.",
                "O motivo deve explicar claramente por que o curso combina com a carreira e competencias do perfil.",
                "Nao retorne cursos genericos sem link direto.",
                "Nao recomende curso igual ou muito parecido com certificacoes, cursos ou formacoes que o usuario ja concluiu ou esta cursando.",
                "Se o usuario ja tem uma certificacao AWS, por exemplo, recomende um curso complementar diferente, nao o mesmo exame/trilha.",
            ],
            "schemaObrigatorio": {
                "cursos": [
                    {
                        "titulo": "nome real do curso",
                        "plataforma": "plataforma real",
                        "url": "https://url-real-do-curso",
                        "area": "area principal do curso",
                        "motivo": "por que combina com o perfil",
                    }
                ]
            },
        }

        response = requests.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "temperature": 0.15,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": json.dumps(user_prompt, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.timeout,
        )

        if response.status_code >= 400:
            raise ProfileCourseSuggestionError(
                f"Erro na API da OpenAI ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProfileCourseSuggestionError("Formato inesperado na resposta da API da OpenAI.") from exc

    def _call_openai_for_career_courses(self, career_context: dict[str, Any]) -> str:
        system_prompt = (
            "Voce e um orientador de carreira no Brasil. "
            "Sua tarefa e pesquisar e recomendar cursos reais, publicos e acessiveis na web com URL direta. "
            "Use a carreira pesquisada e as competencias desejadas como base principal. "
            "Nao invente cursos, plataformas, certificados ou links. Se nao souber uma URL direta, escolha outro curso real. "
            "Prefira paginas oficiais ou plataformas reconhecidas como Microsoft Learn, AWS Skill Builder, Google Cloud Skills Boost, "
            "Coursera, edX, Cisco Networking Academy, freeCodeCamp, DeepLearning.AI, Udacity, Alura, Rocketseat, SENAI, Sebrae, FGV ou Escola Virtual Gov. "
            "Retorne somente JSON valido, sem markdown."
        )
        user_prompt = {
            "contextoCarreira": career_context,
            "regras": [
                "Recomende exatamente 3 cursos reais.",
                "Cada item precisa ter titulo, plataforma, url https, area e motivo.",
                "Os cursos devem cobrir a carreira e as competencias tecnicas mais importantes da analise.",
                "O motivo deve citar uma competencia desejada ou objetivo pratico da carreira.",
                "Nao retorne cursos genericos sem relacao clara com a carreira.",
                "Nao retorne URL de home page generica se houver pagina direta do curso ou trilha.",
            ],
            "schemaObrigatorio": {
                "cursos": [
                    {
                        "titulo": "nome real do curso",
                        "plataforma": "plataforma real",
                        "url": "https://url-real-do-curso",
                        "area": "area principal do curso",
                        "motivo": "por que combina com a carreira e competencias",
                    }
                ]
            },
        }

        response = requests.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "temperature": 0.15,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": json.dumps(user_prompt, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.timeout,
        )

        if response.status_code >= 400:
            raise ProfileCourseSuggestionError(
                f"Erro na API da OpenAI ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProfileCourseSuggestionError("Formato inesperado na resposta da API da OpenAI.") from exc

    def _call_openai(
        self,
        cargo: str,
        filtros: dict[str, Any],
        vagas: list[dict[str, Any]],
    ) -> str:
        vagas_relevantes = vagas[:25]
        system_prompt = (
            "Voce e um analista de mercado de trabalho no Brasil. "
            "Transforme vagas reais coletadas por scraper em um JSON valido para uma tela de carreira. "
            "Use as vagas como base principal. Quando alguma informacao nao existir nas vagas, voce pode inferir "
            "valores coerentes para a carreira pesquisada, mas nao invente empresas ou links de oportunidades. "
            "Se precisar estimar salario, seja conservador e realista para o Brasil: considere senioridade, regiao, "
            "modelo de contrato e porte da empresa; nao superestime por tendencias isoladas ou vagas fora da curva. "
            "No campo cursosRecomendados, indique cursos reais e clicaveis ja durante este relatorio final, alinhados "
            "a carreira e as competencias desejadas. Nao use cursos genericos nem URLs inventadas; se nao souber uma URL direta, escolha outro curso real. "
            "IMPORTANTE: inclua TODAS as vagasColetadas no campo oportunidadesDestaque, sem filtrar nem resumir. "
            "Retorne somente um objeto JSON final, sem markdown, sem comentarios e sem repetir a entrada. "
            "Nao devolva chaves extras como cargoPesquisado, filtros, vagasColetadas ou schemaObrigatorio no topo. "
            "As chaves finais precisam estar no topo do objeto retornado."
        )
        user_prompt = {
            "cargoPesquisado": cargo,
            "filtros": filtros,
            "totalVagasColetadas": len(vagas),
            "vagasColetadas": vagas_relevantes,
            "retorneExatamenteEsteObjeto": {
                "carreira": cargo,
                "insightIA": "texto com panorama do mercado e perfil de vagas",
                "mediaSalarial": "faixa mensal realista em reais baseada nas vagas; se nao houver salario, estimativa conservadora no formato R$ min a R$ max por mes",
                "moeda": "BR",
                "vagasAbertas": len(vagas),
                "crescimentoMensal": "percentual ou estimativa textual",
                "nivelDemanda": "Baixa | Media | Alta",
                "rankingMercado": "ranking ou posicao relativa",
                "crescimentoAnual": "percentual anual",
                "competenciasDesejadas": {
                    "habilidadesTecnicas": ["habilidade tecnica 1"],
                    "softSkills": ["soft skill 1"],
                },
                "certificacoesRecomendadas": [
                    {"empresa": "empresa certificadora", "nome": "nome da certificacao", "descricao": "descricao curta"}
                ],
                "oportunidadesDestaque": [
                    {
                        "titulo": "titulo real da vaga",
                        "empresa": "empresa real da vaga",
                        "localidade": "cidade ou remoto",
                        "modalidade": "Presencial | Remoto | Hibrido | Outro",
                        "salario": "salario se existir",
                        "tipoContrato": "CLT | PJ | Outro se existir",
                        "link": "link real da vaga",
                    }
                ],
                "cursosRecomendados": [
                    {
                        "plataforma": "plataforma real",
                        "nome": "nome real do curso",
                        "url": "https://url-direta-real-do-curso",
                        "preco": "Gratuito | Consultar | valor se existir",
                        "area": "area ou competencia principal",
                        "motivo": "por que este curso combina com a carreira e competencias desejadas",
                    }
                ],
            },
            "regrasCursosRecomendados": [
                "Retorne exatamente 3 cursos reais.",
                "Cada curso precisa ter plataforma, nome, url https, preco, area e motivo.",
                "Os cursos devem estar diretamente relacionados a carreira pesquisada e as competenciasDesejadas.",
                "Prefira paginas oficiais ou plataformas reconhecidas como Microsoft Learn, AWS Skill Builder, Google Cloud Skills Boost, Coursera, edX, Cisco Networking Academy, freeCodeCamp, DeepLearning.AI, Udacity, Alura, Rocketseat, SENAI, Sebrae, FGV ou Escola Virtual Gov.",
                "Nao retorne homepage generica se houver pagina direta do curso ou trilha.",
            ],
        }

        response = requests.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": json.dumps(user_prompt, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.timeout,
        )

        if response.status_code >= 400:
            raise CareerAnalysisError(
                f"Erro na API da OpenAI ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise CareerAnalysisError("Formato inesperado na resposta da API da OpenAI.") from exc
