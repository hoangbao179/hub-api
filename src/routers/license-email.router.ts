import { Router } from "express";
import EmailController from "../controllers/license/license-email.controller"

const router = Router();

router.post("/create", EmailController.createEmail.bind(EmailController));
router.post("/read", EmailController.readEmail.bind(EmailController)); 

export default router;