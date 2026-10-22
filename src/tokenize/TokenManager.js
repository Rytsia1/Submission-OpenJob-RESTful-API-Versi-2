// [Dikerjakan oleh: Distania_9]

const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const AuthenticationError = require('../exceptions/AuthenticationError');

const TokenManager = {
  generateAccessToken: (payload) => {
    const secret = process.env.ACCESS_TOKEN_KEY;
    const expiresIn = parseInt(process.env.ACCESS_TOKEN_AGE || '10800', 10);
    return jwt.sign(payload, secret, { expiresIn });
  },

  generateRefreshToken: (payload) => {
    const secret = process.env.REFRESH_TOKEN_KEY;
    // jwtid unik agar dua login dalam detik yang sama tidak menghasilkan token kembar
    return jwt.sign(payload, secret, { jwtid: nanoid() });
  },

  verifyAccessToken: (token) => {
    try {
      const secret = process.env.ACCESS_TOKEN_KEY;
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Access token tidak valid');
    }
  },

  verifyRefreshToken: (token) => {
    try {
      const secret = process.env.REFRESH_TOKEN_KEY;
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid');
    }
  },
};

module.exports = TokenManager;
