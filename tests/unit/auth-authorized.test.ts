import { describe, expect, it } from "vitest";
import { authConfig } from "@/lib/auth.config";

type Authorized = NonNullable<
  NonNullable<typeof authConfig.callbacks>["authorized"]
>;
type JwtCb = NonNullable<NonNullable<typeof authConfig.callbacks>["jwt"]>;
type SessionCb = NonNullable<
  NonNullable<typeof authConfig.callbacks>["session"]
>;

const authorized = authConfig.callbacks!.authorized as Authorized;
const jwt = authConfig.callbacks!.jwt as JwtCb;
const session = authConfig.callbacks!.session as SessionCb;

function request(pathname: string) {
  return {
    nextUrl: new URL(pathname, "http://localhost:3000"),
  } as Parameters<Authorized>[0]["request"];
}

describe("authConfig.callbacks.authorized", () => {
  it("allows /admin/login without a session", () => {
    expect(
      authorized({ auth: null, request: request("/admin/login") }),
    ).toBe(true);
  });

  it("blocks /admin without a session", () => {
    expect(authorized({ auth: null, request: request("/admin") })).toBe(
      false,
    );
  });

  it("blocks nested admin routes without a session", () => {
    expect(
      authorized({ auth: null, request: request("/admin/merchants") }),
    ).toBe(false);
  });

  it("allows /admin when session has a user", () => {
    expect(
      authorized({
        auth: { user: { id: "1", email: "a@b.com" }, expires: "" },
        request: request("/admin"),
      }),
    ).toBe(true);
  });

  it("allows non-admin paths even without a session", () => {
    expect(authorized({ auth: null, request: request("/") })).toBe(true);
  });
});

describe("authConfig.callbacks.jwt / session", () => {
  it("copies user.id onto the JWT when user is present", () => {
    const token = jwt({
      token: { email: "a@b.com" },
      user: { id: "user-1", email: "a@b.com" },
      account: null,
      // @ts-expect-error minimal trigger shape for unit test
      trigger: "signIn",
    });
    expect(token).toMatchObject({ id: "user-1", email: "a@b.com" });
  });

  it("leaves token unchanged when no user is provided", () => {
    const token = jwt({
      token: { id: "existing", email: "a@b.com" },
      // @ts-expect-error minimal shape
      user: undefined,
      account: null,
    });
    expect(token).toMatchObject({ id: "existing" });
  });

  it("exposes token.id on session.user", () => {
    const result = session({
      session: {
        user: { email: "a@b.com", name: null, image: null },
        expires: "2099-01-01T00:00:00.000Z",
      },
      token: { id: "user-1", email: "a@b.com" },
      // @ts-expect-error minimal shape
      user: undefined,
    });
    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("a@b.com");
  });
});
