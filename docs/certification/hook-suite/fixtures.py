"""
Executable fixture corpus for agent-output-gauntlet's Stop hook.

Every fixture here was derived from what tests/validation-tests.md (H1-H9)
actually enumerates, plus the defects found during the 2026-08-12 certification
audit. The point of this file is that the fixture COUNT is produced by running
it, not asserted in prose. Whatever `run.py` reports is the real number.

Fixture fields:
  id      unique slug
  test    H1..H9, or "AUDIT" for defects found during certification
  name    human description
  records list of transcript records (dicts are JSON-encoded; str is written raw)
  expect  "block" or "allow"
  env     extra environment for the hook process
  stdin   override the hook's stdin JSON entirely (default: transcript + flags)
  active  value for stop_hook_active (default False)
  xfail   None, or a string naming the open defect this fixture currently hits

xfail semantics: the fixture asserts the CORRECT behaviour. If it fails, that is
the known defect and the run stays green. If it PASSES, the defect was fixed and
the marker must be removed — run.py reports that as XPASS and exits non-zero.
"""


# ----------------------------------------------------------------- builders

def tool(name, **inp):
    return {"type": "assistant", "message": {"role": "assistant", "content": [
        {"type": "tool_use", "name": name, "input": inp or {}}]}}


def bash(cmd):
    return tool("Bash", command=cmd)


def text(s):
    return {"type": "assistant", "message": {"role": "assistant", "content": [
        {"type": "text", "text": s}]}}


def user(s):
    return {"type": "user", "message": {"role": "user", "content": [
        {"type": "text", "text": s}]}}


def turn(*blocks):
    """One assistant message carrying several content blocks, in order."""
    return {"type": "assistant", "message": {"role": "assistant", "content": list(blocks)}}


def tblock(name, **inp):
    return {"type": "tool_use", "name": name, "input": inp or {}}


def xblock(s):
    return {"type": "text", "text": s}


GOOD_VERDICT = ("VERDICT: PASS\n"
                "Receipts: ran the suite, 12/12 green, reproduced on real input")

FIXTURES = []


def add(id, test, name, records, expect, env=None, stdin=None, active=False, xfail=None):
    FIXTURES.append(dict(id=id, test=test, name=name, records=records,
                         expect=expect, env=env or {}, stdin=stdin,
                         active=active, xfail=xfail))


# ------------------------------------------------- H1: unaudited ship blocks
# The 26 MCP mutation tools H1 names. (H1 says "26"; this enumeration is what
# its prose actually lists. run.py reports the count it finds.)
H1_MUTATION_TOOLS = [
    "mcp__n8n__add_data_table_rows", "mcp__n8n__publish_workflow",
    "mcp__Airtable__update_records_for_table", "mcp__Airtable__create_field",
    "mcp__Docusign__createEnvelope", "mcp__Docusign__triggerWorkflow",
    "mcp__Docusign__sendReminder", "mcp__Gmail__trash_thread",
    "mcp__Gmail__label_message", "mcp__Gmail__untrash_thread",
    "mcp__Gmail__unmark_message_spam", "mcp__Notion__notion-update-page",
    "mcp__Notion__notion-create-database", "mcp__Notion__notion-move-pages",
    "mcp__Google_Drive__create_file", "mcp__Manufact__invite_org_member",
    "mcp__Lovable__set_project_visibility", "mcp__Miro__board_trash",
    "mcp__Vercel__buy_domain", "mcp__Vercel__buy_pro",
    "mcp__Blotato__blotato_buy_credits", "mcp__Canva__edit-design",
    "mcp__Miro__comment_reply", "mcp__Docusign__pauseNewWorkflowInstances",
    "mcp__Docusign__resumeWorkflow", "mcp__Lovable__remix_project",
    "mcp__n8n_Knowledge__code_execution",
]
for t in H1_MUTATION_TOOLS:
    add("h1-mut-" + t.rsplit("__", 1)[-1], "H1", "mutation tool blocks: " + t,
        [tool(t)], "block")

# All 7 MCP-prefixed deploy forms.
H1_DEPLOY_TOOLS = [
    "mcp__Vercel__deploy_to_vercel", "mcp__Lovable__deploy_project",
    "mcp__Netlify__netlify-deploy-services-updater", "mcp__Manufact__deploy",
    "mcp__Manufact__redeploy", "mcp__Deplixo__deplixo_deploy",
    "mcp__Supabase__deploy_edge_function",
]
for t in H1_DEPLOY_TOOLS:
    add("h1-deploy-" + t.rsplit("__", 1)[-1], "H1", "deploy form blocks: " + t,
        [tool(t)], "block")

add("h1-verb-outranks-status", "H1",
    "mutation verb outranks the _status read-veto", [tool("create_deployment_status")], "block")


