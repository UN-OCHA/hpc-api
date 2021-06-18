# Authentication

Authentication can be used as a guard on a field, query or mutation, restricting data access or actions for a specific group of users.

Since the codebase uses TypeGraphQL, which relies heavily on decorators, authentication is also done using decorators.

Authentication is done with use of `@Permission` decorator. This decorator takes function as an argument with permission object as a return value.

For example:

```lang=js
@Permission(({ args }) =>
  Promise.resolve({
    or: [
      { type: 'global', permission: P.global.VIEW_ANY_PLAN_DATA },
      { type: 'plan', permission: P.plan.VIEW_DATA, id: args.id },
    ],
  })
)
```

If only global permission check is needed, it can be used directly:

```lang=js
@Permission({
  type: 'global',
  permission: P.global.VIEW_ALL_JOBS,
})
```
