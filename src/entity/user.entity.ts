import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Rate } from "./book_rating.entity";
import { Favorites } from "./favorites.entity";
import { Cart } from "./cart.entity";
import { Comments } from "./comments.entity";
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

  @OneToOne(() => Favorites, (favorites) => favorites.userId)
  favorites: Favorites;

  @OneToOne(() => Cart, (cart) => cart.userId)
  cart: Cart;

  @OneToMany(() => Comments, (comments) => comments.user)
  comments: Comments[];
}
