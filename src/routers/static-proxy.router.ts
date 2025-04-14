import * as express from 'express';
import { StaticProxyService } from '../services/static-proxy/static-proxy.services';
import StaticProxyController from '../controllers/static-proxy/static-proxy.controller';

const router = express.Router();

const proxyService = new StaticProxyService();  
const staticProxyController = new StaticProxyController(proxyService); 

router.get('/buy', staticProxyController.buyStaticProxy);
router.get('/inventory', staticProxyController.getAmountInventory);
router.get('/buy-ipv6', staticProxyController.buyStaticProxyV6);
router.get('/inventory-ipv6', staticProxyController.getAmountInventoryV6);
export default router;