import { Logger } from '@aws-lambda-powertools/logger';
import * as cedar from '@cedar-policy/cedar-wasm/nodejs';
import {
	MissingAuthenticatedUserDetailsError,
	MissingAuthorizationActionError,
	MissingAuthorizationPolicyError,
	MissingAuthorizationResourceError,
	MissingAuthorizationSchemaError,
} from '../errors';
import { loadFileAsString } from '../file-loader/file-loader';
import { getRoles, getUserName } from '../user-details';
import { splitCedarPolicies } from './policy-parser';
import type { AuthorizationConfigType } from './types';

const logger = new Logger({ serviceName: 'authorization-service' });
const POLICY_FILE_NAME = 'policies.cedar';
const SCHEMA_FILE_NAME = 'schema.cedarschema';

/**
 * Service for evaluating Cedar policy-based authorization requests.
 *
 * This class provides a fluent API for building and executing Cedar authorization requests.
 * It manages Cedar policies, schemas, and entity relationships to determine whether a user
 * is authorized to perform a specific action on a resource.
 *
 * @remarks
 * **Singleton Pattern:**
 * - The service uses a cached singleton instance for performance optimization
 * - Access the service via the static {@link getService} method
 * - The cache persists across warm Lambda invocations
 *
 * **Policy and Schema Loading:**
 * - Policies and schemas are loaded from bundled files (`policies.cedar` and `schema.cedarschema`)
 * - Files must be included in the Lambda deployment package
 * - Use the {@link AuthLambda} CDK construct to automatically bundle these files
 *
 * **Cache Refresh:**
 * - Call `getService(config, true)` to force reload policies and schemas
 * - Useful for testing or when policies are updated in a warm Lambda
 *
 * **Fluent API:**
 * - Chain methods like `setAction()`, `setResource()`, and `addEntity()` before calling `isAuthorized()`
 * - Each setter returns `this` for method chaining
 *
 * @example
 * Basic usage with method chaining:
 * ```typescript
 * const authService = await AuthorizationService.getService({
 *   namespace: 'OrderService::',
 *   principleType: 'User',
 *   resourceType: 'Order',
 *   roleType: 'Role'
 * });
 *
 * const isAuthorized = authService
 *   .setAction('getOrder')
 *   .setResource('order-123')
 *   .addEntity({
 *     uid: { type: 'OrderService::Order', id: 'order-123' },
 *     attrs: { status: 'PENDING' },
 *     parents: []
 *   })
 *   .isAuthorized();
 * ```
 *
 * @see {@link getService} for initializing the service
 * @see {@link isAuthorized} for evaluating authorization requests
 */
export class AuthorizationService {
	private static service: AuthorizationService;
	private readonly authorizationConfig: AuthorizationConfigType;
	private readonly policy: cedar.StaticPolicySet;
	private readonly schema: string;
	private action: string | undefined;
	private resource: string | undefined;
	private context: Record<string, cedar.CedarValueJson> | undefined;
	private entities: cedar.EntityJson[] | undefined;

	/**
	 * Creates an instance of the Authorization service.
	 *
	 * @remarks
	 * This constructor is private. Use the static {@link getService} method to obtain an instance.
	 *
	 * @param policy - Raw Cedar policy string containing authorization rules
	 * @param schema - Cedar schema definition (JSON string or plain text format)
	 * @param authorizationConfig - Configuration defining namespace, principal type, resource type, and role type
	 *
	 * @internal
	 */
	private constructor(
		policy: string,
		schema: string,
		authorizationConfig: AuthorizationConfigType,
	) {
		this.policy = splitCedarPolicies(policy);
		this.schema = schema;
		this.authorizationConfig = authorizationConfig;
	}

	/**
	 * Sets the action the user is attempting to perform.
	 *
	 * @param action - The action identifier (e.g., 'getOrder', 'updateOrder', 'deleteOrder')
	 *   This will be prefixed with the configured namespace to form the full Cedar action type
	 *
	 * @returns This AuthorizationService instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * authService.setAction('getOrder');
	 * // Becomes: OrderService::Action::"getOrder" in Cedar
	 * ```
	 */
	setAction(action: string): AuthorizationService {
		this.action = action;
		return this;
	}

	/**
	 * Sets the resource identifier the user is attempting to access.
	 *
	 * @param resource - The resource identifier (e.g., 'order-123', 'customer-456')
	 *   This will be combined with the configured namespace and resource type
	 *
	 * @returns This AuthorizationService instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * authService.setResource('order-123');
	 * // Becomes: OrderService::Order::"order-123" in Cedar
	 * ```
	 */
	setResource(resource: string): AuthorizationService {
		this.resource = resource;
		return this;
	}

