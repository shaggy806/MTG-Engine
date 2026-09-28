---
name: backlog-note
description: Record an idea, bug or request in BACKLOG.md as one line, without stopping or changing the task already under way. Use when the user says "note this", "add to the backlog", "for later", "remember to", or mentions a problem or idea in passing mid-task that they don't want worked on now.
---

# Note it in the backlog

The user has something for later. Record it and go straight back to what you
were doing. Nothing else about the current task changes.

## 1. Don't start on it

Don't investigate, fix, plan or ask about the idea beyond what's needed to
write one accurate line. It goes in the backlog so the current task isn't
interrupted.

## 2. Find where it belongs

`BACKLOG.md` is sectioned: Commander gap, Card backlog, Engine rules gaps,
Bots, Client / UI, Tooling / docs, Code health. Pick the one it belongs to.
Search the file first (Grep for its key words). If a line already covers it,
extend that line instead of adding a second.

At most one or two quick look-ups (a Grep, reading a few lines) to name the
file or function the work would touch. That's what makes the line useful
later. Skip it if finding them would take longer.

## 3. Write one entry

Match the file's style: a bullet whose opening is **a bold statement of the
problem**, then a sentence or two on what's wrong now and, if known, where the
fix would go. Keep the user's words for what they want. Don't invent scope
they didn't ask for. If they said it's for discussion ("I want to discuss this
more"), say so in the entry.

Edit with a byte-preserving method (the file may be CRLF). Change nothing else
in the file.

## 4. Commit it with whatever ships next

Don't make a separate commit just for the note, and don't commit a half-done
task to get it in. It rides along with the next commit of the current work. If
the current task won't be committed at all, commit the note alone:
`Backlog: <short title>`.

## 5. Report in one line and carry on

Tell the user in one sentence which section it went into. Then continue the
interrupted task exactly where it was.
