// [Dikerjakan oleh: Distania_9]

const AuthorizationError = require('../exceptions/AuthorizationError');

class UsersController {
  constructor(usersService, cacheService) {
    this._usersService = usersService;
    this._cacheService = cacheService;

    this.postUserHandler = this.postUserHandler.bind(this);
    this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
    this.putUserByIdHandler = this.putUserByIdHandler.bind(this);
  }

  async postUserHandler(req, res, next) {
    try {
      const userId = await this._usersService.addUser(req.body);

      return res.status(201).json({
        status: 'success',
        data: {
          id: userId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserByIdHandler(req, res, next) {
    try {
      const { id } = req.params;
      const user = await this._usersService.getUserById(id);

      return res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async putUserByIdHandler(req, res, next) {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        throw new AuthorizationError('Anda tidak berhak mengubah user ini');
      }

      await this._usersService.editUserById(id, req.body);
      await this._cacheService.delete(`users:${id}`);

      return res.status(200).json({
        status: 'success',
        message: 'User berhasil diperbarui',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsersController;
