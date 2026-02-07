- [ ] Set up a periodic (e.g., daily) function to download updated data from Google Sheets and rerun the data pipeline.

- [ ] Optimize SEO so that “foster care data for Jefferson county” shows up the app 
    - [ ] Programmatic html site generation for SEO 
- [ ] Historic View
    - [ ] Consider implementing option to download all county data at the state level in one file
        - actually consider making the download it whatever is looking at


- [ ] For the Maps, make it a consistent water-grey and land-white or vice versa
- [ ] Investigate and fix Firefox-specific display issues with the map/legend overlay

- [ ] To metrics page, add county population (file this under the data pipeline)
- [ ] Add sources and date from here. Please make sure the source in the hover-over goes with each state and the source and date of data collection are added. (in the data and sources doc there is a specific definition for each metric under the county)
- [ ] On metrics card, provide an option to navigate to another state and county
Requested edit for CTA re: CTA button placement and footer text for the embed view, see this [loom](https://www.loom.com/share/e73eeb6ad5d84baf9e770f3ee9dd3bc8) and the proposed copy below.
    - Button text: Your Next Steps [Will go to exit CTA page] • Footer sentence for embed card: "This snapshot is powered by More Than Enough, CAFO's US Foster Care Initiative. Visit the full dashboard [hyper link to dashboard] for more data — including data for other counties and states." 
- [ ] Let’s add these family preservation cases to national data -> Last column (https://docs.google.com/spreadsheets/d/1yFrhrOmVBSIzqFyuNBCtwfZD7WcXMihf-vYxZbDOdww/edit?usp=sharing
- [ ] On the national map, let’s make the “Jump to County” field typable
- [ ] There’s still an issue for anything not mapped to counties (e.g. regions and districts). Here are customizations
    - `Alabama: Date should be displayed for 2022, also in historic data
    Alaska: District
    Connecticut: Region
    DC: Let's create a county page for DC, with the metrics card
    New Hampshire: District
    South Dakota: District Office
    Vermont: District Office
    Washington: Region
    Wisconsin: Date should be displayed for 2022, also in historic data`


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