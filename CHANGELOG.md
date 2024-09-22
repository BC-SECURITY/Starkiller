# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Added** for new features.
**Changed** for changes in existing functionality.
**Deprecated** for soon-to-be removed features.
**Removed** for now removed features.
**Fixed** for any bug fixes.
**Security** in case of vulnerabilities.

## [Unreleased]

## [2.8.2] - 2024-09-22

### Added

-   Added request for job/task list from agents
-   Added Route4Me to sponsorship section

### Fixed

-   Fixed agent id not being automatically set in terminal

## [2.8.1] - 2024-05-05

### Fixed

-   Fixed issue where plugin task responses were not being displayed

## [2.8.0] - 2024-04-08

### Added

-   Added completed, error, continuous statuses to taskings

## [2.7.3] - 2024-02-22

### Added

-   Added buttons to reload sysinfo to agents pages
-   Add info button on View tab to clarify what options do

### Changed

-   Removed extra space being added in front of Task Input and Output by append/prepend new line
-   Changed default sort on agents page to be "first seen" instead of "last seen"

## [2.7.2] - 2024-01-31

### Fixed

-   Deleting agent from the action menu on the table now works

## [2.7.1] - 2023-12-03

### Changed

-   Remove Interactive Agent Shell from README

## [2.7.0] - 2023-11-15

### Added

-   Add agent dropdown when Agent is a field in a form
-   Add auto-refresh on Agents / Agents Tasks page
-   Add auto-refresh on Plugins Tasks page

### Changed

-   Migrate from Vuex to Pinia

### Fixed

-   Fix form dropdowns getting out of sync with reality by refreshing the store on load
-   Making edits to an Agent on the 'View' tab now properly updates the parent Agent page
-   Updating an agent's name no longer refreshes the page on submit
-   After updating a stager, the download/clipboard of the stager now reflects the changes without requiring the page to be reloaded

### Removed

-   Remove unused AgentCommandViewer component

## [2.6.1] - 2023-09-25

-   Make notification bell menu scrollable with a max height
-   Fix the Listener buttons overflowing out of the toolbar

## [2.6.0] - 2023-09-17

-   Add an Agent terminal to the Interact tab
    -   Run modules and shell commands from a terminal-like interface
-   Add Prettier for code formatting
-   Add user avatar uploads to the settings page, use the avatars in the chat widget
-   Add a notification page and notification bell
    -   Most notifications that were previously showing in the bottom corner will now show up in the notification bell
    -   Agent task results now show up as notifications
    -   Can subscribe/unsubscribe to specific agent notifications

## [2.5.3] - 2023-08-24

-   Fix elevated process icon on agent page
-   Fix input and output downloads not working

## [2.5.2] - 2023-08-09

-   Update the github issue templates to use forms
-   Fix listener name update showing up on the list page
-   Fix stager deletion from the ellipses menu
-   Use a listener dropdown for RedirectListener on hop listeners

## [2.5.1] - 2023-08-02

-   Add a DateTimeDisplay component

## [2.5.0] - 2023-07-25

-   Downgrade sass to fix vuetify errors
-   Fix credential dropdown on DynamicFormInput
-   Refactor advanced filtering expansion panels to common components
-   Refactor a bunch of the list pages so they use a shared component and adds the advanced filtering
-   Refactor agent task api endpoints to another file
-   Modules page has a lot of filtering options now
-   Tag Management
    -   Add a reusable Tag Manager component
    -   Works on Listeners, Agents, Agent Tasks, Plugin Tasks, Credentials, and Downloads
-   Display Empire version on the sidenav

## [2.4.3] - 2023-07-21

-   Fix issue with agent and plugin tasks table not loading

## [2.4.2] - 2023-07-20

## [2.4.1] - 2023-07-06

-   Fix issue with bypasses not loading on form pages
-   Fix issue with agent rename
-   Fix tooltips on agent page not displaying
-   Add ansi formatting to plugin and agent tasks
-   Refactor plugin task table to match agent task table
-   Dependency updates
-   Add options to settings page for reloading profiles, modules, bypasses, and plugins

