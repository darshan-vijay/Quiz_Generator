import { loadJSON, saveJSON } from './utils';
import { filterUsefulLinks } from './gptUtils';

const queuePath = './data/queue.json';

(async () => {
  const queue = loadJSON(queuePath, []);
  if (!Array.isArray(queue) || queue.length === 0) {
    console.log('Queue is empty or invalid. Skipping filtering.');
    return;
  }

  const filtered = await filterUsefulLinks(queue);
  console.log(`Filtered queue from ${queue.length} -> ${filtered.length} entries.`);
  saveJSON(queuePath, filtered);
})();
