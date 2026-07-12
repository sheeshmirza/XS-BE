import BasePublishAdapter from './basePublishAdapter';
class InstagramPublishAdapter extends BasePublishAdapter { async publish(_post, _handle) { return { status: 'failed',
      message: 'Instagram publishing requires business account media container flow',
      raw: { note: 'Implement media container + publish endpoint for your account type' } }; } }
export default InstagramPublishAdapter;