# ------------------------------------------- H2: read-only work must NOT block
H2_ALLOW = [
    "get_deployment", "list_deployments", "netlify-deploy-services-reader",
    "get_deployment_runtime_logs", "search_workflows", "get_project",
    "editforge_status", "vidiq_job_poll", "list_records_for_table",
    "validate_workflow", "get_table_schema", "ping", "predeploy_check",
    "predeployment_validate",
    # read verbs sitting AFTER a vendor prefix
    "blotato_list_posts", "blotato_get_credits", "image_get_upload_url",
    "notion-list-shared-pages", "table_get_latest_update_history",
]
for t in H2_ALLOW:
    add("h2-allow-" + t, "H2", "read-only allows: " + t, [tool(t)], "allow")

H2_BUILTINS = ["TodoWrite", "Write", "Edit", "NotebookEdit", "SendUserMessage",
               "SendUserFile", "SendMessage", "CronCreate", "CronDelete",
               "TaskStop", "TaskCreate", "DesignSync", "Read", "Grep", "Glob",
               "WebSearch"]
for t in H2_BUILTINS:
    add("h2-builtin-" + t, "H2", "Claude Code built-in allows by default: " + t,
        [tool(t)], "allow")

for t in ["Write", "Edit", "NotebookEdit"]:
    add("h2-strict-" + t, "H2", "STRICT=1 makes local writes ship-worthy: " + t,
        [tool(t)], "block", env={"GAUNTLET_HOOK_STRICT": "1"})


# ------------------------------------- H3: only a real assistant verdict clears
SHIP = tool("mcp__Vercel__deploy_to_vercel")

add("h3-no-verdict", "H3", "ship with no verdict", [SHIP], "block")
add("h3-verdict-no-receipts", "H3", "VERDICT: without Receipts:",
    [SHIP, text("VERDICT: PASS")], "block")
add("h3-ship-after-verdict", "H3", "a newer ship after a verdict",
    [SHIP, text(GOOD_VERDICT), SHIP], "block")
add("h3-verdict-in-user-turn", "H3", "verdict echoed in a user message",
    [SHIP, user(GOOD_VERDICT)], "block")
add("h3-blank-template", "H3", "the skill's own blank verdict template",
    [SHIP, text("VERDICT: PASS / PASS-WITH-CONDITIONS / QUARANTINE\n"
                "Receipts: <what was actually run>")], "block")
add("h3-fenced", "H3", "verdict inside a fenced code block",
    [SHIP, text("```\n" + GOOD_VERDICT + "\n```")], "block")
add("h3-indented", "H3", "verdict inside an indented block",
    [SHIP, text("    VERDICT: PASS\n    Receipts: ran the suite, 12/12 green here")], "block")
add("h3-lowercase", "H3", "lowercase prose 'verdict: pass'",
    [SHIP, text("verdict: pass\nreceipts: ran the suite and it was green")], "block")
add("h3-placeholder-receipts", "H3", "placeholder-only receipts",
    [SHIP, text("VERDICT: PASS\nReceipts: <tests run, values rechecked>")], "block")
add("h3-html-comment", "H3", "HTML comment (invisible when rendered)",
    [SHIP, text("<!-- " + GOOD_VERDICT + " -->")], "block")
add("h3-details", "H3", "<details> body (collapsed by default)",
    [SHIP, text("<details><summary>x</summary>\n" + GOOD_VERDICT + "\n</details>")], "block")
add("h3-unclosed-fence", "H3", "unclosed fence swallows the rest",
    [SHIP, text("```\n" + GOOD_VERDICT)], "block")
add("h3-nested-fence", "H3", "``` cannot close ````",
    [SHIP, text("````\n```\n" + GOOD_VERDICT + "\n```")], "block")
add("h3-mismatched-fence", "H3", "mismatched ``` / ~~~",
    [SHIP, text("~~~\n" + GOOD_VERDICT + "\n```")], "block")
add("h3-junk-receipts-x", "H3", "junk receipts (xxxxxxxx)",
    [SHIP, text("VERDICT: PASS\nReceipts: xxxxxxxxxxxx")], "block")
add("h3-junk-receipts-dots", "H3", "junk receipts (........)",
    [SHIP, text("VERDICT: PASS\nReceipts: ....................")], "block")
add("h3-passport", "H3", "VERDICT: PASSPORT renewal shipped (substring)",
    [SHIP, text("VERDICT: PASSPORT renewal shipped\n"
                "Receipts: ran the suite, 12/12 green, reproduced on input")], "block")
add("h3-negated", "H3", "VERDICT: this does NOT PASS review (negated)",
    [SHIP, text("VERDICT: this does NOT PASS review\n"
                "Receipts: ran the suite, 12/12 green, reproduced on input")], "block")
