<template>
  <div>
    <list-page-top
      :breads="breads"
      :show-create="false"
      :show-refresh="true"
      :refresh-loading="loading"
      :show-delete="false"
      @refresh="onRefresh"
    >
      <template #extra-stuff>
        <TooltipButton
          v-if="focusedNode"
          :text="`Unfocus Node: ${focusedNode.name}`"
          icon="fa-eye-slash"
          @click="onUnfocus"
        />
        <TooltipButton
          text="Show All Nodes"
          icon="fa-expand"
          @click="onShowAll"
        />
      </template>
    </list-page-top>

    <agent-graph
      ref="graph"
      :expandable="false"
      @loading-change="loading = $event"
      @focus-change="focusedNode = $event"
    />
  </div>
</template>

<script>
import AgentGraph from "@/components/agents/AgentGraph.vue";
import ListPageTop from "@/components/ListPageTop.vue";
import TooltipButton from "@/components/TooltipButton.vue";

export default {
  name: "GraphView",
  components: {
    AgentGraph,
    ListPageTop,
    TooltipButton,
  },
  data() {
    return {
      breads: [{ text: "Agents Graph", disabled: true, href: "/agents-graph" }],
      loading: false,
      // Local mirror of AgentGraph.focusedNode (refs aren't reactive), kept in
      // sync via the @focus-change event so the header label updates.
      focusedNode: null,
    };
  },
  methods: {
    onRefresh() {
      this.$refs.graph?.refresh();
    },
    onShowAll() {
      this.$refs.graph?.showAllNodes();
    },
    onUnfocus() {
      this.$refs.graph?.unfocus();
    },
  },
};
</script>

<style></style>
