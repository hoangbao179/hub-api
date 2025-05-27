import GmailController from '../controllers/gmail/gmail.controller';
import * as express from 'express';
import { GmailService } from '../services/gmail/gmail.services';

const router = express.Router();
const gmailService = new GmailService();  
const gmailController = new GmailController(gmailService); 

router.get('/buy', gmailController.buyGmail);
router.get('/inventory', gmailController.getAmountGmailInventory);
export default router;