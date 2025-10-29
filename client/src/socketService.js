import io from 'socket.io-client';
import config from './config';

let socket = null;

const socketService = {
  /**
   * Initialize Socket.io connection
   */
  connect: () => {
    if (socket) {
      return socket;
    }

    socket = io(config.SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return socket;
  },

  /**
   * Disconnect Socket.io
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Join a scan room for real-time updates
   */
  joinScan: (scanId) => {
    if (socket) {
      socket.emit('join_scan', { scanId });
    }
  },

  /**
   * Leave a scan room
   */
  leaveScan: (scanId) => {
    if (socket) {
      socket.emit('leave_scan', { scanId });
    }
  },

  /**
   * Listen for scan progress updates
   */
  onScanProgress: (scanId, callback) => {
    if (socket) {
      socket.on(`progress_${scanId}`, callback);
    }
  },

  /**
   * Stop listening for scan progress
   */
  offScanProgress: (scanId) => {
    if (socket) {
      socket.off(`progress_${scanId}`);
    }
  },

  /**
   * Listen for vulnerability found
   */
  onVulnerabilityFound: (scanId, callback) => {
    if (socket) {
      socket.on(`vulnerability_${scanId}`, callback);
    }
  },

  /**
   * Stop listening for vulnerabilities
   */
  offVulnerabilityFound: (scanId) => {
    if (socket) {
      socket.off(`vulnerability_${scanId}`);
    }
  },

  /**
   * Generic event listener
   */
  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  /**
   * Generic event emitter
   */
  emit: (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  },

  /**
   * Remove event listener
   */
  off: (event) => {
    if (socket) {
      socket.off(event);
    }
  },

  /**
   * Check if connected
   */
  isConnected: () => {
    return socket && socket.connected;
  },

  /**
   * Get socket instance
   */
  getSocket: () => socket
};

export default socketService;
