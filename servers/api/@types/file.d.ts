import { MultipartFile as OriginalMultipartFile } from '@fastify/multipart';

declare module '@fastify/multipart' {
  export interface MultipartFile extends OriginalMultipartFile {
    filepath: string;
  }
}
