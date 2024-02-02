import { Todo } from "../entity/todo.entity";
import { myDataSource } from "./../../app-data-source";
import { Response } from "express";
import { RequestWithUser } from "./../Types/req.user";
import { Repository } from "typeorm";
import { User } from "../entity/user.entity";

const todoRepositoriy = myDataSource.getRepository(Todo);
interface PaginateFilter {
  user: User;
  done?: boolean;
}

export const createTodo = async function (req: RequestWithUser, res: Response) {
  const { title } = req.body;

  const newTodo = todoRepositoriy.create({
    title: title,
    date: new Date(),
    user: req.user,
  });

  try {
    await todoRepositoriy.save(newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при создании todo" });
  }
};

export const getTodo = async function (req: RequestWithUser, res: Response) {
  try {
    const user = req.user;
    const todos = await todoRepositoriy.findBy({ user: user });
    if (!todos) {
      return res.status(404).json({ message: "Тудухи не найдены" });
    }
    res.status(200).json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при получении тасок" });
  }
};

export const deleteTodo = async function (req: RequestWithUser, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = req.user;
    const todo = await todoRepositoriy.findOneBy({ user: user, _id: id });
    if (!todo) {
      return res
        .status(404)
        .json({ message: "Задача для удаления не найдена" });
    }
    await todoRepositoriy.remove(todo);
    return res.status(200).json(todo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ошибка сервера при удалении задачи" });
  }
};

export const selectTodo = async function (req: RequestWithUser, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = req.user;
    const todo = await todoRepositoriy.findOneBy({ user: user, _id: id });
    if (!todo) {
      return res.status(404).json({ message: "Нечего удалять" });
    }
    todo.done = !todo.done;
    await todoRepositoriy.save(todo);
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

export const clearHolder = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const user = req.user;
    const todos = await todoRepositoriy.findBy({ user: user });
    if (!todos) {
      return res.status(404).json({ message: "Нечего удалять" });
    }
    await todoRepositoriy.remove(todos);
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

export const clearComplited = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const user = req.user;
    const todos = await todoRepositoriy.findBy({ user: user, done: true });
    if (!todos) {
      return res.status(404).json({ message: "Нечего удалять" });
    }
    await todoRepositoriy.remove(todos);
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

export const allSelectTodo = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const user = req.user;
    const todos = await todoRepositoriy.findBy({ user: user });
    const selectOption = todos.every((todo) => todo.done);
    todos.forEach(async (todo) => {
      todo.done = !selectOption;
      await todoRepositoriy.save(todo);
    });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

export const editTodo = async function (req: RequestWithUser, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = req.user;
    const todo = await todoRepositoriy.findOneBy({ _id: id, user: user });
    const { title } = req.body;
    todo.title = title;
    await todoRepositoriy.save(todo);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

export const paginationTodos = async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user;
    const filter = String(req.query.filter);
    const take = 5;

    const page = Number(req.query.page);
    const skip = isNaN(page) ? 0 : (page - 1) * take;

    const paginateFilter: PaginateFilter = { user: user };
    if (filter === "complete") {
      paginateFilter.done = true;
    } else if (filter === "active") {
      paginateFilter.done = false;
    }

    const [docs, todosCount] = await todoRepositoriy.findAndCount({
      where: paginateFilter,
      take: take,
      skip: skip,
      order: {
        date: "DESC",
      },
    });

    const doneTodosCount = await todoRepositoriy.count({
      where: { done: true, user: user },
    });
    const notDoneTodosCount = await todoRepositoriy.count({
      where: { done: false, user: user },
    });
    const totalCount = await todoRepositoriy.count({ where: { user: user } });
    const pageCount = Math.ceil(todosCount / take);

    res.json({
      docs,
      todosCount,
      pageCount,
      doneTodosCount,
      notDoneTodosCount,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
