/**
 * Error thrown when a user is not authorized to perform a requested action.
 *
 * This error can be thrown in application code when Cedar policy evaluation
 * returns a 'deny' decision, indicating the user lacks permission for the requested operation.
 *
 * @remarks
 * **Usage Pattern:**
 * Typically thrown in Lambda handlers or API endpoints after checking authorization:
 * 1. Evaluate authorization using `authService.isAuthorized()`
 * 2. If `false`, throw UnauthorizedError with a descriptive message
 * 3. Handle in error middleware to return appropriate HTTP status (403 Forbidden)
 *
 * **Best Practices:**
 * - Include specific details about what was denied in the message
 * - Avoid exposing sensitive policy details to end users
 * - Log full details server-side for debugging
 *
 * @example
 * ```typescript
 * const authService = await AuthorizationService.getService(config);
 * const isAuthorized = authService
 *   .setAction('deleteOrder')
 *   .setResource('order-123')
 *   .addEntity(orderEntity)
 *   .isAuthorized();
 *
 * if (!isAuthorized) {
 *   throw new UnauthorizedError(
 *     'You are not authorized to delete this order'
 *   );
 * }
 *
 * // Proceed with deletion
 * await deleteOrder(orderId);
 * ```
 *
 * @example
 * Error handling in Lambda:
 * ```typescript
 * try {
 *   // ... authorization check
 * } catch (error) {
 *   if (error instanceof UnauthorizedError) {
 *     return {
 *       statusCode: 403,
 *       body: JSON.stringify({ error: error.message })
 *     };
 *   }
 *   throw error;
 * }
 * ```
 */
export class UnauthorizedError extends Error {
	/**
	 * Creates a new UnauthorizedError with a custom message.
	 *
	 * @param message - Descriptive message explaining why authorization was denied.
	 *   Should be user-friendly and avoid exposing internal policy details.
	 *
	 * @remarks
	 * Sets the error name to 'UnauthorizedError' for easy identification
	 * in error handling and logging.
	 *
	 * @example
	 * ```typescript
	 * throw new UnauthorizedError('Access denied: insufficient permissions');
	 * ```
	 */
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}
