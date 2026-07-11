class BasePublishAdapter {
  async publish(_post, _handle) {
    throw new Error('publish must be implemented');
  }
}

module.exports = BasePublishAdapter;
