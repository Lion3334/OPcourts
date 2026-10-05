# Next Steps

1. **Check the live site on a real phone and desktop (suggested):** headless screenshots looked right, but nobody has viewed the shipped version on an actual iPhone yet. Check the native date wheel, the animation and Perry's peek.
2. **Fit the title on one line on phones (suggested):** "OP Court Availability" wraps at 390px. A small font-size step under 440px would fix it.
3. **Decide on more umbrellas at Perry's on desktop (suggested):** the vertical sign leaves room for one umbrella row. Options: no letter gaps, or a horizontal sign on wide screens.
4. **Confirm the scheduled runs keep updating (suggested):** check that the 4am/6pm PT runs keep committing fresh `courts.json` and redeploying. GitHub pauses scheduled workflows after 60 days without repo activity, though the daily data commits should prevent that.
5. **Update GitHub Actions versions (suggested):** run logs warn about Node 20 deprecation. Bump the actions before the runner change forces it.
6. **Fill in README.md (suggested):** replace the placeholder URL and describe the API-based setup and the design files.
7. **Handle city API changes gracefully (suggested):** if a court ID ever disappears, the whole update run fails and the old data stays up. Consider skipping a single bad court and flagging it.
