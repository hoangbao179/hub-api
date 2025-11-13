import * as express from 'express';
import { StaticProxyService } from '../services/static-proxy/static-proxy.services';
import StaticProxyController from '../controllers/static-proxy/static-proxy.controller';

const router = express.Router();

const proxyService = new StaticProxyService();  
const staticProxyController = new StaticProxyController(proxyService); 

router.get('/buy', staticProxyController.buyStaticProxy);
router.get('/inventory', staticProxyController.getAmountInventory);
router.get('/buy-socks5', staticProxyController.buyStaticProxySocks5);
router.get('/inventory-socks5', staticProxyController.getAmountInventorySocks5);
export default router;