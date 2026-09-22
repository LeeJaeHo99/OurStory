import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { getDatabaseConfig } from './config/database.config.js';
import { BooksModule } from './modules/books/books.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SentencesModule } from './modules/sentences/sentences.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PoemsModule } from './modules/poems/poems.module.js';
import { RankingsModule } from './modules/rankings/rankings.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: getDatabaseConfig,
        }),
        BooksModule, 
        UsersModule, 
        PostsModule, 
        ReportsModule, 
        SentencesModule, 
        NotificationsModule, 
        PoemsModule, 
        RankingsModule, AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}