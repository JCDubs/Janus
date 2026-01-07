// Mock AWS Lambda Powertools Logger to avoid initialization issues in tests
jest.mock('@aws-lambda-powertools/logger', () => {
	return {
		Logger: jest.fn().mockImplementation(() => ({
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			addContext: jest.fn(),
		})),
	};
});

// Mock environment variables for AWS Lambda Powertools Logger
process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
process.env.AWS_LAMBDA_FUNCTION_VERSION = '$LATEST';
process.env.AWS_REGION = 'us-east-1';
process.env.POWERTOOLS_SERVICE_NAME = 'test-service';
