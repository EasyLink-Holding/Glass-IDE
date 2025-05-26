import { FolderSimplePlus } from 'phosphor-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/buttons/Button';
import { memoIcon } from '../../lib/ui/memoIcon';
import {
  closeWorkspace,
  openWorkspace,
  useWorkspaceRoot,
} from '../../lib/workspace/workspaceStore';

const FolderIcon = memoIcon(FolderSimplePlus);

export default function OpenWorkspaceCard() {
  const root = useWorkspaceRoot();
  return (
    <Card className="flex flex-col items-center gap-4 text-center text-neutral-200">
      <FolderIcon size={48} weight="regular" className="text-neutral-400" />
      {root ? (
        <>
          <h2 className="text-lg font-semibold">Workspace opened</h2>
          <p className="max-w-xs break-all font-mono text-sm text-green-400">{root}</p>
          <div className="flex gap-2">
            <Button
              label="Switch Folder…"
              onClick={() => {
                void openWorkspace();
              }}
            />
            <Button
              label="Close Workspace"
              className="bg-neutral-600 hover:bg-neutral-500"
              onClick={() => {
                closeWorkspace();
              }}
            />
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Open a workspace</h2>
          <p className="max-w-xs text-sm text-neutral-400">
            Choose a folder on your computer to start editing. We&#39;ll remember your choice next
            time.
          </p>
          <Button
            label="Open Folder…"
            onClick={() => {
              void openWorkspace();
            }}
          />
        </>
      )}
    </Card>
  );
}
