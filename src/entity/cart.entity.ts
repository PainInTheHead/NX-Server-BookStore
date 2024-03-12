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
import { CartBook } from "./cart_book.entity";
  
  @Entity()
  export class Cart {
    @PrimaryGeneratedColumn()
    id: number;


  
    @OneToOne(() => User, (user) => user.cart)
    @JoinColumn()
    userId: User;
  
  
    @OneToMany(() => CartBook, (cartbook) => cartbook.cart)
    @JoinColumn()
    cartbook: CartBook[]
  }
  