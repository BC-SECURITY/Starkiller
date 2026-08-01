import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useListenerStore } from "@/stores/listener-module";
import * as listenerApi from "@/api/listener-api";

// Mock the listener-api so the store makes no real HTTP calls.
vi.mock("@/api/listener-api", () => ({
  getListeners: vi.fn(),
  getListenerTemplates: vi.fn(),
  killListener: vi.fn(),
  getAutorunTasks: vi.fn(),
  saveAutorunTasks: vi.fn(),
}));

describe("listener-module store", () => {
  beforeEach(() => {
    // stubActions:false so the real action logic under test actually runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
    // The actions log on their success/error paths; silence it so the test
    // output stays clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("addListener", () => {
    it("appends a listener with a new id", async () => {
      const store = useListenerStore();
      await store.addListener({ id: 1, name: "http" });
      expect(store.listeners).toEqual([{ id: 1, name: "http" }]);
    });

    it("dedups by id — does not push when the id already exists", async () => {
      const store = useListenerStore();
      store.listeners = [{ id: 1, name: "http" }];
      await store.addListener({ id: 1, name: "http-renamed" });
      expect(store.listeners).toHaveLength(1);
      expect(store.listeners[0].name).toBe("http");
    });
  });

  describe("removeListener", () => {
    it("splices the listener whose id matches", () => {
      const store = useListenerStore();
      store.listeners = [{ id: 1 }, { id: 2 }, { id: 3 }];
      store.removeListener(2);
      expect(store.listeners.map((l) => l.id)).toEqual([1, 3]);
    });

    it("is a no-op when no listener has the given id", () => {
      const store = useListenerStore();
      store.listeners = [{ id: 1 }, { id: 2 }];
      store.removeListener(99);
      expect(store.listeners.map((l) => l.id)).toEqual([1, 2]);
    });
  });

  describe("killListener", () => {
    it("kills via the api then removes the listener from state", async () => {
      listenerApi.killListener.mockResolvedValue();
      const store = useListenerStore();
      store.listeners = [{ id: 1 }, { id: 2 }];

      await store.killListener(1);

      expect(listenerApi.killListener).toHaveBeenCalledWith(1);
      expect(store.listeners.map((l) => l.id)).toEqual([2]);
    });
  });

  describe("fetchAutorunTasks", () => {
    it("extracts records, stores them, and returns them on success", async () => {
      const tasks = [{ id: 1, name: "whoami" }];
      listenerApi.getAutorunTasks.mockResolvedValue({ records: tasks });
      const store = useListenerStore();

      const result = await store.fetchAutorunTasks(7);

      expect(listenerApi.getAutorunTasks).toHaveBeenCalledWith(7);
      expect(store.autorunTasks).toEqual(tasks);
      expect(result).toEqual(tasks);
    });

    it("returns an empty array and leaves state intact when the api rejects", async () => {
      listenerApi.getAutorunTasks.mockRejectedValue(new Error("boom"));
      const store = useListenerStore();
      store.autorunTasks = [{ id: 99 }];

      const result = await store.fetchAutorunTasks(7);

      expect(result).toEqual([]);
      // The catch path does not clear previously-loaded tasks.
      expect(store.autorunTasks).toEqual([{ id: 99 }]);
    });
  });

  describe("saveAutorunTasks", () => {
    it("wraps modules under a records key when saving", async () => {
      listenerApi.saveAutorunTasks.mockResolvedValue();
      const store = useListenerStore();

      await store.saveAutorunTasks({ listenerId: 7, modules: [{ id: 1 }] });

      expect(listenerApi.saveAutorunTasks).toHaveBeenCalledWith(7, {
        records: [{ id: 1 }],
      });
    });

    it("swallows api errors without throwing", async () => {
      listenerApi.saveAutorunTasks.mockRejectedValue(new Error("boom"));
      const store = useListenerStore();

      await expect(
        store.saveAutorunTasks({ listenerId: 7, modules: [] }),
      ).resolves.toBeUndefined();
    });
  });

  describe("getListeners", () => {
    it("flips status loading -> success and populates listeners", async () => {
      const records = [{ id: 1, name: "http" }];
      listenerApi.getListeners.mockResolvedValue(records);
      const store = useListenerStore();

      const pending = store.getListeners();
      // status is set synchronously before the awaited fetch resolves.
      expect(store.status).toBe("loading");

      await pending;
      expect(store.status).toBe("success");
      expect(store.listeners).toEqual(records);
      expect(listenerApi.getListeners).toHaveBeenCalledTimes(1);
    });

    it("sets status to error without throwing and leaves listeners intact when the fetch rejects", async () => {
      listenerApi.getListeners.mockRejectedValue(new Error("boom"));
      const store = useListenerStore();
      const existing = [{ id: 1, name: "http" }];
      store.listeners = existing;

      await expect(store.getListeners()).resolves.toBeUndefined();

      expect(store.status).toBe("error");
      // The catch path must not clobber previously-loaded listeners.
      expect(store.listeners).toEqual(existing);
    });
  });

  describe("getters", () => {
    it("listenerNames maps listeners to their names", () => {
      const store = useListenerStore();
      store.listeners = [{ name: "http" }, { name: "smb" }];
      expect(store.listenerNames).toEqual(["http", "smb"]);
    });

    it("templateIds returns a sorted copy without mutating templates", () => {
      const store = useListenerStore();
      store.templates = [{ id: "http" }, { id: "aws" }, { id: "smb" }];
      expect(store.templateIds).toEqual(["aws", "http", "smb"]);
      // original order preserved — the getter must return a copy, not sort in place.
      expect(store.templates.map((t) => t.id)).toEqual(["http", "aws", "smb"]);
    });
  });
});
