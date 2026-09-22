import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    expiresAt!: Date;

    @Column({ default: false })
    revoked!: boolean;

    @Column()
    tokenHash!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => User, (user) => user.refreshTokens)
    user!: Relation<User>;
}
