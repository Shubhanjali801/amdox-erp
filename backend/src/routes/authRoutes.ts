import { Router } from 'express';
import * as auth from '../controllers/authController';
const r = Router();
r.post('/login',    auth.login);
r.post('/register', auth.register);
r.post('/refresh',  auth.refresh);
r.post('/logout',   auth.logout);
r.get('/me',        auth.me);
export default r;
