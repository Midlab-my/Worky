import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import json
import os
import random

class JobScraper:
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        ]

    async def scrape_indeed(self, browser, query, local, modelo):
        print(f"🔍 [INDEED] Iniciando busca para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        page = await context.new_page()
        results = []
        try:
            url_query = f"{query} {modelo}".strip()
            url = f"https://br.indeed.com/jobs?q={url_query}&l={local if local else 'Brasil'}"
            # Indeed as vezes carrega lento ou apresenta captcha se for rápido demais
            await page.goto(url, timeout=45000, wait_until="domcontentloaded")
            
            # Tenta encontrar a lista de vagas com seletor flexível
            try:
                await page.wait_for_selector(".job_seen_beacon, .jobsearch-ResultsList, #mosaic-provider-jobcards", timeout=20000)
            except:
                print("⚠️ [INDEED] Atraso na carga. Rentando ler DOM direto.")

            vagas_els = await page.query_selector_all(".job_seen_beacon, div[class*='job_seen']")
            for v in vagas_els[:6]:
                title_el = await v.query_selector("h2.jobTitle, h2[class*='title']")
                if not title_el: continue
                
                t_val = (await title_el.inner_text()).strip()
                e_val = (await (await v.query_selector("span[data-testid='company-name']")).inner_text()).strip() if await v.query_selector("span[data-testid='company-name']") else "Confidencial"
                l_val = (await (await v.query_selector("div[data-testid='text-location']")).inner_text()).strip() if await v.query_selector("div[data-testid='text-location']") else "Brasil"
                
                link_el = await v.query_selector("h2.jobTitle a")
                href = await link_el.get_attribute("href") if link_el else "#"
                
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": l_val,
                    "modalidade": modelo if modelo else ("Remoto" if "remoto" in t_val.lower() or "home" in t_val.lower() else "Presencial"),
                    "link": f"https://br.indeed.com{href}" if href.startswith("/") else href,
                    "fonte": "Indeed"
                })
            print(f"✅ [INDEED] Sucesso: {len(results)} vagas.")
        except Exception as e:
            print(f"❌ [INDEED] Erro: {str(e)[:50]}")
        finally: await page.close()
        return results

    async def scrape_gupy(self, browser, query, modelo):
        print(f"🔍 [GUPY] Iniciando busca humana para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        results = []
        try:
            await page.goto("https://portal.gupy.io/", timeout=50000, wait_until="networkidle")
            
            # Aceita Cookies com força
            for selector in ["button:has-text('Aceitar')", "button:has-text('Cookies')", "#didomi-notice-agree-button"]:
                try: 
                    btn = await page.query_selector(selector)
                    if btn: await btn.click(); await asyncio.sleep(1)
                except: pass
            
            # Preenche a busca
            await page.wait_for_selector("input[placeholder*='vaga']", timeout=15000)
            await page.click("input[placeholder*='vaga']")
            await page.fill("input[placeholder*='vaga']", query)
            await asyncio.sleep(1)
            
            # Tenta clicar no botão explicitamente buscando pelo texto
            search_btns = await page.query_selector_all("button")
            found_btn = False
            for btn in search_btns:
                t = await btn.inner_text()
                if "buscar" in t.lower():
                    await btn.hover()
                    await btn.click()
                    found_btn = True
                    break
            
            if not found_btn:
                await page.keyboard.press("Enter")

            # Aguarda a transição de página ou carregamento de cards
            await page.wait_for_selector("a[href*='/job/'], [data-testid*='card']", timeout=30000)
            await asyncio.sleep(5)
            
            vagas = await page.query_selector_all("a[href*='/job/'], [data-testid*='card']")
            for v in vagas[:10]:
                try:
                    text = (await v.inner_text()).strip()
                    href = await v.get_attribute("href")
                    if not text or not href: continue
                    
                    # Filtra lixo
                    if len(text) < 25 or "entrar" in text.lower(): continue

                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    results.append({
                        "titulo": lines[0], 
                        "empresa": lines[1] if len(lines) > 1 else "Empresa Gupy", 
                        "local": "Consulte na Gupy", 
                        "modalidade": modelo or ("Remoto" if "remoto" in text.lower() else "Presencial"),
                        "link": f"https://portal.gupy.io{href}" if href.startswith("/") else href, 
                        "fonte": "Gupy"
                    })
                except: continue
            
            print(f"✅ [GUPY] Sucesso: {len(results)} vagas.")
        except Exception: 
            print(f"⚠️ [GUPY] Falha na busca (Timeout ou redirecionamento).")
        finally: 
            await page.close()
        return results

    async def scrape_catho(self, browser, query, modelo):
        print(f"🔍 [CATHO] Iniciando busca para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        page = await context.new_page()
        results = []
        try:
            url = f"https://www.catho.com.br/vagas/?q={query.replace(' ', '%20')}"
            await page.goto(url, timeout=35000)
            await page.wait_for_selector("article", timeout=15000)
            
            vagas = await page.query_selector_all("article")
            for v in vagas[:5]:
                title_el = await v.query_selector("h2 a")
                company_el = await v.query_selector("p")
                
                if not title_el: continue
                
                t_val = (await title_el.inner_text()).strip()
                e_val = (await company_el.inner_text()).strip() if company_el else "Confidencial"
                href = await title_el.get_attribute("href")
                
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": "Brasil",
                    "modalidade": modelo if modelo else "Check Catho",
                    "link": href if href.startswith("http") else f"https://www.catho.com.br{href}",
                    "fonte": "Catho"
                })
            print(f"✅ [CATHO] Sucesso: {len(results)} vagas.")
        except Exception:
            print(f"❌ [CATHO] Timeout ou Bloqueio.")
        finally: await page.close()
        return results

    async def scrape_linkedin_public(self, browser, query, modelo):
        print(f"🔍 [LINKEDIN] Iniciando busca para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        page = await context.new_page()
        results = []
        try:
            url = f"https://www.linkedin.com/jobs/search?keywords={query.replace(' ', '%20')}&location=Brasil"
            # LinkedIn é difícil, tentamos ir mais devagar
            await page.goto(url, timeout=40000)
            await page.wait_for_selector(".base-card", timeout=15000)
            
            vagas = await page.query_selector_all(".base-card")
            for v in vagas[:6]:
                title_el = await v.query_selector("h3")
                company_el = await v.query_selector("h4")
                
                if not title_el: continue
                
                t_val = (await title_el.inner_text()).strip()
                e_val = (await company_el.inner_text()).strip() if company_el else "LinkedIn"
                link_el = await v.query_selector("a.base-card__full-link")
                href = await link_el.get_attribute("href") if link_el else "#"
                
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": "Consulte no LinkedIn",
                    "modalidade": modelo if modelo else ("Remoto" if "remoto" in t_val.lower() or "remote" in t_val.lower() else "Presencial"),
                    "link": href,
                    "fonte": "LinkedIn"
                })
            print(f"✅ [LINKEDIN] Sucesso: {len(results)} vagas.")
        except Exception:
            print(f"❌ [LINKEDIN] Instabilidade ou Bloqueio.")
        finally: await page.close()
        return results

    async def scrape_infojobs(self, browser, query, modelo):
        print(f"🔍 [INFOJOBS] Iniciando busca para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()
        results = []
        try:
            await page.goto("https://www.infojobs.com.br", timeout=35000)
            
            # Click Aceitar cookies
            try:
                await page.click("#didomi-notice-agree-button", timeout=6000)
            except: pass
            
            # Preenche busca com seletores mais robustos
            search_input = await page.query_selector("input[placeholder*='Cargo'], input[id*='search'], input[name*='palavra']")
            if search_input:
                await search_input.fill(query)
                await asyncio.sleep(1)
                await search_input.press("Enter")
            else:
                # Fallback URL direta se o input falhar
                await page.goto(f"https://www.infojobs.com.br/empregos.aspx?palavras={query.replace(' ', '+')}", timeout=30000)
            
            await page.wait_for_selector(".js_vacancyLoad, .card, div[class*='vacancy']", timeout=20000)
            vagas = await page.query_selector_all(".js_vacancyLoad, div[class*='vacancy']")
            
            query_parts = [w.lower() for w in query.split() if len(w) > 3]
            
            for v in vagas:
                if len(results) >= 7: break
                title_el = await v.query_selector("h2")
                if not title_el: continue
                t_val = (await title_el.inner_text()).strip()
                
                # Filtro: aceita se tiver pelo menos uma parte da query ou se for muito similar
                if query_parts and not any(part in t_val.lower() for part in query_parts):
                    continue
                
                company_el = await v.query_selector(".v-company, [class*='company']")
                e_val = (await company_el.inner_text()).strip() if company_el else "Confidencial"
                
                # HEURÍSTICA DE LOCALIZAÇÃO: Procura por padrões "Cidade - UF" no texto do card
                v_text = await v.inner_text()
                l_val = "Brasil"
                import re
                # Busca todos os matches e pega o último (localização costuma ser o final do card)
                geo_matches = re.findall(r"([A-Za-zÀ-ÿ\s]+)\s*-\s*([A-Z]{2})", v_text)
                if geo_matches:
                    l_val = f"{geo_matches[-1][0].strip()} - {geo_matches[-1][1]}"
                
                link_el = await v.query_selector("a")
                href = await link_el.get_attribute("href") if link_el else "#"
                full_link = f"https://www.infojobs.com.br{href}" if href.startswith("/") else href
                
                results.append({
                    "titulo": t_val,
                    "empresa": e_val,
                    "local": l_val,
                    "modalidade": modelo if modelo else ("Híbrido" if "hibrido" in t_val.lower() else "Presencial"),
                    "link": full_link,
                    "fonte": "InfoJobs"
                })
            print(f"✅ [INFOJOBS] Sucesso: {len(results)} vagas.")
        except Exception as e:
            print(f"❌ [INFOJOBS] Falha: {str(e)[:40]}...")
        finally: await page.close()
        return results

    async def scrape_jooble(self, browser, query, modelo):
        print(f"🔍 [JOOBLE] Agregador para: {query}")
        context = await browser.new_context(user_agent=random.choice(self.user_agents))
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        results = []
        try:
            url = f"https://br.jooble.org/SearchResult?ukw={query.replace(' ', '%20')}"
            await page.goto(url, timeout=45000, wait_until="domcontentloaded")
            
            # Jooble é dinâmico, esperamos um pouco
            await asyncio.sleep(5)
            
            # Tenta fechar algum modal de localização ou inscrição que trava a tela
            try:
                close_btn = await page.query_selector("button[class*='close'], [class*='modal'] button")
                if close_btn: await close_btn.click()
            except: pass

            vagas = await page.query_selector_all("article, [class*='vacancy'], [data-testid='vacancy-card'], [class*='JobCard']")
            
            if not vagas:
                # Se não encontrar nada, pode ser bloqueio ou seletor novo
                content = await page.content()
                if "human" in content.lower() or "blocked" in content.lower() or "robot" in content.lower():
                    print("❌ [JOOBLE] Detecção de bot ativa (Cloudflare/WAF).")
                    return []

            for v in vagas[:7]:
                try:
                    title_el = await v.query_selector("h2, [class*='title'], a[href*='/desc/']")
                    if not title_el: continue
                    
                    t_val = (await title_el.inner_text()).strip()
                    link_el = title_el if await title_el.get_attribute("href") else await v.query_selector("a")
                    href = await link_el.get_attribute("href") if link_el else "#"
                    
                    results.append({
                        "titulo": t_val.split("\n")[0],
                        "empresa": "Via Jooble",
                        "local": "Brasil",
                        "modalidade": "Consultar",
                        "link": f"https://br.jooble.org{href}" if href.startswith("/") else href,
                        "fonte": "Jooble"
                    })
                except: continue
                
            print(f"✅ [JOOBLE] Sucesso: {len(results)} vagas.")
        except Exception as e:
            print(f"❌ [JOOBLE] Erro: {str(e)[:50]}")
        finally: await page.close()
        return results

    async def _scrape_vagas_com_br(self, browser, query):
        """Scraper direto para Vagas.com.br — seletores confirmados via inspeção do HTML real."""
        import re
        context = await browser.new_context(
            user_agent=random.choice(self.user_agents),
            locale="pt-BR", timezone_id="America/Sao_Paulo"
        )
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        results = []
        try:
            # Gera slug amigável: "UX/UI Designer" → "ux-ui-designer"
            slug = re.sub(r'[^a-z0-9 ]', ' ', query.lower()).strip()
            slug = re.sub(r'\s+', '-', slug)
            url = f"https://www.vagas.com.br/vagas-de-{slug}"
            await page.goto(url, timeout=45000, wait_until="domcontentloaded")

            # Aguarda os cards (o HTML é server-side, não precisa de JS extra)
            try:
                await page.wait_for_selector("li.vaga", timeout=15000)
            except:
                pass
            await asyncio.sleep(1)

            vagas_els = await page.query_selector_all("li.vaga")
            print(f"  └─ [Vagas.com.br] {len(vagas_els)} cards encontrados")

            for v in vagas_els[:7]:
                try:
                    # Título: atributo title do link principal (confirmado via HTML)
                    title_el = await v.query_selector("a.link-detalhes-vaga")
                    if not title_el: continue

                    t_val = await title_el.get_attribute("title") or ""
                    t_val = t_val.strip()
                    if not t_val:
                        t_val = (await title_el.inner_text()).strip().split('\n')[0]
                    if len(t_val) < 5: continue

                    href = await title_el.get_attribute("href") or "#"

                    # Empresa: classe emprVaga (confirmada)
                    comp_el = await v.query_selector(".emprVaga")
                    e_val = (await comp_el.inner_text()).strip().split('\n')[0] if comp_el else "Confidencial"

                    # Local: classe vaga-local (confirmada)
                    loc_el = await v.query_selector(".vaga-local")
                    l_raw = (await loc_el.inner_text()).strip() if loc_el else "Brasil"
                    # Pega só a primeira linha (ex: "São Paulo / SP")
                    l_val = l_raw.split('\n')[0].strip()

                    full_link = href if href.startswith("http") else f"https://www.vagas.com.br{href}"
                    text_lower = (t_val + " " + l_val).lower()

                    results.append({
                        "titulo": t_val,
                        "empresa": e_val,
                        "local": l_val,
                        "modalidade": "Remoto" if "home office" in l_val.lower() or "remoto" in text_lower
                                      else ("Híbrido" if "hibr" in text_lower else "Presencial"),
                        "link": full_link,
                        "fonte": "Global"
                    })
                except:
                    continue
        except Exception as e:
            print(f"  └─ [Vagas.com.br] Falhou: {str(e)[:60]}")
        finally:
            await page.close()
        return results

    async def _scrape_trampos(self, browser, query):
        """Scraper direto para Trampos.co (vagas de tech/startup no Brasil)"""
        context = await browser.new_context(
            user_agent=random.choice(self.user_agents),
            locale="pt-BR", timezone_id="America/Sao_Paulo"
        )
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        results = []
        try:
            encoded = query.replace(' ', '+')
            url = f"https://trampos.co/oportunidades/?busca={encoded}"
            await page.goto(url, timeout=40000, wait_until="domcontentloaded")
            try:
                await page.wait_for_selector("article, li[class*='opportunity'], .listing-card", timeout=12000)
            except:
                pass
            await asyncio.sleep(2)

            vagas_els = await page.query_selector_all(
                "article, li[class*='opportunity'], .listing-card, [class*='job-listing'], ul.listings li"
            )
            print(f"  └─ [Trampos.co] {len(vagas_els)} cards encontrados")

            for v in vagas_els[:5]:
                try:
                    title_el = None
                    for sel in ["h2 a", "h3 a", "a[class*='title']", ".opportunity-name a", "a"]:
                        title_el = await v.query_selector(sel)
                        if title_el: break
                    if not title_el: continue

                    t_val = (await title_el.inner_text()).strip().split('\n')[0]
                    if len(t_val) < 5: continue
                    href = await title_el.get_attribute("href") or "#"

                    comp_el = await v.query_selector("[class*='company'], [class*='empresa'], h4, p")
                    e_val = (await comp_el.inner_text()).strip().split('\n')[0] if comp_el else "Trampos.co"

                    full_link = href if href.startswith("http") else f"https://trampos.co{href}"

                    results.append({
                        "titulo": t_val,
                        "empresa": e_val,
                        "local": "Brasil",
                        "modalidade": "Remoto" if "remoto" in t_val.lower() else "Consultar",
                        "link": full_link,
                        "fonte": "Global"
                    })
                except:
                    continue
        except Exception as e:
            print(f"  └─ [Trampos.co] Falhou: {str(e)[:60]}")
        finally:
            await page.close()
        return results

    async def scrape_google_global(self, browser, query):
        """
        GLOBAL: scrapa portais brasileiros diretamente (sem motor de busca).
        Primário: Vagas.com.br | Fallback: Trampos.co
        """
        print(f"🌍 [GLOBAL] Varredura direta nos portais BR para: {query}")
        results = []

        # --- Alvo 1: Vagas.com.br ---
        vagas_results = await self._scrape_vagas_com_br(browser, query)
        results.extend(vagas_results)
        print(f"  └─ Vagas.com.br: {len(vagas_results)} vagas coletadas")

        # --- Alvo 2: Trampos.co (complementa se precisar de mais) ---
        if len(results) < 3:
            trampos_results = await self._scrape_trampos(browser, query)
            results.extend(trampos_results)
            print(f"  └─ Trampos.co: {len(trampos_results)} vagas coletadas")

        print(f"✅ [GLOBAL] Sucesso: {len(results)} resultados brasileiros.")
        return results

    async def run_scrape(self, filters={}):
        cargo = filters.get("cargo", "").strip()
        skills = filters.get("skills", "").strip()
        local = filters.get("local", "").strip()
        modelo = filters.get("modelo", "").strip()
        
        query = f"{cargo} {skills}".strip()
        print(f"🚀 INICIANDO MEGA-VARREDURA: '{query}' ({modelo})")
        
        # Limita concorrência (2 tasks por vez para estabilidade)
        sem = asyncio.Semaphore(2) 
        
        async def sem_task(task_func):
            async with sem:
                await asyncio.sleep(random.uniform(1.0, 3.0))
                return await task_func

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
            )
            
            tasks = [
                sem_task(self.scrape_indeed(browser, query, local, modelo)),
                sem_task(self.scrape_gupy(browser, query, modelo)),
                sem_task(self.scrape_linkedin_public(browser, query, modelo)),
                sem_task(self.scrape_infojobs(browser, query, modelo)),
                sem_task(self.scrape_jooble(browser, query, modelo)),
                sem_task(self.scrape_google_global(browser, query))
            ]
            
            all_source_results = await asyncio.gather(*tasks)
            
            # Intercalação round-robin aprimorada para diversidade
            final_results = []
            max_len = max(len(res) for res in all_source_results) if any(all_source_results) else 0
            
            for i in range(max_len):
                for source_list in all_source_results:
                    if i < len(source_list):
                        final_results.append(source_list[i])
            
            # Agora retorna apenas o que foi coletado, sem placeholders
            print(f"📊 TOTAL DE VAGAS ENCONTRADAS: {len(final_results)}")
            await browser.close()
            
            # Cache local (ajusta o path para ser relativo ao diretório do arquivo)
            base_path = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(base_path, "vagas.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(final_results, f, ensure_ascii=False, indent=2)
            
            return final_results
