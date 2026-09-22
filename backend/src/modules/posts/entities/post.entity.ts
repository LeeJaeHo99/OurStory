import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { User } from "../../users/entities/user.entity.js";
import { PostType } from "../enums/PostType.enum.js";
import { PostLike } from "./post_like.entity.js";
import { PostComment } from "./post_comment.entity.js";

@Entity()
export class Post extends Base{
    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @Column({ type: 'text', array: true, nullable: true })
    imageUrls!: string[] | null;
    
    @Column()
    title!: string;

    @Column({type: 'text', array: true})
    texts!: string[];

    @Column({ type: 'enum', enum: PostType })
    type!: PostType;

    @OneToMany(() => PostLike, (postLike) => postLike.post)
    postLikes!: Relation<PostLike>[];

    @OneToMany(() => PostComment, (postComments) => postComments.post)
    postComments!: Relation<PostComment>[];
}
