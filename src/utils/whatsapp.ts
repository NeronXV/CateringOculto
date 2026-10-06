import { QuoteConfigState, CalculationBreakdown } from '../types';
import { BUSINESS_CONFIG } from '../config/business';
import { EVENT_TYPES } from '../config/packages';
import { formatEventDate, formatMXNCents } from './formatters';

export function generateWhatsAppMessage(
  state: QuoteConfigState,
  breakdown: CalculationBreakdown
): string {
  const eventTypeObj = EVENT_TYPES.find(e => e.id === state.eventType);
  const eventTypeName = eventTypeObj ? eventTypeObj.name : state.eventType;
  const formattedDate = formatEventDate(state.eventDate);
  const clientName = state.clientName.trim() || 'Comensal interesado';

  let message = `*SOLICITUD DE DISPONIBILIDAD · ${BUSINESS_CONFIG.brandName.toUpperCase()}*\n`;
  message += `_La Paz, Baja California Sur_\n\n`;
  
  message += `Hola, Chef Carlos. Mi nombre es *${clientName}*. Me gustaría consultar disponibilidad y afinar detalles para el siguiente evento gastronómico:\n\n`;
  
  message += `📅 *Fecha:* ${formattedDate}\n`;
  message += `📍 *Zona / Ubicación:* ${breakdown.selectedZone?.name || state.zoneId}\n`;
  message += `✨ *Tipo de Evento:* ${eventTypeName}\n`;
  message += `👥 *Número de Comensales:* ${state.guestsCount} personas\n`;
  message += `🍽️ *Menú Elegido:* ${breakdown.selectedPackage?.name || 'Por definir'}\n`;
  if (breakdown.selectedPackage) {
    message += `   (${formatMXNCents(breakdown.selectedPackage.pricePerPersonCents)} por persona)\n`;
  }
  
  if (breakdown.extrasItemized.length > 0) {
    message += `\n🍷 *Complementos y Extras Seleccionados:*\n`;
    for (const item of breakdown.extrasItemized) {
      if (item.pricingType === 'per_person') {
        message += ` • ${item.name}: ${item.quantity} pers. (${formatMXNCents(item.totalCents)})\n`;
      } else if (item.pricingType === 'per_unit') {
        message += ` • ${item.name}: ${item.quantity} ${item.unitLabel || 'unidades'} (${formatMXNCents(item.totalCents)})\n`;
      } else {
        message += ` • ${item.name} (tarifa fija): ${formatMXNCents(item.totalCents)}\n`;
      }
    }
  }

  if (state.dietaryRestrictions.trim()) {
    message += `\n🌱 *Alergias o Restricciones Alimentarias:*\n${state.dietaryRestrictions.trim()}\n`;
  }

  if (state.additionalNotes.trim()) {
    message += `\n📝 *Notas o Requerimientos Adicionales:*\n${state.additionalNotes.trim()}\n`;
  }

  message += `\n───────────────\n`;
  message += `💰 *Presupuesto Estimado Preliminar:* ${formatMXNCents(breakdown.totalEstimatedCents)} MXN\n`;
  
  if (breakdown.travelRequiresConfirmation) {
    message += `⚠️ *Logística de Traslado:* Pendiente de confirmar (no incluido en este estimado).\n`;
  } else if (breakdown.travelFeeCents > 0) {
    message += `🚗 *Traslado logístico estimado:* ${formatMXNCents(breakdown.travelFeeCents)} MXN\n`;
  }

  message += `\n_Nota: Entiendo que este estimado es orientativo y que la fecha, requerimientos técnicos y precio final se confirman directamente con su equipo._\n\n`;
  message += `Quedo atento a su respuesta para conocer su disponibilidad. ¡Muchas gracias!`;

  return message;
}

export function generateWhatsAppUrl(
  state: QuoteConfigState,
  breakdown: CalculationBreakdown
): { url: string; hasValidNumber: boolean; rawMessage: string } {
  const number = BUSINESS_CONFIG.whatsAppNumberDigits.replace(/\D/g, '');
  const hasValidNumber = Boolean(number && number.length >= 10);
  
  const rawMessage = generateWhatsAppMessage(state, breakdown);
  const encodedText = encodeURIComponent(rawMessage);
  
  const url = hasValidNumber
    ? `https://wa.me/${number}?text=${encodedText}`
    : '#configuracion-invalida';

  return { url, hasValidNumber, rawMessage };
}
