import { useEffect, useRef, useState } from 'react';
export default function ImageField({id,value,onChange}:{id:string;value:string;onChange:(url:string)=>void}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const sequence=useRef(0);
  useEffect(()=>()=>{sequence.current++;},[]);
  return <div className="admin-field admin-wide">
    <label htmlFor={id}>Fotografía</label>
    <input id={id} value={value} disabled={busy} maxLength={5000} required onChange={event=>{sequence.current++;onChange(event.target.value);setMessage('');}}/>
    <label htmlFor={`${id}-file`} className="admin-hint">Selecciona una foto de tu equipo · JPG, PNG o WebP · máximo 8 MB</label>
    <input id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async event=>{
      const file=event.target.files?.[0];event.target.value='';if(!file)return;
      const ticket=++sequence.current;setError('');setMessage('');
      if(file.size>8*1024*1024){setError('La fotografía supera los 8 MB. Elige una más pequeña.');return;}
      setBusy(true);
      try {
        const response=await fetch('/api/local-editor/media',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});
        const data=await response.json();if(!response.ok)throw new Error(data.error ?? 'No se pudo subir la imagen.');
        if(sequence.current===ticket){onChange(data.url);setMessage('Foto subida y optimizada. Guarda el borrador y publica cuando esté lista.');}
      } catch(err){setError(err instanceof Error?err.message:'No se pudo subir. Intenta nuevamente.');}
      finally{setBusy(false);}
    }}/>
    {busy && <span role="status">Subiendo y optimizando fotografía…</span>}
    {error && <span role="alert" className="admin-error">{error}</span>}
    {message && <span role="status" className="admin-hint">{message}</span>}
    {/^(https:\/\/|\/(?!\/))/.test(value) && <img className="admin-image" src={value} alt="Vista previa de la fotografía seleccionada"/>}
  </div>;
}
