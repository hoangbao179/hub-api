import { Router } from 'express';
import proxyRouter from './static-proxy.router'; 
import rotatingProxyRouter from './rotating-proxy.router';

const router = Router();
router.use('/proxy', proxyRouter);
router.use('/rotating-proxy', rotatingProxyRouter);
export default router;
