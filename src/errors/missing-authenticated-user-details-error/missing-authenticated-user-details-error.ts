/**
 * Error thrown when user authentication details are missing or incomplete.
 *
 * This error is thrown by the AuthorizationService when attempting to evaluate
 * a Cedar authorization request without valid user details (username or roles).
 *
 * @remarks
 * **Common Causes:**
 * - User details not extracted from API Gateway event
 * - Missing or malformed authentication token
 * - `setUserDetails()` not called before authorization evaluation
 * - Username or roles are undefined/null
 *
 * **Prevention:**
 * Ensure the {@link loadCedarAuthorization} middleware is used, or manually call
 * `setUserDetails()` with the API Gateway event before using AuthorizationService.
 *
 * @example
 * ```typescript
 * import { setUserDetails } from './user-details';
 * import { AuthorizationService } from './authorization-service';
 *
 * // Ensure user details are set before authorization
 * setUserDetails(event);
 *
 * const authService = await AuthorizationService.getService(config);
 * const isAuthorized = authService
 *   .setAction('getOrder')
 *   .setResource('order-123')
 *   .isAuthorized(); // Won't throw if user details are properly set
 * ```
 *
 * @see {@link setUserDetails} for setting user details from API Gateway events
 * @see {@link AuthorizationService.isAuthorized} for where this error may be thrown
 */
export class MissingAuthenticatedUserDetailsError extends Error {
	/**
	 * Creates a new MissingAuthenticatedUserDetailsError.
	 *
	 * @remarks
	 * Sets the error name to 'MissingAuthenticatedUserDetailsError' for easy identification
	 * in error handling and logging.
	 */
	constructor() {
		super("Missing authenticated user details");
		this.name = "MissingAuthenticatedUserDetailsError";
	}
}
