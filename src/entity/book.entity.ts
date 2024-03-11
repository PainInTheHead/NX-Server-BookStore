import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { GenreBook } from "./genre-books.entity";
import { Rate } from "./book_rating.entity";
import { Author } from "./author.entity";
import { FavoriteBook } from "./favorite_book.entity";

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column({ default: false })
  liked: boolean;

  @OneToMany(() => GenreBook, (genre) => genre.booksId)
  genre: GenreBook;

  @OneToMany(() => Rate, (rate) => rate.book)
  rates: number;

  @ManyToOne(() => Author, (auth) => auth.book)
  @JoinColumn()
  auth: Author;

  @OneToMany(() => FavoriteBook, (favorite) => favorite.book)
  @JoinColumn()
  favorite: FavoriteBook[];
}
