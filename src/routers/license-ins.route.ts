// routes/license.route.ts
import { Router } from "express";
import LicenseController from "../controllers/license-ins/license-ins.controller";

const router = Router();

router.post("/check", LicenseController.checkLicense.bind(LicenseController));
router.get("/version", LicenseController.getVersion.bind(LicenseController));
export default router;
