/**
 * Error thrown when the authorization resource is not set before evaluation.
 *
 * This error is thrown by the AuthorizationService when attempting to evaluate
 * a Cedar authorization request without specifying the resource being accessed.
 *
 * @remarks
 * **Common Causes:**
 * - Calling `isAuthorized()` without first calling `setResource()`
 * - Resource parameter is undefined or empty
 *
 * **Prevention:**
 * Always call `setResource()` on the AuthorizationService instance before calling `isAuthorized()`.
 *
 * @example
 * ```typescript
 * const authService = await AuthorizationService.getService(config);
 *
 * // Correct usage:
 * authService
 *   .setAction('getOrder')
 *   .setResource('order-123')  // Set the resource
 *   .isAuthorized();
 *
 * // Incorrect - will throw MissingAuthorizationResourceError:
 * // authService.setAction('getOrder').isAuthorized();
 * ```
 *
 * @see {@link AuthorizationService.setResource} for setting the resource
 * @see {@link AuthorizationService.isAuthorized} for where this error may be thrown
 */
export class MissingAuthorizationResourceError extends Error {
	/**
	 * Creates a new MissingAuthorizationResourceError.
	 *
	 * @remarks
	 * Sets the error name to 'MissingAuthorizationResourceError' for easy identification
	 * in error handling and logging.
	 */
	constructor() {
		super('Missing authorization resource details');
		this.name = 'MissingAuthorizationResourceError';
	}
}
