// @ts-check

const child_process = require('child_process');
const path = require('path');
const {
  promises: { stat },
} = require('fs');
const { promisify } = require('util');

const manifest = require('./manifest.json');

const exec = promisify(child_process.exec);

(async () => {
  for (const entry of manifest) {
    const p = path.resolve(__dirname, entry.path);
    console.log(`Setting up external repo ${p}`);

    const exists = await stat(p)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      // Clone repository
      const clone = await exec(`git clone "${entry.url}" "${p}"`);
      console.log(clone.stderr);
      console.log(clone.stdout);
    }

    // Fetch desired commit
    const fetch = await exec(`git fetch origin ${entry.ref}`, {
      cwd: p,
    });
    console.log(fetch.stderr);
    console.log(fetch.stdout);

    // Fetch desired commit
    const checkout = await exec(`git checkout ${entry.ref}`, {
      cwd: p,
    });
    console.log(checkout.stderr);
    console.log(checkout.stdout);
  }
})();
