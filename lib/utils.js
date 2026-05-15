export function parseDatabaseName(uri) {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const afterHosts = withoutProtocol.split('/')[1];
  if (!afterHosts) return '';
  return afterHosts.split('?')[0];
}

import pkg from 'mongodb';

const { ObjectId } = pkg;

export function transformQuery(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformQuery);
  }

  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const key = keys[0];
    if (key === '$oid') {
      return new ObjectId(obj[key]);
    }
    if (key === '$date') {
      return new Date(obj[key]);
    }
  }

  const result = {};
  for (const key of keys) {
    result[key] = transformQuery(obj[key]);
  }
  return result;
}

export function parseQuery(queryString) {
  if (!queryString) return {};
  try {
    const parsed = JSON.parse(queryString);
    return transformQuery(parsed);
  } catch {
    throw new Error(
      `Invalid JSON query: ${queryString}. Ensure the query is valid JSON.`
    );
  }
}

export function sanitizeError(message) {
  return message.replace(
    /mongodb(\+srv)?:\/\/[^/\s]+@/gi,
    'mongodb$1://***:***@'
  );
}
