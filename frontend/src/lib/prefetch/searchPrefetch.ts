import { batchedInvoke } from '../tauri/batchedCommunication';

// Guard so we only preload once per session
let loaded = false;

/**
 * Preload the Search feature chunk and kick-off workspace indexing.
 * Call on user intent (hover / focus). Subsequent calls are no-ops.
 */
export async function preloadSearch(rootPath: string): Promise<void> {
  if (loaded) return;
  loaded = true;

  // Dynamically import Search UI so Vite fetches JS/CSS in background.
  void import('../../features/search/ui/common/SearchBox');

  // Fire-and-forget index build to make first query instant.
  try {
    await batchedInvoke<number>('build_index', { path: rootPath });
    // Fire content indexer in parallel – no await so both run concurrently
    void batchedInvoke<number>('build_content_index', { path: rootPath });
  } catch (err) {
    console.error('preloadSearch: build_index failed', err);
  }
}
