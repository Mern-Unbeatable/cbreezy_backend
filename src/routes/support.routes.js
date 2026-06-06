import express from 'express';
import supportController from '../controllers/support.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/contact-us', supportController.submitContactMessage.bind(supportController));

// Admin routes
router.get('/admin/tickets', authenticate, authorize('ADMIN'), supportController.getTickets.bind(supportController));
router.get('/admin/tickets/:id', authenticate, authorize('ADMIN'), supportController.getTicketById.bind(supportController));
router.delete('/admin/tickets/:id', authenticate, authorize('ADMIN'), supportController.deleteTicket.bind(supportController));

export default router;