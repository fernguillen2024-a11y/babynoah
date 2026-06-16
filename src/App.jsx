import React, { useState, useMemo } from "react";
import bearImg from "./bear.png";

/* ============================================================
   bitethatthing — Cheater Accountability Tribunal (Front End)
   Single-file React app. Mock data only. Supabase wires in later.

   TUNABLE RULES — your future moderator edits these in one place.
   ============================================================ */
const RULES = {
  VOTES_TO_VERIFY: 25,        // net guilty votes to brand VERIFIED
  VOTES_TO_DISMISS: 15,       // net not-guilty votes to DISMISS a case
  FALSE_REPORTS_TO_TRIAL: 3,  // bad-faith dismissed reports before YOU go on trial
  FORGIVENESS_PASSES: 1,      // honest-mistake passes before penalties bite
  VOTES_TO_BAN_USER: 30,      // net guilty votes on a reporter's own trial = ban
  CRED_START: 50,
  CRED_VERIFY_GAIN: 8,
  CRED_DISMISS_LOSS: 12,
};

// Credibility tiers — drive vote weight and how a case loads
const TIERS = [
  { name: "Unproven", min: 0,  weight: 1.0,  color: "#4a7a9b" },
  { name: "Trusted",  min: 60, weight: 1.5,  color: "#00e676" },
  { name: "Sheriff",  min: 78, weight: 2.0,  color: "#f5c400" },
  { name: "Marshal",  min: 92, weight: 3.0,  color: "#00c2ff" },
];
const tierFor = (c) => [...TIERS].reverse().find((t) => c >= t.min) || TIERS[0];

/* ----------------------- MOCK DATA ----------------------- */
const USERS = {
  bitethatthing: { handle: "bitethatthing", cred: 96, verified: 41, dismissed: 1, falseFlags: 0 },
  saltshooter:   { handle: "saltshooter",   cred: 81, verified: 12, dismissed: 0, falseFlags: 0 },
  no_scope_nan:  { handle: "no_scope_nan",  cred: 64, verified: 4,  dismissed: 1, falseFlags: 0 },
  freshfried:    { handle: "freshfried",    cred: 50, verified: 0,  dismissed: 0, falseFlags: 0 },
  trigger_happy: { handle: "trigger_happy", cred: 29, verified: 1,  dismissed: 3, falseFlags: 2 },
};

const SEED_CASES = [
  {
    id: "c1", alias: "iTzZ_Sweat_TTV", realName: "Brandon Keller",
    streamer: true, reporter: "bitethatthing",
    summary: "Replay shows snap-locking to heads through three structures. Name pulled from match replay roster.",
    evidence: [
      { type: "Replay screenshot", note: "Roster panel showing real name" },
      { type: "Clip", note: "180° flick + instant tag, no spray" },
      { type: "Stat anomaly", note: "98% headshot ratio over 14 elims" },
    ],
    guilty: 31, notGuilty: 2, status: "verified", created: "2d ago",
  },
  {
    id: "c2", alias: "qwfp_zxcv", realName: "unknown — hidden",
    streamer: false, reporter: "saltshooter",
    summary: "Tracking through walls before player rounds corner. Requesting replay help to pull a name.",
    evidence: [{ type: "Clip", note: "Crosshair tracks target behind wall" }],
    guilty: 9, notGuilty: 4, status: "open", created: "6h ago",
  },
  {
    id: "c3", alias: "GodlyAimYT", realName: "Marcus Doyle",
    streamer: true, reporter: "no_scope_nan",
    summary: "Streamer claims 'raw aim' but replay shows aim assist values impossible on KBM. Name on stream overlay matches replay.",
    evidence: [
      { type: "Clip", note: "Lock-on through smoke" },
      { type: "Replay screenshot", note: "Name overlay vs roster match" },
    ],
    guilty: 17, notGuilty: 6, status: "open", created: "1d ago",
  },
  {
    id: "c4", alias: "honest_andy", realName: "Andy Pham",
    streamer: false, reporter: "trigger_happy",
    summary: "Reporter claimed walls. Community review found legible audio cues and normal accuracy. No cheating found.",
    evidence: [{ type: "Clip", note: "Clip actually shows footstep audio read" }],
    guilty: 3, notGuilty: 22, status: "dismissed", created: "3d ago",
  },
];

/* ----------------------- HELPERS ------------------------- */
const net = (c) => c.guilty - c.notGuilty;
const STATUS_META = {
  verified:  { label: "VERIFIED — YELLA", color: "#f5c400" },
  open:      { label: "ON TRIAL", color: "#00c2ff" },
  dismissed: { label: "DISMISSED", color: "#4a7a9b" },
};

