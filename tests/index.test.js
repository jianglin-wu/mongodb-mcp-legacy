import { describe, it, expect } from 'vitest';
import pkg from 'mongodb';
import {
  parseDatabaseName,
  parseQuery,
  sanitizeError,
  transformQuery,
} from '../lib/utils.js';

const { ObjectId } = pkg;

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

describe('transformQuery', () => {
  it('converts $oid to ObjectId', () => {
    const result = transformQuery({ $oid: '507f1f77bcf86cd799439011' });
    expect(result).toBeInstanceOf(ObjectId);
    expect(result.toString()).toBe('507f1f77bcf86cd799439011');
  });

  it('converts $date string to Date', () => {
    const result = transformQuery({ $date: '2024-01-01T00:00:00Z' });
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('converts $date number (timestamp) to Date', () => {
    const result = transformQuery({ $date: 1704067200000 });
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('transforms nested query with ObjectId and Date', () => {
    const result = transformQuery({
      _id: { $oid: '507f1f77bcf86cd799439011' },
      createdAt: { $date: '2024-01-01T00:00:00Z' },
      status: 'active',
    });
    expect(result._id).toBeInstanceOf(ObjectId);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.status).toBe('active');
  });

  it('transforms values inside arrays', () => {
    const result = transformQuery({
      _id: { $in: [{ $oid: '507f1f77bcf86cd799439011' }, { $oid: '507f1f77bcf86cd799439012' }] },
    });
    expect(result._id.$in[0]).toBeInstanceOf(ObjectId);
    expect(result._id.$in[1]).toBeInstanceOf(ObjectId);
  });

  it('preserves normal objects unchanged', () => {
    const obj = { status: 'active', count: { $gt: 5 } };
    expect(transformQuery(obj)).toEqual(obj);
  });

  it('returns primitives as-is', () => {
    expect(transformQuery('string')).toBe('string');
    expect(transformQuery(42)).toBe(42);
    expect(transformQuery(null)).toBe(null);
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

  it('converts $oid in JSON query to ObjectId', () => {
    const result = parseQuery('{"_id": {"$oid": "507f1f77bcf86cd799439011"}}');
    expect(result._id).toBeInstanceOf(ObjectId);
    expect(result._id.toString()).toBe('507f1f77bcf86cd799439011');
  });

  it('converts $date in JSON query to Date', () => {
    const result = parseQuery('{"createdAt": {"$date": "2024-01-01T00:00:00Z"}}');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
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
