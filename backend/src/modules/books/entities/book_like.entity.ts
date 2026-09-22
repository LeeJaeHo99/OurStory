import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { Book } from "./book.entity.js";

@Entity()
@Unique(['user', 'book'])
export class BookLike {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.bookLikes)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => Book, (book) => book.bookLikes)
    @JoinColumn({ name: 'bookId' })
    book!: Relation<Book>;

    @CreateDateColumn()
    createdAt!: Date;
}
