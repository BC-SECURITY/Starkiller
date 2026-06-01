import { ref, computed, nextTick } from "vue";
import {
  routeErrorsByKind,
  useServerErrors,
} from "@/composables/forms/useServerErrors";

describe("routeErrorsByKind", () => {
  it("moves file-kind field errors into formLevel (with field-name prefix) and keeps the rest", () => {
    const routed = routeErrorsByKind(
      { fields: { Name: ["bad"], Cert: ["too big"] }, formLevel: ["x"] },
      { Name: "text", Cert: "file" },
    );
    expect(routed.fields).toEqual({ Name: ["bad"] });
    expect(routed.formLevel).toEqual(["x", "Cert: too big"]);
  });

  it("fails safe: routes an error for an unknown kind to the banner with field-name prefix", () => {
    const routed = routeErrorsByKind(
      { fields: { Ghost: ["orphaned"] }, formLevel: [] },
      { Name: "text" }, // no entry for Ghost
    );
    expect(routed.fields).toEqual({});
    expect(routed.formLevel).toEqual(["Ghost: orphaned"]);
  });

  it("does not mutate the input normalized object", () => {
    const input = { fields: { Cert: ["too big"] }, formLevel: ["x"] };
    routeErrorsByKind(input, { Cert: "file" });
    expect(input.formLevel).toEqual(["x"]);
    expect(input.fields).toEqual({ Cert: ["too big"] });
  });

  it("prefixes every message individually when a field has several", () => {
    const routed = routeErrorsByKind(
      { fields: { Cert: ["too big", "wrong type"] }, formLevel: [] },
      { Cert: "file" },
    );
    expect(routed.formLevel).toEqual(["Cert: too big", "Cert: wrong type"]);
  });

  it("dedups the prefix when the backend message already leads with the field name", () => {
    // Pydantic stringified validators sometimes already include the field
    // name in the msg. Double-prefixing would render "Cert: Cert: ..." in
    // the banner.
    const routed = routeErrorsByKind(
      {
        fields: { Cert: ["Cert: too big", "cert: also wrong"] },
        formLevel: [],
      },
      { Cert: "file" },
    );
    expect(routed.formLevel).toEqual(["Cert: too big", "cert: also wrong"]);
  });

  it("does not dedup when the msg starts with the field name without a colon", () => {
    // Substring boundary: "Certs are bad" against field "Cert" must NOT
    // dedup. A refactor to startsWith(name) (dropping the colon) would eat
    // legitimate prefixes on substring matches.
    const routed = routeErrorsByKind(
      { fields: { Cert: ["Certs are bad"] }, formLevel: [] },
      { Cert: "file" },
    );
    expect(routed.formLevel).toEqual(["Cert: Certs are bad"]);
  });
});

