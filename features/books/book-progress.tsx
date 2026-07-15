import { ProgressBar } from "@heroui/react/progress-bar";

interface BookProgressProps {
  readonly label: string;
  readonly progress: number;
}

export function BookProgress({ label, progress }: BookProgressProps) {
  return (
    <ProgressBar.Root
      aria-label={label}
      className="book-progress"
      maxValue={100}
      minValue={0}
      value={progress}
    >
      <div className="book-progress-label">
        <span>{label}</span>
        <ProgressBar.Output>{progress}%</ProgressBar.Output>
      </div>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar.Root>
  );
}
