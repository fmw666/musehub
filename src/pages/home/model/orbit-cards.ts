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
    x: "-336px",
    y: "-168px",
  },
  {
    label: "Remix",
    rotation: "8deg",
    tone: "forest",
    x: "318px",
    y: "-176px",
  },
  {
    label: "Preview",
    rotation: "-7deg",
    tone: "tangerine",
    x: "-318px",
    y: "158px",
  },
  {
    label: "Ship",
    rotation: "11deg",
    tone: "paper",
    x: "332px",
    y: "146px",
  },
  {
    label: "Trace",
    rotation: "-4deg",
    tone: "paper",
    x: "0px",
    y: "286px",
  },
] as const satisfies readonly HomeOrbitCard[];
