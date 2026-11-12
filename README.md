# Reading Australia's 49.2% business survival figure

Prepared by Joe, AI assistant at Finofin, for SMB Loan. November 2026.

Of the 406,365 businesses in the Australian Bureau of Statistics' 2022–23 entry cohort, 199,742 survived to June 2026: 49.2%, rounded to one decimal place. The denominator is that particular entry cohort, rather than all Australian businesses operating today. The figures come from the ABS release *Counts of Australian Businesses, including Entries and Exits*, published on 18 August 2026. [ABS release](https://www.abs.gov.au/statistics/economy/business-indicators/counts-australian-businesses-including-entries-and-exits/jul2022-jun2026).

This repository supplies a short interpretation guide and a reproducible check of SMB Loan's selected CSV. The underlying observations are ABS administrative statistics. SMB Loan selected and presented the figures; it did not survey these businesses. The [business formation and survival atlas](https://smbloan.com.au/research/business-formation-survival-atlas) provides the report, charts and download links.

## What the percentage measures

ABS measures survival through continued activity in its business-register framework. An entry can include a reactivation, so “entry cohort” is more accurate than “new startups”. Exits can reflect closure, sale, restructuring or a business leaving the statistical scope. They do not identify insolvency alone. Administrative reporting can also lag actual activity. [ABS methodology](https://www.abs.gov.au/methodologies/counts-australian-businesses-including-entries-and-exits-methodology/jul2022-jun2026).

The scope covers actively trading market-sector businesses, including larger firms. It excludes government and certain other sectors, and is narrower than the population of all registered ABN holders.

The 49.2% figure therefore cannot tell a reader how many businesses were profitable, paid their owners adequately or could service a new loan. Those questions require other evidence. Subtracting the survival percentage from 100 does not produce an insolvency rate. Nor is this a current annual failure rate or an estimated probability for someone starting a business now.

Employment groups use their starting classification in the survival tables. Non-employing entrants had 44.6% survival, compared with 70.6% for entrants with 20–199 employees. Those differences do not establish that hiring staff causes survival. Employment size also does not describe legal structure: “non-employing” should not be relabelled “sole trader”. The 200-plus group contained only 69 entrants, so its 78.3% result deserves that denominator beside it.

## Check the counts before comparing groups

In the [original ABS workbook](https://www.abs.gov.au/statistics/economy/business-indicators/counts-australian-businesses-including-entries-and-exits/jul2022-jun2026/8165DC01.xlsx), Table 3 cells B26, G26 and H26 contain the national entrant count, survivor count and published rate. Table 6 repeats those national values in row 15. For Western Australia, row 10 records 37,310 entrants and 19,113 survivors, or 51.2%.

The rounded WA and national rates differ by 2.0 percentage points. That descriptive comparison does not adjust for the mix of businesses. ABS assigns multi-location businesses to one geography; the table does not count every operating location separately. Keep the cohort, endpoint and classification consistent before interpreting a regional difference.

The [SMB Loan CSV](https://smbloan.com.au/research-data/business-survival-atlas-june-2026.csv) contains 36 selected rows across industry, state and employment dimensions. They describe overlapping views of the same cohort. Adding all rows would count businesses repeatedly. Employment rows also include a “Total employing” subtotal as well as its component groups. A spreadsheet should filter to one dimension and distinguish categories from subtotals before calculating anything further.

## Reproduce the CSV checks

Python 3.9 or later is sufficient; no packages or account are required. Download and inspect the public CSV explicitly:

```sh
python verify_survival.py --download
```

Or check a file you have already downloaded:

```sh
python verify_survival.py --csv business-survival-atlas-june-2026.csv
```

The site's hosting can challenge automated downloads. The live command encountered that response during the 13 November check; use the browser download and `--csv` route if it happens. The locally downloaded 36-row release passed every check.

The script checks the schema, 36-row edition, duplicate category keys, source references, counts and every percentage. It reports a SHA-256 fingerprint and explains the overlapping totals. It rejects HTML challenge pages. These checks verify arithmetic and documented reference values, not the underlying administrative records or every transcription against the workbook. See [source provenance](provenance.json) for the original-cell checks and [rights notes](RIGHTS.md) before reuse.

SMB Loan is an information publisher operated by Finofin LTD, not a lender or broker. It may receive referral fees from Lend. Joe is an AI assistant; this note does not claim independent expert review or provide a borrowing recommendation. [Publisher and commercial disclosure](https://smbloan.com.au/disclaimer).
