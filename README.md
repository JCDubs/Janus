# Janus

[![CI](https://github.com/JCDubs/Janus/actions/workflows/main.yaml/badge.svg?branch=main)](https://github.com/JCDubs/Janus/actions/workflows/main.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io)
[![Dependabot](https://github.com/JCDubs/Janus/actions/workflows/dependabot-pull-request.yaml/badge.svg)](https://github.com/JCDubs/Janus/actions/workflows/dependabot-pull-request.yaml)

<p align="center">
  <img src="./images/janus.jpg" alt="Janus" width="300"/>
</p>

Open source serverless authentication: A Cedar-based authorization engine for deterministic, deny-by-default access decisions through a CDK construct and SDK libraries.

## Overview

Janus is a TypeScript library that provides fine-grained, policy-based authorization for AWS Lambda functions using [Cedar](https://www.cedarpolicy.com/). It enables you to define complex authorization rules and evaluate them efficiently within your serverless applications.

### Key Features

- 🔐 **Cedar Policy Engine** - Leverage Amazon's Cedar policy language for authorization
- ⚡ **Serverless Optimised** - Designed for AWS Lambda with singleton caching
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🔄 **Fluent API** - Intuitive method chaining for building authorization requests
- 🧪 **Well Tested** - Comprehensive test coverage with real-world examples
- 📦 **Zero Config** - Easy integration with minimal setup

## Installation

### Install the Package

```bash
npm install @jcdubs/janus
```

or

```bash
pnpm add @jcdubs/janus
```

or

```bash
yarn add @jcdubs/janus
```

### Install Peer Dependencies

Janus requires the following peer dependencies to be installed in your project:

```bash
# For AWS Lambda PowerTools (logging)
npm install @aws-lambda-powertools/logger@2.15.0

# For AWS CDK (if using CDK constructs)
npm install aws-cdk-lib@2.219.0 constructs@10.4.2
```

With pnpm:

```bash
pnpm add @aws-lambda-powertools/logger@2.15.0
pnpm add aws-cdk-lib@2.219.0 constructs@10.4.2
```

With yarn:

```bash
yarn add @aws-lambda-powertools/logger@2.15.0
yarn add aws-cdk-lib@2.219.0 constructs@10.4.2
```

> **Note**: The CDK dependencies (`aws-cdk-lib` and `constructs`) are only required if you're using Janus in a CDK application. For Lambda runtime usage only, you just need `@aws-lambda-powertools/logger`.

## Quick Start

### 1. Define Your Cedar Policy

Create a `policies.cedar` file:

```cedar
// Allow users to view their own orders
permit (
  principal,
  action == Action::"viewOrder",
  resource
) when {
  principal.id == resource.customerId
};
```

### 2. Define Your Cedar Schema

Create a `schema.cedarschema` file:

```cedar
namespace OrderService {
  entity User = {
    id: String,
    roles: Set<Role>
  };
  
  entity Order = {
    customerId: String,
    status: String
  };
  
  entity Role;
  
  action viewOrder appliesTo {
    principal: User,
    resource: Order
  };
}
```

### 3. Use the Authorization Service

```typescript
import { AuthorizationService } from '@jcdubs/janus';

// Initialize the service (cached as a singleton)
const authService = await AuthorizationService.getService({
  namespace: 'OrderService::',
  principleType: 'User',
  resourceType: 'Order',
  roleType: 'Role'
});

// Evaluate authorization
const isAuthorized = authService
  .setAction('viewOrder')
  .setResource('order-123')
  .addEntity({
    uid: { type: 'OrderService::Order', id: 'order-123' },
    attrs: { customerId: 'user-456', status: 'PENDING' },
    parents: []
  })
  .isAuthorized();

console.log(isAuthorized); // true or false
```

## API Reference

### AuthorizationService

#### Static Methods

##### `getService(config, refresh?)`

Retrieves or creates a cached instance of the Authorization Service.

**Parameters:**
- `config: AuthorizationConfigType` - Configuration object
  - `namespace: string` - Cedar namespace (e.g., `'OrderService::'`)
  - `principleType: string` - Principal entity type (e.g., `'User'`)
  - `resourceType: string` - Resource entity type (e.g., `'Order'`)
  - `roleType: string` - Role entity type (e.g., `'Role'`)
- `refresh?: boolean` - Force reload policies and schemas (default: `false`)

**Returns:** `Promise<AuthorizationService>`

#### Instance Methods

##### `setAction(action)`

Sets the action to be authorized.

**Parameters:**
- `action: string` - The action name

**Returns:** `this` (for chaining)

##### `setResource(resource)`

Sets the resource identifier.

**Parameters:**
- `resource: string` - The resource ID

**Returns:** `this` (for chaining)

##### `setContext(context)`

Sets the authorization context.

**Parameters:**
- `context: Record<string, cedar.CedarValueJson>` - Context data

**Returns:** `this` (for chaining)

##### `addEntity(entity)`

Adds an entity to the authorization request.

**Parameters:**
- `entity: cedar.EntityJson` - Entity definition

**Returns:** `this` (for chaining)

##### `addEntities(entities)`

Adds multiple entities to the authorization request.

**Parameters:**
- `entities: cedar.EntityJson[]` - Array of entity definitions

**Returns:** `this` (for chaining)

##### `isAuthorized()`

Evaluates the authorization request.

**Returns:** `boolean` - `true` if authorized, `false` otherwise

**Throws:**
- `MissingAuthenticatedUserDetailsError` - If user details are missing
- `MissingAuthorizationActionError` - If action is not set
- `MissingAuthorizationResourceError` - If resource is not set
- `MissingAuthorizationPolicyError` - If policies cannot be loaded
- `MissingAuthorizationSchemaError` - If schema cannot be loaded

### Middleware

#### `authorizationMiddleware`

Middy middleware for automatic authorization in Lambda handlers.

```typescript
import { authorizationMiddleware } from '@jcdubs/janus';
import middy from '@middy/core';

const handler = middy(async (event) => {
  // Your handler logic
})
  .use(authorizationMiddleware({
    namespace: 'OrderService::',
    principleType: 'User',
    resourceType: 'Order',
    roleType: 'Role',
  }));
```

## User Details

The library provides utilities to extract user information from Lambda events:

```typescript
import { getUserName, getRoles } from '@jcdubs/janus';

const username = getUserName(event);
const roles = getRoles(event);
```

## Error Handling

The library provides specific error classes for different authorization failures:

- `MissingAuthenticatedUserDetailsError`
- `MissingAuthorizationActionError`
- `MissingAuthorizationPolicyError`
- `MissingAuthorizationResourceError`
- `MissingAuthorizationSchemaError`
- `UnauthorizedError`

## Examples

See the [authorization-tests](./src/authorization-service/authorization-tests/) directory for comprehensive examples including:

- Customer role permissions
- Sales staff authorization
- Manager access controls
- Account manager restrictions
- Accountant read-only access

## Cedar Resources

- [Cedar Policy Tutorial](https://www.cedarpolicy.com/en/tutorial)
- [Cedar Policy Language Guide](https://docs.cedarpolicy.com/)
- [Cedar Policy Blog](https://www.cedarpolicy.com/blog)
- [Cedar SDK](https://github.com/cedar-policy)
- [Cedar Policy Playground](https://www.cedarpolicy.com/en/playground)

## Development

### Prerequisites

- Node.js 20+ 
- pnpm 10+

### Peer Dependencies

This project uses peer dependencies to avoid version conflicts. The required peer dependencies are:

- `@aws-lambda-powertools/logger@2.15.0` - For structured logging
- `aws-cdk-lib@2.219.0` - For CDK constructs (optional)
- `constructs@10.4.2` - For CDK constructs (optional)

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Security

For security concerns, please see [SECURITY.md](./SECURITY.md).

## Support

- 📫 [Open an issue](https://github.com/JCDubs/Janus/issues)
- 💬 [Discussions](https://github.com/JCDubs/Janus/discussions)

## Acknowledgments

- Built with [Cedar Policy](https://www.cedarpolicy.com/) by Amazon
- Powered by [@cedar-policy/cedar-wasm](https://www.npmjs.com/package/@cedar-policy/cedar-wasm)
