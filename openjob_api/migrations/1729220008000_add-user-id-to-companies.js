// [Dikerjakan oleh: Distania_9]

exports.up = (pgm) => {
  // Pemilik company (job owner) untuk notifikasi email lamaran
  pgm.addColumn('companies', {
    user_id: {
      type: 'VARCHAR(50)',
      notNull: false,
      references: '"users"',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex('companies', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropColumn('companies', 'user_id');
};
