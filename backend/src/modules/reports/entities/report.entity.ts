import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { Base } from '../../../common/entities/Base.entity.js';
import { ReportContentsType } from '../enums/ReportContentsType.enum.js';
import { ReportType } from '../enums/ReportType.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity()
export class Report extends Base {
    @Column({ type: 'enum', enum: ReportContentsType })
    contentsType!: ReportContentsType;
    
    @Column({ type: 'enum', enum: ReportType })
    reportType!: ReportType;

    @ManyToOne(() => User, (user) => user.reporter)
    @JoinColumn({ name: 'reporterId' })
    reporter!: Relation<User>;
    
    @ManyToOne(() => User, (user) => user.reportedUser)
    @JoinColumn({ name: 'reportedUserId' })
    reportedUser!: Relation<User>;

    @Column()
    contentsId!: string;

    @Column()
    comment!: string;
}
