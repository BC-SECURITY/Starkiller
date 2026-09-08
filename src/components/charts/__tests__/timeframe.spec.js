import {
  dayKey,
  safeTimeframe,
  timeframeComputed,
} from "@/components/charts/timeframe";

// Pin the runner's timezone so the local-vs-UTC divergence case is
// deterministic. Without pinning, a UTC CI host collapses the local day onto
// the UTC day and the divergence assertion would silently pass for the wrong
// reason.
const originalTZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/Los_Angeles";
});

afterAll(() => {
  process.env.TZ = originalTZ;
});

describe("dayKey", () => {
  it("buckets a UTC instant by the operator's LOCAL calendar day", () => {
    // 2026-05-01T05:00:00Z is 2026-04-30 22:00 in Los Angeles (PDT, UTC-7),
    // so the local day (Apr 30) differs from the UTC day (May 1).
    expect(dayKey("2026-05-01T05:00:00Z")).toBe("2026-04-30");
  });

  it("returns the shared day when local and UTC agree", () => {
    expect(dayKey("2026-05-01T12:00:00Z")).toBe("2026-05-01");
  });

  it("produces a lexically-sortable ISO day key", () => {
    // The chart x-axis and bucket sort rely on YYYY-MM-DD keys; assert the
    // shape (the real contract) rather than DAY_FORMAT's literal value, which
    // would just be a change-detector.
    expect(dayKey("2026-05-01T12:00:00Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("passes invalid input through as dayjs's 'Invalid Date'", () => {
    // Contract characterization: dayKey does not guard bad input. Its only
    // caller (AgentStats.taskChartData) drops falsy timestamps before calling
    // it, so this documents the sharp edge rather than endorsing it.
    expect(dayKey("not-a-date")).toBe("Invalid Date");
  });
});

describe("safeTimeframe", () => {
  it("returns the value when it is a valid timeframe", () => {
    expect(safeTimeframe("Hour", "Second")).toBe("Hour");
  });

  it("falls back when the value is not a valid timeframe", () => {
    expect(safeTimeframe("Bogus", "Second")).toBe("Second");
  });

  it("returns a null fallback for invalid input (setter-validator mode)", () => {
    expect(safeTimeframe("Bogus", null)).toBe(null);
  });

  it("returns the fallback for undefined", () => {
    expect(safeTimeframe(undefined, "Day")).toBe("Day");
  });
});

describe("timeframeComputed", () => {
  // useStore stub: a function returning a stable backing object, matching how
  // timeframeComputed re-invokes useStore() per access.
  const makeStore = (initial) => {
    const state = { tf: initial };
    return () => state;
  };

  it("get returns the stored value when it is valid", () => {
    const { get } = timeframeComputed(makeStore("Hour"), "tf", "Second");
    expect(get()).toBe("Hour");
  });

  it("get falls back when the stored value is invalid", () => {
    const { get } = timeframeComputed(makeStore("Bogus"), "tf", "Second");
    expect(get()).toBe("Second");
  });

  it("set writes a valid new value", () => {
    const store = makeStore("Second");
    timeframeComputed(store, "tf", "Second").set("Hour");
    expect(store().tf).toBe("Hour");
  });

  it("set rejects an invalid value without writing", () => {
    const store = makeStore("Second");
    timeframeComputed(store, "tf", "Second").set("Bogus");
    expect(store().tf).toBe("Second");
  });

  it("set skips the write when the value is unchanged (same-value guard)", () => {
    // Counts setter invocations so the redundant-write suppression — which
    // otherwise triggers a persistedstate JSON.stringify on every interaction —
    // is actually verified, not just the resulting value.
    let writes = 0;
    const backing = { value: "Hour" };
    const proxy = {
      get tf() {
        return backing.value;
      },
      set tf(v) {
        writes += 1;
        backing.value = v;
      },
    };
    const useStore = () => proxy;
    const { set } = timeframeComputed(useStore, "tf", "Second");

    set("Hour"); // same as current → guarded, no write
    expect(writes).toBe(0);

    set("Minute"); // different → writes once
    expect(writes).toBe(1);
  });
});