/* ======================= APP ============================= */
export default function App() {
  const [route, setRoute] = useState({ name: "home" });
  const [cases, setCases] = useState(SEED_CASES);
  const [voted, setVoted] = useState({}); // caseId -> "guilty"|"notGuilty"
  const me = USERS.bitethatthing;

  const castVote = (id, kind) => {
    if (voted[id]) return;
    setVoted((v) => ({ ...v, [id]: kind }));
    setCases((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const upd = { ...c, [kind]: c[kind] + 1 };
        if (net(upd) >= RULES.VOTES_TO_VERIFY) upd.status = "verified";
        else if (upd.notGuilty - upd.guilty >= RULES.VOTES_TO_DISMISS) upd.status = "dismissed";
        return upd;
      })
    );
  };

  const addCase = (c) => {
    setCases((cs) => [{ ...c, id: "c" + (cs.length + 1), guilty: 0, notGuilty: 0, status: "open", created: "just now", reporter: me.handle }, ...cs]);
    setRoute({ name: "feed" });
  };

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <Nav route={route} setRoute={setRoute} me={me} />
      <main style={S.main}>
        {route.name === "home" && <Home cases={cases} setRoute={setRoute} />}
        {route.name === "feed" && <Feed cases={cases} setRoute={setRoute} />}
        {route.name === "wall" && <Wall cases={cases} setRoute={setRoute} />}
        {route.name === "report" && <Report onSubmit={addCase} onCancel={() => setRoute({ name: "feed" })} />}
        {route.name === "case" && (
          <CaseView c={cases.find((x) => x.id === route.id)} voted={voted[route.id]} castVote={castVote} setRoute={setRoute} />
        )}
        {route.name === "rules" && <RulesPage />}
      </main>
      <Footer setRoute={setRoute} />
    </div>
  );
}

/* ----------------------- NAV ----------------------------- */
function Nav({ route, setRoute, me }) {
  const t = tierFor(me.cred);
  const Item = ({ to, children }) => (
    <button
      className="navlink"
      style={{ ...S.navlink, ...(route.name === to ? S.navlinkActive : {}) }}
      onClick={() => setRoute({ name: to })}
    >
      {children}
    </button>
  );
  return (
    <header style={S.nav}>
      <button style={S.brand} onClick={() => setRoute({ name: "home" })}>
        <img src={bearImg} alt="" style={S.logoMark} />
        <span style={S.brandText}>bitethatthing</span>
      </button>
      <nav style={S.navItems}>
        <Item to="feed">Cases</Item>
        <Item to="wall">Wall of Yella</Item>
        <Item to="rules">The Code</Item>
      </nav>
      <div style={S.navRight}>
        <div style={S.credPill}>
          <span style={{ ...S.tierDot, background: t.color }} />
          <span style={S.credName}>{me.handle}</span>
          <span style={{ ...S.tierLabel, color: t.color }}>{t.name} · {me.cred}</span>
        </div>
        <button className="btn-primary" style={S.btnPrimary} onClick={() => setRoute({ name: "report" })}>
          File a report
        </button>
      </div>
    </header>
  );
}

/* ----------------------- HOME ---------------------------- */
function Home({ cases, setRoute }) {
  const verified = cases.filter((c) => c.status === "verified").length;
  const onTrial = cases.filter((c) => c.status === "open").length;
  return (
    <>
      <section style={S.hero}>
        <div style={S.heroBrand}>EST. BY bitethatthing · A COMMUNITY TRIBUNAL</div>
        <h1 style={S.heroTitle}>
          Catch a cheatin&apos;<br /><span style={S.heroAccent}>cho-mo.</span><br />Earn rewards.
        </h1>
        <p style={S.heroSub}>
          Aimbotters hide behind fake names because they know what they are.
          Pull their real name from the replay, bring the receipts, and let the community
          brand them YELLA. Every verified catch builds your rep — Unproven to Marshal,
          your word carries more weight with every cho-mo you expose.
        </p>
        <div style={S.heroBtns}>
          <button className="btn-primary" style={S.btnPrimaryLg} onClick={() => setRoute({ name: "report" })}>
            Expose a cho-mo
          </button>
          <button className="btn-ghost" style={S.btnGhostLg} onClick={() => setRoute({ name: "wall" })}>
            See the Wall of Yella →
          </button>
        </div>
        <div style={S.statRow}>
          <Stat n={verified} label="branded YELLA" accent />
          <Stat n={onTrial} label="on trial now" />
          <Stat n="1 strike" label="for an honest mistake" />
          <Stat n="permanent" label="when we ban, you're gone" />
        </div>
      </section>

      <section style={S.creed}>
        <h2 style={S.creedTitle}>The deal</h2>
        <div style={S.creedGrid}>
          <Creed n="01" title="Catch the cho-mo" body="Pull their real name from the replay. No evidence, no case — bring a clip, a screenshot, a stat that can't happen clean." />
          <Creed n="02" title="The community judges" body="Players vote guilty or not-guilty. Hit the threshold and the verdict is permanent. One vote per person, no ballot stuffing." />
          <Creed n="03" title="Earn your rewards" body="Every verified catch levels up your rep. Unproven → Trusted → Sheriff → Marshal. Your word carries more weight with each one." />
          <Creed n="04" title="False reports get you cooked" body="Accuse a clean player on purpose and you go on trial yourself. Three strikes and the community votes you out — for good." />
        </div>
      </section>
    </>
  );
}
const Stat = ({ n, label, accent }) => (
  <div style={S.stat}>
    <div style={{ ...S.statNum, ...(accent ? { color: "#b8472f" } : {}) }}>{n}</div>
    <div style={S.statLabel}>{label}</div>
  </div>
);
const Creed = ({ n, title, body }) => (
  <div style={S.creedCard}>
    <div style={S.creedNum}>{n}</div>
    <h3 style={S.creedCardTitle}>{title}</h3>
    <p style={S.creedBody}>{body}</p>
  </div>
);

