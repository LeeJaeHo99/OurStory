import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Poem } from "./poem.entity.js";

@Entity()
export class PoemComment extends Base{
    @ManyToOne(() => User, (user) => user.poemComments)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => Poem, (poem) => poem.poemComments)
    @JoinColumn({ name: 'poemId' })
    poem!: Poem;

    @ManyToOne(() => PoemComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent!: PoemComment | null;

    @OneToMany(() => PoemComment, (comment) => comment.parent)
    replies!: PoemComment[];

    @Column()
    text!: string;
}
