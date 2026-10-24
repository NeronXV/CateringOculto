import type { Catalog } from './catalog';

// Keep unsaved edits when the other editor saves a different part of the catalog.
// Arrays are atomic: overlapping edits must be reviewed, never silently merged.
export function mergeDraft(base: Catalog, local: Catalog, remote: Catalog): Catalog | null {
  let conflict=false;
  const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
  const record=(value:unknown):value is Record<string,unknown>=>!!value && typeof value==='object' && !Array.isArray(value);
  function merge(before:unknown,ours:unknown,theirs:unknown):unknown {
    if(equal(before,ours))return structuredClone(theirs);
    if(equal(before,theirs) || equal(ours,theirs))return structuredClone(ours);
    if(record(before) && record(ours) && record(theirs)) {
      return Object.fromEntries([...new Set([...Object.keys(before),...Object.keys(ours),...Object.keys(theirs)])].map(key=>[key,merge(before[key],ours[key],theirs[key])]));
    }
    conflict=true;return ours;
  }
  const result=merge(base,local,remote) as Catalog;
  return conflict?null:result;
}
