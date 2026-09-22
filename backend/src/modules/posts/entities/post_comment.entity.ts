import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { Post } from "./post.entity.js";

@Entity()
export class PostComment extends Base{
    @ManyToOne(() => User, (user) => user.postComments)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => Post, (post) => post.postComments)
    @JoinColumn({ name: 'postId' })
    post!: Relation<Post>;

    @ManyToOne(() => PostComment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent!: Relation<PostComment> | null;

    @OneToMany(() => PostComment, (comment) => comment.parent)
    replies!: Relation<PostComment>[];

    @Column()
    text!: string;
}
