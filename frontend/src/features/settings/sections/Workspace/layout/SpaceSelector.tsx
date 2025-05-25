import Select, { type SelectOption } from '../../../../../components/ui/buttons/Select';
import type { SpaceId } from '../../../../../lib/layout/types';
import { SPACES, isSpaceId } from '../../../../../lib/layout/types';

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
      <Select
        value={currentSpace}
        onChange={(v) => {
          if (isSpaceId(v)) {
            onSpaceChange(v);
          }
        }}
        options={SPACES.map(
          (s): SelectOption => ({
            value: s,
            label: `${s.charAt(0).toUpperCase()}${s.slice(1)} Space`,
          })
        )}
        aria-label="Select space to configure"
      />
    </div>
  );
}
