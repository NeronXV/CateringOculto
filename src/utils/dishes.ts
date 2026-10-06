import type {PackageMenu} from '../types';
export function activeDishGroups(pkg:PackageMenu|undefined,selected:Record<string,string>={}) {
  return (pkg?.choiceGroups ?? []).filter(g=>!g.dependsOnGroup || selected[g.dependsOnGroup]===g.dependsOnOption);
}
export function pruneDishes(pkg:PackageMenu|undefined,selected:Record<string,string>={}) {
  return Object.fromEntries(activeDishGroups(pkg,selected).filter(g=>g.options.some(o=>o.id===selected[g.id])).map(g=>[g.id,selected[g.id]]));
}
