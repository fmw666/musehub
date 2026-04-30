import type { CSSProperties } from "react";

import { Button, Card } from "@heroui/react";

import { homeOrbitCards, type HomeOrbitCard } from "@/pages/home/model/orbit-cards";

type HomePageProps = {
  communityPath: string;
  description: string;
  isDissolving?: boolean;
  isInteractive?: boolean;
  onEnterCommunity: () => void;
  title: string;
};

const getOrbitCardStyle = (card: HomeOrbitCard) =>
  ({
    "--home-card-rotation": card.rotation,
    "--home-card-x": card.x,
    "--home-card-y": card.y,
  }) satisfies CSSProperties & Record<`--home-card-${"rotation" | "x" | "y"}`, string>;

const founderNote = {
  eyebrow: "Founder note",
  body: [
    <>
      Inspired by Variant and the visual rhythm I love at{" "}
      <a href="https://variany.com" target="_blank" rel="noreferrer">
        variany.com
      </a>
      , MuseHub is an open-source, non-commercial homage to Variant.
    </>,
    "Built for the AI era, it indexes excellent components so agents can understand effects, reuse ideas, and move faster. Please contribute; if your open-source work appears here and you would rather not have it shown, contact me and I will remove it promptly.",
  ],
} as const;

export function HomePage({
  communityPath,
  description,
  isDissolving = false,
  isInteractive = true,
  onEnterCommunity,
  title,
}: HomePageProps) {
  const handleEnterCommunity = () => {
    if (isInteractive && !isDissolving) {
      onEnterCommunity();
    }
  };

  return (
    <section
      className={`home-stage${isDissolving ? " is-dissolving" : ""}`}
      aria-label={`${title} home`}
    >
      <div className="home-orbit" aria-hidden="true">
        {homeOrbitCards.map((card) => (
          <div className="home-orbit-slot" key={card.label} style={getOrbitCardStyle(card)}>
            <div className={`home-orbit-card home-orbit-card-${card.tone}`}>
              <div className="home-orbit-card-surface">
                <span>{card.label}</span>
                <i />
                <b />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="home-hero">
        <p className="home-kicker">Collect. Remix. Ship.</p>
        <h1>{title}</h1>
        <p className="home-copy">{description}</p>
        <Card className="home-note">
          <Card.Content className="home-note-content">
            <span>{founderNote.eyebrow}</span>
            {founderNote.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </Card.Content>
        </Card>
        <Button
          className="home-cta"
          isDisabled={!isInteractive || isDissolving}
          type="button"
          variant="bordered"
          aria-label={`Enter ${title} community`}
          onPress={handleEnterCommunity}
        >
          Start creating
        </Button>
        <span className="home-path">{communityPath}</span>
      </div>
    </section>
  );
}
