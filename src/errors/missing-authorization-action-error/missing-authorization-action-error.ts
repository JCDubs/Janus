/**
 * Error thrown when the authorization action is not set before evaluation.
 *
 * This error is thrown by the AuthorizationService when attempting to evaluate
 * a Cedar authorization request without specifying the action being performed.
 *
 * @remarks
 * **Common Causes:**
 * - Calling `isAuthorized()` without first calling `setAction()`
 * - Action parameter is undefined or empty
 *
 * **Prevention:**
 * Always call `setAction()` on the AuthorizationService instance before calling `isAuthorized()`.
 *
 * @example
 * ```typescript
 * const authService = await AuthorizationService.getService(config);
 *
 * // Correct usage:
 * authService
 *   .setAction('getOrder')  // Set the action
 *   .setResource('order-123')
 *   .isAuthorized();
 *
 * // Incorrect - will throw MissingAuthorizationActionError:
 * // authService.setResource('order-123').isAuthorized();
 * ```
 *
 * @see {@link AuthorizationService.setAction} for setting the action
 * @see {@link AuthorizationService.isAuthorized} for where this error may be thrown
 */
export class MissingAuthorizationActionError extends Error {
	/**
	 * Creates a new MissingAuthorizationActionError.
	 *
	 * @remarks
	 * Sets the error name to 'MissingAuthorizationActionError' for easy identification
	 * in error handling and logging.
	 */
	constructor() {
		super("Missing authorization action details");
		this.name = "MissingAuthorizationActionError";
	}
}
