import { DataSource } from "typeorm";

export const myDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "123456",
  database: "NX-BOOK-DB",
  entities: [__dirname + "/**/*.entity{.ts, .js}"],
  logging: true,
  synchronize: true,
});
