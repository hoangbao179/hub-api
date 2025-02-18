import { Router } from 'express';
import proxyRouter from './static-proxy.router'; 

const router = Router();
router.use('/proxy', proxyRouter);  
export default router;
