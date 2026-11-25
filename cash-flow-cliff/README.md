# Cash-flow Cliff: fictional teaching scenarios

[Play Cash-flow Cliff](https://cash-flow-cliff.surge.sh/) or download the [free offline teaching kit](https://cash-flow-cliff.surge.sh/cash-flow-cliff-kit.zip). Release: **25 November 2026**.

A business can finish a month with cash in the bank while an earlier bill remains unfunded. These three invented Australian-dollar scenarios let learners test that timing problem. This folder contains the calculation engine, source data, worked CSV ledgers, chart, educator guide and tests. The interactive interface is hosted at the game link above.

All businesses, payment dates and amounts are fictional. This educational material is separate from the observed business-survival statistics elsewhere in this repository. It is not representative Australian business data or a borrowing recommendation.

## Check the calculations

With Node.js 22 or later, run `node --test engine.test.mjs` from this directory. The tests cover the three baseline results, daily cash movements, deposit conservation, payments beyond day 30, cent rounding, malformed inputs and 3,366 delay/deposit combinations.

The baseline late-customer example opens at A$5,000. It pays A$6,000 on day 7, receives A$15,000 on day 10, then pays A$4,000 on day 14 and A$2,000 on day 21. Its minimum is minus A$1,000; it closes at A$8,000. Delaying that receipt by 15 days deepens the gap to A$7,000 while preserving the same closing cash.

Deposits bring part of a receipt forward and reduce its later balance. They do not create revenue. Receipts beyond day 30 remain pending and are excluded from closing cash. Extra opening cash is hypothetical money already available, with no assumed borrowing source. Same-day movements are netted; intraday shortages are not modelled. Negative balances indicate unfunded gaps, not available overdrafts. Closing cash is not profit.

## Teach and reuse

The [educator guide](https://cash-flow-cliff.surge.sh/educator-guide.html) gives a ten-minute exercise. [scenarios.json](scenarios.json) records the scenarios and assumptions. The two CSV files contain 31 daily rows each, including opening day 0. [cash-flow-cliff-editorial.svg](cash-flow-cliff-editorial.svg) compares the original and delayed late-customer examples.

Code and documentation are MIT licensed. Original fictional scenario data are CC0. See [LICENSE.txt](LICENSE.txt). No promotional backlink is required. Third-party material retains its own rights.

## Context and publisher

The [Australian Government cash-flow statement guide](https://business.gov.au/finance/cash-flow/set-up-a-cash-flow-statement) supports the general cash-flow principles, not the invented figures. [SMB Loan’s working-capital research](https://smbloan.com.au/research/working-capital-by-industry) provides separate contextual reading.

Prepared by Joe, AI assistant at Finofin. SMB Loan is published by Finofin LTD, based in Israel. It is an information publisher, not a lender or broker, and may receive referral fees from Lend. This exercise provides general education; it does not assess an individual’s finances or recommend borrowing. [Commercial disclosure](https://smbloan.com.au/disclaimer).
