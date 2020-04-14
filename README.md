<div align="center"><img width="125" src="src/assets/icon.png"></div>

# Starkiller
Starkiller is a Frontend for [Powershell Empire](https://github.com/BC-SECURITY/Empire/). It is an Electron application written in VueJS. If you'd like to contribute please follow the [Contribution guide](/CONTRIBUTING.md). If you'd like to request a feature or report a bug, please follow the [Issue template](/.github/ISSUE_TEMPLATE.md).

# Getting Started
* To run Starkiller, you can download the installers for Mac, Linux, and Windows on the [Releases](https://github.com/BC-SECURITY/Starkiller/releases) page.
  * For more info on running AppImage builds in Linux [check out their website](https://appimage.org/)
* If you want to build from source or run in development mode, instructions are below.

## Install
Prerequisites:
* [Node.js](http://nodejs.org/) 10+.
* [Yarn](https://classic.yarnpkg.com/en/docs/install)
Currently it has been tested using Yarn 1.22.0.
```
yarn install
```

### Compile and hot-reload for development
```
yarn electron:serve
```

### Compile and minify for production
```
yarn electron:build

# Or to target a specific OS.
yarn electron:build:lin
yarn electron:build:win
yarn electron:build:mac
```

## Compatability Table
Starkiller’s new features occasionally depend on new functionality within Empire. Therefore, it is recommended that you follow this release table for syncing up your Starkiller and Empire versions. If you are using an older version of Empire, Starkiller will warn you when logging in, but will allow you to continue. If a there is a new minimum version of Empire required to get all the features out of Starkiller, we will do a minor version bump to Starkiller.
| Starkiller Release | Minimum Empire Version | Notes  |
| ------------------ |:-------------:| ---------------:|
| 1.0.x              | 3.1.1         | 3.1.1 is the first version of Empire to include all the user endpoints necessary for Starkiller to function |
| 1.1.x              | 3.1.5         | 3.1.5 updated the reporting endpoint to have the same result as running it in the CLI. Starkiller 1.1.x uses that reporting endpoint for the reporting tab |

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/bc-security/starkiller/releases).

## Stay In Touch

- [Twitter](https://twitter.com/bcsecurity1)
- [Blog](https://bc-security.org/blog)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020 BC Security
