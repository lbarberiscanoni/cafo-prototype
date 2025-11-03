Commit 1: refactor: consolidate to MetricView
  - Create src/views/MetricView.js
  - Copy County_Metric_View.js as starting point
  - Add regionLevel prop with if/else for differences
  - Update App.js routing for metrics only
  - Delete National_Metric_View.js, State_Metric_View.js, County_Metric_View.js
  
Commit 2: refactor: consolidate to OrganizationalView  
  - Create src/views/OrganizationalView.js
  - Copy County_Organizational_View.js as starting point
  - Add regionLevel prop with if/else for differences
  - Update App.js routing for organizational only
  - Delete old organizational views

Commit 3: refactor: consolidate to HistoricView
  - Create src/views/HistoricView.js
  - Copy County_Historic_View.js as starting point
  - Add regionLevel prop with if/else for differences
  - Update App.js routing for historic only
  - Delete old historic views

- [ ] On the historical view page, I would also enlarge the icons and add the “Select a Metric” drop-down. If you need me to re-share what should be included in each drop-down, let me know