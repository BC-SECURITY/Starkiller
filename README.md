<div align="center"><img width="125" src="src/assets/icon.png"></div>

# Starkiller
Starkiller is a Frontend for [Powershell Empire](https://github.com/BC-SECURITY/Empire/). It is an Electron application written in VueJS. If you'd like to contribute please follow the [Contibution guide](/CONTRIBUTING.md). If you'd like to request a feature or report a bug, please follow the [Issue template](/.github/ISSUE_TEMPLATE.md).

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

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/bc-security/starkiller/releases).

## Stay In Touch

- [Twitter](https://twitter.com/bcsecurity1)
- [Blog](https://bc-security.org/blog)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020 BC Security