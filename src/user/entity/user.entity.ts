import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class user {

    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    forgotPassToken: string;

    @Column({ nullable: true })
    forgotPassExpires: Date;
}