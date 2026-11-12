// [Dikerjakan oleh: Distania_9]

const amqp = require('amqplib');
const { AMQP_URL } = require('../config/rabbitmq');

const ProducerService = {
  sendMessage: async (queue, message) => {
    const connection = await amqp.connect(AMQP_URL);
    try {
      const channel = await connection.createChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
      await channel.close();
    } finally {
      await connection.close();
    }
  },
};

module.exports = ProducerService;
