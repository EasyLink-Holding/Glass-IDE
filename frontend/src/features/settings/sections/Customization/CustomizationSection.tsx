import Toggle from '../../ui/Toggle';

export default function CustomizationSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Customization</h2>
      <Toggle settingKey="hideSystemControls" label="Hide system window controls" />
    </div>
  );
}
