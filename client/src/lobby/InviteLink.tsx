import { useEffect, useState } from 'react'

/**
 * "Copy invite link", beside the room code in the waiting room: the link a
 * friend opens to land in this room (`/?room=CODE`, which the landing page's
 * join box also accepts pasted whole). Before it, sharing a room meant
 * reading the code out or copying the address bar. Where the clipboard isn't
 * available (an insecure origin), the link is shown to copy by hand.
 */
export function InviteLink({ roomId }: { readonly roomId: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const link = `${window.location.origin}/?room=${roomId}`

  useEffect(() => {
    if (state !== 'copied') return
    const t = window.setTimeout(() => setState('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [state])

  const copy = () => {
    if (!navigator.clipboard) {
      setState('manual')
      return
    }
    navigator.clipboard.writeText(link).then(
      () => setState('copied'),
      () => setState('manual'),
    )
  }

  return (
    <span className="invite-link">
      <button type="button" onClick={copy}>
        {state === 'copied' ? '✓ Link copied' : 'Copy invite link'}
      </button>
      {state === 'manual' ? (
        <input
          className="invite-link-text"
          readOnly
          value={link}
          aria-label="Invite link"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
        />
      ) : null}
    </span>
  )
}
