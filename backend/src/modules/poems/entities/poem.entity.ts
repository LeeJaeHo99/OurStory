import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Base } from "../../../common/entities/Base.entity.js";
import { Genre } from "../enums/Genre.enum.js";
import { User } from "../../users/entities/user.entity.js";
import { PoemLike } from "./poem_like.entity.js";
import { PoemComment } from "./poem_comment.entity.js";
import { Sentence } from "../../sentences/entities/sentence.entity.js";

@Entity()
export class Poem extends Base{
    @Column()
    title!: string;
    
    @Column({ type: 'enum', enum: Genre })
    genre!: Genre;

    @Column({ type: 'varchar', nullable: true })
    coverImgUrl!: string | null;

    @ManyToOne(() => User, (user) => user.poems)
    @JoinColumn({name: 'userId'})
    user!: Relation<User>;

    @OneToMany(() => PoemLike, (poemLike) => poemLike.poem)
    poemLikes!: Relation<PoemLike>[];
    
    @OneToMany(() => PoemComment, (poemComment) => poemComment.poem)
    poemComments!: Relation<PoemComment>[];

    @OneToMany(() => Sentence, (sentence) => sentence.poem)
    sentences!: Relation<Sentence>[];
}
