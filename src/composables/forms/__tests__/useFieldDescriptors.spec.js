import { ref } from "vue";
import {
  buildFieldDescriptors,
  useFieldDescriptors,
} from "@/composables/forms/useFieldDescriptors";

const OPTIONS = {
  Name: {
    value: "x",
    value_type: "STRING",
    required: true,
    description: "the name",
  },
  Port: {
    value: 80,
    value_type: "INTEGER",
    required: false,
    description: "the port",
  },
  Ratio: { value: 1, value_type: "FLOAT", required: false },
  Enabled: { value: "True", value_type: "BOOLEAN", required: false },
  Cert: { value: "", value_type: "FILE", required: false },
  Other: { value: "", value_type: "WEIRD", required: false },
};

describe("buildFieldDescriptors", () => {
  it("maps each option key into a named descriptor and normalizes value_type", () => {
    const fields = buildFieldDescriptors(OPTIONS, []);
    const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(byName.Name.type).toBe("string");
    expect(byName.Port.type).toBe("number");
    expect(byName.Ratio.type).toBe("float");
    expect(byName.Enabled.type).toBe("boolean");
    expect(byName.Cert.type).toBe("file");
    expect(byName.Other.type).toBe("string"); // unknown value_type falls back to string
  });

  it("preserves the original option fields alongside name and type", () => {
    const [name] = buildFieldDescriptors(
      {
        Name: {
          value: "x",
          value_type: "STRING",
          required: true,
          description: "d",
        },
      },
      [],
    );
    expect(name).toMatchObject({
      name: "Name",
      value: "x",
      required: true,
      description: "d",
      type: "string",
    });
  });

  it("reorders prioritized fields to the front in priority order", () => {
    const names = buildFieldDescriptors(OPTIONS, ["Port", "Name"]).map(
      (f) => f.name,
    );
    expect(names.slice(0, 2)).toEqual(["Port", "Name"]);
  });

  it("ignores priority entries that are not present", () => {
    const names = buildFieldDescriptors(OPTIONS, ["DoesNotExist", "Port"]).map(
      (f) => f.name,
    );
    expect(names[0]).toBe("Port");
  });
});

describe("useFieldDescriptors", () => {
  it("recomputes allFields when the options ref changes", () => {
    const options = ref({
      A: { value: "", value_type: "STRING", required: true },
    });
    const priority = ref([]);
    const { allFields } = useFieldDescriptors(options, priority);
    expect(allFields.value.map((f) => f.name)).toEqual(["A"]);
    options.value = { B: { value: "", value_type: "STRING", required: true } };
    expect(allFields.value.map((f) => f.name)).toEqual(["B"]);
  });
});
