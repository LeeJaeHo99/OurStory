import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { Sentence } from "./sentence.entity.js";

@Entity()
export class SentenceLike {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.sentenceLikes)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => Sentence, (sentence) => sentence.sentenceLikes)
    @JoinColumn({ name: 'sentenceId' })
    sentence!: Sentence;

    @CreateDateColumn()
    createdAt!: Date;
}