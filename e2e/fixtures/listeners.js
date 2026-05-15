// e2e/fixtures/listeners.js
export const defaultListeners = [
  {
    id: 1,
    name: "http-1",
    enabled: true,
    module: "http",
    listener_type: "http",
    template: "http",
    options: { Host: "http://0.0.0.0", Port: "80" },
    tags: [],
    created_at: "2026-04-30T10:00:00Z",
  },
  {
    id: 2,
    name: "http-2-stopped",
    enabled: false,
    module: "http",
    listener_type: "http",
    template: "http",
    options: { Host: "http://0.0.0.0", Port: "8080" },
    tags: [],
    created_at: "2026-04-30T11:00:00Z",
  },
];

export const httpTemplate = {
  id: "http",
  name: "http",
  description: "HTTP[S] listener",
  options: {
    Name: { value: "", required: true, description: "Name" },
    Host: { value: "http://0.0.0.0", required: true, description: "Host" },
    Port: { value: "80", required: true, description: "Port" },
  },
};
