/**
 * This line enables transpilation of TypeScript modules in node_modules.
 *
 * The reason we do this is to allow us to publish `hpc-api-core` without
 * transpiling. (Reasoning for doing this can be found here:
 * https://github.com/UN-OCHA/hpc-api-core#usage).
 *
 * Given that this is not intended to be used for any projects outside of
 * the HPC development team, this seems like an appropriate trade-off.
 *
 * For more details see:
 *
 * * https://github.com/TypeStrong/ts-node#transpilation
 * * https://github.com/TypeStrong/ts-node/issues/155#issuecomment-235243048
 * * https://github.com/UN-OCHA/hpc-api-core#usage
 */
process.env.TS_NODE_IGNORE = 'DISABLED';

require('ts-node/register/transpile-only');
