import {build} from 'esbuild';
await build({entryPoints:['server/start.ts','server/manage.ts','server/owner.ts','server/importClient.ts'],outdir:'server-dist',bundle:true,platform:'node',target:'node24',format:'esm',packages:'external'});
