# Security

Volt runs entirely on the device. There is no backend, no account and no network request: your data is a SQLite file and a media folder inside the app's private storage, and it only leaves the phone when you export it through the share sheet.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting: **Security** tab → **Report a vulnerability**. You will get an answer as soon as possible, usually within a week.

Only the latest release is supported.

## Scope

In scope: anything that lets another app, a crafted media file or an imported file read or alter your data, code execution, and dependency vulnerabilities with a real impact on the app.

Out of scope: issues that require a rooted device or physical access to an unlocked phone.
