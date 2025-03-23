import { IRotatingProxyService } from "services/rotating-proxy/irotating-proxy.services";
import { Request, Response } from 'express';

class RotatingProxyController {
    private proxyService: IRotatingProxyService;

    constructor(proxyService: IRotatingProxyService) {
        this.proxyService = proxyService;
    }

    buyRotatingProxy = async (req: Request, res: Response): Promise<any> => {
        try {
            const { key, order_id, quantity } = req.query;
            if (!key || !order_id || !quantity) {
                return res.status(400).json({ error: 'Missing required parameters: key, order_id, quantity' });
            }
            const result = await this.proxyService.buyRotatingProxy(key.toString(), order_id.toString(), Number(quantity));
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error });
        }
    };

    getAmountInventory = async (req: Request, res: Response): Promise<any> => {
        try {
            try {
                const result = await this.proxyService.getAmountInventory();
                return res.status(200).json(result);
            } catch (error) {
                return res.status(500).json({ error: "Error while calling the proxy service" });
            }

        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    getInfoProxy = async (req: Request, res: Response): Promise<any> =>{
        try {
            const { key, region } = req.query;

            if (!key) {
                return res.status(400).json({ message: 'Missing required "key" parameter' });
            }
    
            const result = await this.proxyService.getInfoProxy(key, region);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error });
        }
    };
};

export default RotatingProxyController;