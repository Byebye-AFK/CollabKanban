# UserSpace

## Overview
User accounts: the `Users` JPA entity, its repository, and a service and REST
controller under `/user` for signup, account deletion and email/password login
(which issues a JWT).

## Interface
- `UserController` (`@RequestMapping("user")`):
  - `POST /user/add` (public): body `CreateUserReq {name, email, password}`.
    200 with the same shape and `password: null`. 400 if any field is blank,
    409 "An account with that email already exists".
  - `DELETE /user/delete/{userId}` (needs a token): 200 with
    `CreateUserReq {name, email, password: null}` of the deleted account.
    403 "You can only delete your own account" when `userId` is not the
    caller's id, 404 "User not found" when the caller's own row is gone.
  - `POST /user/login` (public): body `UserAuthReq {email, password}`. 200 with
    the JWT as a plain `String`. 400 if a field is blank, 401
    "Wrong email or password" for bad credentials.
- `UserService` (constructor-injected `UserRepo`, `AuthenticationManager`,
  `JwtService`, `WorkspaceAccess`): `addUser(CreateUserReq)`,
  `deleteUser(Long)`, `verifyUser(UserAuthReq)` (returns the token or throws),
  `getuser(HttpServletRequest)` (legacy helper; prefer
  `WorkspaceAccess.currentUser()`).
- `Users` (`@Entity`, default table name):
  - `userId`: `@Id`, IDENTITY.
  - `name`: `nullable=false`.
  - `email`: `unique=true, nullable=false`.
  - `password`: BCrypt hash.
  - `memberships`: `@OneToMany(mappedBy="user", cascade=ALL)`, a
    `List<WorkspaceMembers>`.
  - `teams`: `@OneToMany(mappedBy="members", cascade=ALL)`, a
    `List<TeamMembers>`.
- `UserRepo extends JpaRepository<Users, Long>`: `findByuserId(Long)`,
  `findByname(String)`, `findByemail(String)`.

## Invariants
- Passwords are hashed with `BCryptPasswordEncoder` at strength 12 before they
  are saved, and no response ever carries a password.
- `addUser` checks `findByemail` first and answers 409. The unique column is the
  backstop for two signups racing past that check; the resulting
  `DataIntegrityViolationException` is also a 409 (see
  [`../Errors/README.md`](../Errors/README.md)).
- `deleteUser` is `@Transactional`. It compares the path id with
  `WorkspaceAccess.currentUser().getUserId()` **before** looking the row up, so
  a caller cannot probe which ids exist. Errors are thrown as
  `ResponseStatusException`, never wrapped.
- `verifyUser` authenticates through `AuthenticationManager`; any
  `AuthenticationException` (bad password, unknown email) becomes a 401. There
  is no sentinel return value.
- `getuser` answers 401 for a missing header, a header without `Bearer `, an
  unparsable token or an unknown email.

## Side Effects
- `addUser`: BCrypt hashing, then inserts a `Users` row.
- `deleteUser`: deletes the `Users` row. `cascade=ALL` also removes the user's
  `WorkspaceMembers` and `TeamMembers` rows.
- `verifyUser`: creates a JWT through `authentication/JwtService`.

## Verification
- Unit tests: `src/test/java/com/collabKanban/Kanban/UserSpace/UserServiceTest.java`
- Run: `mvn test` (from the repository root)
