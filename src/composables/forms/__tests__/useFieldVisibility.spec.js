import { ref } from "vue";
import {
  computeVisibility,
  useFieldVisibility,
} from "@/composables/forms/useFieldVisibility";

const FIELDS = [
  { name: "Mode" },
  { name: "Secret", depends_on: [{ name: "Mode", values: ["advanced"] }] },
  {
    name: "MultiDep",
    depends_on: [
      { name: "Mode", values: ["advanced"] },
      { name: "Secret", values: ["yes"] },
    ],
  },
];

describe("computeVisibility", () => {
  it("makes fields without depends_on always visible", () => {
    expect(computeVisibility(FIELDS, { Mode: "basic" }).Mode).toBe(true);
  });

  it("hides a dependent field when its dependency value does not match", () => {
    expect(computeVisibility(FIELDS, { Mode: "basic" }).Secret).toBe(false);
  });

  it("shows a dependent field when its dependency value matches", () => {
    expect(computeVisibility(FIELDS, { Mode: "advanced" }).Secret).toBe(true);
  });

  it("requires every dependency to match for multi-dependency fields", () => {
    expect(
      computeVisibility(FIELDS, { Mode: "advanced", Secret: "no" }).MultiDep,
    ).toBe(false);
    expect(
      computeVisibility(FIELDS, { Mode: "advanced", Secret: "yes" }).MultiDep,
    ).toBe(true);
  });

  it("treats a non-array depends_on as no dependency (visible)", () => {
    expect(computeVisibility([{ name: "X", depends_on: "weird" }], {}).X).toBe(
      true,
    );
    expect(
      computeVisibility([{ name: "Y", depends_on: { foo: 1 } }], {}).Y,
    ).toBe(true);
  });

  it("ignores a malformed dep entry instead of throwing at mount", () => {
    // A dep without a `values` array (or a null dep) used to crash with
    // "Cannot read properties of undefined (reading 'includes')", taking the
    // whole form render down. warnUnknownDependencies already guarded this
    // shape; computeVisibility now matches. A malformed dep is ignored (not
    // treated as failing) so it can't silently hide a field the user needs.
    expect(() =>
      computeVisibility([{ name: "X", depends_on: [{ name: "Mode" }] }], {
        Mode: "a",
      }),
    ).not.toThrow();
    expect(
      computeVisibility([{ name: "X", depends_on: [{ name: "Mode" }] }], {
        Mode: "a",
      }).X,
    ).toBe(true);
    expect(computeVisibility([{ name: "Y", depends_on: [null] }], {}).Y).toBe(
      true,
    );
    // A well-formed dep alongside a malformed one is still enforced.
    expect(
      computeVisibility(
        [
          {
            name: "Z",
            depends_on: [
              { name: "Mode", values: ["advanced"] },
              { name: "Bad" },
            ],
          },
        ],
        { Mode: "basic" },
      ).Z,
    ).toBe(false);
  });
});

