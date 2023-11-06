import { type Request } from '@hapi/hapi';
import { BASIC_AUTH_USER } from '@unocha/hpc-api-core/src/auth';
import { BadRequestError } from '@unocha/hpc-api-core/src/util/error';

interface BasicAuth {
  username: string | null;
  password: string | null;
}

const parseBasic = (credentialsPart: string): BasicAuth => {
  let pieces: Array<string | null>;

  const decoded = Buffer.from(credentialsPart, 'base64').toString('utf8');

  if (!decoded) {
    throw new Error('Invalid authorization header');
  }

  const index = decoded.indexOf(':');

  if (index === -1) {
    pieces = [decoded];
  } else {
    pieces = [decoded.slice(0, index), decoded.slice(index + 1)];
  }

  // Allows for usernameless authentication
  if (!pieces[0]) {
    pieces[0] = null;
  }

  // Allows for passwordless authentication
  if (!pieces[1]) {
    pieces[1] = null;
  }

  return {
    username: pieces[0],
    password: pieces[1],
  };
};

export const getTokenFromRequest = (req: Request): string | null => {
  if (!req.headers?.authorization) {
    return null;
  }

  const pieces = req.headers.authorization.split(/\s+/);

  if (!pieces || pieces.length !== 2) {
    throw new Error('Bad HTTP authentication header format');
  }

  const schemePart = pieces[0];
  const credentialsPart = pieces[1];

  switch (schemePart.toLowerCase()) {
    case 'basic': {
      const credentials = parseBasic(credentialsPart);

      if (credentials.username !== BASIC_AUTH_USER) {
        throw new BadRequestError(
          'Client Authentication is not supported in the v4 API'
        );
      }

      return credentials.password;
    }
    case 'bearer':
      return credentialsPart;

    default:
      throw new Error('Unsupported authorization scheme');
  }
};
