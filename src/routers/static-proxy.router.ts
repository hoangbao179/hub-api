import * as express from 'express';
import { StaticProxyService } from '../services/proxy/static-proxy.services';
import StaticProxyController from '../controllers/static-proxy/static-proxy.controller';

const router = express.Router();

const proxyService = new StaticProxyService();  
const staticProxyController = new StaticProxyController(proxyService); 

router.get('/buy', staticProxyController.buyStaticProxy);
router.get('/inventory', staticProxyController.getAmountInventory);

export default router;