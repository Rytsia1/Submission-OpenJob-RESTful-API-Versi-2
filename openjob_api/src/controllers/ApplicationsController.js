// [Dikerjakan oleh: Distania_9]

const { APPLICATION_QUEUE } = require('../config/rabbitmq');

class ApplicationsController {
  constructor(applicationsService, cacheService, producerService) {
    this._applicationsService = applicationsService;
    this._cacheService = cacheService;
    this._producerService = producerService;

    this.postApplicationHandler = this.postApplicationHandler.bind(this);
    this.getApplicationsHandler = this.getApplicationsHandler.bind(this);
    this.getApplicationByIdHandler = this.getApplicationByIdHandler.bind(this);
    this.getApplicationsByUserIdHandler = this.getApplicationsByUserIdHandler.bind(this);
    this.getApplicationsByJobIdHandler = this.getApplicationsByJobIdHandler.bind(this);
    this.putApplicationStatusHandler = this.putApplicationStatusHandler.bind(this);
    this.deleteApplicationHandler = this.deleteApplicationHandler.bind(this);
  }

  async postApplicationHandler(req, res, next) {
    try {
      const application = await this._applicationsService.addApplication(req.body);

      await this._cacheService.delete(
        `applications:user:${application.user_id}`,
        `applications:job:${application.job_id}`
      );

      // Notifikasi diproses asynchronous oleh consumer, tidak menahan response
      this._producerService
        .sendMessage(APPLICATION_QUEUE, { application_id: application.id })
        .catch((error) => console.error('Gagal mengirim message ke RabbitMQ:', error.message));

      return res.status(201).json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsHandler(req, res, next) {
    try {
      const applications = await this._applicationsService.getApplications();

      return res.status(200).json({
        status: 'success',
        data: {
          applications,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationByIdHandler(req, res, next) {
    try {
      const { id } = req.params;
      const application = await this._applicationsService.getApplicationById(id);

      return res.status(200).json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsByUserIdHandler(req, res, next) {
    try {
      const { userId } = req.params;
      const applications = await this._applicationsService.getApplicationsByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: {
          applications,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsByJobIdHandler(req, res, next) {
    try {
      const { jobId } = req.params;
      const applications = await this._applicationsService.getApplicationsByJobId(jobId);

      return res.status(200).json({
        status: 'success',
        data: {
          applications,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async putApplicationStatusHandler(req, res, next) {
    try {
      const { id } = req.params;
      await this._applicationsService.verifyApplicationOwner(id, req.user.id);
      const application = await this._applicationsService.editApplicationStatusById(id, req.body);
      await this._invalidateApplicationCache(application);

      return res.status(200).json({
        status: 'success',
        message: 'Status aplikasi berhasil diperbarui',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteApplicationHandler(req, res, next) {
    try {
      const { id } = req.params;
      await this._applicationsService.verifyApplicationOwner(id, req.user.id);
      const application = await this._applicationsService.deleteApplicationById(id);
      await this._invalidateApplicationCache(application);

      return res.status(200).json({
        status: 'success',
        message: 'Aplikasi berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }

  async _invalidateApplicationCache({ id, user_id, job_id }) {
    await this._cacheService.delete(
      `applications:${id}`,
      `applications:user:${user_id}`,
      `applications:job:${job_id}`
    );
  }
}

module.exports = ApplicationsController;
