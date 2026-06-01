import { resolveWidget } from "@/composables/forms/resolveWidget";

describe("resolveWidget", () => {
  it("returns a boolean switch when strict suggestions are exactly True/False", () => {
    const w = resolveWidget({
      name: "Enabled",
      type: "boolean",
      strict: true,
      suggestedValues: ["True", "False"],
    });
    expect(w.kind).toBe("switch");
    expect(w.props).toMatchObject({
      "false-value": "False",
      "true-value": "True",
    });
  });

  it("treats Bypasses as a multiselect autocomplete", () => {
    const w = resolveWidget({
      name: "Bypasses",
      type: "string",
      strict: false,
      suggestedValues: ["a", "b"],
    });
    expect(w.kind).toBe("multiselect");
    expect(w.props).toMatchObject({ multiple: true, chips: true });
  });

  it("routes FILE-typed fields to the file widget", () => {
    expect(
      resolveWidget({
        name: "Anything",
        type: "file",
        strict: false,
        suggestedValues: [],
      }).kind,
    ).toBe("file");
  });

  it("special-cases Agent and CredID autocompletes", () => {
    const agent = resolveWidget({
      name: "Agent",
      type: "string",
      strict: false,
      suggestedValues: [],
    });
    expect(agent.kind).toBe("agent");
    expect(agent.props).toMatchObject({
      "item-value": "session_id",
      "item-title": "name",
    });
    const cred = resolveWidget({
      name: "CredID",
      type: "string",
      strict: false,
      suggestedValues: [],
    });
    expect(cred.kind).toBe("cred");
    expect(cred.props).toMatchObject({
      "item-value": "id",
      "item-title": "id",
    });
  });

  it("uses a combobox for non-strict suggestions and an autocomplete for strict ones", () => {
    expect(
      resolveWidget({
        name: "X",
        type: "string",
        strict: false,
        suggestedValues: ["a"],
      }).kind,
    ).toBe("combobox");
    expect(
      resolveWidget({
        name: "X",
        type: "string",
        strict: true,
        suggestedValues: ["a"],
      }).kind,
    ).toBe("select");
  });

  it("falls back to a text field, mapping numeric types to a number input", () => {
    expect(
      resolveWidget({
        name: "Name",
        type: "string",
        strict: false,
        suggestedValues: [],
      }),
    ).toMatchObject({ kind: "text", props: { type: "text" } });
    expect(
      resolveWidget({
        name: "Port",
        type: "number",
        strict: false,
        suggestedValues: [],
      }).props.type,
    ).toBe("number");
  });

  it("prioritises the switch branch over Bypasses when both could match", () => {
    const w = resolveWidget({
      name: "Bypasses",
      type: "string",
      strict: true,
      suggestedValues: ["True", "False"],
    });
    expect(w.kind).toBe("switch");
  });
});
