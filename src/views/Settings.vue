<template>
  <div class="route-container">
    <div class="headers">
      <h3>Settings</h3>
    </div>
    <div class="page">
      <div class="first-part">
        <span>{{ user.username }}</span>
        <el-button
          type="text"
          @click="logout"
        >
          Logout
        </el-button>
      </div>
      <el-divider />
      <div class="headers no-left">
        <h4>Update Password</h4>
      </div>
      <update-password-form :user-id="userId" />
      <el-divider />
      <div class="headers no-left">
        <h4> Api Token </h4>
      </div>
      <div
        class="point"
        @click="copyTokenToClipboard"
      >
        <span>{{ apiToken }}</span>
        <i class="el-icon-paperclip center-icon" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import UpdatePasswordForm from '@/components/users/UpdatePasswordForm.vue';

export default {
  components: {
    UpdatePasswordForm,
  },
  computed: {
    ...mapState({
      user: state => state.profile.user,
    }),
    apiToken() {
      return this.user.api_token;
    },
    userId() {
      return this.user.id;
    },
  },
  methods: {
    async copyTokenToClipboard() {
      try {
        await navigator.clipboard.writeText(this.apiToken);
        this.$notify({
          title: 'Success',
          message: 'Output copied to clipboard',
          type: 'success',
        });
      } catch (e) {
        this.$notify.error({
          title: 'Error',
          message: 'Could not copy to clipboard',
        });
      }
    },
    async logout() {
      try {
        await this.$confirm('Are you sure you want to logout?');
      } catch (err) {
        return;
      }

      this.$store.dispatch('profile/logout');
    },
  },
};
</script>

<style>
/* .page {
  display: flex;
  padding-left: 20px;
  padding-right: 20px;
  flex-direction: column;
  align-items: start;
}

.first-part {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
}

.point:hover {
  cursor: pointer;
}

.no-left {
  padding-left: 0px;
} */
</style>
