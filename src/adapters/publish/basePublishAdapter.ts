class BasePublishAdapter {
  async publish(_post: any, _handle: any): Promise<any> { throw new Error('publish must be implemented'); } }
export default BasePublishAdapter;
