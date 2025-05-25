import type { SpaceId } from '../../../../../lib/layout/types';
import { SPACES } from '../../../../../lib/layout/types';

interface Props {
  currentSpace: SpaceId;
  onSpaceChange: (space: SpaceId) => void;
}

/**
 * Component for selecting which space to configure
 */
export default function SpaceSelector({ currentSpace, onSpaceChange }: Props) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-neutral-300">Configure layout for:</span>
      <select
        value={currentSpace}
        onChange={(e) => onSpaceChange(e.target.value as SpaceId)}
        className="w-full max-w-xs rounded border border-neutral-600 bg-neutral-800 p-1 text-sm"
        aria-label="Select space to configure"
      >
        {SPACES.map((space: SpaceId) => (
          <option key={space} value={space}>
            {space.charAt(0).toUpperCase() + space.slice(1)} Space
          </option>
        ))}
      </select>
    </div>
  );
}
