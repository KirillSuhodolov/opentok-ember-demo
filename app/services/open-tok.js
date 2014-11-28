import Ember from 'ember';
import config from 'wecudos/config/environment';

export default Ember.Object.extend({
  createSession: function(sessionId) {
    OT.on('exception', function(){
      Ember.Logger.error('Exception', event.code, event.message);
    });

    if (OT.checkSystemRequirements() === 1) {
      var session = OT.initSession(config.openTok.apiKey, sessionId);

      session.on({
        streamCreated: Ember.run.bind(this, this.streamCreatedInSession),
        streamDestroyed: Ember.run.bind(this, this.streamDestroyedInSession),
        connectionCreated: Ember.run.bind(this, this.connectionCreated),
        connectionDestroyed: Ember.run.bind(this, this.connectionDestroyed),
        sessionConnected: Ember.run.bind(this, this.sessionConnected),
        sessionDisconnected: Ember.run.bind(this, this.sessionDisconnected),
        "signal:begincall": Ember.run.bind(this, this.signalBeginCall),
        "signal:acceptcall": Ember.run.bind(this, this.signalAcceptCall),
        "signal:rejectcall": Ember.run.bind(this, this.signalRejectCall),
        "signal:endcall": Ember.run.bind(this, this.signalEndCall),
        "signal:initializecall": Ember.run.bind(this, this.signalInitializeCall),
      });

      this.set('session', session);
    } else {
      alert('Sorry, but your browser not support WebRTC');
    }
  },

  component: null,

  session: null,

  localStream: null,
  remoteStream: null,
  streams: [],
  connections: [],
  /**
   * session.getPublisherForStream(stream) get publisher.
   */
  publisher: null,

  /**
   * session.getSubscribersForStream(stream) get subscribers.
   */
  subscribers: null,

  isConnectionCreated: false,
  isSessionConnected: false,

  isOutgoingCall: function() {
    return this.get('publisher') && !this.get('subscribers.length');
  }.property('publisher', 'subscribers.length'),

  isCallingNow: function() {
    return this.get('publisher') && this.get('subscribers.length');
  }.property('publisher', 'subscribers.length'),

  //TODO: refactor
  isIncomingCall: function() {
    return this.get('stream') && !this.get('publisher') && !this.get('subscriber');
  }.property('stream', 'publisher', 'subscriber'),

  connect: function(token, sessionId) {
    this.createSession(sessionId);

    this.get('session').connect(token, function(error) {
      if (error) {
        Ember.Logger.error("Error connecting: ", error);
      } else {
        Ember.Logger.debug("Connected to the session.");
      }
    });
  },

  disconnect: function() {
    this.get('session').disconnect();
    Ember.Logger.debug("Disconnected from the session.");
  },

  publish: function() {
    this._publish(this.get('component.localVideoElement'), this.get('component.localVideoOptions'));
  },

  _publish: function(targetElement, params) {
    if (!this.get('publisher')) {
      var publisher = OT.initPublisher(targetElement, params);

      publisher.on({
        streamCreated: Ember.run.bind(this, this.streamCreatedByPublisher),
        streamDestroyed: Ember.run.bind(this, this.streamDestroyedByPublisher),
        destroyed: Ember.run.bind(this, this.publisherDestroyed),
      });

      this.set('publisher', publisher);
      this.get('session').publish(publisher);
    }
  },

  unpublish: function() {
    var publisher = this.get('publisher');
    this.get('session').unpublish(publisher);
    publisher.destroy();
  },

  subscribe: function(stream) {
    this._subscribe(stream, this.get('component.remoteVideoElement'), this.get('component.remoteVideoOptions'));
  },

  _subscribe: function(stream, targetElement, params) {
    var session = this.get('session');
    if (stream.connection.connectionId !== session.connection.connectionId) {
      targetElement = targetElement || this.get('component.remoteVideoElement');
      params = params || this.get('component.remoteVideoOptions');

      var subscriber = session.subscribe(stream, targetElement, params);
      this.get('subscribers').addObject(subscriber);
    }
  },

  unsubscribe: function(stream) {
    var subscriber = this.get('subscribers').findBy('stream.streamId', stream.streamId);
    this.get('session').unsubscribe(subscriber);
    this.get('subscribers').removeObject(subscriber);
  },

  sendSignal: function(params, callback) {
    //TODO: if one session and many users and streams we can find by stream.connection.data(our user/pro)
    callback = callback || function (error) {
      if (error) {
        Ember.Logger.error("signal error:", error.reason);
      } else {
        Ember.Logger.debug("signal sent: begincall");
      }
    };

    this.get('session').signal(params, callback);
  },

  initializeCall: function() {
    this._initializeCall(this.get('connections.firstObject'));
  },

  _initializeCall: function(connection) {
    var localStream = this.get('localStream');

    this.sendSignal({
      type: "initializecall",
      to: connection,
      data: {
        streamId: localStream.streamId,
        streamName: localStream.name
      }
    });
  },

  beginCall: function() {
    //TODO: validate more than one stream
    this._beginCall(this.get('streams.firstObject'));
  },

  _beginCall: function(stream) {
    var localStream = this.get('localStream');

    this.set('remoteStream', stream);

    this.sendSignal({
      type: "begincall",
      to: stream.connection,
      data: {
        streamId: localStream.streamId,
        streamName: localStream.name
      }
    });
  },

  endCall: function() {
    var remoteStream = this.get('remoteStream'),
      localStream = this.get('localStream');

    this.unsubscribe(remoteStream);

    this.sendSignal({
      type: "endcall",
      to:  remoteStream.connection,
      data: {
        streamId: localStream.streamId,
        streamName: localStream.name
      }
    });
  },

  acceptCall: function() {
    var localStream = this.get('localStream'),
      remoteStream = this.get('streams.firstObject');

    this.sendSignal({
      type: "acceptcall",
      to: remoteStream.connection,
      data: {
        streamId: localStream.streamId,
        streamName: localStream.name
      }
    });
  },

  /**
   * Session Handlers
   */

  /**
   * Fires in every local and remote new stream
   * @param event
   */
  streamCreatedInSession: function(event) {
    var session = this.get('session');
    if (event.stream.connection.connectionId !== session.connection.connectionId) {
      this.get('streams').addObject(event.stream);
    }
  },

  /**
   * Fires on every local and remote stop streaming
   * @param event
   */
  streamDestroyedInSession: function(event) {
    var session = this.get('session');
    if (event.stream.connection.connectionId !== session.connection.connectionId) {
      this.get('streams').removeObject(event.stream);
    }
  },

  /**
   * Fires on every local and remote connection.
   * @param event
   */
  connectionCreated: function(event) {
    var session = this.get('session');
    if (event.connection.connectionId === session.connection.connectionId) {
      this.set('isConnectionCreated', true);
    } else {
      this.get('connections').addObject(event.connection);
    }
  },

  /**
   * Fires on every local and remote connection.
   * @param event
   */
  connectionDestroyed: function(event) {
    var session = this.get('session');
    if (event.connection.connectionId === session.connection.connectionId) {
      this.set('isConnectionCreated', false);
    } else {
      this.get('connections').removeObject(event.connection);
    }
  },

  /**
   * Fires once at local application
   * @param event
   */
  sessionConnected: function(event) {
    this.set('isSessionConnected', true);
  },

  /**
   * Fires once at local application
   * @param event
   */
  sessionDisconnected: function(event) {
    this.set('isSessionConnected', false);

    //TODO: check if publisher, subscriber, stream props is null
    //alert(this.get('publisher'));
    //alert(this.get('subscribers'));
    //alert(this.get('streams'));
    //alert(this.get('localStream'));
    //alert(this.get('remoteStream'));
  },

  /**
   * Signal Session Handlers
   * @param event
   */

  signalBeginCall: function(event) {
    var name = event.data.name,
      streams = this.get('streams'),
      localStream = this.get('localStream'),
      stream = streams.findBy('streamId', event.data.streamId);

    if (confirm('Accept call from ' + name + ' ?')) {
      this.subscribe(stream);

      this.sendSignal({
        type: "acceptcall",
        to: stream.connection,
        data: {
          streamId: localStream.streamId,
          streamName: localStream.name
        }
      });
    } else {
      this.sendSignal({
        type: "rejectcall",
        to: stream.connection,
        data: {
          streamId: null,
          streamName: null
        }
      });
    }
  },

  signalAcceptCall: function(event) {
    var name = event.data.name,
      streams = this.get('streams'),
      localStream = this.get('localStream'),
      stream = streams.findBy('streamId', event.data.streamId);

    this.subscribe(stream);
  },

  signalRejectCall: function(event) {
    var name = event.data.name,
      streams = this.get('streams'),
      localStream = this.get('localStream'),
      stream = streams.findBy('streamId', event.data.streamId);

    this.unpublish(this.get('publisher'));
    this.disconnect();

    alert('Call rejected by ' + name);
  },

  signalEndCall: function(event) {
    var name = event.data.name,
      streams = this.get('streams'),
      localStream = this.get('localStream'),
      stream = streams.findBy('streamId', event.data.streamId);

    this.unsubscribe(stream);
  },

  signalInitializeCall: function(event) {
    var name = event.data.name,
      streams = this.get('streams'),
      localStream = this.get('localStream'),
      stream = streams.findBy('streamId', event.data.streamId);

    //event.from return initializator
    if (confirm('Accept call from ' + name + ' ?')) {
      this.subscribe(stream);
      this.publish();
    } else {
      this.sendSignal({
        type: "rejectcall",
        to: stream.connection,
        data: {
          streamId: null,
          streamName: null
        }
      });
      this.disconnect();
    }
  },

  /**
   * Publisher Handlers
   * @param event
   */

  streamCreatedByPublisher: function(event) {
    this.set('localStream', event.stream);
    if (Em.isEmpty(this.get('subscribers'))) {
      this.initializeCall();
    } else {
      this.acceptCall()
    }
  },

  streamDestroyedByPublisher: function (event) {
    this.set('localStream', null);
  },

  publisherDestroyed: function(event) {
    this.set('publisher', null);
  }
});
