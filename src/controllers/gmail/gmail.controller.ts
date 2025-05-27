import { IGmailService } from "services/gmail/igmail.services";
import { Request, Response } from 'express';

class GmailController {
    private gmailServices: IGmailService;

    constructor(gmailServices: IGmailService) {
        this.gmailServices = gmailServices;
    }
    // current gmail 2013 
    buyGmail = async (req: Request, res: Response): Promise<any> => {
        try {
            const { key, order_id, quantity } = req.query;
            if (!key || !order_id || !quantity) {
                return res.status(400).json({ error: 'Missing required parameters: key, order_id, quantity' });
            }
            const result = await this.gmailServices.buyGmail(key.toString(), order_id.toString(), Number(quantity));
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error });
        }
    };

    getAmountGmailInventory = async (req: Request, res: Response): Promise<any> => {
        try {
            const { key } = req.query;
            if (!key) {
                return res.status(400).json({ error: 'Missing required parameters: key' });
            }
            const result = await this.gmailServices.getGmailAmountInventory(key.toString());
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

};

export default GmailController;