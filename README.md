- [ ] Find another icon for the population to be more consistent
    - [this one requires attribution](https://thenounproject.com/icon/people-7979311/)
- [ ] Make organization dots clickable on the national org view so clicking pulls up the appropriate organization in the bottom panel.
- [ ] Add organization descriptions to the national org view by next week.
    - [ ] Look into using ChatGPT to generate one-liner descriptions for each organization based on their names/websites, probably by writing a script to do it one time
- [ ] Set up connections between organizations at the national level.
- [ ] Filter out counties with no data from the homepage, but bring back county selection at the org level if there is data (even if no organizations).
    - [ ] Add a call to action for counties with no data, prompting users to contact local organizations to help populate data.
- [ ] try to use the Noun Project icon (with screenshot or attribution) and finalize once Leah confirms purchase/attribution.
- [ ] Display null values as 'NA' or null instead of defaulting to zero.
- [ ] Revamp the state-level metrics view to match the national metrics view layout (per Figma), but at the state level.
    - [ ] For national and state-level metrics views, update cards to put icons on the side and have the big number as a title, matching Figma.
- [ ] Fix the trends under the national metrics view (spacing issue).
- [ ] Update the historic view to use real data instead of test data and make the x-axis dynamic.
- [ ] Identify which counties have a network for easier testing of network rendering.
- [ ] Fix issue where some purple (placement agency) organizations remain visible after all organization categories are removed.
- [ ] Take a look at the county-level rendering of organizations, specifically investigate Weld County, Colorado, for possible bugs.
- [ ] Set up a periodic (e.g., daily) function to download updated data from Google Sheets and rerun the data pipeline.

[Here are the CAFO Data Sources](https://docs.google.com/document/d/13Bq8yKjXXIynwdoOgY4efEtfI7M72JxQsLBlxl6WTWc/edit?tab=t.0)