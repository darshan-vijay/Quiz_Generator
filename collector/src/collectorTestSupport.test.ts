import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from './utils';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

vi.mock('axios');
const mockedAxios = axios as any;

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    }
}));

vi.mock('cheerio', () => ({
    default: {
        load: vi.fn().mockReturnValue({
            html: vi.fn().mockReturnValue('<html>test</html>'),
            remove: vi.fn(),
            text: vi.fn().mockReturnValue('test text'),
            attr: vi.fn().mockReturnValue('/test'),
            each: vi.fn(),
        })
    }
}));

describe('Utils', () => {
    describe('sanitizeFileName', () => {
        it('should replace invalid characters with underscores', () => {
            expect(utils.sanitizeFileName('test/file?name')).toBe('test_file_name');
            expect(utils.sanitizeFileName('test\\file*name')).toBe('test_file_name');
            expect(utils.sanitizeFileName('test:file|name')).toBe('test_file_name');
        });

        it('should replace spaces with underscores', () => {
            expect(utils.sanitizeFileName('test file name')).toBe('test_file_name');
        });
    });

    describe('loadJSON', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should return parsed JSON when file exists', () => {
            const mockData = { test: 'data' };
            (fs.readFileSync as any).mockReturnValue(JSON.stringify(mockData));
            
            expect(utils.loadJSON('test.json', {})).toEqual(mockData);
        });

        it('should return default value when file does not exist', () => {
            (fs.readFileSync as any).mockImplementation(() => {
                throw new Error('File not found');
            });
            
            expect(utils.loadJSON('nonexistent.json', { default: 'value' }))
                .toEqual({ default: 'value' });
        });
    });

    describe('normalizeUrl', () => {
        it('should normalize valid URLs', () => {
            expect(utils.normalizeUrl('https://example.com/path?query=1'))
                .toBe('https://example.com/path');
        });

        it('should return original string for invalid URLs', () => {
            expect(utils.normalizeUrl('invalid-url')).toBe('invalid-url');
        });
    });

    describe('linkToWikipedia', () => {
        it('should return true for valid Wikipedia links', () => {
            expect(utils.linkToWikipedia('/wiki/Software_engineering')).toBe(true);
        });

        it('should return false for non-Wikipedia links', () => {
            expect(utils.linkToWikipedia('/wiki/File:test.jpg')).toBe(false);
            expect(utils.linkToWikipedia('/wiki/Category:Test')).toBe(false);
            expect(utils.linkToWikipedia('/wiki/Help:Test')).toBe(false);
        });
    });

    describe('isValidText', () => {
        it('should return false for invalid text', () => {
            expect(utils.isValidText('Login to continue')).toBe(false);
            expect(utils.isValidText('Sign up for more')).toBe(false);
            expect(utils.isValidText('Mobile version')).toBe(false);
            expect(utils.isValidText('Desktop version')).toBe(false);
        });

        it('should return true for valid text', () => {
            expect(utils.isValidText('Software Engineering Principles')).toBe(true);
        });
    });

    describe('isPDFLink', () => {
        it('should return true for .pdf extension', async () => {
            expect(await utils.isPDFLink('test.pdf')).toBe(true);
        });

        it('should return true for PDF content type', async () => {
            mockedAxios.head.mockResolvedValue({
                headers: { 'content-type': 'application/pdf' }
            });
            expect(await utils.isPDFLink('test')).toBe(true);
        });

        it('should return false for non-PDF content', async () => {
            mockedAxios.head.mockResolvedValue({
                headers: { 'content-type': 'text/html' }
            });
            expect(await utils.isPDFLink('test')).toBe(false);
        });
    });
});
