# Create a release

For maintainers: how to publish a new version of seneca-web to npm.

1. Review the GitHub issues and pull requests; merge or close what
   belongs to the release.
2. Update `CHANGES.md` with the version, the date and the notable
   changes.
3. On a clean checkout of `master`, run `npm install` and `npm test`
   on Node.js 24 and on Node.js 22. The tests run against the Seneca
   version in `devDependencies`; to check another one, run
   `npm install --no-save seneca@<version>` and `npm test` again, then
   `npm install` to restore the lock file.
4. Run the examples: `for f in docs/examples/*.js; do node $f; done`.
   Each one exits on its own.
5. Run `npm version <major|minor|patch> -m "version %s"`. This updates
   `package.json` and `package-lock.json`, commits, and tags.
6. Run `git push upstream master --tags`.
7. Run `npm publish`.
8. On the [GitHub releases page][Releases], draft a release for the
   tag, paste the `CHANGES.md` entry, and publish it.
9. Notify the core maintainers.

If the `.patches` folder is still present, apply the workflow patch
first (`git am .patches/*.patch`) so that continuous integration runs
for the release; see [.patches/README.md](../../.patches/README.md).

[Releases]: https://github.com/senecajs/seneca-web/releases
