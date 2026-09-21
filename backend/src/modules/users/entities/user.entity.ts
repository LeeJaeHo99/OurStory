import { Column, Entity, OneToMany } from 'typeorm';
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

    @OneToMany(() => Book, (book) => book.user)
    books!: Book[];

    @OneToMany(() => BookLike, (bookLike) => bookLike.user)
    bookLikes!: BookLike[];

    @OneToMany(() => BookComment, (bookComment) => bookComment.user)
    bookComments!: BookComment[];

    @OneToMany(() => Poem, (poem) => poem.user)
    poems!: Poem[];

    @OneToMany(() => PoemLike, (poemLike) => poemLike.user)
    poemLikes!: PoemLike[];

    @OneToMany(() => PoemComment, (poemComment) => poemComment.user)
    poemComments!: PoemComment[];
}