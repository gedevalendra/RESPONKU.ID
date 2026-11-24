import http from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";

/**
 * Mock OIDC Provider Server untuk pengujian dev dan automated tests.
 * KHUSUS DEV / TEST — tidak digunakan atau diekspor ke production.
 */
export async function createMockOidcServer(options = {}) {
  // Generate keypair RSA untuk tanda tangan JWT
  const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "test-key-1";
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";

  let serverPort = options.port || 0;
  let serverInstance = null;
  let issuerUrl = "";

  // Override config untuk skenario pengujian error/tampering
  let scenarioConfig = {
    discoveryIssuer: null,
    discoveryError: false,
    signingAlg: "RS256",
    idTokenIssuer: null,
    idTokenAudience: null,
    idTokenNonce: null,
    idTokenExpired: false,
    email: "user.test@funikin.com",
    emailVerified: true,
    sub: "funikin-sub-123456",
    name: "Pengguna FunikIn",
    picture: "https://www.funikin.com/avatar.png",
    authMethods: ["client_secret_post", "client_secret_basic"],
    requireBasicAuth: false,
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${serverPort}`);

    if (scenarioConfig.discoveryError && url.pathname.includes("openid-configuration")) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
      return;
    }

    if (url.pathname === "/.well-known/openid-configuration") {
      const issuer = scenarioConfig.discoveryIssuer || issuerUrl;
      const doc = {
        issuer,
        authorization_endpoint: `${issuerUrl}/auth`,
        token_endpoint: `${issuerUrl}/token`,
        jwks_uri: `${issuerUrl}/jwks.json`,
        userinfo_endpoint: `${issuerUrl}/userinfo`,
        response_types_supported: ["code"],
        id_token_signing_alg_values_supported: ["RS256", "ES256"],
        token_endpoint_auth_methods_supported: scenarioConfig.authMethods,
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(doc));
      return;
    }

    if (url.pathname === "/jwks.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [publicJwk] }));
      return;
    }

    if (url.pathname === "/auth") {
      const state = url.searchParams.get("state") || "";
      const redirectUri = url.searchParams.get("redirect_uri") || "";
      const code = "mock_auth_code_123";
      // Redirect balik ke client
      res.writeHead(302, {
        Location: `${redirectUri}?code=${code}&state=${encodeURIComponent(state)}`,
      });
      res.end();
      return;
    }

    if (url.pathname === "/token" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const params = new URLSearchParams(body);

      // Cek basic auth jika diminta
      if (scenarioConfig.requireBasicAuth) {
        const authHeader = req.headers["authorization"] || "";
        if (!authHeader.startsWith("Basic ")) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid_client", error_description: "Basic auth required" }));
          return;
        }
      }

      const nonce = scenarioConfig.idTokenNonce !== null
        ? scenarioConfig.idTokenNonce
        : params.get("nonce") || "mock_nonce_val";

      const iss = scenarioConfig.idTokenIssuer || issuerUrl;
      const aud = scenarioConfig.idTokenAudience || "responku-client";
      const alg = scenarioConfig.signingAlg || "RS256";

      let idToken;
      if (alg === "none") {
        // Alg none unsecure token
        const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify({
          iss,
          sub: scenarioConfig.sub,
          aud,
          nonce,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
          email: scenarioConfig.email,
          email_verified: scenarioConfig.emailVerified,
          name: scenarioConfig.name,
        })).toString("base64url");
        idToken = `${header}.${payload}.`;
      } else if (alg === "HS256") {
        // Simetris HMAC dengan secret sembarangan
        const secretKey = new TextEncoder().encode("insecure_symmetric_mock_secret_123");
        idToken = await new SignJWT({
          email: scenarioConfig.email,
          email_verified: scenarioConfig.emailVerified,
          name: scenarioConfig.name,
          nonce,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuer(iss)
          .setAudience(aud)
          .setSubject(scenarioConfig.sub)
          .setIssuedAt()
          .setExpirationTime(scenarioConfig.idTokenExpired ? "-1h" : "1h")
          .sign(secretKey);
      } else {
        // Standar RS256
        const jwtBuilder = new SignJWT({
          email: scenarioConfig.email,
          email_verified: scenarioConfig.emailVerified,
          name: scenarioConfig.name,
          picture: scenarioConfig.picture,
          nonce,
        })
          .setProtectedHeader({ alg: "RS256", kid: "test-key-1" })
          .setIssuer(iss)
          .setAudience(aud)
          .setSubject(scenarioConfig.sub)
          .setIssuedAt();

        if (scenarioConfig.idTokenExpired) {
          jwtBuilder.setExpirationTime("-1h");
        } else {
          jwtBuilder.setExpirationTime("1h");
        }

        idToken = await jwtBuilder.sign(privateKey);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          access_token: "mock_access_token_xyz",
          id_token: idToken,
          token_type: "Bearer",
          expires_in: 3600,
        })
      );
      return;
    }

    if (url.pathname === "/userinfo") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          sub: scenarioConfig.sub,
          email: scenarioConfig.email,
          email_verified: scenarioConfig.emailVerified,
          name: scenarioConfig.name,
          picture: scenarioConfig.picture,
        })
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      serverPort = server.address().port;
      issuerUrl = `http://127.0.0.1:${serverPort}`;
      resolve();
    });
  });

  return {
    server,
    port: serverPort,
    issuer: issuerUrl,
    privateKey,
    publicKey,
    setScenario(newConfig) {
      scenarioConfig = { ...scenarioConfig, ...newConfig };
    },
    resetScenario() {
      scenarioConfig = {
        discoveryIssuer: null,
        discoveryError: false,
        signingAlg: "RS256",
        idTokenIssuer: null,
        idTokenAudience: null,
        idTokenNonce: null,
        idTokenExpired: false,
        email: "user.test@funikin.com",
        emailVerified: true,
        sub: "funikin-sub-123456",
        name: "Pengguna FunikIn",
        picture: "https://www.funikin.com/avatar.png",
        authMethods: ["client_secret_post", "client_secret_basic"],
        requireBasicAuth: false,
      };
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

// Jika dijalankan langsung via CLI: node scripts/mock-oidc-server.mjs
if (process.argv[1] && process.argv[1].endsWith("mock-oidc-server.mjs")) {
  createMockOidcServer().then(({ issuer }) => {
    console.log(`Mock OIDC Provider berjalan di: ${issuer}`);
    console.log(`Discovery: ${issuer}/.well-known/openid-configuration`);
  });
}
