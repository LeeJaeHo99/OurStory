import { Module } from '@nestjs/common';
import { AppController } from '../app.controller.js';
import { AppService } from '../app.service.js';
import { BooksModule } from './books/books.module.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SentencesModule } from './sentences/sentences.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PoemsModule } from './poems/poems.module.js';
import { RankingsModule } from './rankings/rankings.module.js';

@Module({
    imports: [BooksModule, UsersModule, PostsModule, ReportsModule, SentencesModule, NotificationsModule, PoemsModule, RankingsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}