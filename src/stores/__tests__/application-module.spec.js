import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useApplicationStore } from "@/stores/application-module";

// http.js is imported for its setInstance side-effect; keep it inert.
vi.mock("@/api/http", () => ({
  setInstance: vi.fn(),
  request: Object.assign(vi.fn(), {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }),
}));

// login()'s raw-fetch bypass must NOT trigger logout() or bump connectionError
// on auth failure or network error — that's the whole point of the bypass. If
// someone refactors login() to use request() in the future, these tests fail.
describe("application-module — login bypass invariants", () => {
  let store;

  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    store = useApplicationStore();
  });

  it("does NOT logout() or bump connectionError on a 401 from /token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: vi
        .fn()
        .mockResolvedValue({ detail: "Incorrect username or password" }),
    });

    await store.login({
      url: "http://h:1337",
      socketUrl: "ws://h:1337",
      username: "u",
      password: "bad",
    });

    expect(store.logout).not.toHaveBeenCalled();
    expect(store.connectionError).toBe(0);
    expect(store.loginError).toBe("Incorrect username or password");
    expect(store.token).toBe("");
  });

  it("does NOT logout() or bump connectionError on a network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await store.login({
      url: "http://h:1337",
      socketUrl: "ws://h:1337",
      username: "u",
      password: "p",
    });

    expect(store.logout).not.toHaveBeenCalled();
    expect(store.connectionError).toBe(0);
    expect(store.loginError).toBe("Unable to connect to server.");
    expect(store.token).toBe("");
  });

  it("does NOT logout() or bump connectionError when /users/me fails after a successful /token", async () => {
    // /token succeeds, /users/me 401 → login still fails but neither logout
    // nor connectionError fires.
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: vi.fn().mockResolvedValue({ detail: "token expired" }),
      });

    await store.login({
      url: "http://h:1337",
      socketUrl: "ws://h:1337",
      username: "u",
      password: "p",
    });

    expect(store.logout).not.toHaveBeenCalled();
    expect(store.connectionError).toBe(0);
    expect(store.token).toBe("");
  });
});

// Regression tests for the forcedLogoutReason clearing contract: it must
// never linger past the moment it's relevant, or a future unrelated
// session/attempt could show a stale "session expired" message.
describe("application-module — forcedLogoutReason clearing contract", () => {
  let store;

  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    store = useApplicationStore();
  });

  it("logout(reason) sets forcedLogoutReason", async () => {
    await store.logout("Your session has expired. Please log in again.");
    expect(store.forcedLogoutReason).toBe(
      "Your session has expired. Please log in again.",
    );
  });

  it("logout() with no argument clears any stale forcedLogoutReason (the voluntary Settings.vue path)", async () => {
    store.forcedLogoutReason = "stale reason from a prior forced logout";
    await store.logout();
    expect(store.forcedLogoutReason).toBe("");
  });

  it("a new login() attempt clears forcedLogoutReason even before the request resolves", async () => {
    store.forcedLogoutReason = "Your session has expired. Please log in again.";
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await store.login({
      url: "http://h:1337",
      socketUrl: "ws://h:1337",
      username: "u",
      password: "p",
    });

    expect(store.forcedLogoutReason).toBe("");
  });

  it("clear() resets forcedLogoutReason", () => {
    store.forcedLogoutReason = "Your session has expired. Please log in again.";
    store.clear();
    expect(store.forcedLogoutReason).toBe("");
  });
});
