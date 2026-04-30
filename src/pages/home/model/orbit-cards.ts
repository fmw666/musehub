export type HomeOrbitCard = {
  label: string;
  tone: "ink" | "forest" | "tangerine" | "paper";
  rotation: string;
  x: string;
  y: string;
};

export const homeOrbitCards = [
  {
    label: "Capture",
    rotation: "-10deg",
    tone: "ink",
    x: "-386px",
    y: "-204px",
  },
  {
    label: "Remix",
    rotation: "8deg",
    tone: "forest",
    x: "368px",
    y: "-214px",
  },
  {
    label: "Preview",
    rotation: "-7deg",
    tone: "tangerine",
    x: "-374px",
    y: "204px",
  },
  {
    label: "Ship",
    rotation: "11deg",
    tone: "paper",
    x: "386px",
    y: "196px",
  },
  {
    label: "Trace",
    rotation: "-4deg",
    tone: "paper",
    x: "0px",
    y: "348px",
  },
] as const satisfies readonly HomeOrbitCard[];
