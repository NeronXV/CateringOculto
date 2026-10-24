export interface FaqItem {
  question: string;
  answer: string;
  category: 'reserva' | 'cocina' | 'logistica' | 'politicas';
}

// Initial wording only. Existing published questions remain owned by the editor.
export const FAQS_CONFIG: FaqItem[] = [
  {
    category: 'reserva',
    question: '¿La solicitud confirma mis fechas?',
    answer: 'No. Carlos y Karen revisan la disponibilidad y acuerdan contigo el menú, precio y condiciones por WhatsApp. La solicitud no reserva ni genera un cobro.'
  },
  {
    category: 'cocina',
    question: '¿Puedo indicar alergias o preferencias?',
    answer: 'Sí. Inclúyelas en tu solicitud para que el chef revise ingredientes, preparación y viabilidad contigo antes de acordar el servicio.'
  },
  {
    category: 'reserva',
    question: '¿Puedo pedir distintos servicios en varios días?',
    answer: 'Sí. Selecciona solo las fechas en que necesitas servicio y marca desayuno, comida o cena para cada día. Las fechas pueden ser no consecutivas.'
  },
  {
    category: 'politicas',
    question: '¿Cómo conozco el precio?',
    answer: 'La solicitud muestra referencias aprobadas cuando están disponibles. Los importes pendientes aparecen por confirmar; el chef acuerda contigo el precio final, impuestos y traslado antes de contratar.'
  }
];
