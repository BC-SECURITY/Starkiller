import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useUserStore } from "@/stores/user-module";
import * as userApi from "@/api/user-api";
import * as downloadApi from "@/api/download-api";

vi.mock("@/api/user-api", () => ({
  getUsers: vi.fn(),
}));
vi.mock("@/api/download-api", () => ({
  getDownloadAsUrl: vi.fn(),
}));

describe("user-module store — getUsers", () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression test: a single rejected avatar fetch used to reject the
  // whole Promise.all, so this.users was never assigned -- the entire
  // user list silently disappeared for every consumer over one stale
  // avatar reference.
  it("still assigns users when one user's avatar fetch rejects", async () => {
    const store = useUserStore();
    userApi.getUsers.mockResolvedValue([
      { id: 1, username: "has-avatar", avatar: { id: 10 } },
      { id: 2, username: "broken-avatar", avatar: { id: 20 } },
      { id: 3, username: "no-avatar" },
    ]);
    downloadApi.getDownloadAsUrl.mockImplementation((id) => {
      if (id === 20) return Promise.reject(new Error("404"));
      return Promise.resolve(`blob:url-for-${id}`);
    });

    await store.getUsers();

    expect(store.users).toHaveLength(3);
    expect(store.users.find((u) => u.id === 1).avatarUrl).toBe(
      "blob:url-for-10",
    );
    // The failed avatar must not block this user from appearing.
    expect(store.users.find((u) => u.id === 2).avatarUrl).toBeUndefined();
    expect(store.users.find((u) => u.id === 3).avatarUrl).toBeUndefined();
  });

  it("assigns users normally when every avatar fetch succeeds", async () => {
    const store = useUserStore();
    userApi.getUsers.mockResolvedValue([
      { id: 1, username: "a", avatar: { id: 10 } },
    ]);
    downloadApi.getDownloadAsUrl.mockResolvedValue("blob:url-for-10");

    await store.getUsers();

    expect(store.users).toEqual([
      {
        id: 1,
        username: "a",
        avatar: { id: 10 },
        avatarUrl: "blob:url-for-10",
      },
    ]);
  });
});
