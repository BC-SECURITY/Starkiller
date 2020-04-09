<template>
  <div>
    <el-menu
      :default-active="$route.path"
      class="el-menu-vertical-demo"
      :router="true"
      :collapse="isCollapse"
    >
      <el-menu-item @click="isCollapse = !isCollapse">
        <i :class="isCollapse ? 'el-icon-arrow-right' : 'el-icon-arrow-left'" />
      </el-menu-item>
      <el-menu-item index="/listeners">
        <i class="el-icon-headset" />
        <span>Listeners</span>
      </el-menu-item>
      <el-menu-item index="/stagers">
        <i class="el-icon-suitcase-1" />
        <span>Stagers</span>
      </el-menu-item>
      <el-menu-item index="/agents">
        <i class="el-icon-connection" />
        <span>Agents</span>
      </el-menu-item>
      <el-menu-item index="/modules">
        <i class="el-icon-s-grid" />
        <span>Modules</span>
      </el-menu-item>
      <el-menu-item index="/credentials">
        <i class="el-icon-key" />
        <span>Credentials</span>
      </el-menu-item>
      <el-menu-item index="/reporting">
        <i class="el-icon-notebook-2" />
        <span>Reporting</span>
      </el-menu-item>
      <el-menu-item index="/users">
        <i class="el-icon-user" />
        <span>Users</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <i class="el-icon-setting" />
        <span>Settings</span>
      </el-menu-item>
      <el-menu-item index="/about">
        <i class="el-icon-info" />
        <span>About</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isCollapse: true,
    };
  },
  methods: {
  },
};
</script>
