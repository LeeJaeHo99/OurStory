import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Poem } from "./poem.entity.js";

@Entity()
@Unique(['user', 'poem'])
export class PoemLike extends Base{
    @ManyToOne(() => User, (user) => user.poemLikes)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => Poem, (poem) => poem.poemLikes)
    @JoinColumn({ name: 'poemId' })
    poem!: Poem;
}
