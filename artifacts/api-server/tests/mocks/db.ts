export const db = {};
export const recensioniTable = {
  verificata: "verificata",
  createdAt: "created_at",
};
export const leadsTable = {};
export const siteControlRequestsTable = {};
export const pool = {
  query: async () => { throw new Error("Unexpected database access in test"); },
  connect: async () => { throw new Error("Unexpected database access in test"); },
};
