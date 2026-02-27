interface AuthHeroIllustrationProps {
  className?: string;
}

export function AuthHeroIllustration({ className }: AuthHeroIllustrationProps) {
  return (
    <div
      className={className}
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.24), transparent 42%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.22), transparent 45%), linear-gradient(140deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
      }}
    />
  );
}
