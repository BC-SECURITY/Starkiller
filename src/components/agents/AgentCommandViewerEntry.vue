<template>
  <div :class="pulsate ? 'pulsate' : ''">
    <li>
      <span class="username">({{ result.username }})</span>&nbsp;{{ result.input }}
    </li>
    <li> {{ result.ogOutput }}</li>
  </div>
</template>

<script>
export default {
  name: 'AgentCommandViewerEntry',
  props: {
    result: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      pulsate: true,
    };
  },
  watch: {
    result: {
      async handler(oldVal, newVal) {
        if (oldVal.updatedAt !== newVal.updatedAt) {
          console.log('TRIGGGERED');
          this.pulsate = false;
          await this.$nextTick();
          this.pulsate = true;
        }
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>

.shell-body li .username {
  color: yellow;
}

.shell-body li:first-child:before {
  content: '>';
  position: absolute;
  left: 0;
  top: 0;
}

.shell-body li {
  word-wrap: break-word;
  position: relative;
  padding: 0 0 0 15px;
  text-align: left;

  white-space: pre-wrap;
}

// https://www.kevinleary.net/pulsating-css3-animations/
.pulsate {
    -webkit-animation: pulsate 2.5s ease-out;
    -webkit-animation-iteration-count: 1;
    opacity: 1.0;
}
@-webkit-keyframes pulsate {
    0% {
    }
    50% {
        background:#33940c;
        color:#ffffff
    }
    100% {
    }
}
</style>
