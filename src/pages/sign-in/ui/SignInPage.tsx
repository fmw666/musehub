import { SignInLayout } from "@/widgets/sign-in-layout/ui/SignInLayout";

type SignInPageProps = {
  onAuthenticated?: () => void;
};

export function SignInPage({ onAuthenticated }: SignInPageProps) {
  return <SignInLayout onAuthenticated={onAuthenticated} />;
}
