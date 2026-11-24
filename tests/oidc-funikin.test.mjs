import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { createMockOidcServer } from "../scripts/mock-oidc-server.mjs";
import {
  sanitizeRedirectPath,
  getFunikinDiscoveryDoc,
  getFunikinJwks,
  buildTokenEndpointRequest,
  verifyFunikinIdToken,
  determineVerifiedEmail,
  _resetOidcCache,
} from "../lib/oidc-core.ts";

describe("FunikIn OIDC Authentication & Security Suite", () => {
  let mockServer;

  before(async () => {
    mockServer = await createMockOidcServer();
  });

  after(async () => {
    if (mockServer) {
      await mockServer.close();
    }
  });

  beforeEach(() => {
    _resetOidcCache();
    mockServer.resetScenario();
  });

  describe("1. Post-login Redirect Sanitization (sanitizeRedirectPath)", () => {
    it("menolak protocol-relative URLs (//evil.com)", () => {
      assert.equal(sanitizeRedirectPath("//evil.com"), "/");
      assert.equal(sanitizeRedirectPath("//evil.com/path"), "/");
    });

    it("menolak absolute URLs dengan scheme (https://evil.com)", () => {
      assert.equal(sanitizeRedirectPath("https://evil.com"), "/");
      assert.equal(sanitizeRedirectPath("http://evil.com/login"), "/");
      assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/");
    });

    it("menolak backslash evasion (/\\evil.com dan \\evil.com)", () => {
      assert.equal(sanitizeRedirectPath("/\\evil.com"), "/");
      assert.equal(sanitizeRedirectPath("\\evil.com"), "/");
      assert.equal(sanitizeRedirectPath("/\\\\evil.com"), "/");
    });

    it("mengizinkan relative safe paths pada origin yang sama", () => {
      assert.equal(sanitizeRedirectPath("/"), "/");
      assert.equal(sanitizeRedirectPath("/profil"), "/profil");
      assert.equal(
        sanitizeRedirectPath("/artikel/analisis-terbaru?tab=komentar#section"),
        "/artikel/analisis-terbaru?tab=komentar#section",
      );
    });

    it("mengembalikan default '/' untuk input kosong, null, atau spasi", () => {
      assert.equal(sanitizeRedirectPath(null), "/");
      assert.equal(sanitizeRedirectPath(undefined), "/");
      assert.equal(sanitizeRedirectPath(""), "/");
      assert.equal(sanitizeRedirectPath("   "), "/");
    });
  });

  describe("2. OIDC Discovery & HTTPS/Host Enforcement", () => {
    it("berhasil mengambil discovery document yang valid", async () => {
      const doc = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      assert.equal(doc.issuer, mockServer.issuer);
      assert.equal(doc.token_endpoint, `${mockServer.issuer}/token`);
      assert.equal(doc.jwks_uri, `${mockServer.issuer}/jwks.json`);
    });

    it("menolak issuer non-HTTPS di production", async () => {
      await assert.rejects(
        async () => {
          await getFunikinDiscoveryDoc("http://auth.funikin.com", true);
        },
        /wajib menggunakan HTTPS di production/,
      );
    });

    it("menolak issuer localhost di production", async () => {
      await assert.rejects(
        async () => {
          await getFunikinDiscoveryDoc("https://localhost:8080", true);
        },
        /tidak boleh localhost/,
      );
    });

    it("menolak jika claim issuer pada dokumen discovery tidak cocok dengan FUNIKIN_ISSUER", async () => {
      mockServer.setScenario({ discoveryIssuer: "https://spoofed-issuer.com" });
      await assert.rejects(
        async () => {
          await getFunikinDiscoveryDoc(mockServer.issuer, false);
        },
        /tidak cocok dengan FUNIKIN_ISSUER/,
      );
    });

    it("tidak melakukan caching pada respons discovery error", async () => {
      mockServer.setScenario({ discoveryError: true });
      await assert.rejects(
        async () => {
          await getFunikinDiscoveryDoc(mockServer.issuer, false);
        },
        /Gagal mengambil OIDC discovery/,
      );

      // Setelah endpoint normal kembali, request berikutnya harus langsung berhasil (tidak terkunci di cache)
      mockServer.setScenario({ discoveryError: false });
      const doc = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      assert.equal(doc.issuer, mockServer.issuer);
    });
  });

  describe("3. Token Endpoint Client Auth Methods", () => {
    it("menggunakan client_secret_basic jika discovery mendukung basic auth (standar RFC 6749)", () => {
      const discovery = {
        issuer: mockServer.issuer,
        authorization_endpoint: `${mockServer.issuer}/auth`,
        token_endpoint: `${mockServer.issuer}/token`,
        jwks_uri: `${mockServer.issuer}/jwks.json`,
        token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
      };

      const req = buildTokenEndpointRequest({
        discovery,
        clientId: "my-client",
        clientSecret: "my-secret",
        code: "code-123",
        codeVerifier: "verifier-abc",
        redirectUri: "http://localhost:3000/auth/funikin/callback",
      });

      assert.equal(req.body.get("client_id"), null);
      const expectedCreds = Buffer.from("my-client:my-secret").toString("base64");
      assert.equal(req.headers["Authorization"], `Basic ${expectedCreds}`);
    });

    it("menggunakan client_secret_post jika discovery hanya mendukung post body auth", () => {
      const discovery = {
        issuer: mockServer.issuer,
        authorization_endpoint: `${mockServer.issuer}/auth`,
        token_endpoint: `${mockServer.issuer}/token`,
        jwks_uri: `${mockServer.issuer}/jwks.json`,
        token_endpoint_auth_methods_supported: ["client_secret_post"],
      };

      const req = buildTokenEndpointRequest({
        discovery,
        clientId: "my-client",
        clientSecret: "my-secret",
        code: "code-123",
        codeVerifier: "verifier-abc",
        redirectUri: "http://localhost:3000/auth/funikin/callback",
      });

      assert.equal(req.body.get("client_id"), "my-client");
      assert.equal(req.body.get("client_secret"), "my-secret");
      assert.equal(req.headers["Authorization"], undefined);
    });
  });

  describe("4. ID Token Verification & Algorithm Enforcement", () => {
    it("berhasil memverifikasi id_token valid bertanda tangan RS256", async () => {
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      // Ambil id_token dari mock server
      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_secure_123",
        }),
      });
      const tokenData = await tokenRes.json();

      const payload = await verifyFunikinIdToken({
        idToken: tokenData.id_token,
        jwks,
        discovery,
        clientId: "responku-client",
        expectedNonce: "nonce_secure_123",
      });

      assert.equal(payload.sub, "funikin-sub-123456");
      assert.equal(payload.email, "user.test@funikin.com");
      assert.equal(payload.email_verified, true);
    });

    it("MENOLAK id_token dengan algoritma 'none'", async () => {
      mockServer.setScenario({ signingAlg: "none" });
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_secure_123",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_secure_123",
          });
        },
        /JOSEAlgNotAllowed|not allowed/i,
      );
    });

    it("MENOLAK id_token dengan algoritma simetris 'HS256'", async () => {
      mockServer.setScenario({ signingAlg: "HS256" });
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_secure_123",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_secure_123",
          });
        },
        /JOSEAlgNotAllowed|not allowed/i,
      );
    });

    it("MENOLAK id_token yang ditandatangani dengan kunci asing (signature invalid)", async () => {
      // Buat keypair asing yang tidak terdaftar di JWKS provider
      const foreignKey = await generateKeyPair("RS256");
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const forgedToken = await new SignJWT({
        nonce: "nonce_secure_123",
        email: "hacker@evil.com",
      })
        .setProtectedHeader({ alg: "RS256", kid: "foreign-key" })
        .setIssuer(discovery.issuer)
        .setAudience("responku-client")
        .setSubject("sub-hacker")
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(foreignKey.privateKey);

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: forgedToken,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_secure_123",
          });
        },
        /no applicable key found|signature verification failed/i,
      );
    });
  });

  describe("5. Claims Validation (iss, aud, nonce, exp, sub)", () => {
    it("MENOLAK jika issuer (iss) tidak cocok", async () => {
      mockServer.setScenario({ idTokenIssuer: "https://wrong-issuer.com" });
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_123",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_123",
          });
        },
        /unexpected "iss" claim value/i,
      );
    });

    it("MENOLAK jika audience (aud) tidak cocok dengan client_id", async () => {
      mockServer.setScenario({ idTokenAudience: "wrong-client-app" });
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_123",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_123",
          });
        },
        /unexpected "aud" claim value/i,
      );
    });

    it("MENOLAK jika nonce tidak cocok dengan yang disimpan di cookie", async () => {
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_asli",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_berbeda_hasil_tamper",
          });
        },
        /Nonce OIDC tidak cocok atau telah dimanipulasi/,
      );
    });

    it("MENOLAK id_token yang sudah kedaluwarsa (exp expired)", async () => {
      mockServer.setScenario({ idTokenExpired: true });
      const discovery = await getFunikinDiscoveryDoc(mockServer.issuer, false);
      const jwks = getFunikinJwks(discovery.jwks_uri);

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: "valid_code",
          code_verifier: "verifier123",
          client_id: "responku-client",
          client_secret: "secret123",
          nonce: "nonce_123",
        }),
      });
      const tokenData = await tokenRes.json();

      await assert.rejects(
        async () => {
          await verifyFunikinIdToken({
            idToken: tokenData.id_token,
            jwks,
            discovery,
            clientId: "responku-client",
            expectedNonce: "nonce_123",
          });
        },
        /"exp" claim timestamp check failed/i,
      );
    });
  });

  describe("6. Account Linking Policy (determineVerifiedEmail)", () => {
    it("menautkan akun (mengembalikan verifiedEmail) jika email_verified === true", () => {
      const email = determineVerifiedEmail("funikin", {
        email: "user@funikin.com",
        email_verified: true,
      });
      assert.equal(email, "user@funikin.com");
    });

    it("TIDAK menautkan akun jika email_verified === false", () => {
      const email = determineVerifiedEmail("funikin", {
        email: "user@funikin.com",
        email_verified: false,
      });
      assert.equal(email, undefined);
    });

    it("TIDAK menautkan akun jika email_verified tidak bertipe boolean ketat", () => {
      const email1 = determineVerifiedEmail("funikin", {
        email: "user@funikin.com",
        email_verified: "true", // string 'true' bukan boolean
      });
      assert.equal(email1, undefined);

      const email2 = determineVerifiedEmail("funikin", {
        email: "user@funikin.com",
        email_verified: undefined,
      });
      assert.equal(email2, undefined);
    });

    it("Google OAuth: email_verified === true dengan domain gmail.com mengembalikan email", () => {
      const email = determineVerifiedEmail("google", {
        email: "user@gmail.com",
        email_verified: true,
      });
      assert.equal(email, "user@gmail.com");
    });

    it("Google OAuth: email non-gmail tanpa claim hd tidak ditautkan otomatis", () => {
      const email = determineVerifiedEmail("google", {
        email: "user@customdomain.com",
        email_verified: true,
      });
      assert.equal(email, undefined);
    });
  });
});
