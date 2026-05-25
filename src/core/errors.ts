export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class EntitlementError extends Error {
  constructor(message = "This feature is not enabled for the company.") {
    super(message);
    this.name = "EntitlementError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Requested resource was not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}
