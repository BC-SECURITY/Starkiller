import semver from 'semver';

const Store = require('electron-store');

const store = new Store();

// eslint-disable-next-line import/no-mutable-exports
export let namespacedElectronStore = null;

export default store;

/**
 * create an electron store namespaced to the current url.
 * The url is hashed since windows is more picky and doesn't allow :
 * @param {string} url empire  url
 */
export function initNamespacedStore(url) {
  namespacedElectronStore = new Store({ name: btoa(`${url}`) });
  const storeVersion = namespacedElectronStore.get('starkillerVersion', '1.7.0');
  if (semver.satisfies(storeVersion, '<1.8.0')) {
    namespacedElectronStore.clear(); // stager objects incompatible
    namespacedElectronStore.set('starkillerVersion', '1.8.0');
  }
}
