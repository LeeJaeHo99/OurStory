import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { Sentence } from "./sentence.entity.js";

@Entity()
export class SentenceLike {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.sentenceLikes)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => Sentence, (sentence) => sentence.sentenceLikes)
    @JoinColumn({ name: 'sentenceId' })
    sentence!: Relation<Sentence>;

    @CreateDateColumn()
    createdAt!: Date;
}
