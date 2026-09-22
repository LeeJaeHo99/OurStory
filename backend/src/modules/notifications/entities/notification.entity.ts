import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { NotificationType } from "../enums/NotificationType.enum.js";
import { ContentsType } from "../enums/ContentsType.enum.js";

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.notifications)
    @JoinColumn({ name: 'userId' })
    user!: Relation<User>;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'senderId' })
    sender!: Relation<User>;

    @CreateDateColumn()
    createdAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date | null;

    @Column({ type: 'enum', enum: NotificationType })
    type!: NotificationType;

    @Column({type: 'enum', enum: ContentsType})
    contentsType!: ContentsType;

    @Column()
    text!: string;

    @Column({default: false})
    isRead!: boolean;

    @Column()
    contentsId!: string;

    @Column()
    linkUrl!: string;
}
