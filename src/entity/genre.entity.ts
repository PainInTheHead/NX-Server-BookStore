import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Book } from "./book.entity";
import { GenreBook } from "./genre-books.entity";

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => GenreBook, (bookGenre) => bookGenre.genres)
  genre: GenreBook[];
}
