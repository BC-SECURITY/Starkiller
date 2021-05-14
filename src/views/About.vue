<template>
  <div>
    <list-page-top
      :breads="breads"
    />
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
import openExternalBrowser from '@/mixins/open-external';
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  components: { ListPageTop },
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
