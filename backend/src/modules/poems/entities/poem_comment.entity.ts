import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Poem } from "./poem.entity.js";

@Entity()
export class PoemComment extends Base{
    @ManyToOne(() => User, (user) => user.poemComments)
    @JoinColumn({ name: 'user_id' })
    user!: Relation<User>;

    @ManyToOne(() => Poem, (poem) => poem.poemComments)
    @JoinColumn({ name: 'poem_id' })
    poem!: Relation<Poem>;

    @ManyToOne(() => PoemComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent!: Relation<PoemComment> | null;

    @OneToMany(() => PoemComment, (comment) => comment.parent)
    replies!: Relation<PoemComment>[];

    @Column()
    text!: string;
}
