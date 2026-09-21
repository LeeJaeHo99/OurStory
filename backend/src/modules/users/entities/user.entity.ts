import { Column, Entity, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Base } from '../../../common/entities/Base.entity.js';
import { Role } from '../enums/Role.enum.js';
import { Provider } from '../enums/Provider.enum.js';
import { Badge } from '../enums/Badge.enum.js';

@Entity()
export class User extends Base {
    @Column({ unique: true })
    nickname!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ type: 'enum', enum: Role })
    role!: Role;

    @Exclude({ toPlainOnly: true })
    @Column({ type: 'enum', enum: Provider })
    provider!: Provider;
    
    @Exclude({ toPlainOnly: true })
    @Column()
    providerId!: string;

    @Column({ type: 'varchar', nullable: true })
    profileImgUrl!: string | null;

    @Column({ default: 0 })
    experience!: number;

    @Column({ default: 1 })
    level!: number;

    @Column({ type: 'enum', enum: Badge, default: Badge.CHICK })
    badge!: Badge;
}
