import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { modules } from "./test.setup";

describe("Schema Deployment", () => {
  it("deploys without errors", async () => {
    // This test verifies the schema can be instantiated
    const t = convexTest(schema, modules);
    expect(t).toBeDefined();
  });

  it("has required tables", async () => {
    // Verify schema structure has all required tables
    expect(schema.tables.familyProfiles).toBeDefined();
    expect(schema.tables.visitSlots).toBeDefined();
    expect(schema.tables.specialDays).toBeDefined();
    expect(schema.tables.notifications).toBeDefined();
  });

  it("has auth tables from authTables", async () => {
    // Verify auth tables are included
    expect(schema.tables.users).toBeDefined();
    expect(schema.tables.authSessions).toBeDefined();
    expect(schema.tables.authAccounts).toBeDefined();
  });
});