## [2.4.0] - 2023-06-10

-   Turn on auto-refresh for the agent page by default
-   Refactoring Agent Task components
-   Add preview of Sponsor dashboard feature
-   Move malleable profiles under listeners
-   Make agent id clickable from tasks table
-   Fix issue with navigating to login page when already logged in

## [2.3.2] - 2023-05-22

-   Some improvements to the release flow

## [2.3.1] - 2023-05-22

## [2.3.0] - 2023-05-17

-   Add a script import button to the agent page
-   Add a script command checkbox to the agent page
-   Modules with a 'file' type option now get a file selector/uploader instead of a text box

## [2.2.0] - 2023-03-31

-   Move Agent Tasks under the Agents page
-   Add a Plugin Tasks view under the Plugins page
-   Add a Plugin Tasks view under the Plugin Execution page

## [2.1.1] - 2023-03-29

## [2.1.0] - 2023-03-01

-   Hide the module checkboxes if the module is not selected
-   ESLint update - allow unused vars that start with an underscore

## [2.0.5] - 2023-02-20

-   Update the GitHub actions to remove usages of deprecated ::set-output function

## [2.0.4] - 2023-02-14

-   Add warnings when clipboard copy fails
-   Use module_id instead of module_slug for agent task endpoint

## [2.0.3] - 2023-02-04

## [2.0.2] - 2023-02-04

## [2.0.1] - 2023-02-04

-   Small tweaks to the Agents UI. Fix scroll on the agents view tab
-   Auto-merge `private-main` to downstream `main` branches using a label

## [2.0.0] - 2023-01-14

-   Added an obfuscation page to manage keyword obfuscation and global obfuscation
-   Added the ability to view archived (deleted) agents
-   Added advanced filtering to the reporting page
-   Added warning on agent page for modules that are not opsec safe
-   Added the ability to turn listeners on and off
-   Added the ability to modify listener options
-   Added a button the Listener View top bar that prefills a stager form with the listener's id
-   Added a downloads page
-   Added a "literal" checkbox to shell commands to bypass built-in aliases
-   Added the ability to configure bypasses language
-   Added options for ignoring the check for elevated permissions and the agent language version when executing a module
-   Sort file browser correctly
-   Updated "InfoViewer" component to display the description up top, format the comments better, and display the new author info added in Empire 5.0
-   Technique chips can now link to sub-techniques
-   Rename Reporting to Tasks
-   Upgrade Dependencies
-   Migrate from Webpack to Vite
-   Update all -api files to use v2 api
-   General UI changes
-   Reporting page and agent task page more performant utilizing server-side pagination and sorting provided by the v2 api. Option to expand input, download inputs, outputs, joined downloads, and view images
-   Upgrade stager storage to utilize server side storage with the new v2 api
-   Remove Electron. Starkiller is now a plain old web app!
-   Remove agent command viewer sidebar in favor of the tasks tab
-   Removed API Token from settings, since the v2 api uses JWT

## [1.12.0] - 2022-12-17

-   New CI/CD Process (@vinnybod)

## [1.11.0] - 2022-03-15

-   Added malleable profile management pages (Thank you to our Sponsors!)
    -   Create, delete, edit, and view malleable profiles

## [1.10.0] - 2022-02-14

-   Added bypass management pages (Thank you to our Sponsors!)
    -   Create, delete, edit, and view bypasses

## [1.9.0] - 2021-08-29

-   Reimplement splitpanes on agent page with a new library
-   Fix broken refresh button on agent list page
-   Update "View" tab on agents page to display agent properties in a more readable manner and allow for updating fields like name, sleep, kill date, etc
-   Add a "validate" step to listener creation so that 2-step listeners like onedrive will work
-   CredID Autocomplete shows previews of the creds instead of just the numeric ids
-   Zip folders from the file browser menu for Powershell agents
-   Upload files from the file browser menu

## [1.8.0] - 2021-06-28

