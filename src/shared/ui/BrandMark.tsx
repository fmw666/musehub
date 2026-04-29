type BrandMarkProps = {
  label?: string;
};

export function BrandMark({ label }: BrandMarkProps) {
  return (
    <>
      <span className="brand-spark" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </>
  );
}
