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
