<template>
  <div>
    <v-breadcrumbs :items="breads" />
    <div class="headers">
      <h3>About</h3>
    </div>
    <div class="about">
      <img
        alt="Starkiller"
        width="180px"
        style="padding-bottom: 20px;"
        src="../assets/icon.png"
      >
      <span>Starkiller is developed by
        <a
          href="https://bc-security.org/blog"
          target="_blank"
          @click.prevent="openExternalBrowser"
        >BC Security</a>.</span>
      <span>If you would like to contribute please visit our
        <a
          href="https://github.com/BC-SECURITY/Starkiller"
          target="_blank"
          @click.prevent="openExternalBrowser"
        >GitHub</a>.
      </span>
      <img
        alt="Kali"
        width="200px"
        style="padding: 20px 0;"
        src="../assets/kali.png"
      >
      <span>This build was released exclusively for
        <a
          href="https://kali.org"
          target="_blank"
          @click.prevent="openExternalBrowser"
        >Kali Linux</a>.
      </span>
    </div>
  </div>
</template>

<script>
import openExternalBrowser from '@/mixins/open-external';

export default {
  mixins: [openExternalBrowser],
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
