# Family Secret Santa: Christmas 2026

Live at https://www.avivarma.ca/secret-santa/

## For the family

Open the page, tap your name, press **Draw a name**. That's it.

## For the organiser

1. Open `/admin/` (the small "Organiser" link at the bottom of the family page).
2. Enter everyone's names. Mark couples with "can't draw" if they already buy for each other.
3. Set the budget, exchange date and an optional note, then press **Put names in the hat**.
4. **Download family.json**, open https://github.com/avias8/secret-santa/upload/main, drop the file in and commit.
5. About a minute later the family page shows everyone's names.

Publish before anyone draws. Publishing again makes a brand-new draw, so anyone who already drew would get a different name.

## How it guarantees nobody is drawn twice

GitHub Pages can't keep shared state between phones, so the draw is made in advance on the organiser page:

- Names are unique; a duplicate (ignoring case) is refused.
- Each recipient is taken from the pool once and removed, so every name is drawn exactly once and nobody draws themself. Randomness comes from `crypto.getRandomValues`.
- `Santa.verify` re-checks the finished draw before it can be downloaded.
- The organiser never sees the pairs, so they can take part too.
- On the family page, "Draw" plays a shuffle and lands on that person's pre-drawn name. Drawing again on the same phone shows the same name.

Recipients are stored scrambled and padded to the same length in `family.json`, so peeking at the file doesn't give anything away. It isn't real encryption, though. Anyone could tap someone else's name, so it runs on family trust.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Family page: pick your name, draw |
| `admin/index.html` | Organiser page: names, rules, draw, export |
| `family.json` | This year's draw, uploaded by the organiser (absent until then) |
| `app.js` | Draw, check, scrambling, helpers |
| `style.css` | Shared styles, light and dark |

## Run locally

```powershell
python -m http.server 8000
```
