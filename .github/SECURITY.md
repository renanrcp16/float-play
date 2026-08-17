# Security Policy

## Supported versions

FloatPlay supports the latest publicly released Chrome Web Store version.

Before the first public release, security reports concerning the current release candidate or `main` are welcome when they could affect the upcoming public version.

Older versions are not guaranteed to receive security fixes unless a separate support commitment is announced.

## Reporting a vulnerability

Please do **not** disclose suspected vulnerabilities through public GitHub issues, pull requests, discussions, or other public channels.

Use GitHub's **Private Vulnerability Reporting** for this repository:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Provide the affected version or commit, reproduction steps, expected impact, and any useful logs or proof-of-concept details.

If the private-reporting control is temporarily unavailable, do not publish the vulnerability details publicly. Contact the maintainer through the contact information linked from the maintainer's GitHub profile and request a private reporting channel.

## What to expect

Reports will be reviewed and triaged based on reproducibility, impact, and whether the affected behavior is within FloatPlay's supported scope.

When a report is confirmed, the preferred process is to develop and validate the fix privately, coordinate disclosure when appropriate, and publish the corrected extension before exposing details that would unnecessarily put users at risk.

Please avoid accessing data that is not yours, degrading third-party services, or performing destructive testing while investigating a vulnerability.

## Security scope

Useful reports include vulnerabilities involving FloatPlay's extension privileges, Chrome storage, extension pages, content-script boundaries, same-tab YouTube bridge, release package, or other behavior introduced by FloatPlay.

Issues that exist entirely in Chrome, YouTube, or another third-party extension and are not caused or meaningfully worsened by FloatPlay should generally be reported to the relevant upstream project instead.
