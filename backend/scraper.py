import asyncio
import json
import os
import random
import re
from collections import defaultdict

import httpx
import requests
from bs4 import BeautifulSoup

USER_AGENTS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

BASE_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = "gpt-4o-mini"


def _get_slug_from_ai(query: str) -> str:
    """Chama OpenAI para gerar o slug ideal para Vagas.com.br."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return re.sub(r"\s+", "-", re.sub(r"[^a-z0-9 ]", "", query.lower()).strip())

    prompt = (
        f'Dado o cargo ou busca "{query}", retorne APENAS o slug em português para buscar no vagas.com.br.\n'
        "Regras: lowercase, hífens entre palavras, sem acentos, sem artigos, sem preposições curtas. "
        "SEMPRE expanda abreviações para o nome completo.\n"
        'Exemplos: "dev" → "desenvolvedor", '
        '"dev junior" → "desenvolvedor-junior", '
        '"dev frontend" → "desenvolvedor-frontend", '
        '"juridico" → "advogado", '
        '"analista de dados" → "analista-de-dados", '
        '"contador" → "contador", '
        '"rh" → "recursos-humanos", '
        '"ux" → "ux-designer", '
        '"qa" → "analista-de-qualidade", '
        '"engenharia civil" → "engenheiro-civil", '
        '"enfermeira" → "enfermagem".\n'
        "Responda SOMENTE o slug, sem pontos, sem explicações."
    )

    try:
        resp = requests.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": OPENAI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 30,
                "temperature": 0,
            },
            timeout=10,
        )
        slug = resp.json()["choices"][0]["message"]["content"].strip().lower()
        slug = re.sub(r"[^a-z0-9-]", "", slug)
        return slug or re.sub(r"\s+", "-", query.lower())
    except Exception:
        return re.sub(r"\s+", "-", re.sub(r"[^a-z0-9 ]", "", query.lower()).strip())


class JobScraper:
    def _headers(self):
        return {**BASE_HEADERS, "User-Agent": random.choice(USER_AGENTS)}

    async def scrape_vagas_com_br(self, client: httpx.AsyncClient, query: str, slug: str) -> list:
        url = f"https://www.vagas.com.br/vagas-de-{slug}"
        results = []
        try:
            r = await client.get(url, headers=self._headers(), timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            all_cards = soup.select("li.vaga")

            keywords = [w for w in query.lower().split() if len(w) > 2]
            keywords += [w for w in slug.replace("-", " ").split() if len(w) > 2]

            # Passagem 1: com filtro de relevância
            for v in all_cards:
                if len(results) >= 15:
                    break
                link_el = v.select_one("a.link-detalhes-vaga")
                if not link_el:
                    continue
                t_val = (link_el.get("title") or link_el.get_text()).strip()
                if len(t_val) < 5:
                    continue
                if keywords and not any(k in t_val.lower() for k in keywords):
                    continue
                href = link_el.get("href", "#")
                comp_el = v.select_one(".emprVaga")
                e_val = comp_el.get_text(strip=True).split("\n")[0] if comp_el else "Confidencial"
                loc_el = v.select_one(".vaga-local")
                l_val = loc_el.get_text(strip=True).split("\n")[0] if loc_el else "Brasil"
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": l_val,
                    "modalidade": "Remoto" if "home office" in l_val.lower() or "remoto" in t_val.lower() else "Presencial",
                    "link": href if href.startswith("http") else f"https://www.vagas.com.br{href}",
                    "fonte": "Vagas.com.br",
                })

            # Passagem 2 (fallback): se retornou pouco, aceita sem filtrar
            if len(results) < 3:
                for v in all_cards:
                    if len(results) >= 15:
                        break
                    link_el = v.select_one("a.link-detalhes-vaga")
                    if not link_el:
                        continue
                    t_val = (link_el.get("title") or link_el.get_text()).strip()
                    if len(t_val) < 5 or any(r["titulo"] == t_val for r in results):
                        continue
                    href = link_el.get("href", "#")
                    comp_el = v.select_one(".emprVaga")
                    e_val = comp_el.get_text(strip=True).split("\n")[0] if comp_el else "Confidencial"
                    loc_el = v.select_one(".vaga-local")
                    l_val = loc_el.get_text(strip=True).split("\n")[0] if loc_el else "Brasil"
                    results.append({
                        "titulo": t_val,
                        "empresa": e_val,
                        "local": l_val,
                        "modalidade": "Remoto" if "home office" in l_val.lower() or "remoto" in t_val.lower() else "Presencial",
                        "link": href if href.startswith("http") else f"https://www.vagas.com.br{href}",
                        "fonte": "Vagas.com.br",
                    })

            print(f"✅ [VAGAS.COM.BR] {len(results)} vagas (slug: {slug})")
        except Exception as e:
            print(f"❌ [VAGAS.COM.BR] {str(e)[:60]}")
        return results

    async def scrape_linkedin(self, client: httpx.AsyncClient, query: str, modelo: str) -> list:
        encoded = query.replace(" ", "+")
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded}&location=Brasil&start=0&count=25"
        results = []
        try:
            r = await client.get(url, headers=self._headers(), timeout=20)
            if r.status_code != 200:
                print(f"❌ [LINKEDIN] status {r.status_code}")
                return results
            soup = BeautifulSoup(r.text, "html.parser")
            for card in soup.select("li"):
                if len(results) >= 15:
                    break
                title_el = card.select_one("h3")
                if not title_el:
                    continue
                t_val = title_el.get_text(strip=True)
                if not t_val or len(t_val) < 5:
                    continue
                company_el = card.select_one("h4")
                e_val = company_el.get_text(strip=True) if company_el else "LinkedIn"
                loc_el = card.select_one(".job-search-card__location")
                l_val = loc_el.get_text(strip=True) if loc_el else "Brasil"
                link_el = card.select_one("a")
                href = link_el.get("href", "#").split("?")[0] if link_el else "#"
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": l_val,
                    "modalidade": modelo or ("Remoto" if "remoto" in t_val.lower() or "remote" in t_val.lower() else "Presencial"),
                    "link": href,
                    "fonte": "LinkedIn",
                })
            print(f"✅ [LINKEDIN] {len(results)} vagas")
        except Exception as e:
            print(f"❌ [LINKEDIN] {str(e)[:60]}")
        return results

    async def scrape_infojobs(self, client: httpx.AsyncClient, query: str, modelo: str) -> list:
        url = f"https://www.infojobs.com.br/empregos.aspx?palavras={query.replace(' ', '+')}"
        results = []
        try:
            r = await client.get(url, headers=self._headers(), timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            query_parts = [w.lower() for w in query.split() if len(w) > 3]
            for v in soup.select(".js_vacancyLoad, div[class*='vacancy']"):
                if len(results) >= 10:
                    break
                title_el = v.select_one("h2")
                if not title_el:
                    continue
                t_val = title_el.get_text(strip=True)
                if query_parts and not any(p in t_val.lower() for p in query_parts):
                    continue
                comp_el = v.select_one(".v-company, [class*='company']")
                e_val = comp_el.get_text(strip=True) if comp_el else "Confidencial"
                link_el = v.select_one("a")
                href = link_el.get("href", "#") if link_el else "#"
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": "Brasil",
                    "modalidade": modelo or "Presencial",
                    "link": f"https://www.infojobs.com.br{href}" if href.startswith("/") else href,
                    "fonte": "InfoJobs",
                })
            print(f"✅ [INFOJOBS] {len(results)} vagas")
        except Exception as e:
            print(f"❌ [INFOJOBS] {str(e)[:60]}")
        return results

    async def scrape_remotive(self, client: httpx.AsyncClient, query: str) -> list:
        """API pública do Remotive — vagas remotas internacionais (ótimo para tech)."""
        encoded = re.sub(r"[^a-z0-9 ]", "", query.lower()).strip().replace(" ", "%20")
        if not encoded:
            return []
        url = f"https://remotive.com/api/remote-jobs?search={encoded}&limit=20"
        results = []
        keywords = [w for w in re.sub(r"[^a-z0-9 ]", "", query.lower()).split() if len(w) > 2]
        try:
            headers = {"Accept": "application/json", "User-Agent": random.choice(USER_AGENTS)}
            r = await client.get(url, headers=headers, timeout=20)
            if r.status_code != 200:
                return results
            jobs = r.json().get("jobs", [])
            for job in jobs:
                if len(results) >= 10:
                    break
                title = job.get("title", "").lower()
                tags = " ".join(job.get("tags") or []).lower()
                category = (job.get("category") or "").lower()
                job_text = f"{title} {tags} {category}"
                if keywords and not any(k in job_text for k in keywords):
                    continue
                results.append({
                    "titulo": job.get("title", ""),
                    "empresa": job.get("company_name", ""),
                    "local": "Remoto (Internacional)",
                    "modalidade": "Remoto",
                    "link": job.get("url", "https://remotive.com"),
                    "fonte": "Remotive",
                })
            print(f"✅ [REMOTIVE] {len(results)} vagas")
        except Exception as e:
            print(f"❌ [REMOTIVE] {str(e)[:60]}")
        return results

    async def run_scrape(self, filters={}):
        cargo = filters.get("cargo", "").strip()
        skills = filters.get("skills", "").strip()
        local = filters.get("local", "").strip()
        modelo = filters.get("modelo", "").strip()
        query = f"{cargo} {skills}".strip()

        print(f"🚀 INICIANDO VARREDURA: '{query}'")

        # IA gera o slug ideal para Vagas.com.br
        slug = await asyncio.to_thread(_get_slug_from_ai, query)
        print(f"🤖 Slug gerado pela IA: '{slug}'")

        async with httpx.AsyncClient(follow_redirects=True) as client:
            gather_results = await asyncio.gather(
                self.scrape_vagas_com_br(client, query, slug),
                self.scrape_linkedin(client, query, modelo),
                self.scrape_infojobs(client, query, modelo),
                self.scrape_remotive(client, cargo),
                return_exceptions=True,
            )

        by_source = defaultdict(list)
        for res in gather_results:
            if isinstance(res, list):
                for item in res:
                    by_source[item["fonte"]].append(item)

        # Round-robin entre fontes para diversificar
        final_results = []
        max_len = max((len(v) for v in by_source.values()), default=0)
        for i in range(max_len):
            for source_list in by_source.values():
                if i < len(source_list):
                    final_results.append(source_list[i])

        print(f"📊 TOTAL DE VAGAS: {len(final_results)}")

        base_path = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(base_path, "vagas.json"), "w", encoding="utf-8") as f:
            json.dump(final_results, f, ensure_ascii=False, indent=2)

        return final_results
