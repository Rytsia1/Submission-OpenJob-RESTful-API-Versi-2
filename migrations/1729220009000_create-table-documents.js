// [Dikerjakan oleh: Distania_9]

exports.up = (pgm) => {
  pgm.createTable('documents', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    filename: {
      type: 'TEXT',
      notNull: true,
    },
    original_name: {
      type: 'TEXT',
      notNull: true,
    },
    size: {
      type: 'INTEGER',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('documents', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
};
