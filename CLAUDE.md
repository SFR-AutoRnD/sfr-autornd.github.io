# Repository guidance for Claude Code

## Never credit Claude as a contributor

Claude must not appear as a contributor to this repository in any form. This
applies to every commit, merge, and pull request made from a Claude Code
session (terminal, desktop, or cloud/web).

- Do not add a `Co-Authored-By: Claude ...` trailer, or any trailer with a
  `noreply@anthropic.com` address, to a commit message.
- Do not add a `Claude-Session:` trailer or any other Claude or Anthropic
  attribution line to a commit message.
- Do not author or commit as `Claude <noreply@anthropic.com>`. Cloud sessions
  ship with that as the default git identity, so set the author and committer
  explicitly to the GitHub user running the session (look it up with the
  GitHub `get_me` tool, or ask), for example:
  `git -c user.name="Name" -c user.email="verified@email" -c commit.gpgsign=false commit ...`
- Do not sign commits with the container's signing key; pass
  `-c commit.gpgsign=false`.
- Do not add "Generated with Claude Code" or a session link to pull request
  titles or descriptions.

`.claude/settings.json` in this repository switches Claude Code's built-in
commit and pull request attribution off. This note exists so the rule holds
even where that setting is not applied.

The full history was rewritten on 2026-09-06 to remove Claude from every
earlier commit (author, committer, and trailers). Keep it that way.
