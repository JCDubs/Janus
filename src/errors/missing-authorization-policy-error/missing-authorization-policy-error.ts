/**
 * Error thrown when the Cedar policy file cannot be loaded.
 *
 * This error is thrown by AuthorizationService.getService() when the Cedar policy
 * file (`policies.cedar`) cannot be found or read from the Lambda deployment package.
 *
 * @remarks
 * **Common Causes:**
 * - Policy file not bundled with the Lambda deployment
 * - Incorrect file path or naming
 * - File permissions issue
 * - Missing AuthLambda CDK construct configuration
 *
 * **Prevention:**
 * - Use the {@link AuthLambda} CDK construct to automatically bundle policy files
 * - Ensure `policyFilePath` in AuthLambda props points to a valid Cedar policy file
 * - Verify the policy file is included in the Lambda package
 *
 * @example
 * ```typescript
 * // In CDK stack:
 * const authLambda = new AuthLambda(stack, 'MyAuthLambda', {
 *   entry: './src/handler.ts',
 *   authorisation: {
 *     policyFilePath: './policies/policies.cedar',  // Ensure this file exists
 *     schemaFilePath: './policies/schema.cedarschema'
 *   }
 * });
 * ```
 *
 * @see {@link AuthorizationService.getService} for where this error is thrown
 * @see {@link AuthLambda} for proper policy file bundling
 */
export class MissingAuthorizationPolicyError extends Error {
	/**
	 * Creates a new MissingAuthorizationPolicyError.
	 *
	 * @remarks
	 * Sets the error name to 'MissingAuthorizationPolicyError' for easy identification
	 * in error handling and logging.
	 */
	constructor() {
		super('Missing authorization policy details');
		this.name = 'MissingAuthorizationPolicyError';
	}
}
