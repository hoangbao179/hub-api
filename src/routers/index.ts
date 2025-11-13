import { Router } from 'express';
import proxyRouter from './static-proxy.router'; 
import gmailRouter from './gmail.router'; 
import rotatingProxyRouter from './rotating-proxy.router';
import licenseInstaRouter from './license-ins.route';
import licenseEmailRouter from './license-email.router';
import fulfillmentRouter from './fulfillment.router';

const router = Router();
router.use('/proxy', proxyRouter);
router.use('/rotating-proxy', rotatingProxyRouter);
router.use('/gmail', gmailRouter);
router.use("/license-insta", licenseInstaRouter);
router.use("/email", licenseEmailRouter);
router.use("/fulfillments", fulfillmentRouter);
export default router;
