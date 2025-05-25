import Toggle from '../../ui/Toggle';

/**
 * Customization settings section for UI preferences
 */
export default function CustomizationSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Customization</h2>
        <p className="text-neutral-400 text-sm">Personalize the appearance of Glass IDE</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="font-medium">Window Controls</h3>
        <Toggle
          settingKey="hideSystemControls"
          label="Hide system window controls"
          description="Hide the macOS-style window control buttons in the top-left corner"
        />
      </div>
    </div>
  );
}