describe("useServerErrors", () => {
  const known = computed(() => ["Name", "Cert"]);
  const kinds = computed(() => ({ Name: "text", Cert: "file" }));

  it("seeds field and form-level messages from a 422 array", async () => {
    const serverErrors = ref(null);
    const { messagesFor, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: known,
      kindByField: kinds,
    });
    serverErrors.value = [
      { loc: ["body", "options", "Name"], msg: "required" },
      { loc: ["body", "options", "Cert"], msg: "too big" },
    ];
    await nextTick();
    expect(messagesFor("Name")).toEqual(["required"]);
    expect(messagesFor("Cert")).toEqual([]); // file routed to banner
    expect(formLevelMessages.value).toEqual(["Cert: too big"]);
  });

  it("clears a field's messages on edit and resets when serverErrors goes null", async () => {
    const serverErrors = ref([
      { loc: ["body", "options", "Name"], msg: "required" },
    ]);
    const { messagesFor, clearField, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: known,
      kindByField: kinds,
    });
    await nextTick();
    expect(messagesFor("Name")).toEqual(["required"]);
    clearField("Name");
    expect(messagesFor("Name")).toEqual([]);
    serverErrors.value = null;
    await nextTick();
    expect(messagesFor("Name")).toEqual([]);
    expect(formLevelMessages.value).toEqual([]);
  });

  it("authoritatively replaces stale errors when re-seeded with a new 422", async () => {
    const serverErrors = ref([
      { loc: ["body", "options", "Name"], msg: "required" },
    ]);
    const { messagesFor, clearField, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: known,
      kindByField: kinds,
    });
    await nextTick();
    expect(messagesFor("Name")).toEqual(["required"]);
    clearField("Name"); // user fixed Name, dismissed its error

    // Resubmit fails again, this time on Cert only (a file -> banner).
    serverErrors.value = [
      { loc: ["body", "options", "Cert"], msg: "still invalid" },
    ];
    await nextTick();
    expect(messagesFor("Name")).toEqual([]); // no stale/resurrected Name error
    expect(messagesFor("Cert")).toEqual([]); // file routed to banner
    expect(formLevelMessages.value).toEqual(["Cert: still invalid"]);
  });

  it("re-routes already-seeded errors when kindByField changes", async () => {
    // Real-world trigger: suggested values arrive async, flipping a field's
    // resolved widget (e.g. text -> select for Listener) after a 422 was
    // seeded. Fixture uses text -> file because the rebuild path doesn't
    // branch on which specific kinds are involved, and the text/file
    // boundary exercises the banner re-route cleanly.
    const serverErrors = ref([
      { loc: ["body", "options", "Cert"], msg: "broken" },
    ]);
    const knownNames = computed(() => ["Cert"]);
    const kindRef = ref({ Cert: "text" });
    const kindByField = computed(() => kindRef.value);
    const { messagesFor, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    // Initially text -> inline on the field, banner empty.
    expect(messagesFor("Cert")).toEqual(["broken"]);
    expect(formLevelMessages.value).toEqual([]);
    // Suggestions resolve and Cert flips to a file widget; the error must
    // re-route to the banner so it isn't silently hidden.
    kindRef.value = { Cert: "file" };
    await nextTick();
    expect(messagesFor("Cert")).toEqual([]);
    expect(formLevelMessages.value).toEqual(["Cert: broken"]);
  });

  it("does not resurrect a user-dismissed error when kindByField changes", async () => {
    // Regression guard for the widened watch: a kindByField change must NOT
    // re-derive dismissed errors from the (still-set) serverErrors source.
    const serverErrors = ref([
      { loc: ["body", "options", "Name"], msg: "required" },
      { loc: ["body", "options", "Listener"], msg: "missing" },
    ]);
    const knownNames = computed(() => ["Name", "Listener"]);
    const kindRef = ref({ Name: "text", Listener: "text" });
    const kindByField = computed(() => kindRef.value);
    const { messagesFor, clearField } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(messagesFor("Name")).toEqual(["required"]);
    expect(messagesFor("Listener")).toEqual(["missing"]);
    // User fixes Name and dismisses its error.
    clearField("Name");
    expect(messagesFor("Name")).toEqual([]);
    // Listener store loads later -> Listener kind flips text -> select.
    kindRef.value = { Name: "text", Listener: "select" };
    await nextTick();
    // Listener's error is still pinned (topology change is fine for it),
    // but Name must stay dismissed despite the watch re-firing.
    expect(messagesFor("Name")).toEqual([]);
    expect(messagesFor("Listener")).toEqual(["missing"]);
  });

  it("re-routes a banner-bound (file) error back inline when its kind flips to text", async () => {
    // Symmetric to "re-routes already-seeded errors when kindByField changes":
    // pins the kind-narrowing direction. A one-way refactor of routeErrorsByKind
    // that only handles text->file would still pass the other test.
    const serverErrors = ref([
      { loc: ["body", "options", "Cert"], msg: "broken" },
    ]);
    const knownNames = computed(() => ["Cert"]);
    const kindRef = ref({ Cert: "file" });
    const kindByField = computed(() => kindRef.value);
    const { messagesFor, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(formLevelMessages.value).toEqual(["Cert: broken"]);
    kindRef.value = { Cert: "text" };
    await nextTick();
    expect(messagesFor("Cert")).toEqual(["broken"]);
    expect(formLevelMessages.value).toEqual([]);
  });

  it("clearField on a file-kind field clears the banner message (not just inline state)", async () => {
    // Banner-routed errors live in formLevelMessages, not fields. Without
    // running rebuild() inside clearField, dismissing a file-kind error would
    // do nothing visible — exactly the silent-failure class this PR targets.
    const serverErrors = ref([
      { loc: ["body", "options", "Cert"], msg: "broken" },
    ]);
    const knownNames = computed(() => ["Cert"]);
    const kindByField = computed(() => ({ Cert: "file" }));
    const { formLevelMessages, clearField } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(formLevelMessages.value).toEqual(["Cert: broken"]);
    clearField("Cert");
    expect(formLevelMessages.value).toEqual([]);
  });

  it("routes a known field's error to the banner when its kind is omitted (hidden field)", async () => {
    // Mirrors GeneralForm narrowing kindByField to renderable fields only:
    // a 422 against a depends_on-hidden (or non-boolean-required) field has
    // no inline surface, so it must fall through the unknown-kind fail-safe
    // to the banner with the field-name prefix.
    const serverErrors = ref([
      { loc: ["body", "options", "Secret"], msg: "required" },
    ]);
    const knownNames = computed(() => ["Mode", "Secret"]);
    const kindRef = ref({ Mode: "text" }); // Secret hidden, no kind entry
    const kindByField = computed(() => kindRef.value);
    const { messagesFor, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(messagesFor("Secret")).toEqual([]);
    expect(formLevelMessages.value).toEqual(["Secret: required"]);
    // Field becomes visible later (user satisfies the depends_on); the
    // topology watch re-routes the error inline.
    kindRef.value = { Mode: "text", Secret: "text" };
    await nextTick();
    expect(messagesFor("Secret")).toEqual(["required"]);
    expect(formLevelMessages.value).toEqual([]);
  });

  it("does not resurrect a dismissed error in the banner when its kind flips to file", async () => {
    // If a dismissed field's kind later changes such that routing would put
    // it in formLevel (file or unknown), the dismissal must still suppress
    // it. Without the pre-route dismissal filter the error would resurrect
    // in the banner because the per-field set only suppresses the inline
    // surface.
    const serverErrors = ref([
      { loc: ["body", "options", "Cert"], msg: "broken" },
    ]);
    const knownNames = computed(() => ["Cert"]);
    const kindRef = ref({ Cert: "text" });
    const kindByField = computed(() => kindRef.value);
    const { messagesFor, formLevelMessages, clearField } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(messagesFor("Cert")).toEqual(["broken"]);
    clearField("Cert");
    expect(messagesFor("Cert")).toEqual([]);
    // Suggestions resolve -> Cert flips to file. Without the pre-route
    // dismissal filter, the message would re-appear in formLevel.
    kindRef.value = { Cert: "file" };
    await nextTick();
    expect(messagesFor("Cert")).toEqual([]);
    expect(formLevelMessages.value).toEqual([]);
  });

  it("does not resurrect a dismissed error when knownFieldNames changes", async () => {
    // Pins both watch sources: a regression that narrowed the topology
    // watch to `[kindByField]` only would still pass the kind-flip cases
    // above but fail this one.
    const serverErrors = ref([
      { loc: ["body", "options", "Name"], msg: "required" },
    ]);
    const knownRef = ref(["Name"]);
    const knownNames = computed(() => knownRef.value);
    const kindByField = computed(() => ({ Name: "text", Other: "text" }));
    const { messagesFor, clearField } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    clearField("Name");
    // Schema lazy-loads a new field -> knownFieldNames changes.
    knownRef.value = ["Name", "Other"];
    await nextTick();
    expect(messagesFor("Name")).toEqual([]);
  });

  it("re-routes a formerly-unknown field error inline when knownFieldNames learns it", async () => {
    // Topology-watch path: an error sitting in formLevel (because the field
    // was unknown at first) must move inline once the field appears.
    const serverErrors = ref([
      { loc: ["body", "options", "NewField"], msg: "bad" },
    ]);
    const knownRef = ref([]);
    const knownNames = computed(() => knownRef.value);
    const kindByField = computed(() => ({ NewField: "text" }));
    const { messagesFor, formLevelMessages } = useServerErrors({
      serverErrors,
      knownFieldNames: knownNames,
      kindByField,
    });
    await nextTick();
    expect(formLevelMessages.value).toContain("bad");
    expect(messagesFor("NewField")).toEqual([]);
    knownRef.value = ["NewField"];
    await nextTick();
    expect(messagesFor("NewField")).toEqual(["bad"]);
    expect(formLevelMessages.value).toEqual([]);
  });

  it("clears dismissals on a fresh serverErrors so re-submit can re-show them", async () => {
    const serverErrors = ref([
      { loc: ["body", "options", "Name"], msg: "required" },
    ]);
    const { messagesFor, clearField } = useServerErrors({
      serverErrors,
      knownFieldNames: known,
      kindByField: kinds,
    });
    await nextTick();
    clearField("Name");
    expect(messagesFor("Name")).toEqual([]);
    // A new submit (different error object, even if same shape) is a fresh
    // source of truth — dismissals from the prior submit shouldn't suppress.
    serverErrors.value = [
      { loc: ["body", "options", "Name"], msg: "still required" },
    ];
    await nextTick();
    expect(messagesFor("Name")).toEqual(["still required"]);
  });
});
