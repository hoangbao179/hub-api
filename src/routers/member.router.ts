// src/routers/member.router.ts
import * as express from 'express';
import { MemberService } from '../services/member/member.service';
import { MemberProxyService } from '../services/member/member-proxy.service';
import MemberController from '../controllers/member/member.controller';

const router = express.Router();

const memberService = new MemberService();
const memberProxyService = new MemberProxyService(memberService);
const memberController = new MemberController(memberService, memberProxyService);

// GET /api/member/info?member_key=...
router.get('/info', memberController.getInfo);

// GET /api/member/proxy/buy?member_key=...&proxy_type=...&type=...&quantity=...&proxy_name=...&proxy_pass=...
router.get('/proxy/buy', memberController.buyProxy);

export default router;
