<template>
  <div class="hello">
    <v-form
      class="inputs"
      @submit.prevent.native="submit"
    >
      <v-text-field
        v-model="form.url"
        placeholder="URL"
      >
        <template slot="prepend">
          https://
        </template>
      </v-text-field>
      <v-text-field
        v-model="form.username"
        placeholder="Username"
      />
      <v-text-field
        v-model="form.password"
        placeholder="Password"
        show-password
      />
      <v-checkbox
        v-model="rememberMe"
        class="remember-checkbox"
        label="Remember URL and Username"
      />
      <v-btn
        type="primary"
        native-type="submit"
        round
      >
        Submit
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import electronStore from '@/store/electron-store';

export default {
  name: 'Login',
  data() {
    return {
      rememberMe: false,
      form: {
        url: '',
        username: '',
        password: '',
      },
    };
  },
  computed: {
    ...mapGetters({
      isLoggedIn: 'profile/isLoggedIn',
    }),
    ...mapState({
      loginError: state => state.profile.loginError,
    }),
  },
  watch: {
    isLoggedIn(val) {
      if (val === true) {
        this.$router.push({ path: '/listeners' });
      }
    },
    loginError(val) {
      if (val.length > 0) {
        this.$notify.error({
          title: 'Error Logging In',
          message: val,
        });
      }
    },
  },
  mounted() {
    this.form.url = electronStore.get('url', '');
    this.form.username = electronStore.get('username', '');
    this.rememberMe = electronStore.get('rememberMe', false);
  },
  methods: {
    submit() {
      electronStore.set('rememberMe', this.rememberMe);

      if (this.rememberMe === true) {
        electronStore.set('url', this.form.url);
        electronStore.set('username', this.form.username);
      } else {
        electronStore.delete('url');
        electronStore.delete('username');
      }

      this.$store.dispatch('profile/login', this.form);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.hello {
  padding-left: 30px;
  padding-right: 30px;
}

.v-text-field {
  padding-bottom: 10px;
  max-width: 500px;
}

.inputs {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.remember-checkbox {
  padding-right: 275px;
  padding-bottom: 10px
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
