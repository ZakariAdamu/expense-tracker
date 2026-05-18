import { LoaderIcon } from "lucide-react";

export function Spinner({
  className = "h-4 w-4 animate-spin",
}: {
  className?: string;
}) {
  return <LoaderIcon className={className} />;
}
