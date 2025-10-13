import { Hono } from 'hono';
import { userController } from '../controllers/user.controller';

const userRoutes = new Hono();

userRoutes.get('/', userController.getUsers);

export default userRoutes;
