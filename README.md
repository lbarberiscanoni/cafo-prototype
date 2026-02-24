- [ ] Church data comes from the county-level MTE data, not AFCARS. So it's not in the national dataset — but it could be aggregated from all the counties, same way the state records aggregate their counties' church counts. 
- [ ] "Your Next Steps" button in TopNav — A new nav item between "Home" and "National Map View" that links to an exit page with CTAs/recommended next steps. She doesn't have the destination URL or page yet — she's going to send that.
- [ ] Caption text on the embed card "Brought to you by More Than Enough". Test the look on Codepen
- [ ] Add form link to "data missing want to rquest it". This would be just for the county metrics view and county org view.
- [ ] on the metrics page we are going to have a "what does this mean" metrics guide. This is for the county metrics view. Try adding an actual line "what does this data mean?" and it downloads [this PDF](https://docs.google.com/document/d/1h4nw_B2xA2sPHO7jODee_geUKeEbwk3oV3nzL32emZ0/edit?tab=t.0#heading=h.lhvv1cgj8bwi)
- [ ] Change titles to “Number of Children in Care,” “Number of Family Preservation Cases,” “Number of Children Waiting For Adoption,” etc. Basically add “Number of” everywhere except for Family Reunification Rate (%), but add the word “Biological Family Reunification Rate (%)”
- [ ] for the historic view, The legend color coding should be green for positive, orange for negative? “Waiting For Adoption” is green and negative
- [ ] Make sure the title spacing (for example at the county org view) needs to be compressed. 
- [ ] Also change “Bridge” to “Bridge Organization” in Organization Categories
- [ ] Let’s change “View Full Profile” to “Visit Website”
- [ ] I think the icon for “Church” should be grey, not white in the legend
- [ ] in the Nav Bar, I feel like there is an extra space between “National” and “Map” and “State” and “Map”
- [ ] on the home page, Can we also shorten the “Select a county” bar because it’s a lot longer than the names of the counties?
- [ ] On teh home page, move the explore the map closer to the bar
- [ ] on county metrics view, make the first card equal width to the other cards
- [ ] "Boston Region" > "Boston Region County"
- [ ] Add "Massachusets" to the regional place
- [ ] Review the data mapping for the regions




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