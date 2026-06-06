import adminUserService from '../services/admin-user.service.js';

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class AdminUserController {
  async getUsers(req, res, next) {
    try {
      const result = await adminUserService.getUsers({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const result = await adminUserService.getUserById({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const result = await adminUserService.updateUser({
        id: req.params.id,
        body: req.body,
        baseUrl: getBaseUrl(req)
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await adminUserService.deleteUser({
        id: req.params.id,
        adminUserId: req.user.userId
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminUserController();