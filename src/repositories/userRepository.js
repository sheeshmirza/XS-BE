const User = require('../models/User');

class UserRepository {
  create(payload) {
    return User.create(payload);
  }

  findById(id) {
    return User.findById(id);
  }

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByVerificationToken(token) {
    return User.findOne({ emailVerificationToken: token });
  }

  findByResetToken(token) {
    return User.findOne({ resetPasswordToken: token });
  }

  updateById(id, payload) {
    return User.findByIdAndUpdate(id, payload, { new: true });
  }

  deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
