import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Sentence } from "./sentence.entity.js";

@Entity()
export class SentenceComment extends Base{
    @ManyToOne(() => User, (user) => user.sentenceComments)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => Sentence, (sentence) => sentence.sentenceComments)
    @JoinColumn({ name: 'sentenceId' })
    sentence!: Relation<Sentence>;

    @ManyToOne(() => SentenceComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent!: Relation<SentenceComment> | null;

    @OneToMany(() => SentenceComment, (comment) => comment.parent)
    replies!: Relation<SentenceComment>[];

    @Column()
    text!: string;
}
