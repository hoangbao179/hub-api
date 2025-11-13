import { Request, Response } from 'express';
import { fulfillmentService } from '../../services/fulfillment/fulfillment.service';

export class FulfillmentController {
  public getByToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params as { token: string };
      const { statusCode, contentType, body } = await fulfillmentService.renderByToken(token);
      res.type(contentType).status(statusCode).send(body);
    } catch (e) {
      console.error('[fulfillmentController] error', e);
      res.type('text/plain').status(500).send('Internal Server Error');
    }
  };
}
export const fulfillmentController = new FulfillmentController();
