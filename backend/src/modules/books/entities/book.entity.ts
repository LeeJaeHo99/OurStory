import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { BookLike } from "./book_like.entity.js";
import { BookComment } from "./book_comment.entity.js";
import { Genre } from "../enums/Genre.enum.js";

@Entity()
export class Book extends Base {
    @Column()
    title!: string;

    @Column({ type: 'enum', enum: Genre })
    genre!: Genre;
    
    @Column()
    coverImgUrl: string;

    @ManyToOne(() => User, (user) => user.books)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @OneToMany(() => BookLike, (bookLike) => bookLike.book)
    bookLikes!: BookLike[];
    
    @OneToMany(() => BookComment, (bookComment) => bookComment.book)
    bookComments!: BookComment[];
}