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
import { memo, useEffect, useMemo } from 'react';
/**
 * Left-hand navigation bar (outside main container).
 */
import { useWorkspace } from '../../../contexts/ViewContext';
import { useStableCallback } from '../../../hooks/useOptimizedHandlers';
import { usePrefetch } from '../../../hooks/usePrefetch';
import type { SpaceId } from '../../../lib/layout/types';
import { useAppearanceStore } from '../../../lib/settings/appearanceStore';
import { memoIcon } from '../../../lib/ui/memoIcon';
import NavButton from '../../ui/buttons/NavButton';

interface Item {
  id: SpaceId;
  icon: ComponentType<{ size?: number; weight?: 'fill' | 'regular' }>;
  tip: string;
}

// Add 'home' first
const items: Item[] = [
  { id: 'home', icon: memoIcon(House), tip: 'Home' },
  { id: 'editor', icon: memoIcon(Code), tip: 'Editor' },
  { id: 'versionControl', icon: memoIcon(GitBranch), tip: 'Version Control' },
  { id: 'database', icon: memoIcon(Database), tip: 'Database' },
  { id: 'docs', icon: memoIcon(Book), tip: 'Documentation' },
  { id: 'deployment', icon: memoIcon(RocketLaunch), tip: 'Deployment' },
  { id: 'marketplace', icon: memoIcon(Storefront), tip: 'Marketplace' },
  { id: 'teams', icon: memoIcon(UsersThree), tip: 'Teams' },
  { id: 'organization', icon: memoIcon(Buildings), tip: 'Organization' },
];

// Define a mapping from space ID to import function for better maintainability
// This eliminates the repetitive switch cases and makes it easier to add new spaces
const SPACE_IMPORTS: Record<SpaceId, () => Promise<{ default: React.ComponentType<unknown> }>> = {
  home: () => import('../../../app/home/HomePane'),
  // For the editor space, eagerly import side panes (Explorer & Chat) as well.
  editor: async () => {
    // Kick off all related chunk fetches in parallel, but ultimately
    // return the EditorPane module to satisfy the expected type.
    const [editor] = await Promise.all([
      import('../../../app/editor/EditorPane'),
      import('../../../app/editor/ExplorerPane'),
      import('../../../app/editor/ChatPane'),
    ]);
    return editor;
  },
  versionControl: () => import('../../../app/versionControl/VersionControlPane'),
  database: () => import('../../../app/database/DatabasePane'),
  docs: () => import('../../../app/docs/DocsPane'),
  deployment: () => import('../../../app/deployment/DeploymentPane'),
  marketplace: () => import('../../../app/marketplace/MarketplacePane'),
  teams: () => import('../../../app/teams/TeamsPane'),
  organization: () => import('../../../app/organization/OrganizationPane'),
};

// Get the import function for a given space ID
// Falls back to the home import if the ID isn't found
const getPrefetchFn = (id: SpaceId) => {
  return SPACE_IMPORTS[id] || SPACE_IMPORTS.home;
};

function SideNavigationPane() {
  const { space, setSpace, setView } = useWorkspace();
  const showNavBackground = useAppearanceStore((state) => state.showNavBackground);

  // Create a stable callback for navigating to spaces
  // This prevents unnecessary re-renders when the component updates
  const handleNavigation = useStableCallback((id: SpaceId) => {
    // Highlight immediately
    setSpace(id);

    // Ensure the chunk is in cache before we switch the main view to avoid the skeleton
    const importFn = getPrefetchFn(id);
    importFn()
      .catch(() => {}) // ignore failures; we'll still navigate so the user isn't stuck
      .finally(() => {
        setView(id);
      });
  }, []);

  // Use prefetch hooks for each navigation item with more aggressive settings
  //  – Home & Editor are prefetched immediately on mount (no delay)
  //  – Others have a small 20 ms debounce to avoid accidental hovers
  const homePrefetch = usePrefetch(getPrefetchFn('home'), { prefetchOnMount: true, delay: 0 });
  const editorPrefetch = usePrefetch(getPrefetchFn('editor'), { prefetchOnMount: true, delay: 0 });
  const versionControlPrefetch = usePrefetch(getPrefetchFn('versionControl'), { delay: 0 });
  const databasePrefetch = usePrefetch(getPrefetchFn('database'), { delay: 0 });
  const docsPrefetch = usePrefetch(getPrefetchFn('docs'), { delay: 0 });
  const deploymentPrefetch = usePrefetch(getPrefetchFn('deployment'), { delay: 0 });
  const marketplacePrefetch = usePrefetch(getPrefetchFn('marketplace'), { delay: 0 });
  const teamsPrefetch = usePrefetch(getPrefetchFn('teams'), { delay: 0 });
  const organizationPrefetch = usePrefetch(getPrefetchFn('organization'), { delay: 0 });

  // Create a mapping of space IDs to their prefetch functions but memoise the
  // object so its reference remains stable between renders, preventing
  // unnecessary re-renders of every NavButton.
  const prefetchMap = useMemo(
    () => ({
      home: homePrefetch,
      editor: editorPrefetch,
      versionControl: versionControlPrefetch,
      database: databasePrefetch,
      docs: docsPrefetch,
      deployment: deploymentPrefetch,
      marketplace: marketplacePrefetch,
      teams: teamsPrefetch,
      organization: organizationPrefetch,
    }),
    [
      homePrefetch,
      editorPrefetch,
      versionControlPrefetch,
      databasePrefetch,
      docsPrefetch,
      deploymentPrefetch,
      marketplacePrefetch,
      teamsPrefetch,
      organizationPrefetch,
    ]
  );

  // ----- Global idle-time prefetch -----
  /**
   * After initial render, warm-up all navigation chunks during the browser's idle
   * time so future navigations are instant even on cold refresh. We use
   * `requestIdleCallback` when available to avoid blocking the main thread.
   */
  useEffect(() => {
    const warm = () => {
      // Using for...of instead of forEach for better performance
      for (const fn of Object.values(SPACE_IMPORTS)) {
        fn().catch(() => {});
      }
    };

    // Prefer idle callback for better scheduling in supporting browsers
    // Using the requestIdleCallback for better browser scheduling

    let idleId: number;

    // Check if the browser supports requestIdleCallback
    if (window.requestIdleCallback) {
      // Use the API with proper typing
      idleId = window.requestIdleCallback(() => warm());
    } else {
      // Fall back to setTimeout
      idleId = window.setTimeout(warm, 1500); // fallback: run after 1.5 s
    }

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
  }, []);

  return (
    <nav
      aria-label="Primary"
      className={`flex h-full w-16 shrink-0 flex-col items-center gap-3 rounded-lg ${showNavBackground ? 'border border-neutral-700 bg-neutral-800/60 backdrop-blur' : ''} py-3 px-2`}
    >
      {items.map(({ id, icon, tip }) => (
        <NavButton
          key={id}
          icon={icon}
          label={tip}
          testId={`nav-${id}`}
          isActive={space === id}
          onMouseEnter={prefetchMap[id]}
          onClick={() => handleNavigation(id)}
        />
      ))}
    </nav>
  );
}

// Export a memoized version to prevent unnecessary re-renders
export default memo(SideNavigationPane);
