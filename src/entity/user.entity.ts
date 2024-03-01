import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ default: "Guest" })
  userName: string;

  @Column()
  password: string;

  @Column({ default: null })
  avatar: string | null;
}
