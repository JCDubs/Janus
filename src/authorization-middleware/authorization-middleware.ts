import { Logger } from '@aws-lambda-powertools/logger';
import type middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
	type AuthorizationConfigType,
	AuthorizationService,
} from '../authorization-service';
import { setUserDetails } from '../user-details';

const logger = new Logger({ serviceName: 'authorization-middleware' });

/**
 * Middy middleware that loads Cedar authorization and user details for policy-based authorization.
 *
 * This middleware integrates Cedar policy authorization into AWS Lambda functions using the Middy
 * middleware framework. It initializes the AuthorizationService with Cedar policies and schemas,
 * and extracts user details from the incoming API Gateway event.
 *
 * @remarks
 * **Caching Behavior:**
 * - The AuthorizationService is cached after the first invocation for improved performance
 * - Cedar policies and schemas are loaded from the bundled Lambda package files
 * - The cache persists across warm Lambda invocations
 *
 * **Cache Refresh:**
 * To force a refresh of the Cedar policies and schemas in a warm Lambda environment,
 * include the `cedar-refresh` header with a value of `'true'` in your API Gateway request.
 * This will reload the policy and schema files and create a new cached instance.
 *
 * **User Details Extraction:**
 * The middleware automatically extracts and sets user details from the API Gateway event,
 * making them available to the authorization service for policy evaluation.
 *
 * @param authorizationConfig - Configuration object defining Cedar policy parameters including
 *   namespace, principal type, resource type, and role type for authorization evaluation
 *
 * @returns A Middy middleware object containing the `before` hook that executes prior to
 *   the Lambda handler function
 *
 * @throws {MissingAuthorizationPolicyError} If the Cedar policy file cannot be loaded
 * @throws {MissingAuthorizationSchemaError} If the Cedar schema file cannot be loaded
 *
 * @example
 * ```typescript
 * import middy from '@middy/core';
 * import { loadCedarAuthorization } from './authorization-middleware';
 *
 * const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
 *   // Your handler logic
 *   return {
 *     statusCode: 200,
 *     body: JSON.stringify({ message: 'Success' })
 *   };
 * };
 *
 * export const main = middy(handler).use(
 *   loadCedarAuthorization({
 *     namespace: 'OrderService::',
 *     principleType: 'User',
 *     resourceType: 'Order',
 *     roleType: 'Role'
 *   })
 * );
 * ```
 *
 * @example
 * Force cache refresh with header:
 * ```typescript
 * // API Gateway request with cache refresh
 * const event = {
 *   headers: {
 *     'cedar-refresh': 'true'
 *   },
 *   // ... other event properties
 * };
 * ```
 *
 * @see {@link AuthorizationService.getService} for details on service initialization
 * @see {@link setUserDetails} for user details extraction from API Gateway events
 */
export const loadCedarAuthorization = (
	authorizationConfig: AuthorizationConfigType,
): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
	const before: middy.MiddlewareFn<
		APIGatewayProxyEvent,
		APIGatewayProxyResult
	> = async (request): Promise<void> => {
		logger.debug('Loading authorization services...', {
			authorizationConfig,
		});

		const refresh = request.event.headers?.['cedar-refresh']
			? request.event.headers['cedar-refresh'] === 'true'
			: false;

		setUserDetails(request.event);
		await AuthorizationService.getService(authorizationConfig, refresh);
	};
	logger.debug('Authorization services loaded and configured.');
	return {
		before,
	};
};
