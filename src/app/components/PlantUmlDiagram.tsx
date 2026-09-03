import { encode } from "plantuml-encoder";

type PlantUmlDiagramProps = {
  source: string;
  title: string;
};

const PLANTUML_SVG_ENDPOINT = "https://www.plantuml.com/plantuml/svg";

export function PlantUmlDiagram({ source, title }: PlantUmlDiagramProps) {
  const src = `${PLANTUML_SVG_ENDPOINT}/${encode(source)}`;

  return <img className="sb-diagram-img" src={src} alt={title} loading="lazy" />;
}