-   Refactor all forms pages for new 4.0 features
    -   Autosuggestions for fields with `suggestedValues` and `strict`
    -   Switches for "boolean" fields
    -   A multi-select for `bypasses` field where relevant
    -   On listeners page, a dropdown select for malleable listeners
-   Use last seen time instead of check in time on agents list page
-   Dynamic columns on the agents list page
-   New 'Copy' feature for Listeners, Stagers, and Credentials
-   Edit and Delete Credentials
-   Better table formatting on all list pages
-   Links to listeners from agents and stagers pages
-   Better error handling for routing to resources that have been deleted and server connection errors
-   Add a 'StarkillerName' field on stagers for better identification
-   Remove dependency on "toast" library, better control over formatting
-   "getResults" for agents utilizes a 4.0 query parameter for better performance by only retrieving what has been recently updated and appending to the page
-   Added a UI "pulse" when a new result shows up on the agents page
-   Default size of the Starkiller window is now maximum
-   Add default localhost URL for brand new installs
-   Use the new socketio topic for async plugin notifications
-   Add a feature to settings for clearing local storage
-   New top bar to show action buttons and better utilize screen real estate
-   New component abstractions to eliminate duplicate code
-   Add chat widget from the sponsors version (15 sponsor goal)
-   Mega dependency upgrades including Electron 6->13
-   Removed electron-icon-builder as a direct dependency since it was directly breaking ARM builds

## [1.7.0] - 2021-03-01

-   Thank you to our generous sponsors! The file browser is now available to the Kali/Public builds of Starkiller.
-   Renaming an agent no longer redirects the user to the list page
-   Listeners, stagers, and module forms now have descriptions next to each field where applicable
-   Checkbox on agents list page to hide stale agents. Persists through refreshes and page chages
-   Agent list page refactoring to make the page more responsive to smaller widths.
-   Add a button to the stagers page to delete all stagers.

## [1.6.0] - 2021-01-18

-   Added a plugin list page and a plugin execution page
-   Added upload/download functionality to the agent page
-   Converted agents page to be left-right instead of top-bottom
-   Lots of code refactoring on agents

## [1.5.1] - 2020-12-26

-   Removed socket notifications from popout windows.
-   Minor dependency changes.

## [1.5.0] - 2020-11-23

-   Added popout windows for agents. Now you can work on and get live updates from multiple agents at one time.

## [1.4.0] - 2020-10-12

