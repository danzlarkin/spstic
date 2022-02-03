// Evaluate the live-reload / refresh script
(() => {

  // Create the properies
  let socket, reconnection;

  // Extract the current url
  const url = window.location;

  // Determine the socket protocol
  const protocol = (url.protocol == 'https:') ? 'wss:' : 'ws:';

  // Define the socket address
  const address = `${url.origin.replace(url.protocol, protocol)}/refresh`;

  // Kick off the connection code on load.
  connect();

  // Refresh the browser page
  function refresh() {

    // Log out a message
    console.log('Content has updated -- refreshing page...');

    // Reload the page
    window.location.reload();
  }

  // Handle socket connection
  function connect(callback) {

    // Close the existing socket
    if (socket) socket.close();

    // Create a refresh websocket
    socket = new WebSocket(address);

    // Handle messages from the server
    socket.addEventListener('open', callback);

    // Handle messages from the server
    socket.addEventListener('message', (event) => refresh());

    // Attempt to reconnect to the socket when lost
    socket.addEventListener('close', () => {
      
      // Log out a message
      console.log('Connection lost -- refreshing...');

      // Clear the reconnection timer
      clearTimeout(reconnection);

      // Attempt reconnection every second
      reconnection = setTimeout(() => connect(refresh), 1000);
    });
  }
})();