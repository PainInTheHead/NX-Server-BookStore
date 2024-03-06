import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
  JoinTable,
} from "typeorm";
import { Genre } from "./genre.entity";
import { Book } from "./book.entity";

@Entity()
export class GenreBook {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Genre, (genre) => genre.genre)
  @JoinColumn()
  genres: Genre;

  @ManyToOne(() => Book, (book) => book.genre)
  @JoinColumn()
  booksId: Book;
}
