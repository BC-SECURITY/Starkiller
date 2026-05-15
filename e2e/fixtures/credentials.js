// e2e/fixtures/credentials.js
export const defaultCredentials = [
  {
    id: 1,
    credtype: "plaintext",
    domain: "TEST",
    username: "admin",
    password: "Password123",
    host: "DC01",
    tags: [],
  },
  {
    id: 2,
    credtype: "hash",
    domain: "TEST",
    username: "user",
    password:
      "aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0",
    host: "WS01",
    tags: [],
  },
];
