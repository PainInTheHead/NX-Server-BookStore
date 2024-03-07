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
import { Favorites } from "./favorites.entity";

@Entity()
export class FavoriteBook {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Book, (book) => book.favorite)
  @JoinColumn()
  book: Book;

  @ManyToOne(() => Favorites, (favorite) => favorite.favbook)
  @JoinColumn()
  favorites: Favorites;
}
