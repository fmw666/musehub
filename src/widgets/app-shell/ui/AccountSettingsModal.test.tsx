import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountSettingsModal } from "./AccountSettingsModal";

const profile = {
  name: "fmw19990718",
  email: "fmw19990718@gmail.com",
  plan: "Free",
} as const;

describe("AccountSettingsModal", () => {
  it("renders the three stagger sections with their a11y labels when open", () => {
    render(<AccountSettingsModal isOpen onOpenChange={() => undefined} profile={profile} />);

    expect(screen.getByRole("region", { name: "Profile picture preview" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByText(profile.email)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Toggle keep designs private" })).toBeInTheDocument();
  });

  it("renders nothing visible when closed", () => {
    render(
      <AccountSettingsModal isOpen={false} onOpenChange={() => undefined} profile={profile} />,
    );

    expect(
      screen.queryByRole("region", { name: "Profile picture preview" }),
    ).not.toBeInTheDocument();
  });
});
