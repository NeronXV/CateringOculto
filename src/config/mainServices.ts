// Presentation of the three public services. Prices remain in the existing catalog.
export const MAIN_SERVICES = {
  title: 'Chef privado para cada momento de tu día',
  description: 'Elige desayuno, comida o cena para cada fecha. El menú y los detalles se acuerdan directamente con el chef.',
  items: [
    {
      id: 'desayuno', title: 'Desayuno', subtitle: 'Desayuno completo',
      description: 'Una mesa al centro y un plato fuerte a elegir con el chef.',
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
      includes: ['Fruta de temporada', 'Yogurt griego y granola', 'Miel', 'Hot cakes', 'Café'],
      note: 'El plato fuerte y cualquier ajuste se acuerdan contigo antes del servicio.'
    },
    {
      id: 'comida', title: 'Comida', subtitle: 'Para compartir',
      description: 'Una comida preparada al momento para tu grupo, según el menú acordado.',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      includes: ['Menú y alcance a confirmar con el chef'],
      note: 'Cuéntanos tus preferencias para preparar la propuesta.'
    },
    {
      id: 'cena', title: 'Cena', subtitle: 'Cena en tu residencia',
      description: 'Una cena para disfrutar con tu grupo. Definimos los platillos contigo.',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      includes: ['Menú y alcance a confirmar con el chef'],
      note: 'Solo solicita cena; los tiempos y detalles se acuerdan después.'
    }
  ]
};
