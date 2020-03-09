// The use case for this is super limited right now.
// If it expands, do a pros/cons of this vs the vuex persisted state.
const Store = require('electron-store');

const store = new Store();

// eslint-disable-next-line import/no-mutable-exports
export let namespacedElectronStore = null;

export default store;

export function initNamespacedStore(url) {
  namespacedElectronStore = new Store({ name: url });
}
