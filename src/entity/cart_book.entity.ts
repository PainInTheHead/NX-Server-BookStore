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
import { Cart } from "./cart.entity";

@Entity()
export class CartBook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  count: number;

  @ManyToOne(() => Book, (book) => book.cart)
  @JoinColumn()
  book: Book;

  @ManyToOne(() => Cart, (cartbook) => cartbook.cartbook)
  @JoinColumn()
  cart: Cart;
}
