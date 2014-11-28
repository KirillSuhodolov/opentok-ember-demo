import Ember from 'ember';
import User from 'wecudos/models/user';

//TODO: sessionId should been generated at server and send to app.
var sessionId = "2_MX40NTA5MzY3Mn5-MTQxNzA3MzM4Njk4MH5RbWVPNXNadUxibXBReWZiYjNCUlVGVUx-fg";

export default Ember.Component.extend({
  init: function() {
    this._super();
    /**
     * Local User is the user who is using application.
     * Remote User is another user.
     * In this demo app I create them at init hook. But at real you need link current session user to localUser,
     * and when clicking on button 'Start Consultation' set the remoteUser.
     */
    this.setProperties({
      pro: User.create({
        id: 1,
        name: 'Bob',
        token: 'T1==cGFydG5lcl9pZD00NTA5MzY3MiZzaWc9OGE4ZTExNGNkODRiOGRjZGJlMzk4YmVlMTYzNTYxODUzNTU2ZDU0Njpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTJfTVg0ME5UQTVNelkzTW41LU1UUXhOekEzTXpNNE5qazRNSDVSYldWUE5YTmFkVXhpYlhCUmVXWmlZak5DVWxWR1ZVeC1mZyZjcmVhdGVfdGltZT0xNDE3MDczNDI2Jm5vbmNlPTAuMDY5MDkwNTI4Nzc1Nzk4MTMmZXhwaXJlX3RpbWU9MTQxOTY2NTM1Mg=='
      }),

      user: User.create({
        id: 2,
        name: 'Jon',
        token: 'T1==cGFydG5lcl9pZD00NTA5MzY3MiZzaWc9Y2YzMjgwOTJhMGI4MTFhYjEzNTM1OTQwYTJhMjA1ZTgxZTg3ZDEyZjpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTJfTVg0ME5UQTVNelkzTW41LU1UUXhOekEzTXpNNE5qazRNSDVSYldWUE5YTmFkVXhpYlhCUmVXWmlZak5DVWxWR1ZVeC1mZyZjcmVhdGVfdGltZT0xNDE3MDczNDQ3Jm5vbmNlPTAuMDA5MDU0ODA1NDQzOTQ4MjEmZXhwaXJlX3RpbWU9MTQxOTY2NTM1Mg=='
      })
    });
  },

  willInsertElement: function() {
    this.set('openTok.component', this);
  },

  willDestroyElement: function() {
    this.set('openTok.component', null);
  },

  localVideoElement: 'local-video',
  localVideoOptions: {
    insertMode: "append",
    name: Ember.computed.alias('currentUser.name'),
    width:300,
    height:200
  },

  remoteVideoElement: 'remote-video',
  remoteVideoOptions: {
    insertMode: "append",
    name: Ember.computed.alias('currentUser.name'),
    width:400,
    height:300
  },

  isCallingNow: Ember.computed.alias('openTok.isCallingNow'),


  isInSession: function() {
    return this.get('openTok.isSessionConnected') && this.get('openTok.isConnectionCreated');
  }.property('openTok.isSessionConnected', 'openTok.isConnectionCreated'),

  /**
   * Only for test application
   */
  isPro: false,
  currentUser: function() {
    return this.get('isPro') ? this.get('pro') : this.get('user');
  }.property('pro', 'user', 'isPro'),

  pro: null,
  user: null,

  actions: {
    connect: function() {
      this.openTok.connect(this.get('currentUser.token'), sessionId);
    },

    disconnect: function() {
      this.openTok.disconnect();
    },

    initializeCall: function() {
      this.openTok.publish()
    },

    beginCall: function() {
      this.openTok.beginCall();
    },

    endCall: function() {
      this.openTok.endCall();
    }
  }
});
