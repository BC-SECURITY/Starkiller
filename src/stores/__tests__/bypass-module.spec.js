import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useBypassStore } from "@/stores/bypass-module";

// Importing the store pulls in the api module; keep it inert.
vi.mock("@/api/bypass-api", () => ({
  getBypasses: vi.fn(),
  deleteBypass: vi.fn(),
}));

describe("bypass-module store — mergedBypassNames getter", () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
  });

  it("lists default bypass names first, then the rest", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "a", is_default: false },
      { name: "b", is_default: true },
      { name: "c", is_default: false },
    ];
    expect(store.mergedBypassNames).toEqual(["b", "a", "c"]);
  });

  it("dedups a name that is both a default and a non-default", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "a", is_default: false },
      { name: "b", is_default: true },
      { name: "c", is_default: false },
      { name: "b", is_default: false }, // duplicate of the default "b"
    ];
    expect(store.mergedBypassNames).toEqual(["b", "a", "c"]);
  });

  it("preserves the order of multiple defaults ahead of non-defaults", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "d1", is_default: true },
      { name: "r1", is_default: false },
      { name: "d2", is_default: true },
    ];
    expect(store.mergedBypassNames).toEqual(["d1", "d2", "r1"]);
  });

  it("dedups non-default duplicates when there are no defaults", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "x", is_default: false },
      { name: "x", is_default: false },
      { name: "y", is_default: false },
    ];
    expect(store.mergedBypassNames).toEqual(["x", "y"]);
  });

  it("returns an empty array when there are no bypasses", () => {
    const store = useBypassStore();
    store.bypasses = [];
    expect(store.mergedBypassNames).toEqual([]);
  });
});

describe("bypass-module store — language-aware getters", () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
  });

  it("mergedBypassNamesByLanguage filters and keeps defaults first", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps-default", language: "powershell", is_default: true },
      { name: "ps-extra", language: "powershell", is_default: false },
      { name: "py-extra", language: "python", is_default: false },
      { name: "py-default", language: "python", is_default: true },
    ];
    expect(store.mergedBypassNamesByLanguage("powershell")).toEqual([
      "ps-default",
      "ps-extra",
    ]);
    expect(store.mergedBypassNamesByLanguage("python")).toEqual([
      "py-default",
      "py-extra",
    ]);
  });

  it("mergedBypassNamesByLanguage is case-insensitive", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps", language: "powershell", is_default: false },
      { name: "py", language: "python", is_default: false },
    ];
    expect(store.mergedBypassNamesByLanguage("PowerShell")).toEqual(["ps"]);
    expect(store.mergedBypassNamesByLanguage("PYTHON")).toEqual(["py"]);
  });

  it("mergedBypassNamesByLanguage returns full list when language is falsy", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps", language: "powershell", is_default: false },
      { name: "py", language: "python", is_default: false },
    ];
    expect(store.mergedBypassNamesByLanguage(null)).toEqual(["ps", "py"]);
    expect(store.mergedBypassNamesByLanguage("")).toEqual(["ps", "py"]);
    expect(store.mergedBypassNamesByLanguage(undefined)).toEqual(["ps", "py"]);
  });

  it("mergedBypassNamesByLanguage returns empty when no bypasses match", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps", language: "powershell", is_default: false },
    ];
    expect(store.mergedBypassNamesByLanguage("csharp")).toEqual([]);
  });

  it("excludes bypasses with null language from a filtered query", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps", language: "powershell", is_default: false },
      { name: "stray", language: null, is_default: false },
    ];
    expect(store.mergedBypassNamesByLanguage("powershell")).toEqual(["ps"]);
    expect(store.mergedBypassNamesByLanguage(null)).toEqual(["ps", "stray"]);
  });

  it("defaultBypassNamesByLanguage filters defaults to language", () => {
    const store = useBypassStore();
    store.bypasses = [
      { name: "ps-default", language: "powershell", is_default: true },
      { name: "ps-extra", language: "powershell", is_default: false },
      { name: "py-default", language: "python", is_default: true },
    ];
    expect(store.defaultBypassNamesByLanguage("powershell")).toEqual([
      "ps-default",
    ]);
    expect(store.defaultBypassNamesByLanguage("python")).toEqual([
      "py-default",
    ]);
    expect(store.defaultBypassNamesByLanguage(null)).toEqual([
      "ps-default",
      "py-default",
    ]);
  });
});