	/**
	 * Adds an entity to the Cedar authorization request context.
	 *
	 * Entities represent objects in your domain (e.g., orders, customers) that are used
	 * during policy evaluation. Add all relevant entities that policies may reference.
	 *
	 * @param entity - A Cedar entity with uid, attrs, and parents
	 *
	 * @returns This AuthorizationService instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * authService.addEntity({
	 *   uid: { type: 'OrderService::Order', id: 'order-123' },
	 *   attrs: {
	 *     status: 'PENDING',
	 *     customer: { type: 'OrderService::User', id: 'user-456' }
	 *   },
	 *   parents: []
	 * });
	 * ```
	 */
	addEntity(entity: cedar.EntityJson): AuthorizationService {
		if (!this.entities) {
			this.entities = [];
		}
		this.entities.push(entity);
		return this;
	}

	/**
	 * Replaces all entities with a new array of entities for the Cedar authorization request.
	 *
	 * @param entities - Array of Cedar entities to use in policy evaluation
	 *
	 * @returns This AuthorizationService instance for method chaining
	 *
	 * @remarks
	 * This replaces any previously added entities. Use {@link addEntity} to append individual entities.
	 */
	setEntities(entities: cedar.EntityJson[]): AuthorizationService {
		this.entities = entities;
		return this;
	}

	/**
	 * Validates that all required authorization properties are set.
	 *
	 * @throws {MissingAuthenticatedUserDetailsError} If username or roles are not available from user details
	 * @throws {MissingAuthorizationActionError} If action has not been set via {@link setAction}
	 * @throws {MissingAuthorizationResourceError} If resource has not been set via {@link setResource}
	 *
	 * @internal
	 */
	private validateAuthorizationProperties() {
		// Validate that a username and roles is available.
		if (!getUserName() || !getRoles()) {
			logger.error(
				'Authenticated user username or roles has not been provided',
			);
			throw new MissingAuthenticatedUserDetailsError();
		}

		// Validate the cedar scope
		if (!this.action) {
			logger.error('Cedar authorization action has not been provided');
			throw new MissingAuthorizationActionError();
		}

		// Validate the cedar scope
		if (!this.resource) {
			logger.error('Cedar authorization resource has not been provided');
			throw new MissingAuthorizationResourceError();
		}
	}

	/**
	 * Creates the Cedar schema object required by the evaluation process.
	 *
	 * Attempts to parse the schema as JSON first; if that fails, returns it as-is
	 * (assuming it's in Cedar's native schema format).
	 *
	 * @returns Cedar schema object suitable for authorization evaluation
	 *
	 * @internal
	 */
	private createSchema(): cedar.Schema {
		try {
			const schema = JSON.parse(this.schema);
			return { json: schema };
		} catch (_err) {
			return this.schema;
		}
	}

	/**
	 * Constructs the Cedar user (principal) entity from the current user details.
	 *
	 * The user entity includes the username as the entity ID and the user's roles as parent entities.
	 *
	 * @returns Cedar entity representing the authenticated user
	 *
	 * @throws {MissingAuthenticatedUserDetailsError} If username is not available
	 *
	 * @internal
	 */
	private constructUserEntity(): cedar.EntityJson {
		const userName = getUserName();
		if (!userName) {
			logger.error('Authenticated user username has not been provided');
			throw new MissingAuthenticatedUserDetailsError();
		}
		return {
			uid: {
				type: `${this.authorizationConfig.namespace}${this.authorizationConfig.principleType}`,
				id: userName,
			},
			attrs: {},
			parents:
				getRoles()?.map((role) => ({
					type: `${this.authorizationConfig.namespace}${this.authorizationConfig.roleType}`,
					id: role,
				})) ?? [],
		};
	}

	/**
	 * Constructs Cedar role entities from the current user's roles.
	 *
	 * Each role becomes a separate entity that can be referenced in Cedar policies.
	 *
	 * @returns Array of Cedar entities representing user roles, or empty array if no roles
	 *
	 * @internal
	 */
	private constructRoleEntities(): cedar.EntityJson[] {
		return (
			getRoles()?.map((role) => ({
				uid: {
					type: `${this.authorizationConfig.namespace}${this.authorizationConfig.roleType}`,
					id: role,
				},
				attrs: {},
				parents: [],
			})) ?? []
		);
	}

	/**
	 * Builds the complete Cedar authorization request from the configured values.
	 *
	 * Combines the principal (user), action, resource, context, entities, policies, and schema
	 * into a Cedar authorization call ready for evaluation.
	 *
	 * @returns Complete Cedar authorization call object
	 *
	 * @throws {MissingAuthenticatedUserDetailsError} If username is not available
	 * @throws {MissingAuthorizationActionError} If action has not been set
	 * @throws {MissingAuthorizationResourceError} If resource has not been set
	 *
	 * @internal
	 */
	private build(): cedar.AuthorizationCall {
		this.validateAuthorizationProperties();

		const user = this.constructUserEntity();
		const roles = this.constructRoleEntities();

		const userName = getUserName();
		if (!userName) {
			logger.error('Authenticated user username has not been provided');
			throw new MissingAuthenticatedUserDetailsError();
		}
		if (!this.action) {
			logger.error('Cedar authorization action has not been provided');
			throw new MissingAuthorizationActionError();
		}
		if (!this.resource) {
			logger.error('Cedar authorization resource has not been provided');
			throw new MissingAuthorizationResourceError();
		}
		return {
			principal: {
				type: `${this.authorizationConfig.namespace}${this.authorizationConfig.principleType}`,
				id: userName,
			},
			action: {
				type: `${this.authorizationConfig.namespace}Action`,
				id: this.action,
			},
			resource: {
				type: `${this.authorizationConfig.namespace}${this.authorizationConfig.resourceType}`,
				id: this.resource,
			},
			context: this.context ?? {},
			schema: this.createSchema(),
			validateRequest: true,
			policies: {
				staticPolicies: this.policy,
			},
			entities: [user, ...(this.entities ?? []), ...roles],
		};
	}

