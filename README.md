<div align="center"><img width="125" src="src/assets/icon.png"></div>

# Starkiller
Starkiller is a Frontend for [Powershell Empire](https://github.com/BC-SECURITY/Empire/). It is an Electron application written in VueJS. If you'd like to contribute please follow the [Contribution guide](/CONTRIBUTING.md). If you'd like to request a feature or report a bug, please follow the [Issue template](/.github/ISSUE_TEMPLATE.md).

## Sponsors
[<img src="https://user-images.githubusercontent.com/20302208/104083160-41552780-51f1-11eb-8428-3b8cfaf76861.png" width="300"/>](https://www.kali.org/)
[<img src="https://user-images.githubusercontent.com/20302208/113086242-219d2200-9196-11eb-8c91-84f19c646873.png" width="100"/>](https://kovert.no/)

# Getting Started
* To run Starkiller, you can download the installers for Mac, Linux, and Windows on the [Releases](https://github.com/BC-SECURITY/Starkiller/releases) page.
  * For Mac and Windows - run the installer how you would any other .exe or .dmg
  * For Linux - Change the permissions `chmod a+x starkiller-<version>.AppImage`, then execute `./starkiller-<version>.AppImage --no-sandbox`
* Starkiller is also available via `apt install starkiller` on [Kali](https://www.kali.org/). Kali releases are 30 days ahead of the public release.
* If you want to build from source or run in development mode, instructions are below.

# Sponsorship and extra features
[Sponsoring](https://github.com/sponsors/BC-SECURITY/) at the `Individual` level will give access to extra features.
At the moment, the extra Starkiller sponsorship features include:
  - Interactive agent shell
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/104983879-e37fc700-59ca-11eb-9c90-bd2d166c4ac5.gif"></div>
  - Malleable profile management
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/122686145-9cd60900-d1c4-11eb-8a74-e98a09c967cd.gif"></div>
  - Bypass management
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/122686275-0c4bf880-d1c5-11eb-9ed9-399e0360a9f7.gif"></div>
  - Enable/Disable modules
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/123528242-e7f78c80-d69a-11eb-9e88-3410c151cd20.gif"></div>

There is also a collection of Empire plugins available via sponsorship.

Thanks to our sponsors for helping reach previous goals, the file browser, the agent popout windows, and the chat widget have all been moved from the sponsorship repository to the public/Kali builds.

## Build and run from source
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


Starkiller's build tool, [electron-builder](https://www.electron.build), is not meant to target multiple platforms in a single build. It is also recommended to compile on your target platform. 
For example, to build for amd64 (on an amd64 machine) with an AppImage, the command would be:
```
yarn electron:build --arm64 --linux AppImage
```

**Note:** To regenerate the icons
```
npm install -g electron-icon-builder
yarn electron:generate-icons
```

## Compatability Table
Starkiller’s new features occasionally depend on new functionality within Empire. Therefore, it is recommended that you follow this release table for syncing up your Starkiller and Empire versions. If you are using an older version of Empire, Starkiller will warn you when logging in, but will allow you to continue. If a there is a new minimum version of Empire required to get all the features out of Starkiller, we will do a minor version bump to Starkiller.
| Starkiller Release | Minimum Empire Version | Notes  |
| ------------------ | ---------------------- | ------ |
| 1.0.x              | 3.1.1         | 3.1.1 is the first version of Empire to include all the user endpoints necessary for Starkiller to function |
| 1.1.x              | 3.1.5         | 3.1.5 updated the reporting endpoint to have the same result as running it in the CLI. Starkiller 1.1.x uses that reporting endpoint for the reporting tab |
| 1.2.x              | 3.2.0         | 3.2.0 added an endpoint for users that is needed for the UI updates introduced in Starkiller 1.2.0
| 1.3.x              | 3.3.0         | 3.3.0 categorized all of the modules in Empire with corresponding [MITRE techniques](https://attack.mitre.org/techniques/enterprise/)
| 1.4.x, 1.5.x              | 3.5.0         | 3.5.0 added real-time notifications for new listeners and agents
| 1.6.x, 1.7.x              | 3.7.0         | 1.6.0 was tested against Empire 3.7.0. There *shouldn't* be any breaking changes, but there were a lot of code changes.
| 1.8.x             | 4.0.0         | 

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/bc-security/starkiller/releases).

## Stay In Touch

- [Twitter](https://twitter.com/bcsecurity1)
- [Blog](https://bc-security.org/blog)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2021 BC Security
