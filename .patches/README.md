# Workflow patches

GitHub requires the `workflow` OAuth scope to add or change files under
`.github/workflows/`. The session that prepared this branch did not have
it, so the workflow file is provided here as a git patch instead.

Apply it from a checkout with normal credentials:

```sh
git am .patches/*.patch
git rm -r .patches
git commit -m "ci: remove applied workflow patches"
git push
```

| Patch | Adds |
| ----- | ---- |
| `0001-ci-add-the-build-workflow.patch` | `.github/workflows/build.yml`: continuous integration (`npm install`, `npm run build --if-present`, `npm test`) on Node.js 24 and 22 on ubuntu-latest, for pushes and pull requests on `master`. The README build badge points at this workflow. |

The patch is a plain addition; `git apply --check .patches/*.patch`
verifies that it applies.
