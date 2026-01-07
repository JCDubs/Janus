import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitCedarPolicies } from "./policy-parser";

describe("splitCedarPolicies", () => {
	describe("basic policy parsing", () => {
		it("should parse a single policy", () => {
			const input = "permit(principal, action, resource);";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toEqual("permit(principal, action, resource);");
		});

		it("should parse multiple policies", () => {
			const input = `
        permit(principal, action, resource);
        forbid(principal, action, resource);
      `;
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(2);
			expect(policies[0]).toBe("permit(principal, action, resource);");
			expect(policies[1]).toBe("forbid(principal, action, resource);");
		});

		it("should handle empty input", () => {
			const result = splitCedarPolicies("");
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should handle whitespace-only input", () => {
			const result = splitCedarPolicies("   \n  \t  ");
			expect(Object.keys(result)).toHaveLength(0);
		});
	});

	describe("line comments", () => {
		it("should preserve line comments in policy", () => {
			const input =
				"// This is a comment\npermit(principal, action, resource);";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain("// This is a comment");
		});

		it("should handle line comment before semicolon", () => {
			const input = "permit(principal, action, resource) // comment\n;";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain("// comment");
		});

		it("should throw error for line comment after semicolon", () => {
			const input = "permit(principal, action, resource); // comment\n";
			expect(() => splitCedarPolicies(input)).toThrow(
				"Trailing content after last policy terminator ';'",
			);
		});

		it("should handle multiple line comments", () => {
			const input = `
        // Comment 1
        permit(principal, action, resource);
        // Comment 2
        forbid(principal, action, resource);
      `;
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(2);
			expect(policies[0]).toContain("// Comment 1");
			expect(policies[1]).toContain("// Comment 2");
		});
	});

	describe("block comments", () => {
		it("should preserve block comments in policy", () => {
			const input = "/* Block comment */ permit(principal, action, resource);";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain("/* Block comment */");
		});

		it("should handle multi-line block comments", () => {
			const input = `
        /*
         * Multi-line
         * block comment
         */
        permit(principal, action, resource);
      `;
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain("Multi-line");
		});

		it("should handle multiple block comments before semicolon", () => {
			const input =
				"/* Comment 1 */ permit(principal, action, resource) /* Comment 2 */;";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain("/* Comment 1 */");
			expect(policies[0]).toContain("/* Comment 2 */");
		});

		it("should throw error for block comment after semicolon", () => {
			const input =
				"/* Comment 1 */ permit(principal, action, resource); /* Comment 2 */";
			expect(() => splitCedarPolicies(input)).toThrow(
				"Trailing content after last policy terminator ';'",
			);
		});
	});

	describe("string literals", () => {
		it("should not split on semicolon inside string literal", () => {
			const input =
				'permit(principal, action, resource) when { attr == "value;with;semicolons" };';
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain('"value;with;semicolons"');
		});

		it("should handle escaped quotes in strings", () => {
			const input =
				'permit(principal, action, resource) when { attr == "value with \\"quotes\\"" };';
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain('\\"quotes\\"');
		});

		it("should not interpret comment markers inside strings", () => {
			const input =
				'permit(principal, action, resource) when { attr == "// not a comment" };';
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain('"// not a comment"');
		});

		it("should not interpret block comment markers inside strings", () => {
			const input =
				'permit(principal, action, resource) when { attr == "/* not a comment */" };';
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(1);
			expect(policies[0]).toContain('"/* not a comment */"');
		});
	});

	describe("error cases", () => {
		it("should throw error when missing trailing semicolon", () => {
			const input = "permit(principal, action, resource)";
			expect(() => splitCedarPolicies(input)).toThrow(
				"Trailing content after last policy terminator ';'. " +
					"The policy file may be missing a semicolon at the end.",
			);
		});

		it("should throw error with partial policy after valid one", () => {
			const input = `
        permit(principal, action, resource);
        forbid(principal, action, resource)
      `;
			expect(() => splitCedarPolicies(input)).toThrow(
				"Trailing content after last policy terminator ';'",
			);
		});
	});

	describe("complex scenarios", () => {
		it("should handle policies with mixed comments and strings", () => {
			const input = `
        // Policy 1
        permit(principal, action, resource) when {
          /* condition */
          attr == "value;with;semicolons" // inline comment
        };
        /* Policy 2 */
        forbid(principal, action, resource);
      `;
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(2);
			expect(policies[0]).toContain("// Policy 1");
			expect(policies[0]).toContain("/* condition */");
			expect(policies[0]).toContain('"value;with;semicolons"');
			expect(policies[1]).toContain("/* Policy 2 */");
		});

		it("should handle consecutive semicolons", () => {
			const input = "permit(principal, action, resource);;";
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			// Second semicolon creates an empty policy that gets filtered, but a lone semicolon is kept
			expect(policies.length).toBeGreaterThanOrEqual(1);
			expect(policies[0]).toBe("permit(principal, action, resource);");
		});

		it("should preserve policy order", () => {
			const input = `
        permit(principal, action, resource) when { id == "1" };
        forbid(principal, action, resource) when { id == "2" };
        permit(principal, action, resource) when { id == "3" };
      `;
			const result = splitCedarPolicies(input);
			const policies = Object.values(result);
			expect(policies).toHaveLength(3);
			expect(policies[0]).toContain('"1"');
			expect(policies[1]).toContain('"2"');
			expect(policies[2]).toContain('"3"');
		});
	});

	describe("real-world Cedar policies from policies.cedar", () => {
		let policiesFileContent: string;

		beforeAll(() => {
			const policiesPath = join(
				__dirname,
				"authorization-tests",
				"cedar",
				"policies.cedar",
			);
			policiesFileContent = readFileSync(policiesPath, "utf-8");
		});

		it("should parse all policies from policies.cedar file", () => {
			const result = splitCedarPolicies(policiesFileContent);

			// The policies.cedar file contains 7 policies
			expect(Object.keys(result)).toHaveLength(7);
		});

		it("should preserve comments in parsed policies", () => {
			const result = splitCedarPolicies(policiesFileContent);

			// Check that comments are preserved
			const policies = Object.values(result);
			const firstPolicy = policies[0];
			expect(firstPolicy).toContain("// Customer can view their own orders");
		});

		it("should correctly parse customer view orders policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const customerViewPolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes("Customer can view their own orders"),
			);
			expect(customerViewPolicy).toBeDefined();
			expect(customerViewPolicy).toContain('OrderService::Action::"getOrder"');
			expect(customerViewPolicy).toContain(
				'OrderService::Action::"listOrders"',
			);
			expect(customerViewPolicy).toContain("resource.customer == principal");
			expect(customerViewPolicy).toContain('OrderService::Role::"customers"');
		});

		it("should correctly parse customer create orders policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const customerCreatePolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes("Customers can create their own orders"),
			);
			expect(customerCreatePolicy).toBeDefined();
			expect(customerCreatePolicy).toContain(
				'OrderService::Action::"createOrder"',
			);
			expect(customerCreatePolicy).toContain("resource.createdBy == principal");
			expect(customerCreatePolicy).toContain("resource.customer == principal");
		});

		it("should correctly parse customer update/delete policy with status check", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const customerUpdateDeletePolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes(
						"Customers can update and delete any order if the status is a certain value",
					),
			);
			expect(customerUpdateDeletePolicy).toBeDefined();
			expect(customerUpdateDeletePolicy).toContain(
				'OrderService::Action::"updateOrder"',
			);
			expect(customerUpdateDeletePolicy).toContain(
				'OrderService::Action::"deleteOrder"',
			);
			expect(customerUpdateDeletePolicy).toContain(
				'resource.status == "PENDING"',
			);
		});

		it("should correctly parse sales staff and managers view/create policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const salesViewCreatePolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes(
						"Sales Staff and Sale Managers can view and create any orders",
					),
			);
			expect(salesViewCreatePolicy).toBeDefined();
			expect(salesViewCreatePolicy).toContain(
				'OrderService::Role::"saleStaff"',
			);
			expect(salesViewCreatePolicy).toContain(
				'OrderService::Role::"saleManagers"',
			);
			expect(salesViewCreatePolicy).toContain("||");
		});

		it("should correctly parse sales staff and managers update/delete policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const salesUpdateDeletePolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes(
						"Sales Staff and Sale Managers can update and delete any order if the status is a certain value",
					),
			);
			expect(salesUpdateDeletePolicy).toBeDefined();
			expect(salesUpdateDeletePolicy).toContain('resource.status == "PENDING"');
			expect(salesUpdateDeletePolicy).toContain(
				'OrderService::Role::"saleStaff"',
			);
			expect(salesUpdateDeletePolicy).toContain(
				'OrderService::Role::"saleManagers"',
			);
		});

		it("should correctly parse account manager policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const accountManagerPolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes(
						"Account Managers can view orders for accounts they manage",
					),
			);
			expect(accountManagerPolicy).toBeDefined();
			expect(accountManagerPolicy).toContain(
				"resource.accountManager == principal",
			);
			expect(accountManagerPolicy).toContain(
				'OrderService::Role::"accountManagers"',
			);
		});

		it("should correctly parse accountant policy", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const accountantPolicy = policies.find(
				(p) =>
					typeof p === "string" &&
					p.includes("Accountants can view orders for any account"),
			);
			expect(accountantPolicy).toBeDefined();
			expect(accountantPolicy).toContain('OrderService::Role::"accountants"');
			expect(accountantPolicy).toContain('OrderService::Action::"getOrder"');
			expect(accountantPolicy).toContain('OrderService::Action::"listOrders"');
		});

		it("should maintain policy order from file", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			// Verify the order based on comments
			expect(policies[0]).toContain("Customer can view their own orders");
			expect(policies[1]).toContain("Customers can create their own orders");
			expect(policies[2]).toContain(
				"Customers can update and delete any order",
			);
			expect(policies[3]).toContain(
				"Sales Staff and Sale Managers can view and create",
			);
			expect(policies[4]).toContain(
				"Sales Staff and Sale Managers can update and delete",
			);
			expect(policies[5]).toContain("Account Managers can view orders");
			expect(policies[6]).toContain("Accountants can view orders");
		});

		it("should preserve all when clauses and conditions", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const policiesWithWhen = policies.filter(
				(p) => typeof p === "string" && p.includes("when"),
			); // All 7 policies have when clauses
			expect(policiesWithWhen).toHaveLength(7);

			// Verify each has proper when structure
			for (const policy of policiesWithWhen) {
				expect(policy).toContain("when {");
			}
		});

		it("should handle all action types correctly", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const allPoliciesText = policies.join(" ");

			expect(allPoliciesText).toContain('OrderService::Action::"getOrder"');
			expect(allPoliciesText).toContain('OrderService::Action::"listOrders"');
			expect(allPoliciesText).toContain('OrderService::Action::"createOrder"');
			expect(allPoliciesText).toContain('OrderService::Action::"updateOrder"');
			expect(allPoliciesText).toContain('OrderService::Action::"deleteOrder"');
		});

		it("should handle all role types correctly", () => {
			const result = splitCedarPolicies(policiesFileContent);
			const policies = Object.values(result);

			const allPoliciesText = policies.join(" ");

			expect(allPoliciesText).toContain('OrderService::Role::"customers"');
			expect(allPoliciesText).toContain('OrderService::Role::"saleStaff"');
			expect(allPoliciesText).toContain('OrderService::Role::"saleManagers"');
			expect(allPoliciesText).toContain(
				'OrderService::Role::"accountManagers"',
			);
			expect(allPoliciesText).toContain('OrderService::Role::"accountants"');
		});
	});
});
