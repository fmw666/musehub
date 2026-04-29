import type { CSSProperties } from "react";

import { Button } from "@heroui/react";

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
          <div
            className={`home-orbit-card home-orbit-card-${card.tone}`}
            key={card.label}
            style={getOrbitCardStyle(card)}
          >
            <span>{card.label}</span>
            <i />
            <b />
          </div>
        ))}
      </div>

      <div className="home-hero">
        <p className="home-kicker">Collect. Remix. Ship.</p>
        <h1>{title}</h1>
        <p className="home-copy">{description}</p>
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
