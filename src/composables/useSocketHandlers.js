import { onUnmounted } from "vue";

/**
 * Registers socket.io event handlers and removes them automatically when the
 * owning component unmounts. The socket itself is owned elsewhere — this
 * composable only manages handler lifecycle, never opening or closing the
 * connection.
 *
 * The socket reference is captured once, so it must stay stable for the
 * consumer's lifetime (e.g. pass a socket that is only torn down by unmounting
 * the consumer, not one that gets reassigned underneath it).
 *
 * @param {import("socket.io-client").Socket} socket - an existing, stable socket
 * @returns {{ on: Function, emit: Function }}
 * @throws {Error} if no socket instance is provided
 */
// eslint-disable-next-line import/prefer-default-export
export function useSocketHandlers(socket) {
  if (!socket) {
    throw new Error("useSocketHandlers requires an active socket instance");
  }

  const registered = [];

  function on(event, handler) {
    socket.on(event, handler);
    registered.push([event, handler]);
  }

  function emit(event, ...args) {
    socket.emit(event, ...args);
  }

  onUnmounted(() => {
    registered.forEach(([event, handler]) => socket.off(event, handler));
    registered.length = 0;
  });

  return { on, emit };
}
