export type HomeOrbitCard = {
  label: string;
  tone: "ink" | "forest" | "tangerine" | "paper";
  rotation: string;
  x: string;
  y: string;
};

export const homeOrbitCards = [
  { label: "Capture", tone: "ink", rotation: "-10deg", x: "-210px", y: "-118px" },
  { label: "Remix", tone: "forest", rotation: "8deg", x: "168px", y: "-138px" },
  { label: "Preview", tone: "tangerine", rotation: "-7deg", x: "-246px", y: "116px" },
  { label: "Ship", tone: "paper", rotation: "11deg", x: "206px", y: "116px" },
  { label: "Trace", tone: "paper", rotation: "-4deg", x: "0px", y: "190px" },
] as const satisfies readonly HomeOrbitCard[];
