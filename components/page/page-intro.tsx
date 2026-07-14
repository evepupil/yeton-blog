interface PageIntroProps {
  readonly description: string;
  readonly index: string;
  readonly title: string;
}

export function PageIntro({ description, index, title }: PageIntroProps) {
  return (
    <header className="page-intro">
      <span className="section-index">{index}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
