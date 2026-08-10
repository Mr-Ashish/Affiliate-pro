import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashes a password to a bcrypt string different from the plaintext", async () => {
    const plain = "changeme";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies the correct password against its hash", async () => {
    const plain = "s3cret-pass";
    const hash = await hashPassword(plain);

    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse");

    await expect(verifyPassword("wrong-battery", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const plain = "same-password";
    const a = await hashPassword(plain);
    const b = await hashPassword(plain);

    expect(a).not.toBe(b);
    await expect(verifyPassword(plain, a)).resolves.toBe(true);
    await expect(verifyPassword(plain, b)).resolves.toBe(true);
  });
});
