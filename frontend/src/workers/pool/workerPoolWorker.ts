import { taskRegistry } from './tasks';

interface TaskRequest {
  id: number;
  name: string;
  payload: unknown;
}
interface TaskResponse {
  id: number;
  result?: unknown;
  error?: string;
}

self.onmessage = (evt: MessageEvent<TaskRequest>) => {
  const { id, name, payload } = evt.data;
  const fn = taskRegistry[name];
  const resp: TaskResponse = { id };
  try {
    if (!fn) throw new Error(`Unknown task ${name}`);
    resp.result = fn(payload);
  } catch (err) {
    resp.error = err instanceof Error ? err.message : String(err);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.postMessage(resp);
};
