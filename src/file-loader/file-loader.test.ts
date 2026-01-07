import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadFileAsString } from './file-loader';

jest.mock('node:fs');
jest.mock('node:path');

const mockReadFileSync = fs.readFileSync as jest.MockedFunction<
	typeof fs.readFileSync
>;
const mockJoin = path.join as jest.MockedFunction<typeof path.join>;

describe('file-loader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('loadFileAsString', () => {
		it('should successfully load a file as a string', () => {
			const testFileName = 'test-file.txt';
			const testContent = 'This is test content';
			const testPath = '/test/path/test-file.txt';

			mockJoin.mockReturnValue(testPath);
			mockReadFileSync.mockReturnValue(testContent);

			const result = loadFileAsString(testFileName);

			expect(mockJoin).toHaveBeenCalledWith(__dirname, testFileName);
			expect(mockReadFileSync).toHaveBeenCalledWith(testPath, 'utf-8');
			expect(result).toBe(testContent);
		});

		it('should throw an error when file cannot be read', () => {
			const testFileName = 'non-existent.txt';
			const testPath = '/test/path/non-existent.txt';
			const fsError = new Error('ENOENT: no such file or directory');

			mockJoin.mockReturnValue(testPath);
			mockReadFileSync.mockImplementation(() => {
				throw fsError;
			});

			expect(() => loadFileAsString(testFileName)).toThrow(
				`Error reading file ${testFileName}: ${fsError.message}`,
			);
		});

		it('should handle permission errors', () => {
			const testFileName = 'protected-file.txt';
			const testPath = '/test/path/protected-file.txt';
			const fsError = new Error('EACCES: permission denied');

			mockJoin.mockReturnValue(testPath);
			mockReadFileSync.mockImplementation(() => {
				throw fsError;
			});

			expect(() => loadFileAsString(testFileName)).toThrow(
				`Error reading file ${testFileName}: ${fsError.message}`,
			);
		});
	});
});
