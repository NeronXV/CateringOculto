import {AVAILABILITY_LABELS,type AvailabilityStatus} from '../../types/availability';
import {visibleFolio} from '../../utils/folio';
import {EVENT_STATUS,type EventStatus} from '../../types/operations';
import {formatEventDate} from '../../utils/formatters';
export default function RequestTracking({data}:{data:{folio:string;dates:string[];availability:AvailabilityStatus;status:EventStatus;holdUntil:string}}){
  const booked=data.status==='confirmed'||data.status==='hold';
  return <><p>Solicitud: {visibleFolio(data.folio)}</p><h2>{booked?EVENT_STATUS[data.status]:AVAILABILITY_LABELS[data.availability]??'Pendiente de decisión'}</h2><p>{data.dates.map(formatEventDate).join(' · ')}</p>
    <p>{booked?(data.status==='confirmed'?'La reserva está confirmada conforme a los acuerdos registrados con el equipo.':'Existe un apartado temporal; aún no es una reserva confirmada.'):data.availability==='available'?'Podemos continuar con la propuesta. Esta decisión no reserva ni aparta la fecha.':data.availability==='unavailable'?'Por ahora no podemos atender estas fechas. Contacta al equipo para buscar alternativas.':'El equipo está revisando tu solicitud. Aún no hay una decisión de disponibilidad.'}</p>
    {data.holdUntil&&<p>Apartado hasta: {new Date(data.holdUntil).toLocaleString('es-MX')}</p>}
    <p>La contratación se acuerda directamente con el equipo; una solicitud no confirma una reservación.</p><button type="button" onClick={()=>location.reload()}>Actualizar estado</button></>;
}
