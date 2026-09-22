import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Book } from "./book.entity.js";

@Entity()
export class BookComment extends Base{
    @ManyToOne(() => User, (user) => user.bookComments)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => Book, (book) => book.bookComments)
    @JoinColumn({ name: 'bookId' })
    book!: Relation<Book>;

    @ManyToOne(() => BookComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent!: Relation<BookComment> | null;

    @OneToMany(() => BookComment, (comment) => comment.parent)
    replies!: Relation<BookComment>[];

    @Column()
    text!: string;
}
