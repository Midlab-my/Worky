import type { ReactNode, ReactElement } from 'react';
export interface FuzzyTextProps {
  children: ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  colorSplit?: number;
  trigger?: 'hover' | 'always' | 'click';
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  sliceSize?: number;
  fps?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  transitionDuration?: number;
  intro?: boolean;
  introDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
}
export default function FuzzyText(props: FuzzyTextProps): ReactElement;
