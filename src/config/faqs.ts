export interface FaqItem {
  question: string;
  answer: string;
  category: 'reserva' | 'cocina' | 'logistica' | 'politicas';
}

export const FAQS_CONFIG: FaqItem[] = [
  {
    category: 'reserva',
    question: '¿Con cuánta anticipación debo solicitar mi experiencia?',
    answer: 'Para cenas privadas íntimas recomendamos al menos 4 a 7 días de anticipación. Para celebraciones de más de 12 personas o fechas en temporada alta (noviembre a mayo), sugerimos consultar disponibilidad con 2 a 4 semanas de antelación. En ocasiones podemos atender solicitudes con menor margen según la agenda del equipo.'
  },
  {
    category: 'reserva',
    question: '¿El cotizador web confirma mi fecha o servicio?',
    answer: 'No. El cotizador genera un presupuesto estimativo transparente para que conozcas los rangos de inversión. Al hacer clic en "Consultar disponibilidad por WhatsApp", se prepara un mensaje con tu configuración para que nuestro equipo valide personalmente la agenda, los requerimientos de la cocina y el precio final antes de cualquier compromiso.'
  },
  {
    category: 'cocina',
    question: '¿Pueden adaptar los menús a alergias o restricciones alimentarias?',
    answer: 'Completamente. Toda la propuesta se cocina sobre pedido. Si entre tus invitados hay personas celíacas, vegetarianas, con intolerancia a mariscos, frutos secos o lácteos, diseñamos alternativas específicas respetando la misma calidad y cuidado técnico.'
  },
  {
    category: 'logistica',
    question: '¿Qué equipamiento necesitan en la casa, villa o locación?',
    answer: 'Solo requerimos acceso a una cocina funcional con refrigeración básica, fuente de calor y agua potable corriente. Si el evento es al aire libre o en un espacio sin cocina equipada, el Chef Carlos puede coordinar estaciones móviles de asador o inducción (sujeto a previa inspección técnica).'
  },
  {
    category: 'politicas',
    question: '¿Cuáles son las políticas de anticipo y cancelación?',
    answer: 'Información sujeta a confirmación directa: Por lo general, se solicita un anticipo del 50% al formalizar la reserva para asegurar la fecha y realizar la compra anticipada de ingredientes frescos y pesca de anzuelo. El saldo restante se liquida el día del evento. Las condiciones específicas de reembolso o reprogramación se entregan por escrito con la cotización formal.'
  },
  {
    category: 'politicas',
    question: '¿Los precios mostrados en el cotizador incluyen impuestos?',
    answer: 'Condición fiscal pendiente de definir: Los importes mostrados son una base estimada antes de impuestos (IVA). Si requieres factura fiscal mexicana, indícalo en tus comentarios para incorporar el desglose correspondiente en la propuesta definitiva.'
  }
];
