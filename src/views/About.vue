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
          rel="noopener noreferrer"
        >BC-Security</a>.</span>
      <span>If you would like to contribute please visit our
        <a
          href="https://github.com/BC-SECURITY/Starkiller"
          target="_blank"
          rel="noopener noreferrer"
        >GitHub</a>.
      </span>
    </div>
  </div>
</template>

<script>
import ListPageTop from '@/components/ListPageTop.vue';

export default {
  components: { ListPageTop },
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
