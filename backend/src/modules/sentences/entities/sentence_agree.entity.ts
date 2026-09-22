import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { Sentence } from "./sentence.entity.js";
import { User } from "../../users/entities/user.entity.js";

@Entity()
@Unique(['user', 'sentence'])
export class SentenceAgree extends Base{
    @ManyToOne(() => Sentence, (sentence) => sentence.sentenceAgrees)
    @JoinColumn({ name: 'sentenceId' })
    sentence!: Relation<Sentence>;

    @ManyToOne(() => User, (user) => user.sentenceAgrees)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;
}
