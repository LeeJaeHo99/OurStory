import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Book } from "./book.entity.js";

@Entity()
export class BookComment extends Base{
    @ManyToOne(() => User, (user) => user.bookComments)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => Book, (book) => book.bookComments)
    @JoinColumn({ name: 'bookId' })
    book!: Book;

    @ManyToOne(() => BookComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent!: BookComment | null;

    @OneToMany(() => BookComment, (comment) => comment.parent)
    replies!: BookComment[];

    @Column()
    text!: string;
}