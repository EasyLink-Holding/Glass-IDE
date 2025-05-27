/**
 * Debug helper for the search functionality
 * This provides a simple direct function to test search queries
 */
import { invoke } from '@tauri-apps/api/core';
import { terminalLogger } from '../../../lib/tauri/consoleLogger';

/**
 * Performs a direct search query and logs the results to the terminal
 * This bypasses the UI components and directly tests the backend API
 */
export async function debugDirectSearch(rootPath: string): Promise<void> {
  try {
    terminalLogger.log(`[SEARCH-DEBUG] Running direct search test on workspace: ${rootPath}`);

    // Test empty query first - should return initial results
    const emptyResults = await invoke<string[]>('query_index', {
      params: {
        path: rootPath,
        query: '',
        offset: 0,
        limit: 10,
      },
    });

    terminalLogger.log(`[SEARCH-DEBUG] Empty query returned ${emptyResults.length} results`);
    if (emptyResults.length > 0) {
      terminalLogger.log(
        `[SEARCH-DEBUG] First few results: ${emptyResults.slice(0, 3).join(', ')}`
      );
    } else {
      terminalLogger.warn('[SEARCH-DEBUG] No results for empty query!');
    }

    // Now let's test with a sample query
    const testQuery = 'js'; // Simple query that should match JavaScript files
    const queryResults = await invoke<string[]>('query_index', {
      params: {
        path: rootPath,
        query: testQuery,
        offset: 0,
        limit: 10,
      },
    });

    terminalLogger.log(
      `[SEARCH-DEBUG] Query '${testQuery}' returned ${queryResults.length} results`
    );
    if (queryResults.length > 0) {
      terminalLogger.log(
        `[SEARCH-DEBUG] First few results: ${queryResults.slice(0, 3).join(', ')}`
      );
    } else {
      terminalLogger.warn(`[SEARCH-DEBUG] No results for query '${testQuery}'!`);
    }

    terminalLogger.log('[SEARCH-DEBUG] Direct search test completed');
  } catch (error) {
    terminalLogger.error('[SEARCH-DEBUG] Error running direct search test:', error);
  }
}
