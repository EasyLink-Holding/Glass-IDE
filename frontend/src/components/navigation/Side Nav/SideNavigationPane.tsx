import {
  Book,
  Buildings,
  Code,
  Database,
  GitBranch,
  House,
  RocketLaunch,
  Storefront,
  UsersThree,
} from 'phosphor-react';
import type { ComponentType } from 'react';
/**
 * Left-hand navigation bar (outside main container).
 */
import { useWorkspace } from '../../../contexts/ViewContext';
import type { SpaceId } from '../../../lib/layout/types';

interface Item {
  id: SpaceId;
  icon: ComponentType<{ size?: number; weight?: 'fill' | 'regular' }>;
  tip: string;
}

// Add 'home' first
const items: Item[] = [
  { id: 'home', icon: House, tip: 'Home' },
  { id: 'editor', icon: Code, tip: 'Editor' },
  { id: 'versionControl', icon: GitBranch, tip: 'Version Control' },
  { id: 'database', icon: Database, tip: 'Database' },
  { id: 'docs', icon: Book, tip: 'Documentation' },
  { id: 'deployment', icon: RocketLaunch, tip: 'Deployment' },
  { id: 'marketplace', icon: Storefront, tip: 'Marketplace' },
  { id: 'teams', icon: UsersThree, tip: 'Teams' },
  { id: 'organization', icon: Buildings, tip: 'Organization' },
];

export default function SideNavigationPane() {
  const { space, setSpace, setView } = useWorkspace();

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-16 shrink-0 flex-col items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800/60 py-3 px-2 backdrop-blur"
    >
      {items.map(({ id, icon: Icon, tip }) => (
        <button
          key={id}
          type="button"
          title={tip}
          aria-label={tip}
          data-testid={`nav-${id}`}
          onClick={() => {
            setSpace(id);
            setView(id);
          }}
          className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 ${space === id ? 'bg-neutral-700 text-white' : 'text-neutral-200 hover:text-neutral-100'}`}
        >
          <Icon size={20} weight={space === id ? 'fill' : 'regular'} />
        </button>
      ))}
    </nav>
  );
}
