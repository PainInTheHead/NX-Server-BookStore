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
import { FavoriteBook } from "./favorite_book.entity";

@Entity()
export class Favorites {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.favorites)
  @JoinColumn()
  userId: User;


  @OneToMany(() => FavoriteBook, (favbook) => favbook.favorites)
  favbook: FavoriteBook[]
}
