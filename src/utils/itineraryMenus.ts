import type { PackageMenu } from '../types';
import type { MealService, ServiceMenuSelection } from '../types/itinerary';
import { activeDishGroups } from './dishes';

// Keep the existing catalog's service mapping shared by the UI and backend.
export function menusForService(packages: PackageMenu[], service: MealService): PackageMenu[] {
  const matched = packages.filter(p => {
    if (service === 'desayuno') return p.id.startsWith('desayun');
    if (service === 'comida') return p.id === 'lunch' || p.id.includes('comida');
    return p.id.startsWith('cena');
  });
  return matched.length ? matched : packages.filter(p =>
    p.name.toLowerCase().includes(service) || (service === 'comida' && p.name.toLowerCase().includes('lunch'))
  );
}

export function selectionIssue(packages: PackageMenu[], service: MealService, selection?: ServiceMenuSelection): string {
  const menu = menusForService(packages, service).find(p => p.id === selection?.menuId);
  if (!menu || !selection) return 'Elige un menú para este servicio.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selection.requestedTime)) return 'Indica el horario solicitado.';
  const groups = activeDishGroups(menu, selection.selectedDishes);
  if (Object.entries(selection.selectedDishes).some(([id, option]) =>
    !groups.some(g => g.id === id && g.options.some(o => o.id === option))
  )) return 'Revisa los platillos y variantes de este menú.';
  if (groups.some(g => g.required && !selection.selectedDishes[g.id])) return 'Completa las opciones de platillos requeridas.';
  return '';
}

export function serviceMenuLines(packages: PackageMenu[], selection?: ServiceMenuSelection): string[] {
  if (!selection) return [];
  const menu = packages.find(p => p.id === selection.menuId);
  return [
    `${menu?.name ?? selection.menuId} · ${selection.requestedTime}`,
    ...activeDishGroups(menu, selection.selectedDishes).flatMap(g => {
      const option = g.options.find(o => o.id === selection.selectedDishes[g.id]);
      return option ? [`${g.name}: ${option.name}`] : [];
    })
  ];
}
