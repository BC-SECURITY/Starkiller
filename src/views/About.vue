<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>About</h3>
    </div>
    <div class="about">
      <img
        alt="Starkiller"
        width="200px"
        style="padding-bottom: 20px;"
        src="../assets/icon.png"
      >
      <span>Starkiller is developed by
        <a
          href="https://bc-security.org/blog"
          target="_blank"
          @click.prevent="openExternalBrowser"
        >BC-Security</a>.</span>
      <span>If you would like to contribute please visit our
        <a
          href="https://github.com/BC-SECURITY/Starkiller"
          target="_blank"
          @click.prevent="openExternalBrowser"
        >GitHub</a>.
      </span>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { remote } from 'electron';

export default {
  data() {
    return {
      breads: [
        {
          text: 'About',
          disabled: true,
          href: '/about',
        },
      ],
    };
  },
  methods: {
    openExternalBrowser(e) {
      remote.shell.openExternal(e.target.href);
    },
  },
};
</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
