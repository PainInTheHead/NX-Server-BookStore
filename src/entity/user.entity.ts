import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Rate } from "./book_rating.entity";

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

  @OneToMany(() => Rate, (rate) => rate.user)
  rate: Rate[];
}
