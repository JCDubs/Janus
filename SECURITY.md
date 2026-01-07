# Security Policy

## Supported Versions

We actively support the following versions of Janus with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Janus seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/JCDubs/Janus/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the private vulnerability report form

This ensures the report remains private until we can address it.

You should receive a response within 48 hours. If for some reason you do not, please follow up to ensure we received your original message.

### What to Include

Please include the following information in your report:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration required** to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 1 week
- **Status Updates**: At least weekly until resolution
- **Fix Release**: Timeline depends on complexity and severity

### Disclosure Policy

When we receive a security bug report, we will:

1. **Confirm the problem** and determine the affected versions
2. **Audit code** to find any similar problems
3. **Prepare fixes** for all releases still under maintenance
4. **Release new versions** as soon as possible
5. **Credit the reporter** (if desired) in the security advisory

We ask that you:

- **Give us reasonable time** to fix the issue before any disclosure
- **Make a good faith effort** to avoid privacy violations, destruction of data, and interruption or degradation of our service
- **Only interact with accounts you own** or with explicit permission of the account holder

## Security Best Practices

When using Janus in your applications, consider these security best practices:

### Authentication

- **Always validate user authentication** before calling authorization methods
- **Use proper JWT validation** if extracting user details from JWT tokens
- **Implement proper session management** in your application

### Authorization Policies

- **Follow the principle of least privilege** when writing Cedar policies
- **Regularly audit your policies** for unintended permissions
- **Test your policies thoroughly** with comprehensive test cases
- **Use explicit deny rules** where appropriate

### Environment Security

- **Protect your policy and schema files** from unauthorized access
- **Use environment variables** for sensitive configuration
- **Enable AWS CloudTrail** for audit logging in production
- **Implement proper error handling** to avoid information disclosure

### Lambda Security

- **Use least privilege IAM roles** for your Lambda functions
- **Enable VPC configuration** if accessing private resources
- **Use AWS Secrets Manager** for sensitive configuration
- **Monitor function invocations** for unusual patterns

### Dependencies

- **Keep dependencies up to date** with security patches
- **Regularly audit dependencies** using tools like `npm audit`
- **Use lock files** to ensure consistent dependency versions
- **Monitor security advisories** for used packages

## Security Features

Janus includes several security features:

### Input Validation

- **Type checking** on all authorization parameters
- **Schema validation** for Cedar entities and contexts
- **Action and resource validation** before policy evaluation

### Error Handling

- **Secure error messages** that don't leak sensitive information
- **Proper exception handling** to prevent information disclosure
- **Logging of authorization decisions** for audit purposes

### Caching Security

- **Isolated service instances** prevent cross-contamination
- **Secure singleton pattern** with proper initialization
- **Memory management** to prevent sensitive data leakage

## Known Security Considerations

### Policy Evaluation

- **Policy complexity** can impact performance and should be monitored
- **Entity data** should be validated before inclusion in authorization requests
- **Context data** should be sanitized to prevent injection attacks

### Lambda Environment

- **Cold start behavior** may affect security-sensitive timing requirements
- **Memory limits** could be exploited with large entity datasets
- **Timeout settings** should be configured appropriately

## Vulnerability Disclosure

We will publicly disclose security vulnerabilities according to the following process:

1. **Private notification** to affected users when possible
2. **Public security advisory** on GitHub
3. **CVE assignment** for significant vulnerabilities
4. **Release notes** documenting the security fix

## Bug Bounty Program

Currently, we do not offer a bug bounty program. However, we greatly appreciate security researchers who report vulnerabilities responsibly and will acknowledge their contributions in our security advisories.

## Contact

For security-related questions or concerns, please use:

- **GitHub Security Advisories**: [Report a vulnerability](https://github.com/JCDubs/Janus/security)
- **General Questions**: [GitHub Discussions](https://github.com/JCDubs/Janus/discussions)

## Resources

- [Cedar Policy Security Best Practices](https://docs.cedarpolicy.com/)
- [AWS Lambda Security Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

Thank you for helping keep Janus and its users safe!
