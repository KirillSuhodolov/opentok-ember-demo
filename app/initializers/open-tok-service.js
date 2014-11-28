export function initialize(container, application) {
  application.inject('component:openTok', 'openTok', 'service:open-tok');
}

export default {
  name: 'open-tok-service',
  initialize: initialize
};
