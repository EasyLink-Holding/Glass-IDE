import { useState } from 'react';
import { useSettings } from '../../../../lib/settings/store';

export default function GeneralSection() {
  const resetAllData = useSettings((s) => s.resetAllData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  function handleReset() {
    resetAllData();
    setShowConfirmation(false);
    setResetComplete(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setResetComplete(false);
    }, 3000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-neutral-400 text-sm">(General preferences coming soon…)</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="font-medium">Data Management</h3>

        {!showConfirmation && !resetComplete && (
          <button
            type="button"
            onClick={() => setShowConfirmation(true)}
            className="px-3 py-2 bg-red-900/50 text-red-200 rounded text-sm hover:bg-red-800/60"
          >
            Reset All Data
          </button>
        )}

        {showConfirmation && (
          <div className="space-y-2">
            <p className="text-sm text-red-300">
              Are you sure? This will reset all settings and cache.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 bg-red-700 text-white rounded text-sm"
              >
                Yes, Reset Everything
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1 bg-neutral-700 text-neutral-200 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetComplete && (
          <p className="text-sm text-green-300">All data has been reset successfully!</p>
        )}
      </div>
    </div>
  );
}
