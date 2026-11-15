# authentication

## Overview
Stateless Spring Security setup. Requests carry an HS256 JWT bearer token,
which `JwtFilter`/`JwtService` check. Users load by email through
`MyuserDetailsService`, wrapped in `DetailsOfUser`. Google OAuth2 login goes
through `OauthService`, which creates the user on first login and redirects to
the SPA with a JWT in the URL fragment.

## Configuration
| Property | Env var | Default | Meaning |
|---|---|---|---|
| `jwt.secret` | `jwtsecret` | blank | Base64 HMAC key, at least 32 decoded bytes. Blank: a random key is generated at startup and a WARN is logged (tokens die on restart). Set but invalid or too short: startup fails. |
| `app.frontend-url` | `frontendurl` | `http://localhost:5173` | Base URL `OauthService` redirects to. A trailing `/` is stripped; blank fails startup. |

Generate a key with `openssl rand -base64 32`.

## Interface
- `Security` (`@Configuration @EnableWebSecurity`):
  - `filterChain`:
    - `permitAll` on exactly `/user/add`, `/user/login`, `/oauth2/**`,
      `/login/oauth2/**`, `/ws/**` and `/error`. Every other request,
      `/user/delete/{id}` included, must be authenticated.
    - `oauth2Login` with `OauthService` as its success handler.
    - `JwtFilter` added before `UsernamePasswordAuthenticationFilter`.
    - The entry point is `HttpStatusEntryPoint(UNAUTHORIZED)`, so an
      unauthenticated request gets a 401, not a redirect.
  - `authenticationProvider`: `DaoAuthenticationProvider(MyuserDetailsService)`
    with `BCryptPasswordEncoder(12)`.
  - `authenticationManager`.
  - `corsConfigurationSource`:
    - Origin: `http://localhost:5173` (still hard-coded here).
    - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
    - Headers: `*`; credentials allowed; `Authorization` exposed.
    - `maxAge` 3600, registered for `/**`.
- `JwtService(@Value("${jwt.secret:}") String secret)`:
  - `generateToken(String email)`: subject = email, `issuedAt` = now,
    expiry = now + 24h. A blank email throws `IllegalArgumentException`.
  - `extractUserName(String token)`: throws a JJWT `JwtException` for a bad
    signature, malformed or expired token, and `IllegalArgumentException` for
    an empty one.
  - `validateToken(String token, DetailsOfUser)`: returns `false` for a null
    token, null details, a null user or a null email.
- `JwtFilter extends OncePerRequestFilter`: `doFilterInternal`.
- `MyuserDetailsService implements UserDetailsService`:
  `loadUserByUsername(String email)`, throws `UsernameNotFoundException` for a
  blank or unknown email.
- `DetailsOfUser implements UserDetails`:
  - `getUser()` returns the wrapped `Users` (other packages read the caller
    from it).
  - Its only authority is `"USER"`.
  - `getUsername()` returns the user's *name*; `getEmail()` returns the email.
  - All account-status flags return `true`.
- `OauthService implements AuthenticationSuccessHandler`:
  `onAuthenticationSuccess`.

## Invariants
- CSRF is disabled, sessions are `STATELESS`, and CORS uses the
  `corsConfigurationSource` bean.
- `JwtFilter` reads only the `Authorization` header. It uses the header only
  when it starts with `"Bearer "` and the `SecurityContext` is not already
  authenticated.
- Any `JwtException`, `IllegalArgumentException` or
  `UsernameNotFoundException` while parsing the token or loading the user is
  logged at DEBUG and swallowed: the request continues unauthenticated, and
  nothing is set in the `SecurityContext`. So a malformed, expired,
  foreign-key or deleted-user token gets the entry point's 401 on protected
  routes, while public routes (login, signup) still work with a stale header.
- `validateToken` requires `subject == userDetails.getEmail()` and an
  expiration that has not passed. Expired tokens are normally already
  rejected by the parser (and so by the filter's catch).
- The signing key is fixed for the life of the process. With `jwtsecret` set,
  tokens survive restarts and are valid across instances that share the key.
- `MyuserDetailsService` never returns `DetailsOfUser(null)` and does not wrap
  repository exceptions. An unknown email on password login becomes
  `BadCredentialsException` in `DaoAuthenticationProvider` (a 401).
- OAuth users without an `email` attribute get a 401 and no token.

## Side Effects
- `OauthService`: when `findByemail` returns null, it inserts a `Users` row
  with the email and no password. The name is the OAuth `name` attribute,
  falling back to the part of the email before `@`, then to the whole email.
  An existing user is never modified. It then calls
  `sendRedirect("<app.frontend-url>/oauth2/callback#token=<jwt>")`. The token is
  in the fragment, so it is not sent to any server or in a Referer header; the
  SPA (`frontend/src/api/authApi.js` `consumeOauthCallback`) reads it and wipes
  it from the address bar.
- `JwtFilter`: puts a `UsernamePasswordAuthenticationToken` (with
  `WebAuthenticationDetailsSource` details) into the `SecurityContextHolder`
  for a valid token.
- `JwtService`: logs a WARN at startup when it has to generate a key.

## Verification
- Run: `mvn test` (from the repository root). Unit tests (no Spring context)
  live in `src/test/java/com/collabKanban/Kanban/authentication/`.
