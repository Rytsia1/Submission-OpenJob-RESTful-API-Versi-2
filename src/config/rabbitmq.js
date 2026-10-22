// [Dikerjakan oleh: Distania_9]

const {
  RABBITMQ_HOST,
  RABBITMQ_PORT = 5672,
  RABBITMQ_USER = 'guest',
  RABBITMQ_PASSWORD = 'guest',
} = process.env;

module.exports = {
  AMQP_URL: `amqp://${encodeURIComponent(RABBITMQ_USER)}:${encodeURIComponent(RABBITMQ_PASSWORD)}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`,
  APPLICATION_QUEUE: 'application:created',
};
