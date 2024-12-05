import * as express from 'express';
import ProxyController from '../controllers/proxy/proxy.controller';
import { ProxyService } from '../services/proxy/proxy.services';

const router = express.Router();

const proxyService = new ProxyService();  
const proxyController = new ProxyController(proxyService); 

router.post('/buy', proxyController.buyProxy);
router.get('/inventory', proxyController.getAmountInventory);

export default router;