/* ----------------------- FEED ---------------------------- */
function Feed({ cases, setRoute }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("cred");
  const shown = useMemo(() => {
    let list = cases.filter((c) => filter === "all" || c.status === filter);
    if (sort === "cred") {
      list = [...list].sort((a, b) => (USERS[b.reporter]?.cred || 0) - (USERS[a.reporter]?.cred || 0));
    } else {
      list = [...list].sort((a, b) => net(b) - net(a));
    }
    return list;
  }, [cases, filter, sort]);

  return (
    <div style={S.page}>
      <div style={S.pageHead}>
        <div>
          <h2 style={S.pageTitle}>The docket</h2>
          <p style={S.pageDesc}>Active cases and closed verdicts. Reports from high-credibility players surface first.</p>
        </div>
        <button className="btn-primary" style={S.btnPrimary} onClick={() => setRoute({ name: "report" })}>File a report</button>
      </div>
      <div style={S.filterBar}>
        <div style={S.segGroup}>
          {["all", "open", "verified", "dismissed"].map((f) => (
            <button key={f} className="seg" style={{ ...S.seg, ...(filter === f ? S.segOn : {}) }} onClick={() => setFilter(f)}>
              {f === "open" ? "on trial" : f}
            </button>
          ))}
        </div>
        <div style={S.segGroup}>
          <button className="seg" style={{ ...S.seg, ...(sort === "cred" ? S.segOn : {}) }} onClick={() => setSort("cred")}>by credibility</button>
          <button className="seg" style={{ ...S.seg, ...(sort === "votes" ? S.segOn : {}) }} onClick={() => setSort("votes")}>by votes</button>
        </div>
      </div>
      <div style={S.caseGrid}>
        {shown.map((c) => <CaseCard key={c.id} c={c} onClick={() => setRoute({ name: "case", id: c.id })} />)}
      </div>
    </div>
  );
}

function CaseCard({ c, onClick }) {
  const rep = USERS[c.reporter];
  const repTier = rep ? tierFor(rep.cred) : TIERS[0];
  const meta = STATUS_META[c.status];
  return (
    <button style={S.card} className="card" onClick={onClick}>
      <div style={S.cardTop}>
        <span style={{ ...S.statusTag, color: meta.color, borderColor: meta.color }}>{meta.label}</span>
        {c.streamer && <span style={S.streamerTag}>STREAMER · extra scrutiny</span>}
      </div>
      <div style={S.cardAlias}>{c.alias}</div>
      <div style={S.cardReal}>
        {c.realName.startsWith("unknown") ? <span style={S.hiddenName}>name not yet pulled</span> : <>exposed: <strong>{c.realName}</strong></>}
      </div>
      <p style={S.cardSummary}>{c.summary}</p>
      <div style={S.cardFoot}>
        <span style={S.evCount}>{c.evidence.length} piece{c.evidence.length !== 1 ? "s" : ""} of evidence</span>
        <span style={S.voteMini}>
          <span style={{ color: "#00c2ff" }}>{c.guilty} guilty</span> · <span style={{ color: "#00e676" }}>{c.notGuilty} clear</span>
        </span>
      </div>
      <div style={S.cardReporter}>
        <span style={{ ...S.tierDot, background: repTier.color }} />
        filed by {c.reporter} · <span style={{ color: repTier.color }}>{repTier.name}</span>
      </div>
    </button>
  );
}

