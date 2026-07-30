/**
 * Apollo Server wired into the existing Express app at /api/graphql.
 * Shares the same JWT auth + RBAC + tenant isolation as the REST API — GraphQL
 * is an additional read/BI surface, not a replacement.
 */
import type { Express, RequestHandler } from 'express';
import { json } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { buildContext, GqlContext } from './context';
import { logger } from '../utils/logger';

export async function mountGraphQL(app: Express, path = '/api/graphql') {
  const server = new ApolloServer<GqlContext>({ typeDefs, resolvers });
  await server.start();
  app.use(
    path,
    json(),
    // Cast around the Apollo/Express @types version mismatch (runtime is fine).
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req.headers.authorization),
    }) as unknown as RequestHandler,
  );
  logger.info(`GraphQL ready at ${path}`);
}
