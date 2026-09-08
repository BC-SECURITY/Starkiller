import { visibleAutorunFields } from "@/composables/forms/autorunFieldVisibility";

describe("visibleAutorunFields", () => {
  it("excludes the agent field regardless of case", () => {
    const options = {
      Agent: { value: "abc123" },
      Listener: { value: "http" },
    };
    const names = visibleAutorunFields(options).map((f) => f.name);
    expect(names).not.toContain("Agent");
    expect(names).toContain("Listener");
  });

  it("hides a dependent field when its dependency value does not match", () => {
    const options = {
      Mode: { value: "basic" },
      Secret: {
        value: "",
        depends_on: [{ name: "Mode", values: ["advanced"] }],
      },
    };
    const names = visibleAutorunFields(options).map((f) => f.name);
    expect(names).toContain("Mode");
    expect(names).not.toContain("Secret");
  });

  it("shows a dependent field once its dependency value matches", () => {
    const options = {
      Mode: { value: "advanced" },
      Secret: {
        value: "",
        depends_on: [{ name: "Mode", values: ["advanced"] }],
      },
    };
    const names = visibleAutorunFields(options).map((f) => f.name);
    expect(names).toContain("Secret");
  });

  it("resolves depends_on against the full field set, including the agent field", () => {
    const options = {
      Agent: { value: "abc123" },
      Secret: {
        value: "",
        depends_on: [{ name: "Agent", values: ["abc123"] }],
      },
    };
    const names = visibleAutorunFields(options).map((f) => f.name);
    expect(names).toContain("Secret");
  });

  it("preserves the rest of each field's descriptor (value, description, suggested_values)", () => {
    const options = {
      Listener: {
        value: "http",
        description: "Listener to use",
        suggested_values: ["http", "https"],
      },
    };
    const [field] = visibleAutorunFields(options);
    expect(field).toMatchObject({
      name: "Listener",
      value: "http",
      description: "Listener to use",
      suggested_values: ["http", "https"],
    });
  });
});
