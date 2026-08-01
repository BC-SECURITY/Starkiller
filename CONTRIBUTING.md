# Contributing to Starkiller

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Creating Github Issues

Please first review the existing Starkiller issues to see if the error was resolved with a fix in the development branch or if we chose not to fix the error for some reason.

The more information you provide in a Github issue the easier it will be for us to track down and fix the problem:

- Please provide the version of Empire you are using.
- Please provide the OS, and Starkiller version that you are using.
- Please describe the expected behavior and the encountered error.
  - The more detail the better!
  - Include any actions taken just prior to the error.
  - Please post a screenshot of the error, a link to a Pastebin dump of the error, or embedded text of the error.
  - Any additional information.

## Making a Pull Request

1. Create an issue describing the motivation for your changes

   - Pull Requests without associated Issues may still be accepted, if the motivation is obvious. However, this will help speed up code review if there's any uncertainty.

1. Fork the repo and create your branch from main.
1. Make sure your code lints.
1. Issue that pull request!

## Use a Consistent Coding Style

We use Airbnb's and Vue's recommended ESLint configs. To make your life easier, consider installing an ESLint plugin in your editor of choice. You can also run `yarn lint`.

## Running tests

End-to-end tests live in `e2e/` and use [Playwright](https://playwright.dev/).

```bash
yarn test:e2e          # headless
yarn test:e2e:ui       # interactive UI mode
yarn test:e2e e2e/agents-list.spec.js   # single spec
```

The dev server is auto-started by Playwright on port 5173. If you already have `yarn dev` running locally, it's reused.

### Adding a spec

1. Add or extend a fixture in `e2e/fixtures/<resource>.js`.
2. Add or extend a mock helper in `e2e/helpers/api/<resource>.js`.
3. Add a spec at `e2e/<feature>.spec.js`. Use `setFakeAuth(page)` (and `blockSockets`, `mockEmpireBootstrap`) in `beforeEach`.
4. Run it: `yarn test:e2e e2e/<feature>.spec.js`.

### Selectors and conventions

- Routes are hash-based — use `/#/agents` style paths in `goto`. URL assertions use regex like `/#\/agents$/`.
- Prefer locators by role/label/text. Add `data-testid` only when ambiguous.
- Vuetify dialogs and menus portal to `document.body`. Use `page.getByRole("dialog")` rather than scoped queries inside parents.
- Never call `page.waitForTimeout`. Use `expect(...).toBeVisible()` and `expect.poll(...)` for retry semantics.
- Don't commit `.only` — CI will fail (`forbidOnly`).
