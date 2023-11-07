import { actionIsPermitted } from '@unocha/hpc-api-core/src/auth';
import { type RequiredPermissionsCondition } from '@unocha/hpc-api-core/src/auth/permissions';
import { type Context } from '@unocha/hpc-api-core/src/lib/context';
import { ForbiddenError } from '@unocha/hpc-api-core/src/util/error';
import { createMethodDecorator, type ResolverData } from 'type-graphql';

type RequiredPermissions = (
  resolverData: ResolverData<Context>
) => Promise<RequiredPermissionsCondition<never>>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Permission(
  requiredPermissions: RequiredPermissions | RequiredPermissionsCondition<never>
): MethodDecorator {
  return createMethodDecorator(
    async (resolverData: ResolverData<Context>, next) => {
      let permissions: RequiredPermissionsCondition<never>;
      if (typeof requiredPermissions === 'function') {
        permissions = await requiredPermissions(resolverData);
      } else {
        permissions = requiredPermissions;
      }

      if (!(await actionIsPermitted(permissions, resolverData.context))) {
        throw new ForbiddenError('No permission to perform this action');
      }

      return next();
    }
  );
}
