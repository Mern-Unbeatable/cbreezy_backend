import supportService from '../services/support.service.js';

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class SupportController {
  async submitContactMessage(req, res, next) {
    try {
      const result = await supportService.submitContactMessage(req.body);

      return res.status(result.statusCode).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  async getTickets(req, res, next) {
    try {
      const result = await supportService.getTickets({
        query: req.query
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req, res, next) {
    try {
      const result = await supportService.getTicketById({
        id: req.params.id
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTicket(req, res, next) {
    try {
      const result = await supportService.deleteTicket({
        id: req.params.id
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new SupportController();