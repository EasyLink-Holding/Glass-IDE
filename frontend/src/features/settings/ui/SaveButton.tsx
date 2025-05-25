/**
 * Save button component for settings section
 */
interface Props {
  dirty: boolean;
  onSave: () => void;
}

export default function SaveButton({ dirty, onSave }: Props) {
  return (
    <button
      type="button"
      disabled={!dirty}
      onClick={onSave}
      className={`rounded px-3 py-1 text-sm ${
        dirty
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
      }`}
    >
      Save Changes
    </button>
  );
}
