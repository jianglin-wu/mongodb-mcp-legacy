import { describe, it, expect } from 'vitest';
import { parseDatabaseName, parseQuery, sanitizeError } from '../lib/utils.js';

describe('parseDatabaseName', () => {
  it('extracts database name from simple URI', () => {
    expect(parseDatabaseName('mongodb://localhost:27017/mydb')).toBe('mydb');
  });

  it('extracts database name from URI with query params', () => {
    expect(
      parseDatabaseName('mongodb://localhost:27017/mydb?retryWrites=true')
    ).toBe('mydb');
  });

  it('extracts database name from URI with credentials', () => {
    expect(parseDatabaseName('mongodb://user:pass@host:27017/testdb')).toBe(
      'testdb'
    );
  });

  it('handles URI with multiple hosts (replica set)', () => {
    expect(
      parseDatabaseName(
        'mongodb://host1:27017,host2:27017/repldb?replicaSet=rs0'
      )
    ).toBe('repldb');
  });

  it('returns empty string for URI without database path', () => {
    expect(parseDatabaseName('mongodb://localhost:27017')).toBe('');
  });

  it('returns empty string for URI with trailing slash but no database', () => {
    expect(parseDatabaseName('mongodb://localhost:27017/')).toBe('');
  });

  it('handles mongodb+srv:// URIs', () => {
    expect(
      parseDatabaseName('mongodb+srv://user:pass@cluster.example.com/proddb')
    ).toBe('proddb');
  });

  it('handles mongodb+srv:// URI without database', () => {
    expect(
      parseDatabaseName('mongodb+srv://user:pass@cluster.example.com')
    ).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(parseDatabaseName('')).toBe('');
  });
});

describe('parseQuery', () => {
  it('returns empty object for undefined input', () => {
    expect(parseQuery(undefined)).toEqual({});
  });

  it('returns empty object for null input', () => {
    expect(parseQuery(null)).toEqual({});
  });

  it('returns empty object for empty string', () => {
    expect(parseQuery('')).toEqual({});
  });

  it('parses valid JSON query', () => {
    expect(parseQuery('{"status": "active"}')).toEqual({ status: 'active' });
  });

  it('parses complex nested query', () => {
    expect(parseQuery('{"age": {"$gt": 18}, "status": "active"}')).toEqual({
      age: { $gt: 18 },
      status: 'active',
    });
  });

  it('throws on invalid JSON', () => {
    expect(() => parseQuery('{invalid}')).toThrow('Invalid JSON query');
  });

  it('throws on malformed JSON with descriptive message', () => {
    expect(() => parseQuery('not json at all')).toThrow(
      'Ensure the query is valid JSON'
    );
  });
});

describe('sanitizeError', () => {
  it('redacts credentials from mongodb:// URI', () => {
    const msg = 'failed to connect to mongodb://admin:secretpass@host:27017/db';
    expect(sanitizeError(msg)).toBe(
      'failed to connect to mongodb://***:***@host:27017/db'
    );
  });

  it('redacts credentials from mongodb+srv:// URI', () => {
    const msg = 'error: mongodb+srv://user:p%40ss@cluster.example.com/db';
    expect(sanitizeError(msg)).toBe(
      'error: mongodb+srv://***:***@cluster.example.com/db'
    );
  });

  it('leaves messages without URIs unchanged', () => {
    const msg = 'Collection not found';
    expect(sanitizeError(msg)).toBe('Collection not found');
  });
});
