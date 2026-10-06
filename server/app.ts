import express from 'express';
import {resolve} from 'node:path';
import type {Pool} from 'mysql2/promise';
import {authApp, type AuthOptions} from './authApp';
export async function application(pool:Pool,secret:string,mediaDirectory:string,options:AuthOptions,dist=resolve('dist')) {
  const app=express();app.disable('x-powered-by');
  app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');next();});
  app.get('/health/live',(_req,res)=>res.json({ok:true}));
  app.get('/health/ready',async(_req,res)=>{
    res.setHeader('Cache-Control','no-store');
    try {await pool.query('SELECT id FROM editorial_state WHERE id=1');res.json({ok:true});}catch{res.status(503).json({ok:false});}
  });
  // Keep this prefix to preserve existing media URLs and clients.
  app.use('/api/local-editor',await authApp(pool,secret,mediaDirectory,options));
  app.use('/api',(_req,res)=>res.status(404).json({error:'Ruta desconocida.'}));
  app.use(express.static(dist,{index:false,dotfiles:'deny',setHeaders:(res,path)=>{res.setHeader('Cache-Control',path.includes(`${resolve(dist)}/assets/`)?'public, max-age=31536000, immutable':'no-cache');}}));
  app.get(['/', '/admin', '/seguimiento'],(req,res)=>{if(req.path==='/seguimiento'){res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');}res.setHeader('Cache-Control','no-store');res.sendFile(resolve(dist,'index.html'));});
  app.use((_req,res)=>res.status(404).send('No encontrado.'));
  return app;
}
