# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2021-08-29
- Reimplement splitpanes on agent page with a new library
- Fix broken refresh button on agent list page
- Update "View" tab on agents page to display agent properties in a more readable manner and allow for updating fields like name, sleep, kill date, etc
- Add a "validate" step to listener creation so that 2-step listeners like onedrive will work
- CredID Autocomplete shows previews of the creds instead of just the numeric ids
- Zip folders from the file browser menu for Powershell agents
- Upload files from the file browser menu

## [1.8.0] - 2021-06-28
- Refactor all forms pages for new 4.0 features
  - Autosuggestions for fields with `suggestedValues` and `strict`
  - Switches for "boolean" fields
  - A multi-select for `bypasses` field where relevant
  - On listeners page, a dropdown select for malleable listeners
- Use last seen time instead of check in time on agents list page
- Dynamic columns on the agents list page
- New 'Copy' feature for Listeners, Stagers, and Credentials
- Edit and Delete Credentials
- Better table formatting on all list pages
- Links to listeners from agents and stagers pages
- Better error handling for routing to resources that have been deleted and server connection errors
- Add a 'StarkillerName' field on stagers for better identification
- Remove dependency on "toast" library, better control over formatting
- "getResults" for agents utilizes a 4.0 query parameter for better performance by only retrieving what has been recently updated and appending to the page
- Added a UI "pulse" when a new result shows up on the agents page
- Default size of the Starkiller window is now maximum
- Add default localhost URL for brand new installs
- Use the new socketio topic for async plugin notifications
- Add a feature to settings for clearing local storage
- New top bar to show action buttons and better utilize screen real estate
- New component abstractions to eliminate duplicate code
- Add chat widget from the sponsors version (15 sponsor goal)
- Mega dependency upgrades including Electron 6->13
- Removed electron-icon-builder as a direct dependency since it was directly breaking ARM builds

## [1.7.0] - 2021-03-01
- Thank you to our generous sponsors! The file browser is now available to the Kali/Public builds of Starkiller.
- Renaming an agent no longer redirects the user to the list page
- Listeners, stagers, and module forms now have descriptions next to each field where applicable
- Checkbox on agents list page to hide stale agents. Persists through refreshes and page chages
- Agent list page refactoring to make the page more responsive to smaller widths.
- Add a button to the stagers page to delete all stagers.

## [1.6.0] - 2021-01-18
- Added a plugin list page and a plugin execution page
- Added upload/download functionality to the agent page
- Converted agents page to be left-right instead of top-bottom
- Lots of code refactoring on agents

## [1.5.1] - 2020-12-26
- Removed socket notifications from popout windows.
- Minor dependency changes.

## [1.5.0] - 2020-11-23
- Added popout windows for agents. Now you can work on and get live updates from multiple agents at one time.

## [1.4.0] - 2020-10-12
- Added real-time notifications new listeners and agents [#49](https://github.com/BC-SECURITY/Starkiller/pull/49) 

## [1.3.2] - 2020-07-29
- "Listener" option on modules now shows up as a dropdown instead of a textfield
- Correct some of the "cannot read property data of undefined" errors
- Add a page to execute a single module across multiple agents
- Fix bug with similarly named modules presenting the wrong options

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
