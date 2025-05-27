import { Router } from 'express';
import proxyRouter from './static-proxy.router'; 
import gmailRouter from './gmail.router'; 
import rotatingProxyRouter from './rotating-proxy.router';

const router = Router();
router.use('/proxy', proxyRouter);
router.use('/rotating-proxy', rotatingProxyRouter);
router.use('/gmail', gmailRouter);
export default router;
