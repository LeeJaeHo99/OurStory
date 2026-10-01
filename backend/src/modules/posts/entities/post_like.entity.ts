import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Post } from "./post.entity.js";

@Entity()
@Unique(['user', 'post'])
export class PostLike extends Base{
    @ManyToOne(() => User, (user) => user.postLikes)
    @JoinColumn({ name: 'user_id' })
    user!: Relation<User>;
    
    @ManyToOne(() => Post, (post) => post.postLikes)
    @JoinColumn({ name: 'post_id' })
    post!: Relation<Post>;
}
