# CI Processes

Starkiller's workflows (and this documentation) are a fork of the [Empire workflows](https://github.com/BC-SECURITY/Empire/tree/main/.github).
The `main`, `kali-main`, and `sponsors-main` branches get a `dist/` generated upon release. `private-main` does not. 

## Pull Requests - Build and Test
All pull requests will run the `Lint and Test` workflow.

* The workflow will run `vue-cli-service lint` to lint the code.
* There are no tests yet.

When submitting a pull request to `private-main`, the label `auto-merge-downstream` can be added. If the label is present, then merging a branch to `private-main` will automatically trigger the prerelease step of merging `private-main` into `sponsors-main` and `kali-main`.

## BC-SECURITY/Starkiller-Sponsors Sponsors & Kali Release Process
*Note: Starting in 2023, the Kali team will be pulling from the public repo.
I am keeping the Kali workflows running for now with the exception of the tagging.
This is mostly out of laziness since I just wrote all of the CI/CD. In the near future,
we can rework these jobs to be more like "sponsors & other downstream" releases.*

Sponsors and Kali releases go through the same release process. It is easier to manage Starkiller releases by not allowing them to be released at different times and have the version numbers diverge.
A side effect of this is its possible for a version bump to be empty (no changes) and still be released.

### 1. cherry-pick any changes from BC-SECURITY/Starkiller#main to BC-SECURITY/Starkiller-Sponsors#private-main
If you don't feel comfortable pushing to `private-main`, you can branch from `private-main` before cherry-picking and open a pull request to merge into `private-main`.

```bash
cd /tmp
git clone --recursive git@github.com:bc-security/starkiller-sponsors.git
cd starkiller-sponsors
git remote add upstream git@github.com:bc-security/starkiller.git
git fetch upstream
git checkout private-main

# cherry-pick all commits needed from main to private-main
git cherry-pick <commit-hash>

# If there's any conflicts, resolve them then:
git add -A
git cherry-pick --continue

# push
git push origin private-main
```

**Potential Enhancement:** Could add a GitHub workflow that you supply a commit hash and it will cherry-pick it into `private-main` and open a pull request.

### 2. Merge Starkiller-Sponsors/private-main -> (Starkiller-Sponsors/sponsors-main, Starkiller-Sponsors/kali-main)
Run the `Prerelease - Merge private-main` manual workflow. The branch that it runs on doesn't matter.
The workflow will merge `private-main` into `sponsors-main` and `kali-main`.

No pull requests will be opened, if there are issues that broke the code, they will manifest in CI when the release PR is open.

If this step fails, it is probably due to a merge conflict. In this case,
the merge conflicts need to be resolved, and its best to run this locally.

<details>
<summary>If `private-main` -> `kali-main` fails</summary>
<p>

```bash
cd /tmp
git clone --recursive git@github.com:bc-security/starkiller-sponsors.git
cd starkiller-sponsors
git checkout kali-main
git merge origin/private-main

# Fix the conflicts, then:
git add -A
git merge --continue
git push origin kali-main
```
</p>
</details>

<details>
<summary>If `private-main` -> `sponsors-main` fails</summary>
<p>

```bash
cd /tmp
git clone --recursive git@github.com:bc-security/starkiller-sponsors.git
cd starkiller-sponsors
git checkout sponsors-main
git merge origin/private-main

# Fix the conflicts, then:
git add -A
git merge --continue
git push origin sponsors-main
```
</p>
</details>

**Potential Enhancement:** I'm still considering if this step should open PRs instead of doing direct merges.

### 3. Start Private Release
Start a release by running the `Private - Create Release` manual workflow.
The branch that it runs on doesn't matter.
The workflow will then create a release branch, push it to the repo, and create a pull request into `private-main`.

* Updates `package.json` version

### 4. Manual Step - Merge private-main release PR
Once the first workflow runs, it will open one pull request from the `release/v{version}-private` branch to `private-main`.

Check the changelog on this branch, this will be the changelog that is used for the release notes.

