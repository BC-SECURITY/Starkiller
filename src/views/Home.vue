<template>
  <div class="home">
    <img alt="Starkiller" width="200px" src="../assets/icon.png" />
    <Login />
  </div>
</template>

<script>
// @ is an alias to /src
import Login from "@/components/Login.vue";

export default {
  name: "Home",
  components: {
    Login,
  },
};
</script>

<style lang="scss" scoped>
.home {
  padding-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
