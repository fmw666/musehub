export type PageStatus = "planned" | "scaffolded" | "implemented";

export type PageContract = {
  id: string;
  path: string;
  label: string;
  title: string;
  description: string;
  status: PageStatus;
  ownerLayer: "pages";
};
