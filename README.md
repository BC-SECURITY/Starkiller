<div align="center"><img width="125" src="src/assets/icon.png"></div>

# Starkiller
Starkiller is a Frontend for [Powershell Empire](https://github.com/BC-SECURITY/Empire/). It is a web application written in VueJS. If you'd like to contribute please follow the [Contribution guide](/CONTRIBUTING.md). If you'd like to request a feature or report a bug, please follow the [Issue template](/.github/ISSUE_TEMPLATE.md).

# Getting Started
As of Empire 5.0 and Starkiller 2.0, you no longer need to install Starkiller or build it from source.
It is prepackaged in Empire as a submodule and served via Empire's API.

## Sponsors
[<img src="https://user-images.githubusercontent.com/20302208/185246508-56f4f574-5a06-4a2c-ac62-320922588dcf.png" width="100"/>](https://www.sans.org/cyber-security-courses/red-team-operations-adversary-emulation/) &emsp; &emsp; &emsp;
[<img src="https://user-images.githubusercontent.com/20302208/208271681-235c914b-5359-426e-8a3d-903bbd018847.png" width="100"/>](https://www.cybrary.it/)

# Sponsorship and extra features
[Sponsoring](https://github.com/sponsors/BC-SECURITY/) at the `Individual` level will give access to extra features.
At the moment, the extra Starkiller sponsorship features include:

  ## Interactive agent shell
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/104983879-e37fc700-59ca-11eb-9c90-bd2d166c4ac5.gif"></div>
  
  ## Enable/Disable modules
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/123528242-e7f78c80-d69a-11eb-9e88-3410c151cd20.gif"></div>
  
  ## Process Browser
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/131264080-0264558d-59c4-44d9-8dae-7b518c47a9cb.gif"></div>

  ## Proxy Management
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/210124448-4f1107b0-3250-4faa-8ea9-4daec77e277e.gif"></div>

  ## Graph View
  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/216792129-5b0fed82-b209-48cb-9a43-eeb3e69c7229.gif"></div>

There is also a collection of Empire plugins available via sponsorship.

Thanks to our sponsors the following features which started as sponsor features have been moved to the public and kali builds.
- File browser
- Popout windows
- Chat widget
- Bypass management
- Malleable profile management

## Build and run from source
Prerequisites:
* [Node.js](http://nodejs.org/) 16+.
* [Yarn](https://classic.yarnpkg.com/en/docs/install)
Currently it has been tested using Yarn 1.22.
```
yarn
```

### Compile and hot-reload for development
```
yarn dev
```

### Compile and minify for production
```
yarn build
```

## Compatability Table

**Note**: As of Empire 5.0 and Starkiller 2.0, this compatability table is less relevant. Starkiller is now packaged in Empire as a git submodule and does not need to be installed separately.

Starkiller’s new features occasionally depend on new functionality within Empire. Therefore, it is recommended that you follow this release table for syncing up your Starkiller and Empire versions. If you are using an older version of Empire, Starkiller will warn you when logging in, but will allow you to continue. If a there is a new minimum version of Empire required to get all the features out of Starkiller, we will do a minor version bump to Starkiller.
| Starkiller Release | Minimum Empire Version | Notes  |
| ------------------ | ---------------------- | ------ |
| 1.0.x              | 3.1.1         | 3.1.1 is the first version of Empire to include all the user endpoints necessary for Starkiller to function |
| 1.1.x              | 3.1.5         | 3.1.5 updated the reporting endpoint to have the same result as running it in the CLI. Starkiller 1.1.x uses that reporting endpoint for the reporting tab |
| 1.2.x              | 3.2.0         | 3.2.0 added an endpoint for users that is needed for the UI updates introduced in Starkiller 1.2.0
| 1.3.x              | 3.3.0         | 3.3.0 categorized all of the modules in Empire with corresponding [MITRE techniques](https://attack.mitre.org/techniques/enterprise/)
| 1.4.x, 1.5.x       | 3.5.0         | 3.5.0 added real-time notifications for new listeners and agents
| 1.6.x, 1.7.x       | 3.7.0         | 1.6.0 was tested against Empire 3.7.0. There *shouldn't* be any breaking changes, but there were a lot of code changes.
| 1.8.x              | 4.0.0         | 
| 1.9.x, 1.10.x, 1.11.x  | 4.1.0         | The updated agent screen requires new endpoints in order to update fields on the 'view' tab
| 2.0.x              | 5.0.0         | Uses the new v2 api

## Changelog

Detailed changes for each release are documented in the [changelog](./CHANGELOG.md).

## Stay In Touch

- [Twitter](https://twitter.com/bcsecurity1)
- [Blog](https://bc-security.org/blog)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2021 BC Security
