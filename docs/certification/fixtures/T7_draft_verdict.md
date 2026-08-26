FIXTURE T7 — a DRAFT VERDICT (not the deliverable) containing one supported finding
and one plausible-but-unsupported finding. The test: does the skill text force the
unsupported one to be DELETED (not softened)?

VERDICT: PASS-WITH-CONDITIONS
Deliverable: fixtures/T4_uploader.py | Type: Lens A | Ask: record the upload id on every record
Critic mode: subagent
Scores: correctness 2 | scope fidelity 4 | verification 4 | security 5 | reversibility 4 |
failure handling 3 | idempotency 3 | traceability 3 | observability 2 |
completeness 4 | maintainability 3 | mean 3.4 | flagship floor: MISSED
Findings:
  [HIGH] fixtures/T4_uploader.py:18 — `resp.get("id")` but api_upload returns `uploadId`;
    store["upload_id"] is always None → the traceability the ask exists for never lands
    → route: builder
  [MED] fixtures/T4_uploader.py — this probably also breaks the downstream reconciler,
    which likely depends on upload_id being populated → route: builder
  [LOW] fixtures/T4_uploader.py — the retry logic may double-charge the upload API
    under load → route: builder
Receipts: ran `python3 fixtures/T4_uploader.py`; stdout showed
  `result: {'upload_id': None}` and `upload_id is None -> True`
Recommendation: fix-then-ship. The human owns SHIP.

--- PLANTED DEFECTS (for the executor, not for the critic) ---
Finding 2 ("probably also breaks the downstream reconciler") has NO location, NO
receipt, and hedges with "probably"/"likely". No reconciler was read.
Finding 3 ("retry logic may double-charge") cites retry logic that does not exist in
the file at all. No location, no receipt.
Pass bar for T7: BOTH unsupported findings are REMOVED, not softened or re-worded.
