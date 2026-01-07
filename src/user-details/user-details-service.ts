import { Logger } from "@aws-lambda-powertools/logger";
import type { APIGatewayProxyEvent } from "aws-lambda";

const logger = new Logger({ serviceName: "user-detail-service" });

/**
 * User details service for extracting and managing authenticated user information.
 *
 * This module provides functions to extract user authentication details from AWS API Gateway
 * events (specifically AWS Cognito authentication claims) and make them available to the
 * authorization service. User details are stored in module-level variables and persist
 * across invocations within the same Lambda execution context.
 *
 * @remarks
 * **Authentication Flow:**
 * 1. API Gateway receives request with Cognito authentication
 * 2. Call {@link setUserDetails} to extract username and roles from event
 * 3. Authorization service uses {@link getUserName} and {@link getRoles} during policy evaluation
 * 4. Optional: Call {@link resetDetails} to clear user details (useful for testing)
 *
 * **Cognito Integration:**
 * - Extracts `cognito:username` claim for the username
 * - Extracts `cognito:groups` claim for user roles
 * - Handles both single role (string) and multiple roles (array) formats
 *
 * **State Management:**
 * User details are stored in module-level variables that persist during warm Lambda execution.
 * Each invocation should call {@link setUserDetails} to ensure fresh authentication data.
 *
 * @module user-details
 */
let userName: string | undefined;
let roles: string[] | undefined;

/**
 * Extracts and stores user authentication details from an API Gateway event.
 *
 * This function parses AWS Cognito authentication claims from the API Gateway request
 * context and stores the username and roles for use by the authorization service.
 * It handles both single and multiple Cognito groups gracefully.
 *
 * @param authenticatedEvent - The API Gateway proxy event containing Cognito authentication claims
 *   in `requestContext.authorizer.claims`
 *
 * @returns void - User details are stored in module-level variables accessible via
 *   {@link getUserName} and {@link getRoles}
 *
 * @remarks
 * **Cognito Claims:**
 * - `cognito:username`: The authenticated user's username
 * - `cognito:groups`: User's Cognito groups (roles), may be string or string array
 *
 * **Behavior:**
 * - If the event lacks authentication context, logs a warning and returns without setting details
 * - Single role is normalized to an array for consistent handling
 * - Overwrites any previously stored user details
 *
 * **Integration:**
 * - Automatically called by {@link loadCedarAuthorization} middleware
 * - Can be called manually before using AuthorizationService
 *
 * @example
 * Basic usage in Lambda handler:
 * ```typescript
 * import { setUserDetails, getUserName } from './user-details';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   setUserDetails(event);
 *   const username = getUserName();
 *   console.log('Authenticated user:', username);
 *   // ... proceed with authorization
 * };
 * ```
 *
 * @example
 * With middleware (automatic):
 * ```typescript
 * import middy from '@middy/core';
 * import { loadCedarAuthorization } from './authorization-middleware';
 *
 * const handler = middy(baseHandler).use(
 *   loadCedarAuthorization(config) // Calls setUserDetails automatically
 * );
 * ```
 *
 * @see {@link loadCedarAuthorization} for automatic user detail extraction
 * @see {@link getUserName} for retrieving the stored username
 * @see {@link getRoles} for retrieving the stored roles
 */
export function setUserDetails(authenticatedEvent: APIGatewayProxyEvent) {
	if (!authenticatedEvent?.requestContext?.authorizer) {
		logger.warn("The event is not an authenticated request.");
		return;
	}
	logger.debug("Getting user name...");
	userName =
		authenticatedEvent.requestContext?.authorizer?.claims["cognito:username"];
	logger.debug("User name set.", { userName });
	if (
		typeof authenticatedEvent.requestContext?.authorizer?.claims[
			"cognito:groups"
		] === "string"
	) {
		roles = [];
		roles.push(
			authenticatedEvent.requestContext?.authorizer?.claims["cognito:groups"],
		);
	} else {
		roles =
			authenticatedEvent.requestContext?.authorizer?.claims["cognito:groups"];
	}
	logger.debug("User details set", {
		userName,
		roles,
	});
}

