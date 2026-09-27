// The heading block shared by the experience and education cards: a chrome
// title, then a line in body ink, then a small uppercase line under it.

const line: React.CSSProperties = {
  marginTop: 0,
  textAlign: "center",
  color: "var(--body-ink)",
};

export default function CardHeader({
  title,
  subtitle,
  meta,
  metaWeight = 500,
}: {
  title: string;
  subtitle: string;
  meta: string;
  metaWeight?: number;
}) {
  return (
    <>
      <h2
        style={{
          marginTop: 0,
          marginBottom: "8px",
          fontSize: "clamp(1.375rem, 2.2vw, 1.875rem)",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        <span className="relative inline-block">
          <span className="metal-text">{title}</span>
        </span>
      </h2>
      <h3
        className="font-[family-name:var(--font-elevated)]"
        style={{ ...line, marginBottom: "4px", fontSize: "clamp(0.95rem, 1.3vw, 1.125rem)", fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        {subtitle}
      </h3>
      <h4
        className="font-[family-name:var(--font-elevated)]"
        style={{
          ...line,
          marginBottom: "16px",
          fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)",
          fontWeight: metaWeight,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {meta}
      </h4>
    </>
  );
}
