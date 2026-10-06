import type { Qualification as Result } from '../../types/quote';
export function Qualification({value}:{value:Result|undefined}) {
  if(!value)return <p>Esta solicitud se emitió antes del filtro comercial.</p>;
  return <section aria-label="Revisión comercial"><h4>{value.status==='ready'?'Lista para revisión comercial':'Requiere aclaraciones'}</h4>
    <p>Este resultado organiza la atención. No confirma disponibilidad, precio definitivo ni reserva.</p>
    {value.reasons.length>0 && <ul>{value.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>}
    <details><summary>Condiciones pendientes del negocio</summary><ul>{value.policyPending.map(reason=><li key={reason}>{reason}</li>)}</ul></details>
  </section>;
}
