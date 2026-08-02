import { testRegex } from '../engines/developer';

type RegexRequest = {
  id: number;
  pattern: string;
  flags: string;
  sample: string;
};

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, sample } = event.data;
  self.postMessage({ id, result: testRegex(pattern, flags, sample) });
};

export {};
