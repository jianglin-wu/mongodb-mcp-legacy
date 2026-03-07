export function parseDatabaseName(uri) {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const afterHosts = withoutProtocol.split('/')[1];
  if (!afterHosts) return '';
  return afterHosts.split('?')[0];
}

export function parseQuery(queryString) {
  if (!queryString) return {};
  try {
    return JSON.parse(queryString);
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
