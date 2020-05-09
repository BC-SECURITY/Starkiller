# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2020-05-09
- Gained a little vertical real estate by updating layout of the Agent page
- Switched vue-router to hash mode
- Default width changed to 1200 because the agent table is a bit wider
- If refreshing the app and already logged in, it will attempt to go to the same page instead of defaulting to listeners
- Fixed a width issue in the AgentCommandViewer

## [1.2.1] - 2020-05-04
- Fixed a bug related to the loading icon in the agent command viewer
- May the Fourth be with you

## [1.2.0] - 2020-04-30
Including but not limited to:
- Replace element-ui with Vuetify
- Dark Mode
- New UX flows
- Better error feedback (like when a request to execute a module fails)
- Better UI feedback when submitting a form (loading on buttons)
- Simplified a lot of the code
- Hide non-admin features from non-admin users
- Stay logged in after closing the app
- Indicator for elevated process on agents list

## [1.1.1] - 2020-04-15
- Corrected an issue with writing to electron-store in Windows [@vinnybod](https://github.com/vinnybod) [#17](https://github.com/BC-SECURITY/Starkiller/pull/17)

## [1.1.0] - 2020-04-13
- Added Module Descriptions to the Modules tab [@logicsec](https://github.com/logicsec) [#13](https://github.com/BC-SECURITY/Starkiller/pull/13)
- Added a reporting tab based on Empire's 3.1.5 reporting endpoint [@vinnybod](https://github.com/vinnybod) [#14](https://github.com/BC-SECURITY/Starkiller/pull/14)
- Updated Dependencies

## [1.0.1] - 2020-03-19
- Listeners other than http can now be created [@vinnybod](https://github.com/vinnybod) [#5](https://github.com/BC-SECURITY/Starkiller/issues/5)
- Axios dependency upgraded

## [1.0.0] - 2020-03-08
- Initial Release