# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2020-07-20
- Upgrade to Vuetify 2.3.0
- Fix the Empire compatability popup
- Add the ability to manually add credentials
- Add copy to clipboard functionality to username and password on credentials list

## [1.3.0] - 2020-07-09
- Fixed a bug with clearing the autocomplete on the execute module page
- Added MITRE techniques to the modules list page
- Added MITRE techniques to the execute module page
- Lots of dependency upgrades

## [1.2.4] - 2020-07-04
- Move external fonts (icons + google font) to internal dependencies to allow for offline use (https://github.com/BC-SECURITY/Starkiller/issues/34)
- Change title of login url field
- Make the use of http/https prefixes in the empire url optional. Will default to https if no prefix provided

## [1.2.3] - 2020-05-24
- Fix a bug that didn't allow 0 values when creating listeners, stagers
- Updated agent tab ui to have centered tabs
- Kill agent from the list view now works

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
