/**
 * Configuration for Cedar authorization evaluation.
 *
 * Defines the type structure for Cedar entities used in policy evaluation.
 * These types are combined with the namespace to form fully-qualified Cedar type names.
 *
 * @example
 * ```typescript
 * const config: AuthorizationConfigType = {
 *   namespace: 'OrderService::',
 *   principleType: 'User',
 *   resourceType: 'Order',
 *   roleType: 'Role'
 * };
 * // Produces Cedar types like:
 * // - OrderService::User (principal)
 * // - OrderService::Order (resource)
 * // - OrderService::Role (role entities)
 * // - OrderService::Action (action type)
 * ```
 */
export type AuthorizationConfigType = {
	/**
	 * Cedar namespace prefix for all entity types.
	 *
	 * @remarks
	 * - Should end with `::` (e.g., 'OrderService::')
	 * - Optional: defaults to empty string if not provided
	 * - Used to prefix all principal, resource, role, and action types
	 *
	 * @example
	 * ```typescript
	 * namespace: 'OrderService::'
	 * ```
	 */
	namespace?: string;

	/**
	 * The Cedar entity type for the principal (user).
	 *
	 * @remarks
	 * - Typically 'User' but can be customized for your domain
	 * - Combined with namespace to form the full principal type
	 * - Example: With namespace 'OrderService::', becomes 'OrderService::User'
	 *
	 * @example
	 * ```typescript
	 * principleType: 'User'
	 * ```
	 */
	principleType: string;

	/**
	 * The Cedar entity type for resources being accessed.
	 *
	 * @remarks
	 * - Represents the resource type in authorization requests
	 * - Combined with namespace to form the full resource type
	 * - Example: With namespace 'OrderService::', becomes 'OrderService::Order'
	 *
	 * @example
	 * ```typescript
	 * resourceType: 'Order'
	 * ```
	 */
	resourceType: string;

	/**
	 * The Cedar entity type for user roles.
	 *
	 * @remarks
	 * - Used to create role entities that act as parents of the principal
	 * - Combined with namespace to form the full role type
	 * - Example: With namespace 'OrderService::', becomes 'OrderService::Role'
	 *
	 * @example
	 * ```typescript
	 * roleType: 'Role'
	 * ```
	 */
	roleType: string;
};
