// Pure step builders for the hash-table visualizer (separate chaining).
// Each returns [{ description, action, kind?, line, vars? }] where actions
// call the page's ui callbacks with absolute state so the player can replay
// steps 0..k when scrubbing. `line` is the 1-based line into
// HASH_TABLE_PSEUDOCODE; `vars` feeds the variable watch. `buckets` is
// number[][] — arrays of keys per bucket. Search/delete builders assume the
// key's bucket is known to the caller's data (page validates key inputs);
// empty buckets and missing keys narrate an error step instead of throwing.

export const HASH_BUCKETS = 11;

export const hashKey = (key, buckets = HASH_BUCKETS) =>
  ((key % buckets) + buckets) % buckets;

export const totalKeys = (buckets) =>
  buckets.reduce((sum, chain) => sum + chain.length, 0);

const clearUi = (ui) => {
  ui.setActiveBucket?.(null);
  ui.setActiveChainIndex?.(null);
  ui.setShiftingChain?.([]);
  ui.setRemovingCell?.(null);
};

export const buildInsertSteps = (buckets, key, ui) => {
  const h = hashKey(key);
  const chain = buckets[h] ?? [];
  const steps = [
    {
      description: `Creating a new key to insert: ${key}`,
      line: 1,
      vars: { key },
      action: () => clearUi(ui),
    },
    {
      description: `Computing hash of ${key} → bucket ${h} (key mod ${HASH_BUCKETS})`,
      kind: 'compare',
      line: 2,
      vars: { key, bucket: h },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(null);
      },
    },
  ];

  if (chain.length === 0) {
    steps.push({
      description: `Bucket ${h} is empty — placing ${key} as the bucket head`,
      kind: 'move',
      line: 5,
      vars: { key },
      action: () => {
        ui.setActiveChainIndex?.(0);
      },
    });
  } else {
    steps.push({
      description: `Bucket ${h} has ${chain.length} keys — appending ${key} at position ${chain.length}`,
      kind: 'move',
      line: 7,
      vars: { key, pos: chain.length },
      action: () => {
        ui.setActiveChainIndex?.(chain.length);
      },
    });
  }

  steps.push({
    description: `Table now has ${totalKeys(buckets) + 1} keys`,
    kind: 'found',
    line: 8,
    vars: { total: totalKeys(buckets) + 1 },
    action: () => {
      ui.setActiveBucket?.(h);
      ui.setActiveChainIndex?.(chain.length);
    },
  });

  return steps;
};

export const buildSearchSteps = (buckets, key, ui) => {
  const h = hashKey(key);
  const chain = buckets[h] ?? [];
  const steps = [
    {
      description: `Computing hash of ${key} → bucket ${h} (key mod ${HASH_BUCKETS})`,
      kind: 'compare',
      line: 2,
      vars: { key, bucket: h },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(null);
      },
    },
  ];

  if (chain.length === 0) {
    steps.push({
      description: `Bucket ${h} is empty — key ${key} not found`,
      kind: 'error',
      line: 5,
      vars: { key },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(null);
      },
    });
    return steps;
  }

  let foundPos = -1;
  for (let i = 0; i < chain.length; i += 1) {
    steps.push({
      description: `Comparing ${key} with ${chain[i]} (bucket ${h}, position ${i})`,
      kind: 'compare',
      line: 7,
      vars: { key, other: chain[i], pos: i },
      action: () => {
        ui.setActiveChainIndex?.(i);
      },
    });
    if (chain[i] === key) {
      foundPos = i;
      break;
    }
  }

  if (foundPos >= 0) {
    steps.push({
      description: `Key ${key} found in bucket ${h} at position ${foundPos}`,
      kind: 'found',
      line: 8,
      vars: { key, bucket: h, pos: foundPos },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(foundPos);
      },
    });
  } else {
    steps.push({
      description: `Key ${key} not found in the table`,
      kind: 'error',
      line: 9,
      vars: { key },
      action: () => {
        ui.setActiveChainIndex?.(null);
      },
    });
  }

  return steps;
};

export const buildDeleteSteps = (buckets, key, ui) => {
  const h = hashKey(key);
  const chain = buckets[h] ?? [];
  const steps = [
    {
      description: `Computing hash of ${key} → bucket ${h} (key mod ${HASH_BUCKETS})`,
      kind: 'compare',
      line: 2,
      vars: { key, bucket: h },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(null);
        ui.setRemovingCell?.(null);
        ui.setShiftingChain?.([]);
      },
    },
  ];

  if (chain.length === 0) {
    steps.push({
      description: `Bucket ${h} is empty — key ${key} not present`,
      kind: 'error',
      line: 5,
      vars: { key },
      action: () => {
        ui.setActiveBucket?.(h);
        ui.setActiveChainIndex?.(null);
      },
    });
    return steps;
  }

  let foundPos = -1;
  for (let i = 0; i < chain.length; i += 1) {
    steps.push({
      description: `Comparing ${key} with ${chain[i]} (bucket ${h}, position ${i})`,
      kind: 'compare',
      line: 7,
      vars: { key, other: chain[i], pos: i },
      action: () => {
        ui.setActiveChainIndex?.(i);
      },
    });
    if (chain[i] === key) {
      foundPos = i;
      break;
    }
  }

  if (foundPos < 0) {
    steps.push({
      description: `Key ${key} not present in the table`,
      kind: 'error',
      line: 12,
      vars: { key },
      action: () => {
        ui.setActiveChainIndex?.(null);
      },
    });
    return steps;
  }

  steps.push({
    description: `Removing key ${key} from bucket ${h} (position ${foundPos})`,
    kind: 'move',
    line: 9,
    vars: { key, bucket: h, pos: foundPos },
    action: () => {
      ui.setRemovingCell?.({ bucket: h, index: foundPos });
    },
  });

  for (let i = foundPos + 1; i < chain.length; i += 1) {
    steps.push({
      description: `Shifting key ${chain[i]} from position ${i} to position ${i - 1}`,
      kind: 'move',
      line: 9,
      vars: { i, key: chain[i] },
      action: () => {
        ui.setShiftingChain?.([{ bucket: h, index: i }]);
      },
    });
  }

  steps.push({
    description: `Bucket ${h} now has ${chain.length - 1} keys`,
    kind: 'found',
    line: 10,
    vars: { bucket: h, size: chain.length - 1 },
    action: () => {
      ui.setRemovingCell?.(null);
      ui.setShiftingChain?.([]);
      ui.setActiveChainIndex?.(null);
    },
  });

  return steps;
};
