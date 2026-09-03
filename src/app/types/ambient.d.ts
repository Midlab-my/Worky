declare module "plantuml-encoder" {
  export function encode(source: string): string;
  export function decode(encoded: string): string;
}

declare module "*.wsd?raw" {
  const content: string;
  export default content;
}