	/**
	 * Evaluates the Cedar authorization request and determines if the user is authorized.
	 *
	 * This method builds the complete authorization request using the configured action, resource,
	 * entities, and user details, then evaluates it against the loaded Cedar policies.
	 *
	 * @returns `true` if the user is authorized (Cedar decision is 'allow'), `false` otherwise
	 *
	 * @throws {MissingAuthenticatedUserDetailsError} If user details are not available
	 * @throws {MissingAuthorizationActionError} If action has not been set via {@link setAction}
	 * @throws {MissingAuthorizationResourceError} If resource has not been set via {@link setResource}
	 * @throws {Error} If Cedar evaluation fails due to policy or schema errors
	 *
	 * @example
	 * ```typescript
	 * const isAuthorized = authService
	 *   .setAction('getOrder')
	 *   .setResource('order-123')
	 *   .addEntity(orderEntity)
	 *   .isAuthorized();
	 *
	 * if (isAuthorized) {
	 *   // Proceed with the request
	 * } else {
	 *   // Return 403 Forbidden
	 * }
	 * ```
	 */
	isAuthorized(): boolean {
		logger.debug('Authorizing request...');
		const builtAuthRequest = this.build();
		logger.debug('Built Authorization request', { builtAuthRequest });
		const authResult = cedar.isAuthorized(builtAuthRequest);
		logger.debug('Auth Result', { authResult });

		if (authResult.type === 'failure') {
			logger.debug('A problem occurred while authorizing the request', {
				authResult,
			});
			throw Error(authResult.errors.map((error) => error.message).join('\n'));
		}
		return authResult.response.decision === ('allow' as cedar.Decision);
	}

	/**
	 * Retrieves the singleton AuthorizationService instance, initializing it if needed.
	 *
	 * This static factory method manages the service lifecycle:
	 * - Returns the cached instance on subsequent calls (when `refresh` is false)
	 * - Creates a new instance when called for the first time or when `refresh` is true
	 * - Loads Cedar policies and schemas from bundled files in the Lambda package
	 *
	 * @param authorizationConfig - Configuration object defining:
	 *   - `namespace`: Cedar namespace prefix (e.g., 'OrderService::')
	 *   - `principleType`: Principal entity type (e.g., 'User')
	 *   - `resourceType`: Resource entity type (e.g., 'Order')
	 *   - `roleType`: Role entity type (e.g., 'Role')
	 *
	 * @param refresh - If `true`, forces reload of policies and schemas from files.
	 *   Default is `false` (returns cached instance if available)
	 *
	 * @returns Promise resolving to the AuthorizationService instance
	 *
	 * @throws {MissingAuthorizationPolicyError} If the `policies.cedar` file cannot be loaded
	 * @throws {MissingAuthorizationSchemaError} If the `schema.cedarschema` file cannot be loaded
	 *
	 * @example
	 * Initialize the service:
	 * ```typescript
	 * const authService = await AuthorizationService.getService({
	 *   namespace: 'OrderService::',
	 *   principleType: 'User',
	 *   resourceType: 'Order',
	 *   roleType: 'Role'
	 * });
	 * ```
	 *
	 * @example
	 * Force refresh in a warm Lambda:
	 * ```typescript
	 * const authService = await AuthorizationService.getService(config, true);
	 * ```
	 */
	static async getService(
		authorizationConfig: AuthorizationConfigType,
		refresh = false,
	): Promise<AuthorizationService> {
		if (!refresh && AuthorizationService.service) {
			logger.debug('Returning cached Authorization service');
			return AuthorizationService.service;
		}

		let policy: string | undefined;
		let schema: string | undefined;

		try {
			policy = loadFileAsString(POLICY_FILE_NAME);
		} catch (err) {
			logger.error((err as Error).message, { error: err });
			throw new MissingAuthorizationPolicyError();
		}

		try {
			schema = loadFileAsString(SCHEMA_FILE_NAME);
		} catch (err) {
			logger.error((err as Error).message, { error: err });
			throw new MissingAuthorizationSchemaError();
		}

		logger.debug('Policy and Schema loaded', {
			policy,
			schema,
		});
		AuthorizationService.service = new AuthorizationService(
			policy,
			schema,
			authorizationConfig,
		);
		return AuthorizationService.service;
	}
}
