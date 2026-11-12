// [Dikerjakan oleh: Distania_9]

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');

// Exception & Middleware
const NotFoundError = require('./exceptions/NotFoundError');
const errorHandler = require('./middlewares/errorHandler');

// Token Manager
const TokenManager = require('./tokenize/TokenManager');

// Services
const UsersService = require('./services/UsersService');
const AuthenticationsService = require('./services/AuthenticationsService');
const CompaniesService = require('./services/CompaniesService');
const CategoriesService = require('./services/CategoriesService');
const JobsService = require('./services/JobsService');
const ApplicationsService = require('./services/ApplicationsService');
const BookmarksService = require('./services/BookmarksService');
const DocumentsService = require('./services/DocumentsService');
const CacheService = require('./cache/CacheService');
const ProducerService = require('./mq/ProducerService');

// Controllers
const UsersController = require('./controllers/UsersController');
const AuthenticationsController = require('./controllers/AuthenticationsController');
const CompaniesController = require('./controllers/CompaniesController');
const CategoriesController = require('./controllers/CategoriesController');
const JobsController = require('./controllers/JobsController');
const ApplicationsController = require('./controllers/ApplicationsController');
const BookmarksController = require('./controllers/BookmarksController');
const ProfilesController = require('./controllers/ProfilesController');
const DocumentsController = require('./controllers/DocumentsController');

// Routers
const createUsersRouter = require('./routes/users');
const createAuthenticationsRouter = require('./routes/authentications');
const createCompaniesRouter = require('./routes/companies');
const createCategoriesRouter = require('./routes/categories');
const createJobsRouter = require('./routes/jobs');
const createApplicationsRouter = require('./routes/applications');
const createBookmarksRouter = require('./routes/bookmarks');
const createProfilesRouter = require('./routes/profiles');
const createDocumentsRouter = require('./routes/documents');

const createApp = () => {
  const app = express();

  app.use(express.json());

  // Instantiate Services
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const companiesService = new CompaniesService();
  const categoriesService = new CategoriesService();
  const jobsService = new JobsService();
  const applicationsService = new ApplicationsService();
  const bookmarksService = new BookmarksService();
  const documentsService = new DocumentsService();
  const cacheService = new CacheService();

  // Instantiate Controllers
  const usersController = new UsersController(usersService, cacheService);
  const authenticationsController = new AuthenticationsController(
    authenticationsService,
    usersService,
    TokenManager
  );
  const companiesController = new CompaniesController(companiesService, cacheService);
  const categoriesController = new CategoriesController(categoriesService);
  const jobsController = new JobsController(jobsService);
  const applicationsController = new ApplicationsController(applicationsService, cacheService, ProducerService);
  const bookmarksController = new BookmarksController(bookmarksService, cacheService);
  const profilesController = new ProfilesController(usersService, applicationsService, bookmarksService);
  const documentsController = new DocumentsController(documentsService);

  // Mount Routes
  app.use('/users', createUsersRouter(usersController, cacheService));
  app.use('/authentications', createAuthenticationsRouter(authenticationsController));
  app.use('/companies', createCompaniesRouter(companiesController, cacheService));
  app.use('/categories', createCategoriesRouter(categoriesController));
  app.use('/jobs', createJobsRouter(jobsController, bookmarksController));
  app.use('/applications', createApplicationsRouter(applicationsController, cacheService));
  app.use('/bookmarks', createBookmarksRouter(bookmarksController, cacheService));
  app.use('/profile', createProfilesRouter(profilesController));
  app.use('/documents', createDocumentsRouter(documentsController));

  // Catch undefined routes
  app.use((req, res, next) => {
    next(new NotFoundError('Resource tidak ditemukan'));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
