# Airtable Package Versions

A Github action that will parse your `composer.lock` and submit all packages (and their versions) to Airtable.

## Setup
```yml
name: Airtable

on:
  workflow_dispatch:
  schedule:
    - cron: '12 5 * * *'
  
permissions:
  contents: read

jobs:
  package-versions:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        
      - name: Parse Versions
        uses: zero1limited/airtable-magento-packages@main
        with:
          apiKey: ${{ secrets.AIRTABLE_API_KEY }}
          base: ${{ vars.AIRTABLE_BASE }}
          site: ${{ vars.AIRTABLE_SITE }}
```

**Configuration**
- `apiKey` this is a Api Token or Personal Access Token granted by Airtable
- `base` this the base ID in Airtable
- `site` a human description of the project this is running against. (You could run this action for multiple project, with a different site, i.e "Client A" and "Client B")

**Prerequisite**
- You need a _table_ in Airtable called **Versions**
- The **Versions** _table_ needs at least 3 columns:
  - `Site` (any text type)
  - `Package` (any text type)
  - `Version` (any text type)
  (other columns will not be touched, though the row will be removed if the package is no longer installed)

