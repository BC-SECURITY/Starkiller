<div align="center"><img width="125" src="src/assets/icon.png"></div>

<div align="center">

[![Donate](https://img.shields.io/badge/Donate-Sponsor-blue?style=plastic&logo=github)](https://github.com/sponsors/BC-SECURITY)
[![Docs](https://img.shields.io/badge/Wiki-Docs-green?style=plastic&logo=wikipedia)](https://bc-security.gitbook.io/empire-wiki/)
[![Twitter URL](https://img.shields.io/twitter/follow/BCSecurity1?style=plastic&logo=twitter)](https://twitter.com/BCSecurity1)
[![YouTube URL](https://img.shields.io/youtube/channel/views/UCIV4xSntF1h1bvFt8SUfzZg?style=plastic&logo=youtube)](https://www.youtube.com/channel/UCIV4xSntF1h1bvFt8SUfzZg)
[![Discord](https://img.shields.io/discord/716165691383873536?style=plastic&logo=discord)](https://discord.gg/P8PZPyf)
[![Donate](https://img.shields.io/badge/Donate-Sponsor-blue?style=plastic&logo=github)](https://github.com/sponsors/BC-SECURITY)
[![Blog](https://img.shields.io/badge/Blog-Read%20me-orange?style=plastic&logo=wordpress)](https://www.bc-security.org/blog)
[![Twitter URL](https://img.shields.io/twitter/follow/BCSecurity?style=plastic&logo=twitter)](https://twitter.com/BCSecurity)
[![Twitter URL](https://img.shields.io/twitter/follow/EmpireC2Project?style=plastic&logo=twitter)](https://twitter.com/EmpireC2Project)
[![YouTube URL](https://img.shields.io/youtube/channel/views/UCIV4xSntF1h1bvFt8SUfzZg?style=plastic&logo=youtube)](https://www.youtube.com/channel/UCIV4xSntF1h1bvFt8SUfzZg)
[![LinkedIn](https://img.shields.io/badge/Linkedin-blue?style=plastic&logo=linkedin&logoColor=#0A66C2)](https://www.linkedin.com/company/bc-security/)

</div>

# Starkiller

Starkiller is a Frontend for [Powershell Empire](https://github.com/BC-SECURITY/Empire/). It is a web application written in VueJS. If you'd like to contribute please follow the [Contribution guide](/CONTRIBUTING.md). If you'd like to request a feature or report a bug, please follow the [Issue template](/.github/ISSUE_TEMPLATE.md).

# Getting Started

As of Empire 5.0 and Starkiller 2.0, you no longer need to install Starkiller or build it from source.
It is prepackaged in Empire as a submodule and served via Empire's API.

## Sponsors
<div align="center">

[<img src="https://github.com/user-attachments/assets/604fbb97-4641-4a15-a6ba-039f67694f15" width="200"/>](https://www.route4me.com//)
</div>
<!---https://github-production-user-asset-6210df.s3.amazonaws.com/20302208/354655875-3497ee72-324a-4b8a-a14b-37748115997d.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20240802%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240802T160658Z&X-Amz-Expires=300&X-Amz-Signature=68f78dde4457cc5bc6642dce601e1fd439252e2796b3ebe8d8d47e17625acd9a&X-Amz-SignedHeaders=host&actor_id=20302208&key_id=0&repo_id=276544505" width="100"/>](https://twitter.com/joehelle)
</div>
--->

# Sponsorship and extra features

[Sponsoring](https://github.com/sponsors/BC-SECURITY/) at the `Individual` level will give access to extra features.
At the moment, the extra Starkiller sponsorship features include:

## Dashboard

  <div align="left"><img width="800" src="https://github.com/BC-SECURITY/Starkiller/assets/9831420/7fda92cd-52ab-4d84-a835-89c35b38cf7e"></div>

## Graph View

  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/216792129-5b0fed82-b209-48cb-9a43-eeb3e69c7229.gif"></div>

## Process Browser

  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/131264080-0264558d-59c4-44d9-8dae-7b518c47a9cb.gif"></div>

## Modify Module Scripts

  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/221427395-28d63b1d-bbe5-423e-9113-e58a10a86ced.gif"></div>

## Enable/Disable modules

  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/123528242-e7f78c80-d69a-11eb-9e88-3410c151cd20.gif"></div>

## Proxy Management

  <div align="left"><img width="800" src="https://user-images.githubusercontent.com/9831420/210124448-4f1107b0-3250-4faa-8ea9-4daec77e277e.gif"></div>

There is also a collection of Empire plugins available via sponsorship.

Thanks to our sponsors the following features which started as sponsor features have been moved to the public and kali builds.

- File browser
- Popout windows
- Chat widget
- Bypass management
- Malleable profile management

## Build and run from source

Prerequisites:

- [Node.js](http://nodejs.org/) 16+.
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
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
| Starkiller Release | Minimum Empire Version | Notes |
| ------------------ | ---------------------- | ------ |
| 1.0.x | 3.1.1 | 3.1.1 is the first version of Empire to include all the user endpoints necessary for Starkiller to function |
| 1.1.x | 3.1.5 | 3.1.5 updated the reporting endpoint to have the same result as running it in the CLI. Starkiller 1.1.x uses that reporting endpoint for the reporting tab |
| 1.2.x | 3.2.0 | 3.2.0 added an endpoint for users that is needed for the UI updates introduced in Starkiller 1.2.0
| 1.3.x | 3.3.0 | 3.3.0 categorized all of the modules in Empire with corresponding [MITRE techniques](https://attack.mitre.org/techniques/enterprise/)
| 1.4.x, 1.5.x | 3.5.0 | 3.5.0 added real-time notifications for new listeners and agents
| 1.6.x, 1.7.x | 3.7.0 | 1.6.0 was tested against Empire 3.7.0. There _shouldn't_ be any breaking changes, but there were a lot of code changes.
| 1.8.x | 4.0.0 |
| 1.9.x, 1.10.x, 1.11.x | 4.1.0 | The updated agent screen requires new endpoints in order to update fields on the 'view' tab
| 2.0.x, 2.1.x | 5.0.0 | Uses the new v2 api
| 2.2.x, 2.3.x | 5.2.0 | Requires the new plugin task endpoints
| 2.4.x | 5.5.0 | For sponsors, requires the checkin endpoints
| 2.5.x | 5.6.0 | Requires the tags endpoints
| 2.6.x | 5.7.0 | Requires the user avatar endpoints and fixes for the agent task socketio events

## Changelog

Detailed changes for each release are documented in the [changelog](./CHANGELOG.md).

## Stay In Touch

- [Twitter](https://twitter.com/bcsecurity1)
- [Blog](https://bc-security.org/blog)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2021 BC Security
