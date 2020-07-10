// eslint-disable-next-line import/no-extraneous-dependencies
import { remote } from 'electron';

export default {
  methods: {
    /**
     * Open a link in an external browser.
     * @param {*} e click event
     */
    openExternalBrowser(e) {
      if (!e.target.href) return; // For overriding native click events on v-chip.
      remote.shell.openExternal(e.target.href);
    },
  },
};