add("h3-verdict-earlier-same-turn", "H3",
    "verdict emitted earlier in the SAME turn than the mutation",
    [turn(xblock(GOOD_VERDICT), tblock("mcp__Vercel__deploy_to_vercel"))], "block")
add("h3-real-verdict", "H3", "a real verdict allows",
    [SHIP, text(GOOD_VERDICT)], "allow")
for i, r in enumerate([
        "p95 <200ms across the run, reproduced on staging input",
        "mailed <ops@example.com>, confirmed receipt, suite green 12/12",
        "rendered <div class=card> correctly, checked against the fixture"]):
    add("h3-angle-receipts-%d" % i, "H3", "receipts containing angle brackets allow",
        [SHIP, text("VERDICT: PASS\nReceipts: " + r)], "allow")


# ------------------------------------------- H4: cannot brick or loop a session
add("h4-stop-hook-active", "H4", "stop_hook_active true allows", [SHIP], "allow", active=True)
add("h4-stop-hook-active-string", "H4",
    "the STRING 'false' must not disable enforcement", [SHIP], "block", active="false")
add("h4-malformed-record", "H4", "malformed JSON record",
    ["{not json at all", SHIP], "block")
add("h4-missing-transcript", "H4", "missing transcript file allows", [], "allow",
    stdin='{"transcript_path":"/nonexistent/path/xyz.jsonl","stop_hook_active":false}')
add("h4-empty-stdin", "H4", "empty stdin allows", [], "allow", stdin="")
add("h4-non-json-stdin", "H4", "non-JSON stdin allows", [], "allow", stdin="not json")
add("h4-kill-switch", "H4", "GAUNTLET_HOOK_DISABLE=1 allows", [SHIP], "allow",
    env={"GAUNTLET_HOOK_DISABLE": "1"})


# ------------------------------------------------- H5: poison-pill isolation
POISON = ["[]", "[1,2]", '"x"', "5", "null", "true",
          '{"type":"assistant","message":"not-a-dict"}',
          '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":123}]}}',
          '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":{"a":1}}]}}',
          '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":["a"]}]}}']
for i, p in enumerate(POISON):
    add("h5-poison-%d" % i, "H5",
        "one malformed record must not abandon the scan: " + p[:40],
        [p, SHIP], "block")

# Built as a raw JSON string, not a Python object: json.dumps would hit the
# recursion limit in THIS process before the hook ever saw it.
_DEEP = ('{"type":"assistant","message":{"role":"assistant","content":'
         '[{"type":"tool_use","name":"some_tool","input":'
         + '{"a":' * 1200 + 'null' + '}' * 1200 + '}]}}')
add("h5-deep-nesting", "H5", "~1200-deep nested tool argument (RecursionError)",
    [_DEEP, SHIP], "block")


# ------------------------------- H6: bash matches commands, not prose about them
H6_BLOCK = [
    "git -C /repo push", "git --git-dir=/r/.git push",
    "env GIT_SSH_COMMAND='ssh -i k' git push", "VERCEL_TOKEN=xyz vercel --prod",
    "sudo -u deploy git push", 'eval "git push"', "bash -c 'git push'",
    "bash -c $'git push'", "bash <<'EOF'\ngit push\nEOF", "bash <<< 'git push'",
    "echo main | xargs -I{} git push origin {}", "`git push`", "$(git push)",
    "nohup git push &", "time git push", "timeout 30 git push",
    "nice -n 10 git push", "stdbuf -o0 git push", "env -i PATH=/bin git push",
    ">/dev/null git push", "command git push", "/usr/bin/git push",
    "{ git push; }", "for r in a b; do git push $r; done",
    "if true; then git push; fi", "doas git push", "git \\\n  push",
    "npx vercel --prod", "pnpm dlx vercel --prod", "npm exec vercel --prod",
    "aws s3 sync ./dist s3://bucket --delete", "docker push registry/img:tag",
    "gcloud run deploy svc --image img", "wrangler deploy",
    "supabase db push", "psql -c 'DELETE FROM users'",
    "ssh prod 'systemctl restart web'", "rm -rf /var/tmp/build",
    "curl -X POST https://api.example.com/v1/things",
    "terraform apply -auto-approve", "kubectl apply -f k8s/",
    "kubectl delete deployment web", "kubectl rollout restart deploy/web",
    "gh release create v1.0.0", "netlify deploy --prod", "npm publish",
]
for i, c in enumerate(H6_BLOCK):
    add("h6-block-%02d" % i, "H6", "ship command blocks: " + c[:60].replace("\n", "\\n"),
        [bash(c)], "block")