/* ----------------------- CASE VIEW ----------------------- */
function CaseView({ c, voted, castVote, setRoute }) {
  if (!c) return <div style={S.page}>Case not found.</div>;
  const rep = USERS[c.reporter];
  const repTier = rep ? tierFor(rep.cred) : TIERS[0];
  const meta = STATUS_META[c.status];
  const total = c.guilty + c.notGuilty;
  const guiltyPct = total ? Math.round((c.guilty / total) * 100) : 0;
  const toVerify = Math.max(0, RULES.VOTES_TO_VERIFY - net(c));

  return (
    <div style={S.page}>
      <button className="btn-ghost" style={S.backBtn} onClick={() => setRoute({ name: "feed" })}>← back to docket</button>
      <div style={S.caseHead}>
        <div>
          <span style={{ ...S.statusTag, color: meta.color, borderColor: meta.color }}>{meta.label}</span>
          {c.streamer && <span style={S.streamerTag}>STREAMER · extra scrutiny</span>}
          <h2 style={S.caseAlias}>{c.alias}</h2>
          <div style={S.caseReal}>
            {c.realName.startsWith("unknown")
              ? <span style={S.hiddenName}>Real name not yet pulled from replay</span>
              : <>Real name exposed: <strong style={{ color: "#f5c400" }}>{c.realName}</strong></>}
          </div>
        </div>
        <div style={S.caseFiledBox}>
          <div style={S.caseFiledLabel}>filed by</div>
          <div style={S.caseFiledName}>
            <span style={{ ...S.tierDot, background: repTier.color }} /> {c.reporter}
          </div>
          <div style={{ color: repTier.color, fontSize: 13, fontWeight: 700 }}>{repTier.name} · {rep?.cred}</div>
        </div>
      </div>

      <p style={S.caseSummary}>{c.summary}</p>

      <h3 style={S.sectionTitle}>Evidence on file</h3>
      <div style={S.evList}>
        {c.evidence.map((e, i) => (
          <div key={i} style={S.evCard}>
            <div style={S.evThumb}>{evIcon(e.type)}</div>
            <div>
              <div style={S.evType}>{e.type}</div>
              <div style={S.evNote}>{e.note}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={S.sectionTitle}>The verdict</h3>
      <div style={S.tally}>
        <div style={S.tallyBar}>
          <div style={{ ...S.tallyGuilty, width: `${guiltyPct}%` }} />
          <div style={{ ...S.tallyClear, width: `${100 - guiltyPct}%` }} />
        </div>
        <div style={S.tallyNums}>
          <span style={{ color: "#00c2ff", fontWeight: 800 }}>{c.guilty} guilty</span>
          <span style={{ color: "#6b7280" }}>
            {c.status === "open" ? `${toVerify} net votes from VERIFIED` : meta.label}
          </span>
          <span style={{ color: "#00e676", fontWeight: 800 }}>{c.notGuilty} clear</span>
        </div>
      </div>

      {c.status === "open" ? (
        voted ? (
          <div style={S.votedNote}>
            You voted <strong style={{ color: voted === "guilty" ? "#b8472f" : "#3b9c6e" }}>{voted === "guilty" ? "guilty" : "not guilty"}</strong>. One vote per case.
          </div>
        ) : (
          <div style={S.voteBtns}>
            <button className="vote-guilty" style={S.voteGuilty} onClick={() => castVote(c.id, "guilty")}>Vote guilty — brand them YELLA</button>
            <button className="vote-clear" style={S.voteClear} onClick={() => castVote(c.id, "notGuilty")}>Vote not guilty — they&apos;re clean</button>
          </div>
        )
      ) : (
        <div style={S.closedNote}>
          This case is closed. {c.status === "verified"
            ? "The accused is branded YELLA and added to the wall."
            : "No cheating found. The accuser's credibility took the hit for this one."}
        </div>
      )}

      <div style={S.warnBox}>
        Voting carries weight by your tier. Marshals count 3×, Sheriffs 2×, Trusted 1.5×, Unproven 1×.
        Vote in bad faith and you lose standing too.
      </div>
    </div>
  );
}
const evIcon = (t) => (t.includes("Replay") ? "🎞" : t.includes("Clip") ? "📹" : t.includes("Stat") ? "📊" : "📎");

/* ----------------------- REPORT FLOW --------------------- */
function Report({ onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ alias: "", realName: "", summary: "", evidence: [], ack: false });
  const [evDraft, setEvDraft] = useState({ type: "Replay screenshot", note: "" });
  const streamer = /ttv|yt/i.test(form.alias);

  const addEv = () => {
    if (!evDraft.note.trim()) return;
    setForm((f) => ({ ...f, evidence: [...f.evidence, evDraft] }));
    setEvDraft({ type: "Replay screenshot", note: "" });
  };
  const removeEv = (i) => setForm((f) => ({ ...f, evidence: f.evidence.filter((_, x) => x !== i) }));

  const canSubmit = form.alias.trim() && form.summary.trim() && form.evidence.length > 0 && form.ack;

  return (
    <div style={S.page}>
      <button className="btn-ghost" style={S.backBtn} onClick={onCancel}>← cancel</button>
      <h2 style={S.pageTitle}>File a report</h2>
      <p style={S.pageDesc}>You&apos;re putting your name and your credibility on this. Make it count.</p>

      <div style={S.stepRow}>
        {["The accused", "The evidence", "Swear it"].map((s, i) => (
          <div key={i} style={{ ...S.stepPill, ...(step === i + 1 ? S.stepPillOn : {}) }}>
            <span style={S.stepNum}>{i + 1}</span> {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={S.formCard}>
          <Field label="In-game name (the alias they hide behind)">
            <input style={S.input} value={form.alias} placeholder="e.g. iTzZ_Sweat_TTV"
              onChange={(e) => setForm({ ...form, alias: e.target.value })} />
          </Field>
          {streamer && <div style={S.streamerNotice}>⚑ &ldquo;ttv&rdquo;/&ldquo;yt&rdquo; detected — this account will carry a <strong>Streamer · extra scrutiny</strong> badge.</div>}
          <Field label="Real name (from the replay roster, if you pulled it)">
            <input style={S.input} value={form.realName} placeholder="Leave blank if not yet exposed"
              onChange={(e) => setForm({ ...form, realName: e.target.value })} />
          </Field>
          <Field label="What happened">
            <textarea style={S.textarea} rows={4} value={form.summary}
              placeholder="Describe exactly what the replay shows. Be specific — vague reports get dismissed."
              onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <div style={S.formFoot}>
            <button className="btn-primary" style={S.btnPrimary} disabled={!form.alias.trim() || !form.summary.trim()}
              onClick={() => setStep(2)}>Next: evidence →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={S.formCard}>
          <div style={S.evReq}>A case cannot be filed without at least one piece of evidence.</div>
          <Field label="Add evidence">
            <div style={S.evAddRow}>
              <select style={S.select} value={evDraft.type} onChange={(e) => setEvDraft({ ...evDraft, type: e.target.value })}>
                <option>Replay screenshot</option>
                <option>Clip</option>
                <option>Stat anomaly</option>
                <option>Other</option>
              </select>
              <input style={{ ...S.input, flex: 1 }} placeholder="Describe what it proves" value={evDraft.note}
                onChange={(e) => setEvDraft({ ...evDraft, note: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEv()} />
              <button className="btn-ghost" style={S.btnGhost} onClick={addEv}>Add</button>
            </div>
          </Field>
          {form.evidence.length > 0 && (
            <div style={S.evDraftList}>
              {form.evidence.map((e, i) => (
                <div key={i} style={S.evDraftItem}>
                  <span>{evIcon(e.type)} <strong>{e.type}</strong> — {e.note}</span>
                  <button className="btn-x" style={S.btnX} onClick={() => removeEv(i)}>remove</button>
                </div>
              ))}
            </div>
          )}
          <div style={S.formFoot}>
            <button className="btn-ghost" style={S.btnGhost} onClick={() => setStep(1)}>← back</button>
            <button className="btn-primary" style={S.btnPrimary} disabled={form.evidence.length === 0} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={S.formCard}>
          <div style={S.oathBox}>
            <h3 style={S.oathTitle}>The oath</h3>
            <p style={S.oathBody}>
              I swear this report is honest. I understand that accusing a clean player is worse than cheating —
              if the community finds this report was filed in bad faith, my credibility drops, and repeat false
              reports put <em>me</em> on trial and can get me voted off for good. An honest mistake gets one pass.
              A pattern of lies does not.
            </p>
            <label style={S.oathCheck}>
              <input type="checkbox" checked={form.ack} onChange={(e) => setForm({ ...form, ack: e.target.checked })} />
              <span>I swear it.</span>
            </label>
          </div>
          <div style={S.reviewBox}>
            <div><strong>Accused:</strong> {form.alias} {streamer && "· STREAMER"}</div>
            <div><strong>Real name:</strong> {form.realName || "not yet pulled"}</div>
            <div><strong>Evidence:</strong> {form.evidence.length} piece{form.evidence.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={S.formFoot}>
            <button className="btn-ghost" style={S.btnGhost} onClick={() => setStep(2)}>← back</button>
            <button className="btn-primary" style={S.btnPrimaryLg} disabled={!canSubmit}
              onClick={() => onSubmit({ ...form, streamer, realName: form.realName.trim() || "unknown — hidden" })}>
              Submit to the tribunal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const Field = ({ label, children }) => (
  <div style={S.field}><label style={S.label}>{label}</label>{children}</div>
);

/* ----------------------- WALL OF YELLA ------------------- */
function Wall({ cases, setRoute }) {
  const branded = cases.filter((c) => c.status === "verified");
  return (
    <div style={S.page}>
      <div style={S.wallHead}>
        <h2 style={S.wallTitle}>The Wall of Yella</h2>
        <p style={S.wallDesc}>
          Convicted by the community. They hid their names out of shame — here they are anyway.
          Yellow is the color of the coward. This brand is permanent.
        </p>
      </div>
      {branded.length === 0 ? (
        <div style={S.empty}>No one branded yet. File the first verified case.</div>
      ) : (
        <div style={S.wallGrid}>
          {branded.map((c) => (
            <button key={c.id} className="yella" style={S.yellaCard} onClick={() => setRoute({ name: "case", id: c.id })}>
              <div style={S.yellaBrand}>YELLA</div>
              <div style={S.yellaAlias}>{c.alias}</div>
              {!c.realName.startsWith("unknown") && <div style={S.yellaReal}>{c.realName}</div>}
              {c.streamer && <div style={S.yellaStreamer}>posed as a streamer</div>}
              <div style={S.yellaVotes}>{c.guilty} guilty votes · {c.evidence.length} proofs</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------- RULES PAGE ---------------------- */
function RulesPage() {
  const rows = [
    ["Net votes to brand VERIFIED", RULES.VOTES_TO_VERIFY],
    ["Net votes to DISMISS a case", RULES.VOTES_TO_DISMISS],
    ["Honest-mistake forgiveness passes", RULES.FORGIVENESS_PASSES],
    ["Bad-faith reports before you go on trial", RULES.FALSE_REPORTS_TO_TRIAL],
    ["Net votes to ban a bad-faith reporter", RULES.VOTES_TO_BAN_USER],
  ];
  return (
    <div style={S.page}>
      <h2 style={S.pageTitle}>The Code</h2>
      <p style={S.pageDesc}>The rules every case runs on. A moderator can tune these — for now, here&apos;s where they stand.</p>
      <table style={S.table}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><td style={S.tdKey}>{k}</td><td style={S.tdVal}>{v}</td></tr>
          ))}
        </tbody>
      </table>
      <h3 style={S.sectionTitle}>Credibility tiers</h3>
      <div style={S.tierList}>
        {TIERS.map((t) => (
          <div key={t.name} style={S.tierRow}>
            <span style={{ ...S.tierDot, background: t.color }} />
            <strong style={{ color: t.color }}>{t.name}</strong>
            <span style={S.tierMeta}>credibility {t.min}+ · vote weight {t.weight}×</span>
          </div>
        ))}
      </div>
      <div style={S.warnBox}>
        Bearing false witness on an honest player is the one thing this platform does not forgive twice.
        When the community bans you, you&apos;re gone. This isn&apos;t Epic — there&apos;s no coming back.
      </div>
    </div>
  );
}

/* ----------------------- FOOTER -------------------------- */
function Footer({ setRoute }) {
  return (
    <footer style={S.footer}>
      <div style={S.footBrand}><img src={bearImg} alt="" style={{ width: 20, height: 20, verticalAlign: "middle", marginRight: 6 }} />bitethatthing</div>
      <div style={S.footTag}>A community tribunal. Evidence over anonymity. Reputation over noise.</div>
      <button className="btn-ghost" style={S.btnGhost} onClick={() => setRoute({ name: "rules" })}>Read the Code</button>
    </footer>
  );
}

/* ======================= STYLES ========================= */
const ink = "#e8f0fe", paper = "#0d1b2a", line = "#1e3a5f";
const blood = "#00c2ff", gold = "#f5c400", green = "#00e676", yella = "#f5c400";

const card_bg  = "#0a1628";
const card_border = "#1a3a6a";

const S = {
  app: { background: paper, color: ink, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  main: { maxWidth: 1080, margin: "0 auto", padding: "0 20px" },

  nav: { position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 16,
    padding: "12px 20px", background: "rgba(10,22,40,0.96)", backdropFilter: "blur(10px)",
    borderBottom: `2px solid ${blood}`, flexWrap: "wrap" },
  brand: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 },
  logoMark: { width: 28, height: 28, objectFit: "contain" },
  brandText: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px", color: blood, textShadow: `0 0 12px ${blood}` },
  navItems: { display: "flex", gap: 4, marginLeft: 8 },
  navlink: { background: "none", border: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600,
    color: "#7ba7d4", padding: "6px 10px", borderRadius: 6 },
  navlinkActive: { color: blood, background: "rgba(0,194,255,0.1)" },
  navRight: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 },
  credPill: { display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", border: `1px solid ${card_border}`, borderRadius: 99, background: card_bg },
  tierDot: { width: 8, height: 8, borderRadius: 99, display: "inline-block" },
  credName: { fontSize: 13, fontWeight: 600 },
  tierLabel: { fontSize: 12, fontWeight: 700 },

  btnPrimary: { background: blood, color: "#001a2c", border: "none", borderRadius: 8, padding: "9px 16px",
    fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px" },
  btnPrimaryLg: { background: blood, color: "#001a2c", border: "none", borderRadius: 8, padding: "14px 28px",
    fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px" },
  btnGhost: { background: "none", color: ink, border: `1.5px solid ${card_border}`, borderRadius: 8, padding: "8px 14px",
    fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  btnGhostLg: { background: "none", color: ink, border: `1.5px solid ${ink}`, borderRadius: 8, padding: "13px 22px",
    fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },

  hero: { padding: "72px 0 48px", maxWidth: 780 },
  heroBrand: { fontSize: 12, fontWeight: 700, letterSpacing: "3px", color: blood, marginBottom: 20, fontFamily: "'Oswald', sans-serif", textShadow: `0 0 8px ${blood}` },
  heroTitle: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(38px, 7vw, 78px)", lineHeight: 0.95,
    fontWeight: 700, letterSpacing: "-1px", margin: "0 0 24px", color: "#ffffff" },
  heroAccent: { color: gold, textShadow: `0 0 20px ${gold}88` },
  heroSub: { fontSize: 18, lineHeight: 1.6, color: "#7ba7d4", maxWidth: 620, margin: "0 0 32px" },
  heroBtns: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 24,
    borderTop: `2px solid ${card_border}`, paddingTop: 28 },
  stat: {},
  statNum: { fontFamily: "'Oswald', sans-serif", fontSize: 34, fontWeight: 700, lineHeight: 1, color: ink },
  statLabel: { fontSize: 13, color: "#5a7fa8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },

  creed: { padding: "48px 0 72px" },
  creedTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", color: blood, marginBottom: 24, textShadow: `0 0 8px ${blood}` },
  creedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 },
  creedCard: { background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, padding: 24 },
  creedNum: { fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: blood, marginBottom: 12 },
  creedCardTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" },
  creedBody: { fontSize: 14, lineHeight: 1.55, color: "#7ba7d4", margin: 0 },

  page: { padding: "32px 0 64px" },
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  pageTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px", margin: 0, color: "#fff" },
  pageDesc: { fontSize: 15, color: "#7ba7d4", margin: "6px 0 0", maxWidth: 560 },

  filterBar: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  segGroup: { display: "flex", gap: 4, background: card_bg, border: `1px solid ${card_border}`, borderRadius: 8, padding: 3 },
  seg: { background: "none", border: "none", cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600,
    color: "#5a7fa8", padding: "6px 12px", borderRadius: 6, textTransform: "capitalize" },
  segOn: { background: blood, color: "#001a2c", fontWeight: 800 },

  caseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  card: { textAlign: "left", background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, padding: 20,
    cursor: "pointer", font: "inherit", color: ink, display: "flex", flexDirection: "column", gap: 8 },
  cardTop: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  statusTag: { fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", border: "1.5px solid", borderRadius: 4, padding: "3px 7px", fontFamily: "'Oswald', sans-serif" },
  streamerTag: { fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", color: gold, border: `1px solid ${gold}`, borderRadius: 4, padding: "3px 6px" },
  cardAlias: { fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, marginTop: 4, color: "#ffffff" },
  cardReal: { fontSize: 13, color: "#7ba7d4" },
  hiddenName: { fontStyle: "italic", color: "#3a6080" },
  cardSummary: { fontSize: 14, lineHeight: 1.5, color: "#7ba7d4", margin: "4px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardFoot: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5a7fa8", borderTop: `1px solid ${card_border}`, paddingTop: 10 },
  evCount: { fontWeight: 600 },
  voteMini: { fontWeight: 600 },
  cardReporter: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5a7fa8" },

  backBtn: { background: "none", border: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, color: "#5a7fa8", padding: 0, marginBottom: 20 },
  caseHead: { display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 16 },
  caseAlias: { fontFamily: "'Oswald', sans-serif", fontSize: 42, fontWeight: 700, margin: "12px 0 6px", letterSpacing: "-1px", color: "#fff" },
  caseReal: { fontSize: 16 },
  caseFiledBox: { background: card_bg, border: `1px solid ${card_border}`, borderRadius: 10, padding: "12px 16px", minWidth: 160 },
  caseFiledLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: "#3a6080" },
  caseFiledName: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, margin: "4px 0" },
  caseSummary: { fontSize: 17, lineHeight: 1.6, color: "#7ba7d4", maxWidth: 680, marginBottom: 32 },
  sectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 14, letterSpacing: "1.5px", textTransform: "uppercase", color: blood, margin: "32px 0 14px" },

  evList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  evCard: { display: "flex", gap: 12, background: card_bg, border: `1px solid ${card_border}`, borderRadius: 10, padding: 14, alignItems: "center" },
  evThumb: { width: 44, height: 44, borderRadius: 8, background: "#071020", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 },
  evType: { fontWeight: 700, fontSize: 14, color: "#fff" },
  evNote: { fontSize: 13, color: "#5a7fa8" },

  tally: { background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, padding: 20 },
  tallyBar: { display: "flex", height: 14, borderRadius: 99, overflow: "hidden", background: "#071020" },
  tallyGuilty: { background: blood },
  tallyClear: { background: green },
  tallyNums: { display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14 },

  voteBtns: { display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" },
  voteGuilty: { flex: 1, minWidth: 200, background: blood, color: "#001a2c", border: "none", borderRadius: 10, padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase" },
  voteClear: { flex: 1, minWidth: 200, background: "transparent", color: green, border: `2px solid ${green}`, borderRadius: 10, padding: "16px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  votedNote: { marginTop: 20, padding: 16, background: card_bg, border: `1px solid ${card_border}`, borderRadius: 10, fontSize: 15 },
  closedNote: { marginTop: 20, padding: 16, background: card_bg, border: `1px solid ${card_border}`, borderRadius: 10, fontSize: 15, color: "#7ba7d4" },
  warnBox: { marginTop: 24, padding: 16, background: "rgba(0,194,255,0.06)", border: `1px solid ${blood}`, borderRadius: 10, fontSize: 14, color: "#7ba7d4", lineHeight: 1.5 },

  stepRow: { display: "flex", gap: 8, margin: "24px 0", flexWrap: "wrap" },
  stepPill: { display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, border: `1px solid ${card_border}`, background: card_bg, fontSize: 14, fontWeight: 600, color: "#3a6080" },
  stepPillOn: { borderColor: blood, color: blood, background: "rgba(0,194,255,0.08)" },
  stepNum: { width: 22, height: 22, borderRadius: 99, background: blood, color: "#001a2c", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 },

  formCard: { background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, padding: 28, maxWidth: 640 },
  field: { marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#a0c4e8" },
  input: { width: "100%", padding: "11px 14px", border: `1.5px solid ${card_border}`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", background: "#071020", color: ink },
  textarea: { width: "100%", padding: "11px 14px", border: `1.5px solid ${card_border}`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", background: "#071020", color: ink, resize: "vertical" },
  select: { padding: "11px 12px", border: `1.5px solid ${card_border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#071020", color: ink },
  streamerNotice: { padding: 12, background: "rgba(245,196,0,0.08)", border: `1px solid ${gold}`, borderRadius: 8, fontSize: 13, color: gold, marginBottom: 20 },
  evReq: { padding: 12, background: "#071020", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#5a7fa8", marginBottom: 20 },
  evAddRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  evDraftList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
  evDraftItem: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 14px", background: "#071020", borderRadius: 8, fontSize: 14 },
  btnX: { background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600 },
  formFoot: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 },

  oathBox: { padding: 20, background: "rgba(0,194,255,0.05)", border: `1px solid ${blood}`, borderRadius: 10, marginBottom: 20 },
  oathTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 18, margin: "0 0 10px", color: blood },
  oathBody: { fontSize: 14, lineHeight: 1.6, color: "#7ba7d4", margin: "0 0 16px" },
  oathCheck: { display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", color: ink },
  reviewBox: { padding: 16, background: "#071020", borderRadius: 10, fontSize: 14, lineHeight: 1.9, marginBottom: 20, color: "#a0c4e8" },

  wallHead: { maxWidth: 640, marginBottom: 32 },
  wallTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 48, fontWeight: 700, letterSpacing: "-1px", margin: 0, color: gold, textShadow: `0 0 24px ${gold}88` },
  wallDesc: { fontSize: 16, lineHeight: 1.6, color: "#7ba7d4", marginTop: 12 },
  wallGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  yellaCard: { textAlign: "left", background: "#0a0d00", color: yella, border: `2px solid ${yella}`, borderRadius: 12, padding: 22, cursor: "pointer", font: "inherit", display: "flex", flexDirection: "column", gap: 6 },
  yellaBrand: { fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "4px", color: yella, textShadow: `0 0 10px ${yella}` },
  yellaAlias: { fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff" },
  yellaReal: { fontSize: 15, fontWeight: 700, color: yella },
  yellaStreamer: { fontSize: 12, color: "#c9a832", fontStyle: "italic" },
  yellaVotes: { fontSize: 12, color: "#5a5020", marginTop: 8, borderTop: "1px solid #2a2800", paddingTop: 10 },
  empty: { padding: 48, textAlign: "center", color: "#3a6080", background: card_bg, border: `1px dashed ${card_border}`, borderRadius: 12 },

  table: { width: "100%", maxWidth: 640, borderCollapse: "collapse", background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, overflow: "hidden" },
  tdKey: { padding: "14px 18px", borderBottom: `1px solid ${card_border}`, fontSize: 14, color: "#7ba7d4" },
  tdVal: { padding: "14px 18px", borderBottom: `1px solid ${card_border}`, fontSize: 18, fontWeight: 700, fontFamily: "'Oswald', sans-serif", textAlign: "right", color: blood },
  tierList: { display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 },
  tierRow: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: card_bg, border: `1px solid ${card_border}`, borderRadius: 10, fontSize: 15 },
  tierMeta: { marginLeft: "auto", fontSize: 13, color: "#5a7fa8" },

  footer: { borderTop: `2px solid ${card_border}`, padding: "32px 20px", display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 40 },
  footBrand: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 18, color: blood },
  footTag: { fontSize: 13, color: "#5a7fa8" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Inter:wght@400;600;700;800&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: #0d1b2a; }
.card { transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,194,255,0.15); border-color: #00c2ff; }
.yella { transition: transform .12s ease, box-shadow .12s ease; }
.yella:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(245,196,0,0.3); }
.btn-primary:hover { filter: brightness(1.1); box-shadow: 0 0 16px rgba(0,194,255,0.4); }
.btn-primary:disabled { opacity: .35; cursor: not-allowed; filter: none; box-shadow: none; }
.btn-ghost:hover { background: rgba(0,194,255,0.07); border-color: #00c2ff; color: #00c2ff; }
.vote-guilty:hover { filter: brightness(1.1); box-shadow: 0 0 20px rgba(0,194,255,0.35); }
.vote-clear:hover { background: rgba(0,230,118,0.08); }
.seg:hover { color: #00c2ff; }
.navlink:hover { color: #00c2ff; background: rgba(0,194,255,0.08); }
input:focus, textarea:focus, select:focus { outline: 2px solid #00c2ff; outline-offset: 1px; border-color: #00c2ff; }
button:focus-visible { outline: 2px solid #00c2ff; outline-offset: 2px; }
input::placeholder, textarea::placeholder { color: #3a6080; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
