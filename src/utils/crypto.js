const crypto = require('crypto');

const randomToken = (size = 32) => crypto.randomBytes(size).toString('hex');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

module.exports = { randomToken, sha256 };
