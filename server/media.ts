import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const mediaId = /^[a-f0-9-]{36}\.webp$/;
export class MediaStore {
  private busy = false;
  constructor(readonly directory: string) {}
  async save(input: Buffer) {
    if (!Buffer.isBuffer(input) || !input.length || input.length > MAX_IMAGE_BYTES) throw new Error('Usa una imagen de hasta 8 MB.');
    if (this.busy) throw new Error('Hay otra imagen procesándose. Intenta nuevamente.');
    this.busy = true;
    try {
      const image = sharp(input,{limitInputPixels:24_000_000,failOn:'warning'});
      const info = await image.metadata();
      if (!['jpeg','png','webp'].includes(info.format ?? '') || (info.pages ?? 1)>1) throw new Error('Usa JPG, PNG o WebP sin animación.');
      const output = await image.autoOrient().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
      await mkdir(this.directory,{recursive:true});
      const files = (await readdir(this.directory)).filter(name=>mediaId.test(name));
      const sizes = await Promise.all(files.map(name=>stat(join(this.directory,name))));
      if (files.length>=500 || sizes.reduce((sum,file)=>sum+file.size,0)+output.length>250*1024*1024) throw new Error('Almacenamiento local lleno. Solicita una revisión de las fotografías.');
      const id = `${randomUUID()}.webp`;
      await writeFile(join(this.directory,id),output,{flag:'wx'});
      return {url:`/api/local-editor/media/${id}`,bytes:output.length};
    } finally {this.busy=false;}
  }
}
