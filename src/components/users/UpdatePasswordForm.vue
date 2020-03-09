<template>
  <div class="user-form">
    <el-form
      ref="form"
      :model="form"
      :label-position="labelPosition"
      label-width="125px"
      class="form"
      :rules="rules"
    >
      <el-form-item
        prop="password"
        label="Password"
      >
        <el-input
          v-model="form.password"
          show-password
          autocomplete="off"
        />
      </el-form-item>
      <el-form-item
        prop="confirmPassword"
        label="Confirm Password"
      >
        <el-input
          v-model="form.confirmPassword"
          show-password
          autocomplete="off"
        />
      </el-form-item>
      <el-form-item>
        <div class="footer">
          <el-button @click="cancel">
            Cancel
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            @click="submit"
          >
            {{ loading ? 'Submitting ...' : 'Submit' }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import * as userApi from '@/api/user-api';

export default {
  props: {
    userId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      labelPosition: 'left',
      loading: false,
      form: {
        password: '',
        confirmPassword: '',
      },
    };
  },
  computed: {
    rules() {
      return {
        password: [
          {
            validator: (rule, value, callback) => {
              if (value === '') {
                callback(new Error('Please input the password'));
              } else {
                if (this.form.confirmPassword !== '') {
                  this.$refs.form.validateField('confirmPassword');
                }
                callback();
              }
            },
            trigger: 'blur',
          },
          {
            min: 5, message: 'Length should be greater than or equal to 5', trigger: 'blur',
          },
        ],
        confirmPassword: [
          {
            validator: (rule, value, callback) => {
              if (value === '') {
                callback(new Error('Please input the password again'));
              } else if (value !== this.form.password) {
                callback(new Error('Two inputs don\'t match!'));
              } else {
                callback();
              }
            },
            trigger: 'blur',
          },
          {
            min: 5, message: 'Length should be greater than or equal to 5', trigger: 'blur',
          },
        ],
      };
    },
  },
  methods: {
    cancel() {
      this.loading = false;
      this.$emit('done');
    },
    async submit() {
      if (this.loading) {
        return;
      }

      try {
        await this.$refs.form.validate();
      } catch (err) {
        return;
      }

      try {
        this.loading = true;
        await this.create();
        this.loading = false;
        this.form = {
          password: '',
          confirmPassword: '',
        };
        this.$emit('done');
      } catch (err) {
        this.loading = false;
        this.$emit('done');
      }
    },
    async create() {
      await userApi.updatePassword(this.userId, this.form.password);
    },
  },
};
</script>

<style lang="scss" scoped>
.user-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form {
  max-width: 600px;
  width: 100%;
}
</style>
