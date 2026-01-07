import { Logger } from "@aws-lambda-powertools/logger";
import type { Policy, PolicyId } from "@cedar-policy/cedar-wasm";

const logger = new Logger({ serviceName: "policy-parser" });

/**
 * Parses a Cedar policy file and splits it into individual policy objects.
 *
 * This function processes a Cedar policy file containing multiple policies and converts it into
 * a record where each policy is assigned a unique identifier. The parser handles Cedar syntax
 * including string literals, line comments, and block comments correctly.
 *
 * @param policyFile - The complete Cedar policy file content as a string, containing one or more policies
 *
 * @returns A record mapping policy IDs (e.g., 'policy_0', 'policy_1') to individual policy strings.
 *   Policies are indexed sequentially starting from 0 in their original file order.
 *
 * @throws {Error} If the policy file contains trailing content after the last semicolon,
 *   indicating a malformed policy (missing semicolon terminator)
 *
 * @remarks
 * **Parsing Rules:**
 * - Each Cedar policy must end with a semicolon (`;`)
 * - Semicolons inside string literals are correctly ignored
 * - Line comments (`//`) are preserved in the output
 * - Block comments are preserved in the output
 * - Policies are returned in their original order from the file
 * - Each policy is trimmed of leading/trailing whitespace
 *
 * **Comment Handling:**
 * The parser correctly distinguishes between:
 * - String literals (content within double quotes)
 * - Line comments (from `//` to end of line)
 * - Block comments (enclosed in comment markers)
 * - Actual policy terminators (semicolons outside strings/comments)
 *
 * **Policy ID Format:**
 * - Generated IDs follow the pattern: 'policy_0', 'policy_1', 'policy_2', etc.
 * - IDs are sequential based on policy order in the file
 *
 * @example
 * ```typescript
 * const policyFile = 'permit(principal in Role::"admin", action, resource);';
 * const policies = splitCedarPolicies(policyFile);
 * // Returns: { 'policy_0': 'permit(principal in Role::"admin", action, resource);' }
 * ```
 *
 * @example
 * ```typescript
 * const malformed = 'permit(principal, action, resource)'; // Missing semicolon
 * try {
 *   splitCedarPolicies(malformed);
 * } catch (error) {
 *   console.error('Policy file is missing a semicolon terminator');
 * }
 * ```
 *
 * @see {@link https://docs.cedarpolicy.com/policies/syntax.html | Cedar Policy Syntax Documentation}
 */
export function splitCedarPolicies(
	policyFile: string,
): Record<PolicyId, Policy> {
	const results: string[] = [];

	let buf = "";
	let inString = false; // inside "..."
	let inLineComment = false; // inside // ...
	let inBlockComment = false; // inside /* ... */
	let prev = "";

	for (let i = 0; i < policyFile.length; i++) {
		const ch = policyFile[i];
		const next = i + 1 < policyFile.length ? policyFile[i + 1] : "";

		// End line comment
		if (inLineComment) {
			buf += ch;
			if (ch === "\n") inLineComment = false;
			prev = ch;
			continue;
		}

		// End block comment
		if (inBlockComment) {
			buf += ch;
			if (prev === "*" && ch === "/") inBlockComment = false;
			prev = ch;
			continue;
		}

		// Start line comment (only when not in string)
		if (!inString && ch === "/" && next === "/") {
			inLineComment = true;
			buf += ch; // add '/'
			// next char will be processed in next loop iteration, so add it now and skip
			buf += next; // add second '/'
			i++;
			prev = "/";
			continue;
		}

		// Start block comment (only when not in string)
		if (!inString && ch === "/" && next === "*") {
			inBlockComment = true;
			buf += ch; // add '/'
			buf += next; // add '*'
			i++;
			prev = "*";
			continue;
		}

		// Toggle string state on unescaped double quote
		if (ch === `"` && prev !== "\\") {
			inString = !inString;
			buf += ch;
			prev = ch;
			continue;
		}

		// Normal char
		buf += ch;

		// Policy terminator: semicolon outside string/comments
		if (!inString && ch === ";") {
			const policy = buf.trim();
			if (policy.length > 0) results.push(policy);
			buf = "";
		}

		prev = ch;
	}

	// Anything leftover that isn't whitespace is probably an incomplete policy
	const tail = buf.trim();
	if (tail.length > 0) {
		throw new Error(
			"Trailing content after last policy terminator ';'. " +
				"The policy file may be missing a semicolon at the end.",
		);
	}

	const finalResults: Record<string, string> = {};
	const filteredResults = results.filter((p) => p.length > 0);
	for (let idx = 0; idx < filteredResults.length; idx++) {
		finalResults[`policy_${idx}`] = filteredResults[idx];
	}
	logger.debug(
		`splitCedarPolicies: split into ${Object.keys(finalResults).length} policies.`,
		{ finalResults },
	);
	return finalResults as Record<PolicyId, Policy>;
}
