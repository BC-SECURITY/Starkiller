<template>
  <v-row class="pb-5">
    <v-col cols="4" class="d-flex align-center justify-start">
      <span class="text--bold">{{ label }}</span>
      <v-tooltip v-if="infoText" bottom>
        <template #activator="{ on, attrs }">
          <v-icon small class="ml-2" v-bind="attrs" v-on="on">
            mdi-information-outline
          </v-icon>
        </template>
        <span>{{ infoText }}</span>
      </v-tooltip>
    </v-col>
    <v-col cols="6" :class="getColClass()" @click="clicked">
      <template v-if="editing && editable">
        <v-autocomplete
          v-if="suggestedValues.length > 0 && strict"
          ref="field"
          v-model="internalValue"
          :items="suggestedValues"
          :label="label"
          outlined
          dense
          @blur="update"
          @keyup.enter="update"
        />
        <v-menu
          v-else-if="dataType === 'date' || dataType === 'date-range'"
          ref="menu"
          v-model="menu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ on, attrs }">
            <v-text-field
              ref="field"
              v-model="internalValue"
              label="Picker in menu"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              clearable
              v-on="on"
              @click:clear="clear"
            />
          </template>
          <v-date-picker
            v-model="internalValue"
            outlined
            dense
            :range="dataType === 'date-range'"
            :min="moment().format('YYYY-MM-DD')"
            @blur="update"
            @keyup.enter="update"
          >
            <v-spacer />
            <v-btn
              text
              color="primary"
              @click="
                menu = false;
                editing = false;
                revert();
              "
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="
                menu = false;
                update();
              "
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
        <v-text-field
          v-else-if="dataType === 'string' || dataType === 'number'"
          ref="field"
          v-model="internalValue"
          style="margin-bottom: -45px"
          :rules="rules"
          :label="label"
          :type="dataType === 'string' ? 'text' : 'number'"
          :step="label === 'Jitter' ? '0.1' : '1'"
          :max="label === 'Jitter' ? '1' : ''"
          min="0"
          outlined
          dense
          required
          @blur="update"
          @keyup.enter.native="update"
        />
      </template>
      <span v-else class="ml-3">
        {{ internalValue }}
      </span>
    </v-col>
  </v-row>
</template>

<script>
import { mapState } from "pinia";
import moment from "moment";
import { useApplicationStore } from "@/stores/application-module";

export default {
  components: {},
  props: {
    editable: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      default: "",
    },
    infoText: {
      type: String,
      default: "",
    },
    dataType: {
      type: String,
      default: "string",
    },
    suggestedValues: {
      type: Array,
      default: () => [],
    },
    strict: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      internalValue: this.value,
      editing: false,
      menu: false,
      original: "",
      moment,
    };
  },
  computed: {
    dirty() {
      return this.original !== this.internalValue;
    },
    ...mapState(useApplicationStore, ["darkMode"]),
  },
  watch: {
    internalValue(val) {
      this.$emit("input", val);
    },
  },
  mounted() {
    this.original = this.value;
  },
  methods: {
    clicked() {
      if (!this.editable) return;
      this.editing = true;
      this.$nextTick(() => {
        if (this.dataType === "date" || this.dataType === "date-range") {
          this.menu = true;
        } else {
          this.$refs.field.focus();
        }
      });
    },
    async update() {
      if (this.$refs.field.validate && this.$refs.field.validate() === false) {
        return;
      }

      if (this.label === "Delay") {
        this.internalValue = Math.floor(this.internalValue);
      } else if (this.label === "Jitter") {
        // truncate to 1 decimal place
        this.internalValue = Math.floor(this.internalValue * 10) / 10;
      }
      await this.$nextTick();

      this.editing = false;
      this.$emit("update");
    },
    revert() {
      this.editing = false;
      this.internalValue = this.original;
    },
    async clear() {
      this.internalValue = "";
      await this.$nextTick();
      this.editing = false;
      this.$emit("update");
    },
    getColClass() {
      if (this.editing === false && this.editable === true) {
        if (this.darkMode) {
          return "column-not-editing-dark";
        }
        return "column-not-editing";
      }
      return "";
    },
  },
};
</script>

<style>
.column-not-editing {
  background-color: rgb(0, 0, 0, 0.1);
  border-radius: 5px;
  height: 45px;
  cursor: pointer;
}

.column-not-editing-dark {
  background-color: rgb(255, 255, 255, 0.1);
  border-radius: 5px;
  height: 45px;
  cursor: pointer;
}
</style>