-   Added real-time notifications new listeners and agents [#49](https://github.com/BC-SECURITY/Starkiller/pull/49)

## [1.3.2] - 2020-07-29

-   "Listener" option on modules now shows up as a dropdown instead of a textfield
-   Correct some of the "cannot read property data of undefined" errors
-   Add a page to execute a single module across multiple agents
-   Fix bug with similarly named modules presenting the wrong options

## [1.3.1] - 2020-07-20

-   Upgrade to Vuetify 2.3.0
-   Fix the Empire compatability popup
-   Add the ability to manually add credentials
-   Add copy to clipboard functionality to username and password on credentials list

## [1.3.0] - 2020-07-09

-   Fixed a bug with clearing the autocomplete on the execute module page
-   Added MITRE techniques to the modules list page
-   Added MITRE techniques to the execute module page
-   Lots of dependency upgrades

## [1.2.4] - 2020-07-04

-   Move external fonts (icons + google font) to internal dependencies to allow for offline use (<https://github.com/BC-SECURITY/Starkiller/issues/34>)
-   Change title of login url field
-   Make the use of http/https prefixes in the empire url optional. Will default to https if no prefix provided

## [1.2.3] - 2020-05-24

-   Fix a bug that didn't allow 0 values when creating listeners, stagers
-   Updated agent tab ui to have centered tabs
-   Kill agent from the list view now works

## [1.2.2] - 2020-05-09

-   Gained a little vertical real estate by updating layout of the Agent page
-   Switched vue-router to hash mode
-   Default width changed to 1200 because the agent table is a bit wider
-   If refreshing the app and already logged in, it will attempt to go to the same page instead of defaulting to listeners
-   Fixed a width issue in the AgentCommandViewer

## [1.2.1] - 2020-05-04

-   Fixed a bug related to the loading icon in the agent command viewer
-   May the Fourth be with you

## [1.2.0] - 2020-04-30

Including but not limited to:

-   Replace element-ui with Vuetify
-   Dark Mode
-   New UX flows
-   Better error feedback (like when a request to execute a module fails)
-   Better UI feedback when submitting a form (loading on buttons)
-   Simplified a lot of the code
-   Hide non-admin features from non-admin users
-   Stay logged in after closing the app
-   Indicator for elevated process on agents list

## [1.1.1] - 2020-04-15

-   Corrected an issue with writing to electron-store in Windows [@vinnybod](https://github.com/vinnybod) [#17](https://github.com/BC-SECURITY/Starkiller/pull/17)

## [1.1.0] - 2020-04-13

-   Added Module Descriptions to the Modules tab [@logicsec](https://github.com/logicsec) [#13](https://github.com/BC-SECURITY/Starkiller/pull/13)
-   Added a reporting tab based on Empire's 3.1.5 reporting endpoint [@vinnybod](https://github.com/vinnybod) [#14](https://github.com/BC-SECURITY/Starkiller/pull/14)
-   Updated Dependencies

## [1.0.1] - 2020-03-19

-   Listeners other than http can now be created [@vinnybod](https://github.com/vinnybod) [#5](https://github.com/BC-SECURITY/Starkiller/issues/5)
-   Axios dependency upgraded

## [1.0.0] - 2020-03-08

-   Initial Release

[Unreleased]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.8.2...HEAD

[2.8.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.8.1...v2.8.2

[2.8.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.8.0...v2.8.1

[2.8.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.7.3...v2.8.0

[2.7.3]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.7.2...v2.7.3

[2.7.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.7.1...v2.7.2

[2.7.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.7.0...v2.7.1

[2.7.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.6.1...v2.7.0

[2.6.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.6.0...v2.6.1

[2.6.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.5.3...v2.6.0

[2.5.3]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.5.2...v2.5.3

[2.5.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.5.1...v2.5.2

[2.5.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.5.0...v2.5.1

[2.5.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.4.3...v2.5.0

[2.4.3]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.4.2...v2.4.3

[2.4.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.4.1...v2.4.2

[2.4.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.4.0...v2.4.1

[2.4.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.3.2...v2.4.0

[2.3.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.3.1...v2.3.2

[2.3.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.3.0...v2.3.1

[2.3.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.2.0...v2.3.0

[2.2.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.1.1...v2.2.0

[2.1.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.1.0...v2.1.1

[2.1.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.5...v2.1.0

[2.0.5]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.4...v2.0.5

[2.0.4]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.3...v2.0.4

[2.0.3]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.2...v2.0.3

[2.0.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.1...v2.0.2

[2.0.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v2.0.0...v2.0.1

[2.0.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.12.0...v2.0.0

[1.12.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.11.0...v1.12.0

[1.11.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.10.0...v1.11.0

[1.10.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.9.0...v1.10.0

[1.9.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.8.0...v1.9.0

[1.8.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.7.0...v1.8.0

[1.7.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.6.1...v1.7.0

[1.6.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.6.0...v1.6.1

[1.6.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.5.1...v1.6.0

[1.5.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.5.0...v1.5.1

[1.5.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.4.0...v1.5.0

[1.4.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.3.2...v1.4.0

[1.3.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.3.1...v1.3.2

[1.3.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.3.0...v1.3.1

[1.3.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.2.4...v1.3.0

[1.2.4]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.2.3...v1.2.4

[1.2.3]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.2.2...v1.2.3

[1.2.2]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.2.1...v1.2.2

[1.2.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.2.0...v1.2.1

[1.2.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.1.1...v1.2.0

[1.1.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.1.0...v1.1.1

[1.1.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.0.1...v1.1.0

[1.0.1]: https://github.com/BC-SECURITY/Starkiller-Sponsors/compare/v1.0.0...v1.0.1

[1.0.0]: https://github.com/BC-SECURITY/Starkiller-Sponsors/releases/tag/v1.0.0