H6_ALLOW = [
    "cat > doc.md <<'EOF'\ngit push\nEOF", "tee doc.md <<'EOF'\ngit push\nEOF",
    "echo 'step 1; git commit -am msg'", 'echo "CI runs: npm test; git push is manual"',
    "git status", "vercel dev", "vercel --version", "vercel projects ls",
    "vercel link", "vercel pull", "cat vercel.json", "grep -rn vercel src/",
    "ls -la .vercel", "npx vercel --help",
]
for i, c in enumerate(H6_ALLOW):
    add("h6-allow-%02d" % i, "H6", "prose/rehearsal allows: " + c[:60].replace("\n", "\\n"),
        [bash(c)], "allow")

H6_SHORTFLAG = [
    ("curl -X POST https://api.example.com -H 'Content-Type: application/json'", "block"),
    ("psql -h db -c 'DELETE FROM users'", "block"),
    ("kubectl delete deployment web -n production", "block"),
    ("git commit -n -m x && git push", "block"),
    ("git push origin main # --dry-run", "block"),
    ("git push --dry-run", "allow"),
]
for i, (c, e) in enumerate(H6_SHORTFLAG):
    add("h6-shortflag-%d" % i, "H6", "short-flag veto collision: " + c[:60], [bash(c)], e)


# --------------------------------- H7: the read-veto must not exempt mutations
H7 = [("create_deployment_status", "block"),
      ("mcp__GitHub__create_deployment_status", "block"),
      ("update_deployment_status", "block"),
      ("publish_deployment_status", "block"),
      ("predeploy_check", "allow"),
      ("predeployment_validate", "allow"),
      ("redeploy_service", "block"),
      ("mcp__Manufact__redeploy", "block")]
for t, e in H7:
    add("h7-" + t.rsplit("__", 1)[-1], "H7", "read-veto ranking: " + t, [tool(t)], e)


# ------------------------------------------- H8: schema drift is announced
add("h8-schema-drift", "H8",
    "5+ parsed records, 0 assistant turns -> warn on stderr, allow",
    ['{"kind":"other","n":%d}' % i for i in range(6)], "allow")


# =====================================================================
# AUDIT — defects found during the 2026-08-12 certification.
# Each asserts the CORRECT behaviour and is marked xfail against the open
# defect. When one starts passing, delete its xfail marker.
# =====================================================================

for t in ["mcp__github__push_files", "mcp__github__fork_repository"]:
    add("audit-invisible-" + t.rsplit("__", 1)[-1], "AUDIT",
        "real remote-write tool must block: " + t, [tool(t)], "block",
        xfail="MUTATION_VERBS omits 'push' and 'fork' (hook:93-102)")

for t in ["mcp__Context7__resolve-library-id", "mcp__Canva__resolve-shortlink",
          "mcp__Wispr_Flow__resolve_share_link", "mcp__Miro__comment_list_comments",
          "mcp__Adobe_for_creativity__asset_resolve_short_url"]:
    add("audit-crywolf-" + t.rsplit("__", 1)[-1], "AUDIT",
        "read-only tool must not block: " + t, [tool(t)], "allow",
        xfail="'resolve'/'comment' are mutation verbs and MUTATION_HEAD_RE "
              "outranks the read veto (hook:99,128-139)")

add("audit-documented-verdict-shape", "AUDIT",
    "a verdict in the shape SKILL.md:70-81 documents must clear the gate",
    [SHIP, text("```\n" + GOOD_VERDICT + "\n```")], "allow",
    xfail="SKILL.md prints the mandatory output shape inside a fence, and "
          "strip_code deletes fenced blocks - a correct audit reads as unaudited")

add("audit-coached-bypass", "AUDIT",
    "the escape the hook's own block message coaches must NOT clear the gate",
    [SHIP, text("VERDICT: PASS\n"
                "Receipts: reviewed the change, nothing was actually shipped here")],
    "block",
    xfail="hook:521-524 tells the model to write exactly this to stop")

add("audit-contentfree-receipts", "AUDIT",
    "content-free receipts must NOT clear the gate",
    [SHIP, text("VERDICT: QUARANTINE\nReceipts: looked at things and considered them")],
    "block",
    xfail="has_real_verdict only checks length/charset/word-count (hook:386-397)")

for i, c in enumerate(['"git" push', "g''it push", 'gi""t push',
                       "git p''ush", "X=git; $X push"]):
    add("audit-quotesplice-%d" % i, "AUDIT",
        "quote-splice evasion must block: " + c, [bash(c)], "block",
        xfail="one-character quote splicing defeats command-position matching "
              "(hook:241-305)")

add("audit-peel-bound", "AUDIT",
    "33 stacked env assignments must not exhaust the peel bound",
    [bash("A=1 " * 33 + "git push")], "block",
    xfail="the 32-peel bound (hook:297) is a silent bypass")
