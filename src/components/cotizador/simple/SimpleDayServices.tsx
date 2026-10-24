import React, { useState } from 'react';
import { Check, Utensils, AlertCircle } from 'lucide-react';
import { formatEventDate, formatMXNCents } from '../../../utils/formatters';
import { MEAL_SERVICES, MEAL_LABELS, type MealService, type ServiceMenuSelection } from '../../../types/itinerary';
import { DEMO_PACKAGES } from '../../../config/packages';
import { SERVICE_SETTINGS } from '../../../config/service';
import { activeDishGroups, pruneDishes } from '../../../utils/dishes';
import { menusForService } from '../../../utils/itineraryMenus';
import { SECTIONS_CONFIG } from '../../../config/sections';

export type DayMenuSelections = Record<string, Partial<Record<MealService, ServiceMenuSelection>>>;

interface SimpleDayServicesProps {
  dates: string[];
  dayServices: Record<string, MealService[]>;
  selections: DayMenuSelections;
  errors: Record<string, string>;
  onToggleService: (date: string, service: MealService) => void;
  onChangeSelection: (date: string, service: MealService, selection: ServiceMenuSelection) => void;
  onCopySelection: (date: string, service: MealService, targetDate: string) => void;
}

export const SimpleDayServices: React.FC<SimpleDayServicesProps> = ({ dates, dayServices, selections, errors, onToggleService, onChangeSelection, onCopySelection }) => {
  const [copyTargets, setCopyTargets] = useState<Record<string, string>>({});
  const [copyNotice, setCopyNotice] = useState('');
  const [menuNotice, setMenuNotice] = useState<Record<string, string>>({});
  const breakfastSelected = dates.some(date => dayServices[date]?.includes('desayuno'));
  const breakfastIncludes = SECTIONS_CONFIG.services.items.find(service => service.id === 'desayuno')?.includes.filter(text => text.trim()) ?? [];
  return <div className="simple-day-services">
    <div className="simple-step-header">
      <span className="simple-step-tag">Paso 2</span>
      <h3 className="simple-step-title">Servicios y menús</h3>
      <p className="simple-step-desc">Elige qué disfrutar cada día. Los horarios y ajustes se confirmarán con el chef.</p>
    </div>
    {breakfastSelected && breakfastIncludes.length > 0 && <aside className="simple-breakfast-includes" aria-label="Incluido en desayunos">
      <h4>Tu desayuno incluye</h4>
      <p>{breakfastIncludes.join(' · ')}</p>
    </aside>}
    {copyNotice && <p className="simple-copy-notice" role="status">{copyNotice}</p>}
    <div className="day-services-cards">
      {dates.map(date => {
        const services = dayServices[date] || [];
        return <div key={date} className={`day-service-card ${services.length ? '' : 'card-warning'}`}>
          <div className="day-card-header">
            <div className="day-card-date-wrap"><Utensils size={16} className="day-card-icon"/><h4 className="day-card-date">{formatEventDate(date)}</h4></div>
            <span className="day-card-count">{services.length ? `${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}` : 'Sin servicios'}</span>
          </div>
          <div className="day-meal-options" role="group" aria-label={`Servicios para ${date}`}>
            {MEAL_SERVICES.map(service => <button type="button" key={service} className={`meal-pill-btn ${services.includes(service) ? 'active' : ''}`} onClick={() => onToggleService(date, service)} aria-pressed={services.includes(service)}>
              <span className="meal-pill-checkbox">{services.includes(service) && <Check size={14}/>}</span><span className="meal-pill-label">{MEAL_LABELS[service]}</span>
            </button>)}
          </div>
          {!services.length && <div className="day-warning-notice"><AlertCircle size={14}/><span>Selecciona al menos un servicio para este día.</span></div>}
          {MEAL_SERVICES.filter(service => services.includes(service)).map(service => {
            const key = `${date}-${service}`;
            const selection = selections[date]?.[service] ?? { menuId: '', requestedTime: '', selectedDishes: {} };
            const menus = menusForService(DEMO_PACKAGES, service);
            const menu = menus.find(p => p.id === selection.menuId);
            const targets = dates.filter(target => target !== date);
            const target = copyTargets[key] || '';
            return <fieldset className="simple-service-menu" key={service} aria-describedby={errors[key] ? `${key}-error` : undefined}>
              <legend>{MEAL_LABELS[service]}</legend>
              <label className="simple-menu-field" htmlFor={`${key}-time`}>Horario solicitado
                <input id={`${key}-time`} type="time" value={selection.requestedTime} onChange={e => onChangeSelection(date, service, { ...selection, requestedTime: e.target.value })}/>
              </label>
              {!menus.length ? <p role="status">No hay menús publicados para este servicio. Consulta al equipo antes de continuar.</p> : <>
                {menus.length > 1 && <div className="simple-menu-options" role="group" aria-label={`Menú de ${MEAL_LABELS[service]} para ${date}`}>
                  {menus.map(p => <button type="button" key={p.id} aria-pressed={p.id === selection.menuId} className={`simple-menu-option ${p.id === selection.menuId ? 'selected' : ''}`} onClick={() => {
                    const dishes = pruneDishes(p, selection.selectedDishes);
                    setMenuNotice(current => ({ ...current, [key]: Object.keys(dishes).length < Object.keys(selection.selectedDishes).length ? 'Se retiraron las opciones que no pertenecen al nuevo menú. Conservamos las compatibles.' : '' }));
                    onChangeSelection(date, service, { ...selection, menuId: p.id, selectedDishes: dishes });
                  }}>
                    <span>{p.name}</span>{p.id === selection.menuId && <Check size={16}/>}
                  </button>)}
                </div>}
                {menuNotice[key] && <p className="simple-menu-note" role="status">{menuNotice[key]}</p>}
                {menu && <>
                  <div className="simple-menu-heading">
                    {menu.image && <figure><img src={menu.image} alt={menu.name} loading="lazy" width="120" height="90"/>{menu.demoLabel && <figcaption>{menu.demoLabel}</figcaption>}</figure>}
                    <div><h5>{menu.name}</h5><p>{menu.concept}</p><span className="simple-menu-price">{SERVICE_SETTINGS.pricesApproved && menu.priceApproved !== false && menu.pricePerPersonCents > 0 ? `${formatMXNCents(menu.pricePerPersonCents)} / persona · antes de IVA` : 'Precio por confirmar'}</span></div>
                  </div>
                  {activeDishGroups(menu, selection.selectedDishes).map(group => <div className="simple-menu-field" key={group.id}>
                    <label htmlFor={`${key}-${group.id}`}>{group.name}{group.required ? ' *' : ' · opcional'}</label>
                    <select id={`${key}-${group.id}`} value={selection.selectedDishes[group.id] || ''} onChange={e => onChangeSelection(date, service, { ...selection, selectedDishes: pruneDishes(menu, { ...selection.selectedDishes, [group.id]: e.target.value }) })}>
                      <option value="">{group.required ? 'Elige una opción' : 'Lo acordaré con el chef'}</option>
                      {group.options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                    </select>
                    {group.options.find(o => o.id === selection.selectedDishes[group.id])?.description && <p className="simple-dish-description">{group.options.find(o => o.id === selection.selectedDishes[group.id])!.description}</p>}
                    {group.note && <p className="simple-menu-note">{group.note}</p>}
                  </div>)}
                  {targets.length > 0 && <details className="simple-menu-copy">
                    <summary>Usar este {MEAL_LABELS[service].toLowerCase()} en otra fecha</summary>
                    <label className="simple-menu-field" htmlFor={`${key}-copy`}>Fecha de destino
                      <select id={`${key}-copy`} value={target} onChange={e => setCopyTargets(current => ({ ...current, [key]: e.target.value }))}>
                        <option value="">Elige una fecha</option>{targets.map(day => <option key={day} value={day}>{formatEventDate(day)}</option>)}
                      </select>
                    </label>
                    {target && selections[target]?.[service] && <p className="simple-menu-note">Se reemplazará la selección de {MEAL_LABELS[service].toLowerCase()} de esa fecha.</p>}
                    <button type="button" className="simple-btn-prev" disabled={!target} onClick={() => {
                      onCopySelection(date, service, target);
                      setCopyNotice(`${MEAL_LABELS[service]} copiado a ${formatEventDate(target)}. Puedes ajustarlo por separado.`);
                    }}>Copiar selección</button>
                  </details>}
                </>}
              </>}
              {errors[key] && <p id={`${key}-error`} className="simple-menu-error" role="alert">{errors[key]}</p>}
            </fieldset>;
          })}
        </div>;
      })}
    </div>
  </div>;
};
