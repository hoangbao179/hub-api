import * as express from 'express';
import RotatingProxyController from '../controllers/rotating-proxy/rotating-proxy.controller';
import { RotatingProxyService } from '../services/rotating-proxy/rotating-proxy.services';


const router = express.Router();

const proxyService = new RotatingProxyService();  
const rotatingProxyController = new RotatingProxyController(proxyService); 

router.get('/buy', rotatingProxyController.buyRotatingProxy);
router.get('/inventory', rotatingProxyController.getAmountInventory);

export default router;