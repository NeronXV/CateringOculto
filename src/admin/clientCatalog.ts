import type {Catalog} from './catalog';
import type {DishGroup,PackageMenu} from '../types';
const option=(id:string,name:string,description:string)=>({id,name,description});
const group=(id:string,name:string,options:DishGroup['options'],required=false,note='Preferencia para el grupo; selección final sujeta a confirmación.'):DishGroup=>({id,name,required,note,dependsOnGroup:'',dependsOnOption:'',options});
export function clientCatalog(base:Catalog):Catalog {
  const catalog=structuredClone(base);
  catalog.sections.experiences.items.forEach(item=>{item.idealFor='A partir de 5 personas · Capacidad y espacio sujetos a confirmación';});
  const breakfasts=group('desayuno','Desayuno',[
    option('omelette','Omelette','Tocino, espinaca, champiñones, queso gouda y ensalada verde.'),
    option('chilaquiles','Chilaquiles tradicionales','Cebolla, cilantro, crema y frijoles refritos. Elige salsa y proteína.'),
    option('croissant','Croissant de huevo','Pesto de albahaca, huevo a la mantequilla, gouda, parmesano, ensaladilla verde y papas al romero.'),
    option('tacos-baja','Tacos estilo Baja','Camarón y pescado en tempura, col, salsa mexicana y alioli de cilantro; tortillas de harina y maíz.'),
    option('marlin','Sándwich de marlín ahumado','Salsa de queso, gratinado con gouda y ensalada verde.')
  ],true,'Una opción de desayuno elegida con anticipación. Confirma con el chef cualquier ajuste para tus invitados.');
  const salsa={...group('salsa','Salsa de chilaquiles',[option('roja','Roja','Salsa roja.'),option('verde','Verde','Salsa verde.')],true,''),dependsOnGroup:'desayuno',dependsOnOption:'chilaquiles'};
  const protein={...group('proteina','Proteína de chilaquiles',[option('huevo','Huevo','Con huevo.'),option('pollo','Pollo','Con pollo.')],true,''),dependsOnGroup:'desayuno',dependsOnOption:'chilaquiles'};
  const lunch=group('lunch','Opción de lunch',[
    option('camarones','Camarones al ajillo','Chile guajillo, vino blanco y arroz a la mexicana.'),
    option('pescado','Pescado empanizado','Pesca del día con panko, alioli de chipotle y ensalada verde.'),
    option('tacos','Tacos estilo Baja','Camarón y pescado capeados, alioli de cilantro, salsa mexicana, guacamole y col.'),
    option('mariscada','Mariscada','Ostiones de bienvenida. Opcionales indicados: aguachiles verde, negro o rojo, ceviche, tártara de atún y cóctel de frutos de mar. Selección, cantidades y posibles suplementos por confirmar.'),
    option('arrachera','Arrachera','Espinaca a la crema y vegetales salteados.')]);
  const starter=group('entrada','Entrada',[
    option('ceviche','Ceviche surf and turf','Camarón en limón, papada de cerdo, aguachile fermentado, chintextle, pepino, cilantro, cebolla morada, ajonjolí y furikake.'),
    option('guacamole','Guacamole con pork belly','Pork belly con salsa hoisin sobre guacamole y tortillas.'),
    option('almejas','Almejas de temporada','Almejas chocolates abiertas al momento, salsas marisqueras y tostadas; sujetas a temporada.'),
    option('ensalada','Ensalada de vegetales ahumados','Vinagreta de betabel, zanahorias, fresas, nuez pecana, arúgula y queso Chiapas.')]);
  const main=group('fuerte','Plato fuerte',[
    option('pescado','Pescado en salsa de alcaparras','Vino blanco, alcaparras y limón amarillo; puré de papa y vegetales salteados.'),
    option('filete','Filete de res','Filete prime de Rancho 17, vino tinto, puré de coliflor ahumado, vegetales y salsa demiglace.'),
    option('short-rib','Short rib con mole de dátiles','Braseado lentamente, mole de dátil, chiles, puré de camote con jengibre y vegetales.'),
    option('hamburguesa','Hamburguesa a la parrilla','Carne de ¼ lb, cheddar, cebolla crujiente, tocino y BBQ en brioche; jalapeños y papas fritas.')]);
  const dessert=group('postre','Postre',[
    option('pay-chocola','Pay de “chocola”','Nombre escrito en el documento, por confirmar; salsa de mascarpone y frutos rojos.'),
    option('tarta-datil','Tarta de dátil','Con queso y nuez.'),
    option('flan','Flan casero','Caramelo y frutos de temporada.'),
    option('pay-limon','Pay de limón','Con frutos de temporada.')]);
  const photo=base.packages[0].image;
  const menu=(id:string,name:string,price:number,groups:DishGroup[],note:string,priceApproved:boolean):PackageMenu=>({id,name,subtitle:note,concept:note,
    pricePerPersonCents:price,minGuests:5,priceApproved,choiceGroups:groups,courses:groups.filter(g=>!g.dependsOnGroup).map(g=>({title:g.name,description:g.note || 'Elige tu preferencia.'})),
    includedServices:['Servicios, equipo y personal incluidos por confirmar con el chef.'],compatibleExtraIds:[],image:photo,demoLabel:'Fotografía ilustrativa · IVA y traslado por confirmar'});
  catalog.packages=[menu('desayunos','Desayunos',95000,[breakfasts,salsa,protein],'$950 más IVA por persona. Una opción elegida con anticipación.',true),
    menu('lunch','Lunch',110000,[lunch],'$1,100 más IVA por persona. Preferencias y alcance de mariscada por confirmar.',true),
    menu('cena-dos','Cena de dos tiempos',0,[starter,main],'Entrada y fuerte. El documento indica $1,300 más IVA; unidad de cobro por confirmar.',false),
    menu('cena-tres','Cena de tres tiempos',0,[starter,main,dessert],'Entrada, fuerte y postre. El documento indica $1,450 más IVA; unidad de cobro por confirmar.',false)];
  catalog.packages[0].includedServices=['Fruta de temporada, yogurt griego, granola, miel, hot cakes y café al centro.'];
  catalog.extras=[];
  catalog.zones=['La Paz','La Ventana','Los Planes','Las Cruces','El Sargento','Todos Santos','Pescadero','Otra localidad'].map((name,i)=>({id:`zona-${i}`,name,description:i===0?'Ciudad de La Paz.':'Fuera de La Paz: costo adicional por confirmar.',travelFeeCents:0,requiresConfirmation:true}));
  catalog.rules.leadTimes=catalog.packages.map(p=>({id:p.id,name:p.name,approved:false,days:30}));
  catalog.service={...catalog.service,pricesApproved:true,taxApproved:false,travelApproved:false,travelMode:'zones',contactEmail:'pdro_valenzuela@hotmail.com',
    conditionsVersion:'cliente-2026-10-03',conditions:'Se solicita 50% de anticipo para reservar, una vez confirmada la disponibilidad y aceptadas las condiciones. El saldo se liquida 15 días antes del evento. Las reducciones de invitados no reducen el importe contratado. La política recibida contempla cancelaciones, reprogramaciones y cambios de invitados; el equipo debe confirmar contigo su aplicación antes de contratar. Se solicita un mes de anticipación; el cómputo exacto y las excepciones deben confirmarse.'};
  catalog.business.whatsAppNumberDigits='526122883091';catalog.business.whatsAppPhoneDisplay='612 288 3091';catalog.business.whatsAppPhoneIntl='+52 612 288 3091';
  catalog.business.demoNotice='Menús basados en la información del negocio. Fotografías ilustrativas; IVA, traslado y disponibilidad por confirmar.';
  catalog.business.taxNotice='Los precios base no incluyen IVA. La tasa aplicable y el traslado se confirmarán antes de contratar.';
  catalog.faqs=[{question:'¿Cuál es el mínimo de personas?',answer:'Atendemos a partir de 5 personas. Si son menos, el chef revisará personalmente la solicitud; no se cobra automáticamente el mínimo.'},
    {question:'¿Con cuánto tiempo debo solicitar el servicio?',answer:'El documento del negocio solicita un mes de anticipación. El equipo confirmará la fecha y revisará cualquier excepción.'},
    {question:'¿Qué incluye el presupuesto?',answer:'El desglose muestra los conceptos conocidos y señala IVA, traslados y cualquier precio pendiente. La solicitud no reserva una fecha.'},
    {question:'¿Cómo reservo?',answer:'Tras confirmar disponibilidad, precio final y condiciones, se solicita 50% de anticipo. El saldo debe cubrirse 15 días antes del evento. La página no recibe pagos.'},
    {question:'¿Atienden fuera de La Paz?',answer:'Sí, sujeto a revisión logística y costo extra. La fórmula de traslado indicada en el documento ($5,000 por cada 20 personas) requiere confirmar alcance, fracciones e impuestos antes de aplicarla.'},
    {question:'¿Puedo indicar alergias o ajustes de menú?',answer:'Inclúyelos en tu solicitud. El chef debe evaluar ingredientes, preparación y viabilidad; no se garantiza seguridad alimentaria automáticamente.'},
    {question:'¿Qué sucede si cancelo o cambio el evento?',answer:'Solicita las condiciones completas antes de contratar. El documento contempla retenciones según la anticipación, gastos no recuperables y reprogramación sujeta a disponibilidad. El equipo aclarará los plazos y cambios aplicables a tu evento.'}].map(faq=>({...faq,category:'politicas' as const}));
  return catalog;
}
