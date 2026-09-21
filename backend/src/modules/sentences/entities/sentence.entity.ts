import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Book } from "../../books/entities/book.entity.js";
import { Poem } from "../../poems/entities/poem.entity.js";
import { SentenceAgree } from "./sentence_agree.entity.js";
import { SentenceComment } from "./sentence_comment.entity.js";
import { SentenceLike } from "./sentence_like.entity.js";

@Entity()
export class Sentence extends Base{
    @Column()
    text!: string;

    @ManyToOne(() => User, (user) => user.sentences)
    @JoinColumn({ name: 'userId' })
    user!: User;
    
    @ManyToOne(() => Book, (book) => book.sentences, { nullable: true })
    @JoinColumn({ name: 'bookId' })
    book!: Book | null;
    
    @ManyToOne(() => Poem, (poem) => poem.sentences, { nullable: true })
    @JoinColumn({ name: 'poemId' })
    poem!: Poem | null;
    
    @OneToMany(() => SentenceAgree, (sentenceAgree) => sentenceAgree.sentence)
    sentenceAgrees!: SentenceAgree[];

    @OneToMany(() => SentenceLike, (sentenceLike) => sentenceLike.sentence)
    sentenceLikes!: SentenceLike[];
    
    @OneToMany(() => SentenceComment, (sentenceComment) => sentenceComment.sentence)
    sentenceComments!: SentenceComment[];

}
