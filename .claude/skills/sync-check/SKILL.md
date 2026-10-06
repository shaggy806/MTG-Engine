---
name: sync-check
description: Report whether this checkout matches what is pushed to the remote, without pulling. Use when the user sits down at a different machine (PC vs laptop), asks whether they need to pull or push, asks if they are up to date / in sync / behind / ahead, wonders whether work from the other machine has landed, or asks whether the build is stale after switching machines.
---

# Sync check

Answers one question: **is it safe to start working in this checkout, or is there
state on the remote (or on the other machine) that I would clobber or miss?**

This repo gets worked on from two machines. The point of this skill is to replace
"pull every time out of superstition" with a factual report, so a pull only happens
when there is something to pull.

## The one thing that matters

`git status` alone **cannot** answer this. `origin/main` is a local cache ref, and
without a fetch it reflects whenever the last network operation happened — possibly
days ago, possibly before the other machine pushed. **Always `git fetch` first.**
The script below does.

## Run this

One Bash call. Do not split it up:

```bash
cd "$(git rev-parse --show-toplevel)" || exit 1
git fetch --quiet --all 2>&1 | head -5

BRANCH=$(git rev-parse --abbrev-ref HEAD)
UPSTREAM=$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null)
echo "branch:   $BRANCH"

if [ -z "$UPSTREAM" ]; then
  echo "upstream: NONE — this branch has never been pushed"
else
  echo "upstream: $UPSTREAM"
  COUNTS=$(git rev-list --left-right --count "$UPSTREAM...HEAD")
  echo "behind:   $(echo "$COUNTS" | cut -f1)"
  echo "ahead:    $(echo "$COUNTS" | cut -f2)"
fi

echo "--- uncommitted ---"
git status --porcelain
echo "--- stashes ---"
git stash list
if [ -n "$UPSTREAM" ]; then
  echo "--- incoming (on remote, not here) ---"
  git log --oneline --no-decorate "HEAD..$UPSTREAM" | head -20
  echo "--- outgoing (here, not pushed) ---"
  git log --oneline --no-decorate "$UPSTREAM..HEAD" | head -20
fi

# gh is not installed on the Windows machine; the public REST API needs no auth.
echo "--- open pull requests ---"
REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
curl -s --max-time 15 "https://api.github.com/repos/$REPO/pulls?state=open&per_page=50" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let j;try{j=JSON.parse(s)}catch{console.log("(could not reach GitHub)");return}if(!Array.isArray(j)){console.log("("+j.message+")");return}if(!j.length)console.log("none");for(const p of j)console.log(`#${p.number} ${p.head.ref} -> ${p.base.ref}  ${p.title}  (${p.updated_at.slice(0,10)}${p.draft?", draft":""})`)})'
echo "--- remote branches not merged into main ---"
for b in $(git branch -r --no-merged origin/main | grep -v HEAD); do
  echo "$b  ahead $(git rev-list --count origin/main..$b), behind $(git rev-list --count $b..origin/main), last $(git log -1 --format=%cs $b)"
done

echo "--- build freshness ---"
for w in engine protocol server; do
  s=$(find "$w/src" -name '*.ts' -not -name '*.test.ts' -printf '%T@\n' 2>/dev/null | sort -rn | head -1)
  d=$(find "$w/dist" -name '*.js' -printf '%T@\n' 2>/dev/null | sort -rn | head -1)
  if [ -z "$d" ]; then echo "$w/dist: MISSING"
  elif [ "${s%.*}" -gt "${d%.*}" ]; then echo "$w/dist: STALE"
  else echo "$w/dist: current"; fi
done
```

## Reporting

Lead with the verdict in one line, then only the details that are non-zero. A clean
in-sync checkout should be about two lines total — do not pad it.

| behind | ahead | dirty | verdict |
|---|---|---|---|
| 0 | 0 | no | **In sync.** Safe to start. |
| 0 | 0 | yes | **In sync, uncommitted work here.** List the files. |
| >0 | 0 | no | **Behind.** A clean `git pull` will fast-forward. Name the incoming commits. |
| >0 | 0 | yes | **Behind with local edits.** Pull may conflict — show what is dirty and let the user decide. |
| 0 | >0 | — | **Ahead.** Unpushed work here. Name the commits; this is usually work left behind on this machine. |
| >0 | >0 | — | **Diverged.** Both sides moved. Say so plainly, show both lists, do not pick a strategy unprompted. |

Always surface, when present:

- **Open pull requests.** Cloud sessions push to `claude/…` branches and open PRs rather
  than pushing to `main`, so an open PR is finished work that has not landed here yet. List
  each one (number, title, how many commits ahead and whether it is behind `main`) and say
  whether it would merge cleanly (behind 0 = fast-forward). Do not merge one unprompted.
- **Unmerged remote branches without a PR.** Old `claude/…` branches far behind `main`
  are usually abandoned; name them in one line, do not delete them unprompted.
- **Line-ending-only changes.** If `git diff --stat` shows nothing for files `git status`
  calls modified, it is CRLF/LF churn (often the engine prebuild rewriting generated card
  files) — say so instead of calling it uncommitted work.
- **Stashes.** They are invisible to the other machine and easy to forget about.
- **No upstream.** The branch has never been pushed; work here exists nowhere else.
- **Stale/missing `dist`.** After pulling, `client` will not typecheck against an old
  `engine/dist`. Recommend `npm run build` (engine → protocol → server → client, in that order).
  Note every `dist/` is gitignored, so they are *always* stale on a
  machine that just pulled — this is expected, not a problem, but it does need a build.

## Acting on it

**Report first; do not pull, push, stash or rebase as part of running this skill.**
The whole point is to let the user decide. After reporting, offer the obvious next
step in one line ("want me to pull?"), and act only if they say so.

The one exception: if the user's own request was already explicit ("pull if I'm
behind"), follow it — but still show what changed.
