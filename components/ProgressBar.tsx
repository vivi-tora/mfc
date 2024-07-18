import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  current: number;
  total: number;
  currentItem: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, currentItem }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <Progress value={percentage} className="w-full" />
      <div className="flex justify-between mt-2">
        <span>{`${current} / ${total}`}</span>
        <span>{`${percentage}%`}</span>
      </div>
      <p className="text-center mt-2">Currently processing: {currentItem}</p>
    </div>
  );
};
