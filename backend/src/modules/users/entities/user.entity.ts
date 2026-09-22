import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Base } from '../../../common/entities/Base.entity.js';
import { Role } from '../enums/Role.enum.js';
import { Provider } from '../enums/Provider.enum.js';
import { Badge } from '../enums/Badge.enum.js';
import { Book } from '../../books/entities/book.entity.js';
import { BookLike } from '../../books/entities/book_like.entity.js';
import { BookComment } from '../../books/entities/book_comment.entity.js';
import { Poem } from '../../poems/entities/poem.entity.js';
import { PoemLike } from '../../poems/entities/poem_like.entity.js';
import { PoemComment } from '../../poems/entities/poem_comment.entity.js';
import { Sentence } from '../../sentences/entities/sentence.entity.js';
import { SentenceAgree } from '../../sentences/entities/sentence_agree.entity.js';
import { SentenceLike } from '../../sentences/entities/sentence_like.entity.js';
import { SentenceComment } from '../../sentences/entities/sentence_comment.entity.js';
import { Post } from '../../posts/entities/post.entity.js';
import { PostComment } from '../../posts/entities/post_comment.entity.js';
import { PostLike } from '../../posts/entities/post_like.entity.js';
import { Notification } from '../../notifications/entities/notification.entity.js';
import { Report } from '../../reports/entities/report.entity.js';
import { RefreshToken } from '../../auth/entities/refresh_token.entity.js';

@Entity()
export class User extends Base {
    @Column({ unique: true })
    nickname!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ type: 'enum', enum: Role })
    role!: Role;

    @Exclude({ toPlainOnly: true })
    @Column({ type: 'enum', enum: Provider })
    provider!: Provider;
    
    @Exclude({ toPlainOnly: true })
    @Column()
    providerId!: string;

    @Column({ type: 'varchar', nullable: true })
    profileImgUrl!: string | null;

    @Column({ default: 0 })
    experience!: number;

    @Column({ default: 1 })
    level!: number;

    @Column({ type: 'enum', enum: Badge, default: Badge.CHICK })
    badge!: Badge;

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens!: Relation<RefreshToken>[];

    @OneToMany(() => Book, (book) => book.user)
    books!: Relation<Book>[];

    @OneToMany(() => BookLike, (bookLike) => bookLike.user)
    bookLikes!: Relation<BookLike>[];

    @OneToMany(() => BookComment, (bookComment) => bookComment.user)
    bookComments!: Relation<BookComment>[];

    @OneToMany(() => Poem, (poem) => poem.user)
    poems!: Relation<Poem>[];

    @OneToMany(() => PoemLike, (poemLike) => poemLike.user)
    poemLikes!: Relation<PoemLike>[];

    @OneToMany(() => PoemComment, (poemComment) => poemComment.user)
    poemComments!: Relation<PoemComment>[];

    @OneToMany(() => Sentence, (sentence) => sentence.user)
    sentences!: Relation<Sentence>[];

    @OneToMany(() => SentenceAgree, (sentenceAgree) => sentenceAgree.sentence)
    sentenceAgrees!: Relation<SentenceAgree>[];

    @OneToMany(() => SentenceLike, (sentenceLike) => sentenceLike.user)
    sentenceLikes!: Relation<SentenceLike>[];

    @OneToMany(() => SentenceComment, (sentenceComment) => sentenceComment.user)
    sentenceComments!: Relation<SentenceComment>[];

    @OneToMany(() => Post, (post) => post.user)
    posts!: Relation<Post>[];

    @OneToMany(() => PostLike, (postLike) => postLike.user)
    postLikes!: Relation<PostLike>[];

    @OneToMany(() => PostComment, (postComment) => postComment.user)
    postComments!: Relation<PostComment>[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications!: Relation<Notification>[];

    @OneToMany(() => Report, (report) => report.reporter)
    reporter!: Relation<Report>[];

    @OneToMany(() => Report, (report) => report.reportedUser)
    reportedUser!: Relation<Report>[];
}
