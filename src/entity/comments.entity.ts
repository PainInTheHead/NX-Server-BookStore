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
  export class Comments {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    value: string;

    @Column()
    date: Date;
  
    @ManyToOne(() => Book, (book) => book.comments)
    @JoinColumn()
    book: Book;
  
    @ManyToOne(() => User, (user) => user.comments)
    @JoinColumn()
    user: User;
  
  }
  