Merge the pull request. **DO NOT SQUASH**

**Note**: If at this point there are additional changes for the release, merge them into the release branch, not
the `private-main` branch.

**Potential Enhancement:** Use a git diff to generate a list of changes as suggestions for the release notes.

### 5. Private - Tag and Release
Once the `release/` pull request is merged, the `Private - Tag Release` workflow will automatically run.
The workflow will create a tag and release on the `HEAD` of `private-main` using the release notes from `CHANGELOG.md` for the body of the release.

### 6. Start Sponsor/Kali Release
Start the release by running the `Sponsors & Kali - Create Release` manual workflow.

This will first attempt to merge the `private-main` branch into `sponsors-main` and `kali-main` with the new release changes. Most likely, if there is a merge conflict here it is caused by `CHANGELOG.md` and should be minor. If that occurs, the merge conflict can be resolved in the pull request via the GitHub editor, or locally. 

A release PR will then be opened for each branch.

#### 7. Manual Step - Merge sponsor/kali release PRs
Once the workflow runs, it will open two pull requests from the `release/v{version}-sponsors` and `release/v{version}-kali` branches to `sponsors-main` and `kali-main` respectively.

Check the changelog on these branches, this will be the changelog that is used for the release notes.

If there are sponsor/kali specific changelog entries that need to be added, add them to the `CHANGELOG.md` file on the release branch.

Merge the pull requests. **DO NOT SQUASH**

**Note**: If at this point there are additional changes for the release, merge them into the release branch, not
the `sponsors-main` branch or `kali-main` branch.

**Potential Enhancement** We could add automation that copies the `unreleased` section from the target branch to the version section in the `head` branch.

### 7. Tag and Release
Once the pull requests are merged, the `Sponsors - Tag Release` and `Kali - Tag Release` workflows will automatically run.
The workflow will run `yarn build` and commit the `dist/` to `sponsors-main` and `kali-main` (independently). It will then create a tag and release on the `HEAD` of  of `sponsors-main` and `kali-main` using the release notes from `CHANGELOG.md` for the body of the release.

### Setup
Requires a secret in the repo `RELEASE_TOKEN` that has `repo` and `workflow` access.

## BC-SECURITY/Starkiller Public Release Process
### 1. Start Release
Start a release by running the `Public - Create Release Branch` manual workflow. It doesn't matter which branch it runs on.

The workflow will then checkout the chosen tag from the `sponsors` repo, create a release branch, push it to the public repo, and create a pull request into `main`.

The chosen tag should end in `-private`

### 2. Manual Steps - Merge release PR
Once the first workflow runs, it will open one pull request from the `release/v{version}` branch to `main`.

Check the changelog on this branch, this will be the changelog that is used for the release notes.

Merge the pull request. **DO NOT SQUASH**

**Note**: If at this point there are additional changes for the release, merge them into the release branch, not
the `main` branch. This will ensure the change ends up in the release properly.

### 3. Tag Release
Once the pull request is merged, the `Public - Tag Release` workflow will automatically run.
The workflow will create a tag and release on the `HEAD` of `main`, using the release notes from `CHANGELOG.md` for the body of the release.

The workflow will detect the last released tag, and use the release notes from the `CHANGELOG.md` between the last release and the current release. The workflow will run `yarn build` and commit the `dist/` to `main-main`.

### Setup
Requires a secret in the repo `RELEASE_TOKEN` that has `repo` and `workflow` access.

## More Information
https://www.bc-security.org/using-github-actions-to-manage-ci-cd-for-empire/

## Contributing
To update the workflows if you don't have access to the `Starkiller-Sponsors` repo:
Merge to `main` in `Starkiller`, then we can cherry-pick the changes into `private-main`.

To update the workflows if you have access to the `Starkiller-Sponsors` repo:
Merge to `private-main` in `Starkiller-Sponsors`. It will automatically merge to `sponsors-main` and `kali-main` when the prerelease workflow runs. It will merge to `Starkiller#main` when the public release workflow runs.
