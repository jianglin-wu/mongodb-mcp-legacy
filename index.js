#!/usr/bin/env node

import { createRequire } from 'module';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pkg from 'mongodb';
import { parseDatabaseName, parseQuery, sanitizeError } from './lib/utils.js';

const { MongoClient } = pkg;
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
let client = null;
let db = null;

async function connectMongoDB() {
  if (!client) {
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    const dbName = parseDatabaseName(MONGODB_URI);
    if (!dbName) {
      throw new Error(
        'MONGODB_URI must include a database name (e.g. mongodb://host:port/mydb)'
      );
    }
    db = client.db(dbName);
    console.error(`Connected to MongoDB: ${dbName}`);
  }
  return { client, db };
}

async function shutdown() {
  if (client) {
    await client.close();
    console.error('MongoDB connection closed');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const server = new Server(
  {
    name: 'mongodb-mcp-legacy',
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_databases',
        description:
          'List databases on the MongoDB server. Falls back to the current database if admin privileges are unavailable.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_collections',
        description: 'List all collections in a database',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description:
                'Database name (optional, uses default if not specified)',
            },
          },
          required: [],
        },
      },
      {
        name: 'execute_query',
        description: 'Execute a read-only query (find operation)',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description:
                'Database name (optional, uses default if not specified)',
            },
            collection: {
              type: 'string',
              description: 'Collection name',
            },
            query: {
              type: 'string',
              description:
                'Query filter as JSON string. Supports MongoDB extended JSON: use {"$oid": "..."} for ObjectId, {"$date": "..."} for ISODate, and {"$regex": "...", "$options": "..."} for regular expressions',
            },
            sort: {
              type: 'string',
              description:
                'Sort specification as JSON string (e.g., {"createdAt": -1} or {"name": 1})',
            },
            skip: {
              type: 'number',
              description: 'Number of documents to skip (default: 0)',
            },
            limit: {
              type: 'number',
              description:
                'Maximum number of documents to return (default: 10)',
            },
          },
          required: ['collection'],
        },
      },
      {
        name: 'count_documents',
        description: 'Count documents matching a query',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description:
                'Database name (optional, uses default if not specified)',
            },
            collection: {
              type: 'string',
              description: 'Collection name',
            },
            query: {
              type: 'string',
              description:
                'Query filter as JSON string. Supports MongoDB extended JSON: use {"$oid": "..."} for ObjectId and {"$date": "..."} for ISODate',
            },
          },
          required: ['collection'],
        },
      },
      {
        name: 'distinct_values',
        description: 'Get distinct values for a field in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description:
                'Database name (optional, uses default if not specified)',
            },
            collection: {
              type: 'string',
              description: 'Collection name',
            },
            field: {
              type: 'string',
              description: 'Field name to get distinct values for',
            },
            query: {
              type: 'string',
              description:
                'Optional query filter as JSON string. Supports MongoDB extended JSON: use {"$oid": "..."} for ObjectId, {"$date": "..."} for ISODate, and {"$regex": "...", "$options": "..."} for regular expressions',
            },
          },
          required: ['collection', 'field'],
        },
      },
    ],
  };
});

function resolveDb(args) {
  return args.database ? client.db(args.database) : db;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    await connectMongoDB();

    switch (name) {
      case 'list_databases': {
        try {
          const adminDb = client.db('admin').admin();
          const result = await adminDb.listDatabases();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.databases, null, 2),
              },
            ],
          };
        } catch {
          const dbName = parseDatabaseName(MONGODB_URI);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  [
                    {
                      name: dbName,
                      note: 'fallback: admin privileges unavailable',
                    },
                  ],
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case 'list_collections': {
        const targetDb = resolveDb(args);
        const collections = await targetDb.listCollections().toArray();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(collections, null, 2),
            },
          ],
        };
      }

      case 'execute_query': {
        const targetDb = resolveDb(args);
        const collection = targetDb.collection(args.collection);
        const query = parseQuery(args.query);
        const limit = args.limit || 10;
        const skip = args.skip || 0;
        const sort = args.sort ? parseQuery(args.sort) : undefined;

        let cursor = collection.find(query);
        if (sort) cursor = cursor.sort(sort);
        cursor = cursor.skip(skip).limit(limit);
        const results = await cursor.toArray();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'count_documents': {
        const targetDb = resolveDb(args);
        const collection = targetDb.collection(args.collection);
        const query = parseQuery(args.query);
        const count = await collection.countDocuments(query);
        return {
          content: [
            {
              type: 'text',
              text: `Count: ${count}`,
            },
          ],
        };
      }

      case 'distinct_values': {
        const targetDb = resolveDb(args);
        const collection = targetDb.collection(args.collection);
        const query = parseQuery(args.query);
        const values = await collection.distinct(args.field, query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(values, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${sanitizeError(error.message)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MongoDB MCP Legacy Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', sanitizeError(error.message));
  process.exit(1);
});
