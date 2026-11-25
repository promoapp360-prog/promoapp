// Only the isolated payment-test bundle resolves dependencies to this module.
export const state = {
  rows: [] as unknown[][],
  reads: 0,
  inserts: [] as Record<string, unknown>[],
  updates: [] as Record<string, unknown>[],
  sessions: [] as any[],
  clients: [] as { key: string; options: unknown }[],
  emails: [] as any[],
  fail: "" as "" | "insert" | "update" | "session" | "email",
};

export function reset() {
  state.rows = [];
  state.reads = 0;
  state.inserts = [];
  state.updates = [];
  state.sessions = [];
  state.clients = [];
  state.emails = [];
  state.fail = "";
}

function check(operation: typeof state.fail) {
  if (state.fail === operation) throw new Error(`Synthetic ${operation} failure`);
}

export const accontiTable = { id: "id", progettoRef: "ref", stato: "state", email: "email" };
export const discountCodesTable = { code: "code", id: "id", usedCount: "usedCount" };
export const db = {
  select: () => ({
    from: () => ({
      where: async () => {
        state.reads++;
        const rows = state.rows.shift();
        if (!rows) throw new Error("Unexpected database read");
        return rows;
      },
    }),
  }),
  insert: () => ({
    values: async (value: Record<string, unknown>) => {
      check("insert");
      state.inserts.push(value);
    },
  }),
  update: () => ({
    set: (value: Record<string, unknown>) => ({
      where: async () => {
        check("update");
        state.updates.push(value);
      },
    }),
  }),
};
export const eq = (...args: unknown[]) => args;
export const sql = (...args: unknown[]) => args;

export default class Stripe {
  constructor(key: string, options: unknown) {
    state.clients.push({ key, options });
  }
  checkout = {
    sessions: {
      create: async (params: unknown) => {
        check("session");
        state.sessions.push(params);
        return { url: "https://checkout.example.test/session" };
      },
    },
  };
}

export class StripeSync {
  constructor() {
    throw new Error("Stripe synchronization is forbidden in payment tests");
  }
}

export class Resend {
  emails = {
    send: async (message: unknown) => {
      check("email");
      state.emails.push(message);
    },
  };
}
