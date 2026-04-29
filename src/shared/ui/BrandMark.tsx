type BrandMarkProps = {
  label?: string;
};

export function BrandMark({ label }: BrandMarkProps) {
  return (
    <>
      <svg className="brand-spark" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0.8 9.3 5.3 13.8 6.6 9.3 7.9 8 12.4 6.7 7.9 2.2 6.6 6.7 5.3 8 0.8Z" />
        <path d="M2.8 10.2 3.4 12.1 5.2 12.7 3.4 13.3 2.8 15.2 2.2 13.3 0.4 12.7 2.2 12.1 2.8 10.2Z" />
        <path d="M13.2 10.3 13.7 11.8 15.2 12.3 13.7 12.8 13.2 14.3 12.7 12.8 11.2 12.3 12.7 11.8 13.2 10.3Z" />
      </svg>
      {label ? <span>{label}</span> : null}
    </>
  );
}
