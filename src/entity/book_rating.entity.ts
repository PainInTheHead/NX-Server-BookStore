import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Book } from "./book.entity";
import { User } from "./user.entity";

@Entity()
export class Rate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  value: number;

  @ManyToOne(() => Book, (book) => book.rates)
  @JoinColumn()
  book: Book;

  @ManyToOne(() => User, (user) => user.rate)
  @JoinColumn()
  user: number;

}
