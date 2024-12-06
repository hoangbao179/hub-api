import { IProxyService } from "../../services/proxy/iproxy.service";
import { Request, Response } from 'express';

class ProxyController {
    private proxyService: IProxyService;

    constructor(proxyService: IProxyService) {
        this.proxyService = proxyService;
    }

    buyProxy = async (req: Request, res: Response): Promise<any> => {
        try {
            const { key, order_id, quantity } = req.query;
            if (!key || !order_id || !quantity) {
                return res.status(400).json({ error: 'Missing required parameters: key, order_id, quantity' });
            }
            const result = await this.proxyService.buyProxy(key.toString(), order_id.toString(), Number(quantity));
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
};

export default ProxyController;