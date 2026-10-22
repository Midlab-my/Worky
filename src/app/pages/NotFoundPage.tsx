import { useEffect } from 'react';
import { Link } from 'react-router';
import FuzzyText from '../components/FuzzyText';
import { ArrowLeft } from 'lucide-react';
import './NotFoundPage.css';

export function NotFoundPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Worky: Página não encontrada';
    return () => { document.title = previousTitle; };
  }, []);
  return <main className="not-found-page">
    <section className="not-found-card" aria-labelledby="not-found-title">
      <Link to="/" className="not-found-brand" aria-label="Worky, página inicial">Worky</Link>
      <h1 id="not-found-title" aria-label="Página não encontrada">
        <span className="not-found-fuzzy" aria-hidden="true">
          {['Página não', 'encontrada'].map(line => (
            <FuzzyText key={line} fontSize="clamp(1.6rem, 5vw, 2rem)" fontWeight={800}
              color="#172033" baseIntensity={0.2} hoverIntensity={0.5} fuzzRange={30}
              trigger="hover" direction="horizontal" sliceSize={1} fps={60}
              intro introDuration={1400} enableHover colorSplit={0}>
              {line}
            </FuzzyText>
          ))}
        </span>
      </h1>
      <Link className="not-found-home" to="/" replace><ArrowLeft size={17} aria-hidden="true" />Voltar ao início</Link>
    </section>
  </main>;
}