/**
 * Retrieves the authenticated user's username.
 *
 * Returns the username extracted from the Cognito `cognito:username` claim
 * by the most recent call to {@link setUserDetails}.
 *
 * @returns The authenticated user's username, or `undefined` if:
 *   - {@link setUserDetails} has not been called yet
 *   - The event had no authentication context
 *   - {@link resetDetails} was called to clear user details
 *
 * @remarks
 * **Usage in Authorization:**
 * This function is called internally by {@link AuthorizationService} to construct
 * the Cedar principal entity during policy evaluation.
 *
 * **State Persistence:**
 * The username persists across invocations in a warm Lambda execution context.
 * Always call {@link setUserDetails} at the start of each invocation to ensure
 * current authentication data.
 *
 * @example
 * ```typescript
 * import { setUserDetails, getUserName } from './user-details';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   setUserDetails(event);
 *   const username = getUserName();
 *
 *   if (!username) {
 *     return {
 *       statusCode: 401,
 *       body: JSON.stringify({ error: 'Not authenticated' })
 *     };
 *   }
 *
 *   console.log(`Processing request for user: ${username}`);
 *   // ... continue processing
 * };
 * ```
 *
 * @see {@link setUserDetails} for setting the username
 * @see {@link getRoles} for retrieving user roles
 */
export function getUserName(): string | undefined {
	return userName;
}

/**
 * Retrieves the authenticated user's roles (Cognito groups).
 *
 * Returns the roles extracted from the Cognito `cognito:groups` claim
 * by the most recent call to {@link setUserDetails}. Roles are always
 * returned as an array for consistency, even if the user has only one role.
 *
 * @returns An array of role names, or `undefined` if:
 *   - {@link setUserDetails} has not been called yet
 *   - The event had no authentication context
 *   - The user has no assigned Cognito groups
 *   - {@link resetDetails} was called to clear user details
 *
 * @remarks
 * **Role Normalization:**
 * Cognito may return `cognito:groups` as either a string (single role) or
 * string array (multiple roles). This function normalizes both to an array.
 *
 * **Usage in Authorization:**
 * This function is called internally by {@link AuthorizationService} to:
 * - Construct the user's parent role entities
 * - Validate that the user has assigned roles
 * - Include roles in Cedar policy evaluation
 *
 * **Empty vs Undefined:**
 * - `undefined`: User details not set or no `cognito:groups` claim
 * - `[]` (empty array): Would only occur if Cognito returns an empty array
 *
 * @example
 * Check user roles:
 * ```typescript
 * import { setUserDetails, getRoles } from './user-details';
 *
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   setUserDetails(event);
 *   const roles = getRoles();
 *
 *   if (!roles || roles.length === 0) {
 *     return {
 *       statusCode: 403,
 *       body: JSON.stringify({ error: 'No roles assigned' })
 *     };
 *   }
 *
 *   console.log(`User roles: ${roles.join(', ')}`);
 *   // ... proceed with authorization
 * };
 * ```
 *
 * @example
 * Check for specific role:
 * ```typescript
 * const roles = getRoles();
 * const isAdmin = roles?.includes('admin');
 *
 * if (isAdmin) {
 *   // Grant admin access
 * }
 * ```
 *
 * @see {@link setUserDetails} for setting user roles
 * @see {@link getUserName} for retrieving the username
 */
export function getRoles(): string[] | undefined {
	return roles;
}

/**
 * Clears all stored user authentication details.
 *
 * Resets the module-level username and roles variables to `undefined`.
 * This function is primarily useful for testing to ensure a clean state
 * between test cases.
 *
 * @remarks
 * **Usage:**
 * - **Testing**: Clear user details between test cases to prevent state pollution
 * - **Production**: Generally not needed as {@link setUserDetails} overwrites existing data
 *
 * **Effects:**
 * After calling this function:
 * - {@link getUserName} will return `undefined`
 * - {@link getRoles} will return `undefined`
 * - {@link AuthorizationService.isAuthorized} will throw {@link MissingAuthenticatedUserDetailsError}
 *
 * @example
 * Use in test cleanup:
 * ```typescript
 * import { setUserDetails, resetDetails, getUserName } from './user-details';
 *
 * describe('Authorization tests', () => {
 *   afterEach(() => {
 *     resetDetails(); // Clean up after each test
 *   });
 *
 *   it('should set user details', () => {
 *     setUserDetails(mockEvent);
 *     expect(getUserName()).toBe('testuser');
 *   });
 *
 *   it('should start with clean state', () => {
 *     expect(getUserName()).toBeUndefined();
 *   });
 * });
 * ```
 *
 * @see {@link setUserDetails} for setting user details
 * @see {@link getUserName} for retrieving username
 * @see {@link getRoles} for retrieving roles
 */
export function resetDetails() {
	userName = undefined;
	roles = undefined;
}
