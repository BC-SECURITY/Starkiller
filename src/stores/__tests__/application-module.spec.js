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
