import crypto from 'crypto';
const randomToken = (size = 32) => crypto.randomBytes(size).toString('hex');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
export { randomToken, sha256 };
