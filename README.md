# Family Secret Santa: Christmas 2026

Live at https://www.avivarma.ca/secret-santa/

## For the family

Open the page, tap your name tag, press **Draw a name**. Until the organiser closes the hat, the page shows who's in so far.

## For the organiser: `/admin/`

The organiser page is a live list. Every name you add or remove saves straight to the site.

**One-time setup on your device:** create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) with
*Repository access → Only select repositories → `secret-santa`* and *Permissions → Contents → Read and write*, then paste it into the page.
It's stored only in that browser ("Disconnect this device" forgets it).

Then:
1. Add everyone's names (paste a list to add many at once). Mark couples with the ♥ selector so they don't draw each other.
2. Open **Details** for budget, date and a note.
3. When everyone's in, press **Close the hat & draw**.

Changing the list after the draw cancels it (the page asks first). Anyone who already drew would then need to draw again.

## How it guarantees nobody is drawn twice

GitHub Pages can't share live state between phones, so the draw happens once, on the organiser page, and is saved into `family.json`:

- Names are unique; a duplicate (ignoring case) is refused.
- Each recipient is taken from the pool once and removed, so every name is drawn exactly once and nobody draws themself. Randomness comes from `crypto.getRandomValues`.
- `Santa.verify` re-checks the finished draw before it's saved.
- The organiser never sees the pairs, so they can take part too.
- On the family page, "Draw" plays a shuffle and lands on that person's pre-drawn name. Drawing again on the same phone shows the same name.

Each save sends the file version it last read. If someone else saved in between, GitHub refuses the save; the page then re-reads the list and re-applies its change.

Recipients are stored scrambled and padded to the same length. It isn't real encryption, though: anyone could tap someone else's name, so it runs on family trust.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `family.css` | Family page: gift tags, pick your name, draw |
| `admin/index.html` | Organiser page: live names list, couples, details, draw |
| `family.json` | The live list and draw (created by the organiser page) |
| `app.js` | Draw, check, scrambling, GitHub save, helpers |
| `style.css` | Organiser page styles, light and dark |

## Run locally

```powershell
python -m http.server 8000
```
