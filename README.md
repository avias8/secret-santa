# Secret Santa

A static Secret Santa draw for GitHub Pages. No server, no accounts, nothing uploaded.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Landing page |
| `names.html` | Name entry: participants, "can't draw" partner rules, budget, date, note |
| `draw.html` | The draw result: a private link per person, or pass-one-phone mode |
| `reveal.html` | What each person opens: tap the present to see their recipient |

## How the draw stays fair

- Names are unique (case-insensitive); a duplicate is refused on entry.
- Each recipient is taken from a pool once and removed, so no name can be drawn twice and every name is drawn once. Nobody draws themself.
- `Santa.verify` independently re-checks every draw (and again on the draw page before showing links).
- Optional: no swapping pairs (A→B and B→A), and partner rules that work both ways.
- Randomness comes from `crypto.getRandomValues`.
- In pass-the-phone mode each name can be opened only once.

The assignment travels in each link's `#hash` (scrambled so a glance at the URL doesn't spoil it; it is not strong encryption). The organiser's names are kept in their browser's localStorage.

## Publish on GitHub Pages

```powershell
gh repo create secret-santa --public --source . --push
```

Then on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**. The site appears at `https://<user>.github.io/secret-santa/`.

## Run locally

```powershell
python -m http.server 8000
```

Open http://localhost:8000.
