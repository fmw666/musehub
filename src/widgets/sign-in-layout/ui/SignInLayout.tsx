import { BlurFade } from "@/shared/ui/motion";
import { SignInForm } from "@/features/auth/ui/SignInForm";

type SignInLayoutProps = {
  onAuthenticated?: () => void;
};

export function SignInLayout({ onAuthenticated }: SignInLayoutProps) {
  return (
    <section className="signin-stage" aria-label="Sign in to MuseHub">
      <div className="signin-card">
        <BlurFade delay={0.05} offsetY={6} blur={4}>
          <h1 className="signin-heading">Sign in or sign up</h1>
        </BlurFade>

        <BlurFade delay={0.15} offsetY={6} blur={3}>
          <SignInForm onAuthenticated={onAuthenticated} />
        </BlurFade>

        <BlurFade delay={0.3} offsetY={4} blur={2}>
          <p className="signin-legal">
            <span>By continuing, you agree to our</span>
            <br />
            <a href="/terms" className="signin-legal-link">
              Terms of Service
            </a>
            <span> and have read our </span>
            <a href="/privacy" className="signin-legal-link">
              Privacy Policy
            </a>
            <span>.</span>
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
