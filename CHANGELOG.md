# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [Unreleased]
- More notification types: mute, block, message, channel, channel_subscription, token, user. See "Example Objects" of [App Stream docs](https://pnut.io/docs/api/how-to/app-streams).
- Add `silent` property to Notification. Not all notifications (eg. user) need to be user visible.



## [1.0.2] - 13-07-2017
### Changed
- Functions using parameters with `object_types` keys now use camelCase `objectTypes`. Parameters are converted to snake_case for API.
- Added `'use-strict';` to top of `.js` files.
- Added `engines` key to `package.json` to specify compatible `node` and `npm` versions.

### Added
- Added `CHANGELOG.md`.
- Added `LICENSE` (MIT).

### Removed
- `test` folder from `.gitignore`.



## [1.0.1] - 12-07-2017
### Changed
- Added `repository`, `keywords`, `bugs` keys to `package.json`.
- Added Github syntax highlighting to `README.md`.
- Minor fixes to stupid mistakes in `README.md`.

### Added
- Added `README.md`.



## [1.0.0] - 12-07-2017
### Added
- Initial commit