describe("useFieldVisibility", () => {
  // Use fake timers for the whole suite. The composable's flash setTimeout is
  // normally cleared in onBeforeUnmount, but that lifecycle hook never fires
  // outside a component, so without this a real 7s timer would leak between
  // tests and could wipe a later test's highlight (a cross-test flake).
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const FIELDS_REF = () =>
    ref([
      { name: "Mode" },
      { name: "Secret", depends_on: [{ name: "Mode", values: ["advanced"] }] },
    ]);

  it("reflects visibility through isFieldVisible after updateVisibility", () => {
    const allFields = FIELDS_REF();
    const { isFieldVisible, updateVisibility } = useFieldVisibility(allFields);
    updateVisibility({ Mode: "basic" }, true);
    expect(isFieldVisible({ name: "Mode" })).toBe(true);
    expect(isFieldVisible({ name: "Secret" })).toBe(false);
    updateVisibility({ Mode: "advanced" });
    expect(isFieldVisible({ name: "Secret" })).toBe(true);
  });

  it("does not flash on the initial computation", () => {
    const { recentlyVisibleFields, updateVisibility } =
      useFieldVisibility(FIELDS_REF());
    updateVisibility({ Mode: "advanced" }, true);
    expect(recentlyVisibleFields.value).toEqual([]);
  });

  it("flashes only fields that transition hidden->visible, then clears after 7s", () => {
    const { recentlyVisibleFields, updateVisibility } =
      useFieldVisibility(FIELDS_REF());
    updateVisibility({ Mode: "basic" }, true); // Secret hidden, no flash (initial)
    updateVisibility({ Mode: "advanced" }); // Secret becomes visible -> flash
    expect(recentlyVisibleFields.value).toEqual(["Secret"]);
    vi.advanceTimersByTime(7000);
    expect(recentlyVisibleFields.value).toEqual([]);
  });

  it("debounces the flash window: a second transition resets the 7s timer", () => {
    const fields = ref([
      { name: "Mode" },
      { name: "A", depends_on: [{ name: "Mode", values: ["a"] }] },
      { name: "B", depends_on: [{ name: "Mode", values: ["b"] }] },
    ]);
    const { recentlyVisibleFields, updateVisibility } =
      useFieldVisibility(fields);
    updateVisibility({ Mode: "x" }, true); // both hidden, no flash
    updateVisibility({ Mode: "a" }); // A becomes visible -> flash
    expect(recentlyVisibleFields.value).toEqual(["A"]);
    vi.advanceTimersByTime(3000);
    updateVisibility({ Mode: "b" }); // A hides, B becomes visible -> flash + reset timer
    expect(recentlyVisibleFields.value).toEqual(["B"]);
    vi.advanceTimersByTime(4000); // 7s since A, but only 4s since B
    expect(recentlyVisibleFields.value).toEqual(["B"]); // first timer was cleared
    vi.advanceTimersByTime(3000); // now 7s since B
    expect(recentlyVisibleFields.value).toEqual([]);
  });

  describe("warnUnknownDependencies", () => {
    let warnSpy;
    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => warnSpy.mockRestore());

    // Filter out Vue's own [Vue warn] noise (onBeforeUnmount fires outside a
    // component lifecycle in these tests) so we only count our warnings.
    function visibilityWarnings() {
      return warnSpy.mock.calls
        .map((call) => call[0])
        .filter(
          (msg) =>
            typeof msg === "string" && msg.includes("[useFieldVisibility]"),
        );
    }

    it("warns once per (field, missing-dep) pair", () => {
      const fields = ref([
        {
          name: "Secret",
          depends_on: [{ name: "MissingDep", values: ["x"] }],
        },
      ]);
      const { updateVisibility } = useFieldVisibility(fields);
      updateVisibility({});
      updateVisibility({});
      updateVisibility({});
      const warnings = visibilityWarnings();
      expect(warnings).toHaveLength(1);
      // The message must name both the dependent field and the missing dep
      // so a "useless warning" refactor (dropping names) fails the test.
      expect(warnings[0]).toContain("Secret");
      expect(warnings[0]).toContain("MissingDep");
      // Positive prefix assertion: renaming the [useFieldVisibility] tag
      // would otherwise slip past visibilityWarnings() (which filters by
      // the prefix) and silently make this whole suite a no-op.
      expect(warnings[0]).toContain("[useFieldVisibility]");
    });

    it("does not warn when every dependency name resolves to a known field", () => {
      const fields = ref([
        { name: "Mode" },
        {
          name: "Secret",
          depends_on: [{ name: "Mode", values: ["advanced"] }],
        },
      ]);
      const { updateVisibility } = useFieldVisibility(fields);
      updateVisibility({ Mode: "basic" });
      updateVisibility({ Mode: "advanced" });
      expect(visibilityWarnings()).toEqual([]);
    });

    it("warns separately for distinct (field, missing-dep) pairs", () => {
      const fields = ref([
        { name: "A", depends_on: [{ name: "MissingX", values: ["x"] }] },
        { name: "B", depends_on: [{ name: "MissingY", values: ["y"] }] },
      ]);
      const { updateVisibility } = useFieldVisibility(fields);
      updateVisibility({});
      expect(visibilityWarnings()).toHaveLength(2);
    });
  });
});
