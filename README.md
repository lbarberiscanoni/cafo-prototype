- [ ] I think the icon for “Church” should be grey, not white in the legend
- [ ] Add "Massachusets" to the regional place
- [ ] Review the data mapping for the regions

Questions for Leah 
- [ ] "Your Next Steps" link
- [ ] Request missing data link
- [ ] for the historic view, The legend color coding should be green for positive, orange for negative? “Waiting For Adoption” is green and negative
    - The color logic is contextual — for some metrics, a decrease is good (green) and an increase is bad (orange), and vice versa. Currently:
        `Children in Care: < 0 = green (fewer kids in care = good) — correct
        Licensed Homes: > 0 = green (more homes = good) — correct
        Waiting For Adoption: < 0 = green (fewer kids waiting = good) — correct
        Reunification Rate: > 0 = green (higher rate = good) — correct
        Family Preservation Cases: > 0 = green (more cases = good) — correct
        The logic is actually correct already — it uses domain-aware coloring where green = positive outcome, not positive number. For "Waiting For Adoption", a negative number (fewer children waiting) is the positive outcome, so it's green when negative.`



Here are the states that don't have counties (e.g. regions and districts). Here are customizations
    - `Alabama: Date should be displayed for 2022, also in historic data
    - Alaska: District
    - Connecticut: Region
    - DC: Let's create a county page for DC, with the metrics card
    - New Hampshire: District
    - South Dakota: District Office
    - Vermont: District Office
    - Washington: Region
    - Wisconsin: Date should be displayed for 2022, also in historic data`


[Here are the CAFO Data Sources](https://docs.google.com/document/d/13Bq8yKjXXIynwdoOgY4efEtfI7M72JxQsLBlxl6WTWc/edit?tab=t.0)

Here are the counties/states with active network connections:

**Networks with Connection Lines (2+ orgs):**

| Network | State | County | # Orgs | URL to Test |
|---------|-------|--------|--------|-------------|
| Weld County Collaboration | CO | Weld/Larimer/Arapahoe | 4 | `#/state/colorado/organizational` |
| Okaloosa County Collaboration | FL | Okaloosa | 3 | `#/state/florida/organizational` |
| Kosciusko County Collaboration | IN | Kosciusko | 3 | `#/state/indiana/organizational` |
| Maury County Collaboration | TN | Maury | 2 | `#/state/tennessee/organizational` |
| Highlands County Collaboration | FL | Highlands | 2 | `#/state/florida/organizational` |
| Lowndes County Collaboration | GA | Lowndes | 2 | `#/state/georgia/organizational` |
| York County Collaboration | ME | York | 2 | `#/state/maine/organizational` |
| Upshur County Collaboration | WV | Upshur | 2 | `#/state/west-virginia/organizational` |

**Best for testing:**
- **Colorado** - Weld County Collaboration has 4 orgs spread across 3 counties (most complex)
- **Florida** - Has 2 networks (Okaloosa + Highlands)
- **Indiana** - Kosciusko has 3 orgs all in Warsaw

**Networks with only 1 org (no lines yet):**
- Wake County (NC), Douglas County (NE), Polk County (IA), Clark County (NV)