import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { BaseEntity } from "typeorm/repository/BaseEntity";

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column()
  title: string;

  @Column({ default: false })
  isEdit: boolean;

  @Column({ default: false })
  done: boolean;

  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.todo)
  @JoinColumn({ name: "userId" })
  user: User;
}
