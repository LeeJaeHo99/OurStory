import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const currentDir = dirname(fileURLToPath(import.meta.url));

export const getDatabaseConfig = ( configService: ConfigService ): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: Number(configService.getOrThrow('DB_PORT')),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),
    entities: [join(currentDir, '..', '**', '*.entity.js')],
    synchronize: configService.get('NODE_ENV') !== 'production',
});
