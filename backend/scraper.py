import asyncio
import json
import os
import random
import re
from collections import defaultdict

import httpx
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

# Expande abreviações comuns para slugs do Vagas.com.br
_TERM_MAP = {
    # Tech
    "dev": "desenvolvedor",
    "devs": "desenvolvedor",
    "ux": "ux-designer",
    "ui": "ui-designer",
    "qa": "analista-de-qualidade",
    "ti": "tecnologia-da-informacao",
    "bi": "business-intelligence",
    "ml": "machine-learning",
    "ai": "inteligencia-artificial",
    "ia": "inteligencia-artificial",
    "po": "product-owner",
    "pm": "product-manager",
    "cs": "customer-success",
    "ds": "data-science",
    "de": "engenharia-de-dados",
    # Negócios
    "rh": "recursos-humanos",
    "adm": "administracao",
    "mkt": "marketing",
    "fin": "financeiro",
    "cont": "contabilidade",
    # Jurídico
    "juridico": "advogado",
    "juridica": "advogado",
    "direito": "advogado",
    # Saúde
    "enf": "enfermagem",
    "med": "medico",
    # Comum
    "suporte": "analista-de-suporte",
    "infra": "infraestrutura",
    "dados": "analista-de-dados",
    "design": "designer",
}


def _normalize_query(query: str) -> str:
    words = query.lower().strip().split()
    expanded = [_TERM_MAP.get(w, w) for w in words]
    return " ".join(expanded)


class JobScraper:
    def _headers(self):
        return {**BASE_HEADERS, "User-Agent": random.choice(USER_AGENTS)}

    async def scrape_vagas_com_br(self, client: httpx.AsyncClient, query: str) -> list:
        normalized = _normalize_query(query)
        slug = re.sub(r"[^a-z0-9 ]", " ", normalized).strip()
        slug = re.sub(r"\s+", "-", slug)
        url = f"https://www.vagas.com.br/vagas-de-{slug}"
        # Palavras-chave para filtrar vagas relevantes
        keywords = [w for w in query.lower().split() if len(w) > 2]
        keywords += [w for w in normalized.lower().split() if len(w) > 2]
        results = []
        try:
            r = await client.get(url, headers=self._headers(), timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            all_cards = soup.select("li.vaga")
            # Primeira passagem: com filtro de keyword
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
            # Fallback: slug específico o suficiente, aceita sem filtrar keyword
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
            print(f"✅ [VAGAS.COM.BR] {len(results)} vagas")
        except Exception as e:
            print(f"❌ [VAGAS.COM.BR] {str(e)[:60]}")
        return results

    async def scrape_indeed(self, client: httpx.AsyncClient, query: str, local: str, modelo: str) -> list:
        url = f"https://br.indeed.com/jobs?q={query.replace(' ', '+')}&l={local or 'Brasil'}"
        results = []
        try:
            r = await client.get(url, headers=self._headers(), timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            for v in soup.select(".job_seen_beacon, div[class*='job_seen']")[:6]:
                title_el = v.select_one("h2.jobTitle, h2[class*='title']")
                if not title_el:
                    continue
                t_val = title_el.get_text(strip=True)
                comp_el = v.select_one("span[data-testid='company-name']")
                e_val = comp_el.get_text(strip=True) if comp_el else "Confidencial"
                loc_el = v.select_one("div[data-testid='text-location']")
                l_val = loc_el.get_text(strip=True) if loc_el else "Brasil"
                link_el = v.select_one("h2.jobTitle a")
                href = link_el.get("href", "#") if link_el else "#"
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": l_val,
                    "modalidade": modelo or ("Remoto" if "remoto" in t_val.lower() else "Presencial"),
                    "link": f"https://br.indeed.com{href}" if href.startswith("/") else href,
                    "fonte": "Indeed",
                })
            print(f"✅ [INDEED] {len(results)} vagas")
        except Exception as e:
            print(f"❌ [INDEED] {str(e)[:60]}")
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
                if len(results) >= 7:
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

    async def run_scrape(self, filters={}):
        cargo = filters.get("cargo", "").strip()
        skills = filters.get("skills", "").strip()
        local = filters.get("local", "").strip()
        modelo = filters.get("modelo", "").strip()
        query = f"{cargo} {skills}".strip()
        query_expanded = _normalize_query(query)

        print(f"🚀 INICIANDO VARREDURA: '{query}' (expandido: '{query_expanded}')")

        async with httpx.AsyncClient(follow_redirects=True) as client:
            results = await asyncio.gather(
                self.scrape_vagas_com_br(client, query),
                self.scrape_linkedin(client, query_expanded, modelo),
                self.scrape_infojobs(client, query_expanded, modelo),
                return_exceptions=True,
            )

        by_source = defaultdict(list)
        for res in results:
            if isinstance(res, list):
                for item in res:
                    by_source[item["fonte"]].append(item)

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
