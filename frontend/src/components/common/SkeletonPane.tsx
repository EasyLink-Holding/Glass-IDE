/**
 * Full-size subtle skeleton placeholder used while a pane’s chunk is loading.
 * Keeps layout stable and matches the skeleton already used in MainPane.
 */
export default function SkeletonPane() {
  return <div className="h-full w-full animate-pulse bg-neutral-800/40" />;
}
