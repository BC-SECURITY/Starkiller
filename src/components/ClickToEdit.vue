<template>
  <v-row class="pb-5">
    <v-col cols="4" class="d-flex align-center justify-start">
      <span class="text--bold">{{ label }}</span>
      <v-tooltip v-if="infoText" location="bottom">
        <template #activator="{ props: activatorProps }">
          <v-icon size="small" class="ml-2" v-bind="activatorProps">
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
          variant="outlined"
          density="compact"
          @blur="update"
          @keyup.enter="update"
        />
        <v-menu
          v-else-if="dataType === 'date' || dataType === 'date-range'"
          ref="menu"
          v-model="menu"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
        >
          <template #activator="{ props: activatorProps }">
            <v-text-field
              ref="field"
              v-model="internalValue"
              label="Picker in menu"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="activatorProps"
              clearable
              @click:clear="clear"
            />
          </template>
          <v-date-picker
            :model-value="
              internalValue ? new Date(internalValue + 'T00:00:00') : undefined
            "
            :min="new Date()"
            @update:model-value="onDatePicked"
          >
            <template #actions>
              <v-spacer />
              <v-btn
                variant="text"
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
                variant="text"
                color="primary"
                @click="
                  menu = false;
                  update();
                "
              >
                OK
              </v-btn>
            </template>
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
          variant="outlined"
          density="compact"
          required
          @blur="update"
          @keyup.enter="update"
        />
      </template>
      <span v-else class="ml-3">
        {{ internalValue }}
      </span>
    </v-col>
  </v-row>
</template>

<script>
import moment from "moment";

export default {
  props: {
    editable: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      required: true,
    },
    modelValue: {
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
  emits: ["update:modelValue", "update"],
  data() {
    return {
      internalValue: this.modelValue,
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
  },
  watch: {
    modelValue(val) {
      this.internalValue = val;
      this.original = val;
    },
    internalValue(val) {
      this.$emit("update:modelValue", val);
    },
  },
  mounted() {
    this.original = this.modelValue;
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
      if (this.$refs.field && this.$refs.field.validate) {
        const result = await this.$refs.field.validate();
        const isValid = Array.isArray(result)
          ? result.length === 0
          : result?.valid !== false;
        if (!isValid) return;
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
    onDatePicked(date) {
      this.internalValue = date ? moment(date).format("YYYY-MM-DD") : "";
    },
    getColClass() {
      if (this.editing === false && this.editable === true) {
        return "column-not-editing-dark";
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
