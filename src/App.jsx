import React, { useState, useMemo, useEffect, useRef } from "react";
import bearImg from "./bear.png";
import headerImg from "./HEADER.png";
import cheaterImg from "./cheater.png";

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
  const [voted, setVoted] = useState({});
  const [fadeKey, setFadeKey] = useState(0);
  const me = USERS.bitethatthing;

  const navigate = (r) => {
    setFadeKey((k) => k + 1);
    setRoute(r);
  };

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
    navigate({ name: "feed" });
  };

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <Nav route={route} setRoute={navigate} me={me} />
      <main style={S.main}>
        <div key={fadeKey} className="page-fade">
          {route.name === "home" && <Home cases={cases} setRoute={navigate} />}
          {route.name === "feed" && <Feed cases={cases} setRoute={navigate} />}
          {route.name === "wall" && <Wall cases={cases} setRoute={navigate} />}
          {route.name === "report" && <Report onSubmit={addCase} onCancel={() => navigate({ name: "feed" })} />}
          {route.name === "case" && (
            <CaseView c={cases.find((x) => x.id === route.id)} voted={voted[route.id]} castVote={castVote} setRoute={navigate} />
          )}
          {route.name === "rules" && <RulesPage />}
          {route.name === "knowledge" && <KnowledgeBase setRoute={navigate} />}
        </div>
      </main>
      <Footer setRoute={navigate} />
    </div>
  );
}

/* ----------------------- NAV ----------------------------- */
function Nav({ route, setRoute, me }) {
  const t = tierFor(me.cred);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (name) => { setRoute({ name }); setMenuOpen(false); };

  const Item = ({ to, children }) => (
    <button
      className="navlink"
      style={{ ...S.navlink, ...(route.name === to ? S.navlinkActive : {}) }}
      onClick={() => go(to)}
    >
      {children}
    </button>
  );

  return (
    <header style={S.nav}>
      <button style={S.brand} onClick={() => go("home")}>
        <img src={bearImg} alt="" style={S.logoMark} />
        <span style={S.brandText}>bitethatthing</span>
      </button>

      {/* Desktop nav */}
      <nav style={S.navItems} className="nav-desktop">
        <Item to="feed">Cases</Item>
        <Item to="wall">Wall of Yella</Item>
        <Item to="knowledge">FAQ</Item>
        <Item to="rules">The Code</Item>
      </nav>

      {/* Desktop right */}
      <div style={S.navRight} className="nav-desktop">
        <div style={S.credPill}>
          <span style={{ ...S.tierDot, background: t.color }} />
          <span style={S.credName}>{me.handle}</span>
          <span style={{ ...S.tierLabel, color: t.color }}>{t.name} · {me.cred}</span>
        </div>
        <button className="btn-primary" style={S.btnPrimary} onClick={() => go("report")}>
          File a report
        </button>
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="nav-mobile hamburger"
        style={S.hamburger}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menu"
      >
        <span style={{ ...S.hamLine, ...(menuOpen ? S.hamLineTop : {}) }} />
        <span style={{ ...S.hamLine, ...(menuOpen ? S.hamLineMid : {}) }} />
        <span style={{ ...S.hamLine, ...(menuOpen ? S.hamLineBot : {}) }} />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={S.mobileMenu} className="nav-mobile">
          <div style={S.credPill}>
            <span style={{ ...S.tierDot, background: t.color }} />
            <span style={S.credName}>{me.handle}</span>
            <span style={{ ...S.tierLabel, color: t.color }}>{t.name} · {me.cred}</span>
          </div>
          <button className="navlink" style={S.mobileLink} onClick={() => go("feed")}>Cases</button>
          <button className="navlink" style={S.mobileLink} onClick={() => go("wall")}>Wall of Yella</button>
          <button className="navlink" style={S.mobileLink} onClick={() => go("knowledge")}>FAQ</button>
          <button className="navlink" style={S.mobileLink} onClick={() => go("rules")}>The Code</button>
          <button className="btn-primary" style={{ ...S.btnPrimary, width: "100%", marginTop: 8, padding: "12px" }} onClick={() => go("report")}>
            File a report
          </button>
        </div>
      )}
    </header>
  );
}

/* ----------------------- HOME ---------------------------- */
function Home({ cases, setRoute }) {
  const verified = cases.filter((c) => c.status === "verified").length;
  const onTrial = cases.filter((c) => c.status === "open").length;
  return (
    <>
      <div style={S.heroBanner}>
        <img src={headerImg} alt="bitethatthing banner" style={S.heroBannerImg} />
      </div>
      <div style={S.heroRow}>
        <section style={S.hero}>
          <div style={S.heroBrand}>EST. BY bitethatthing · A COMMUNITY TRIBUNAL</div>
          <h1 style={S.heroTitle}>
            Make Fortnite<br /><span style={S.heroAccent}>Great Again.</span>
          </h1>
          <div style={S.loreBox}>
            <div style={S.loreLine}>
              The Island survived the Zero Point. The Loop was broken. Jonesy made it out.
            </div>
            <div style={S.loreLine}>
              But what he found on the outside broke him harder than any storm ever could —
              millions of players grinding clean, losing to rats with software doing the work for them.
            </div>
            <div style={S.loreLine}>
              So Jonesy didn&apos;t retire. He took over Epic.
              And his first executive order: <span style={{ color: gold, fontWeight: 800 }}>no room for cheaters.</span>
            </div>
            <div style={S.loreCredit}>— The bitethatthing Canon</div>
          </div>
          <p style={S.heroSub}>
            Cheating is for rats and cho-mos. Aimbotters and wallhackers hide behind fake names
            because they are ashamed of what they are. Pull the real name from the replay,
            bring the evidence, and let the community brand them YELLA permanently.
            Every verified catch builds your rep and takes the game back.
          </p>
          <div style={S.heroBtns}>
            <button className="btn-primary" style={S.btnPrimaryLg} onClick={() => setRoute({ name: "report" })}>
              Expose a cheater
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
        <div style={S.heroImgWrap}>
          <img src={cheaterImg} alt="President Jonesy — In my Fortnite, there's no room for cheaters" style={S.heroImg} />
        </div>
      </div>

      <section style={S.creed}>
        <h2 style={S.creedTitle}>The deal</h2>
        <div style={S.creedGrid}>
          <Creed n="01" title="Catch the cheater" body="Pull their real name from the replay. No evidence, no case — bring a clip, a screenshot, a stat that can't happen clean." />
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
    <div style={{ ...S.statNum, ...(accent ? { color: "#f5c400", textShadow: "0 0 16px #f5c40066" } : {}) }}>{n}</div>
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
  const netVotes = net(c);
  const isHot = c.status === "open" && netVotes >= 15 && netVotes < RULES.VOTES_TO_VERIFY;
  return (
    <button style={{ ...S.card, ...(isHot ? S.cardHot : {}) }} className="card" onClick={onClick}>
      <div style={S.cardTop}>
        <span style={{ ...S.statusTag, color: meta.color, borderColor: meta.color }}>{meta.label}</span>
        {isHot && <span className="hot-pulse" style={S.hotTag}>🔥 HOT — near verdict</span>}
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

  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarPct(guiltyPct), 80);
    return () => clearTimeout(t);
  }, [guiltyPct]);

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
          <div style={{ ...S.tallyGuilty, width: `${barPct}%`, transition: "width 600ms ease-out" }} />
          <div style={{ ...S.tallyClear, width: `${100 - barPct}%`, transition: "width 600ms ease-out" }} />
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
        {["The accused", "The evidence", "Swear it"].map((s, i) => {
          const done = step > i + 1;
          const active = step === i + 1;
          return (
            <div key={i} style={{ ...S.stepPill, ...(active ? S.stepPillOn : {}), ...(done ? S.stepPillDone : {}) }}>
              <span style={{ ...S.stepNum, ...(done ? S.stepNumDone : {}) }}>
                {done ? "✓" : i + 1}
              </span>
              {s}
            </div>
          );
        })}
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

/* ===================== KNOWLEDGE BASE / FAQ ======================== */

const KB_ARTICLES = [
  {
    id: "what-is-cheating",
    category: "The Basics",
    q: "What exactly counts as cheating in Fortnite?",
    tags: ["cheating", "basics", "definition", "aimbot", "wallhack", "cho-mo", "cheater"],
    a: `Cheating in Fortnite means using any third-party software, hardware device, or exploit to gain an unfair mechanical advantage over other players — something that cannot be done through skill, practice, or game knowledge alone.

On this site we call them what they are: **cho-mos**. A cho-mo is a cheating coward — someone who cannot compete on a fair playing field so they use software or hardware to take what they didn't earn. They hide behind anonymous aliases because deep down they know exactly what they are.

The main categories:
• **Aimbot** — software that automatically moves your crosshair to enemy hitboxes for you
• **Wallhack / ESP** — software that shows you enemy locations through walls
• **Trigger Bot** — fires automatically the moment your crosshair touches an enemy
• **Speedhack** — moves your character faster than the engine permits
• **No Recoil / No Spread** — removes weapon spread patterns so every shot hits perfectly
• **Soft Aim** — subtly inflates aim assist beyond its legal maximum
• **Cronus Zen / XIM Apex** — hardware devices that abuse aim assist loopholes
• **Cho-mo** — our word for all of the above. A cheating coward who steals wins they did not earn and hides their real name because they are ashamed of what they are.

What is NOT cheating:
• High natural aim from thousands of hours of practice
• Strong controller aim assist (it is strong by design — that's Epic's choice)
• Pre-editing and game sense from experience
• Playing on low ping with fast hardware
• Being just genuinely that good

The rule: if the advantage comes from software or hardware outside of what Epic provides to every player equally, it is cheating.`,
  },
  {
    id: "why-cheat",
    category: "The Basics",
    q: "Why do people cheat in Fortnite?",
    tags: ["why", "psychology", "cheaters", "basics"],
    a: `Short answer: they cannot win fairly and they know it.

**Ego protection** — Some players cannot accept that they are average. A loss feels like an attack on their identity. A cheat is a way to win without risking the truth about their actual skill level.

**Content creation fraud** — Some streamers and YouTubers cheat to manufacture "highlight reel" clips. They need views. They cannot produce that content legitimately. They hide it behind a persona.

**Griefing and power** — Some people cheat purely to ruin other people's experiences. The win is watching others suffer. These are the most honest cheaters about what they are.

**Peer pressure and community** — Private cheat communities normalize it. When your whole Discord is cheating, it stops feeling wrong.

**Low risk perception** — Easy Anti-Cheat ban waves are slow. A cheater can operate for weeks before a ban hits. They often just buy a new account and continue.

**The bottom line:** every cheater has decided that their desire to appear skilled is more important than the experience of every other player in that lobby. That is a character decision, not a technical one. This site exists because those decisions should have consequences that follow them.`,
  },
  {
    id: "how-aimbot-works",
    category: "How Cheats Work",
    q: "How does aimbot actually work — technically?",
    tags: ["aimbot", "technical", "how it works", "memory", "detection"],
    a: `An aimbot reads the game's memory while it is running to find the coordinates of every enemy player in the match. It then calculates the angle between your crosshair and the enemy's hitbox and moves your mouse (or analog stick) to that angle automatically.

**Types of aimbot:**

**Rage aimbot** — No subtlety. Snaps directly to head instantly. Obvious in any replay. Used by players who don't care if they get reported.

**Silent aimbot** — Snaps to the target, fires, then returns the crosshair to where you were aiming. Designed to look normal on killcam. In slow-motion replay you can still see the single-frame crosshair teleport.

**Humanized aimbot** — Adds a simulated curve and delay to the snap to mimic human movement. Harder to spot visually. Detectable through statistical analysis of reaction times across many eliminations.

**Bone prioritization** — Targets specific hitboxes. Head-priority explains a 95%+ headshot rate over many eliminations. Legitimate players, even pros, average 30-60%.

**How to spot it in replay:**
Set replay speed to 0.1×. Watch the crosshair frame by frame as the accused engages. Human aim shows gradual movement — even a fast flick has a curve. Aimbot shows a single-frame snap to perfect center-mass or head. The crosshair should not teleport.`,
  },
  {
    id: "how-wallhack-works",
    category: "How Cheats Work",
    q: "How does wallhack / ESP work?",
    tags: ["wallhack", "esp", "technical", "walls", "detection"],
    a: `ESP (Extra Sensory Perception) reads game memory to extract the positions of all players on the map, then renders an overlay on the screen showing boxes, health bars, distances, and weapon loadouts — even through solid walls.

**What the cheater sees:** Glowing boxes around every player in the lobby at all times. They know exactly where you are before you peek. They know your health. They know your weapon.

**Hardware ESP** — The most advanced version runs on a second computer that reads the GPU output via a capture card and overlays information on a separate monitor. This never touches the game's memory and bypasses anti-cheat entirely.

**How to detect it in replay:**

The key tool: in Fortnite replays, footstep audio is shown as a visible ring expanding from players' feet. This is the ground truth for "what information was available."

Watch the accused in replay:
• Do they rotate toward a player BEFORE the audio ring reaches them? Wallhack.
• Do they pre-aim an exact corner at head height before peeking? Wallhack.
• Do they build/edit in a pattern that only makes sense if they know your exact position? Wallhack.
• Do they track your position through multiple structures without any line of sight? Wallhack.

**The hardest thing to explain away:** a player who rotates 90 degrees away from the storm, through a solid building, directly toward where you are hiding — before you have made any noise and before they could see you through any gap. That does not happen from game sense. Game sense uses audio and visual information. Wallhack uses information the game provides but does not intend to share.`,
  },
  {
    id: "how-to-use-replay",
    category: "Catching Cheaters",
    q: "How do I use Fortnite's replay system to catch a cheater?",
    tags: ["replay", "how to", "guide", "evidence", "real name"],
    a: `The Fortnite replay system is the single most powerful tool on this platform. Here is the full process:

**Step 1 — Find the replay**
After any match: Career → Replays. Fortnite keeps your recent matches. Open the one where you suspect cheating.

**Step 2 — Switch to the cheater's POV**
Click on the suspected cheater's name in the replay interface. You are now watching exactly what they saw — their crosshair, their camera, their inputs.

**Step 3 — Slow it down**
Set replay speed to 0.1× or lower. This is where aimbot becomes obvious. Human aim is gradual even at maximum speed. Aimbot is a single-frame crosshair teleport.

**Step 4 — Pull the real name**
Pause the replay. Open the scoreboard (Tab key). Every player's real Epic account name is listed here — the name tied to their actual account. Screenshot this. This is the name that goes on the case.

**Step 5 — Check the audio rings**
Fortnite's replay shows footstep audio as a visual ring expanding from each player. Watch the accused. Do they react to your position BEFORE the ring reaches them? That is information they should not have.

**Step 6 — Check pre-aim angles**
Watch the accused peek around corners. Are they already aiming at head height at the exact pixel you will appear before they can see you? That is wallhack or experience — replay context tells you which.

**Step 7 — Document everything**
Screenshot the scoreboard for the real name. Record a clip of the suspicious moment at slow speed. Note the headshot count and total eliminations. These three things — name proof, mechanical proof, stat proof — are the strongest case you can file.`,
  },
  {
    id: "pull-real-name",
    category: "Catching Cheaters",
    q: "How do I find a cheater's real Epic account name?",
    tags: ["real name", "epic", "replay", "roster", "scoreboard"],
    a: `The Fortnite replay system displays every player's real Epic account username on the scoreboard during the match. This is the name tied to their actual account — not the display name they chose, but the account-level identifier.

**Method 1 — In-match scoreboard**
During the match, open the scoreboard (Tab). If you catch the cheater in time, the names are right there. Screenshot it before the match ends.

**Method 2 — Replay scoreboard**
After the match, open the replay (Career → Replays). At any point during the replay, press Tab to open the scoreboard. All player names are listed. Pause the replay, screenshot it. This works even hours after the match.

**Method 3 — Replay POV**
Switch to the cheater's POV in replay. In some Fortnite versions, the name also appears in the HUD or in team display when playing squads.

**Why this name matters:**
This is the name on their Epic account. It cannot be changed in-game mid-match. When combined with clip evidence, it makes a complete case: you have proven WHO cheated and HOW they cheated. Both are required for a strong report on this site.

**Important:** We only use the Epic account name — what the game's own system shows. We do not search for real-world identity beyond what the player voluntarily attached to their gaming account. That is the line between accountability and doxxing.`,
  },
  {
    id: "false-positives",
    category: "Catching Cheaters",
    q: "How do I make sure I'm not falsely accusing an innocent player?",
    tags: ["false positive", "innocent", "controller", "aim assist", "game sense", "accuracy"],
    a: `This is the most important question on this site. A false accusation against an honest player is the worst thing you can do here. Before you file, run through this checklist:

**Aim assist check**
Fortnite's controller aim assist is genuinely very powerful. A controller player tracking through edits or making fast flicks can look exactly like aimbot to a KB&M player. The difference in replay: aim assist SLOWS the crosshair near a target and keeps it on them as they move. It does not SNAP from zero. If the crosshair teleports in a single frame — that's aimbot. If it smoothly tracks — that is likely aim assist or skill.

**Audio cue check**
Before accusing wallhack, check the audio rings in replay. If the accused rotated toward you AND the footstep ring had already reached them, they reacted to audio. That is game sense, not ESP. You must check the rings before filing.

**Pre-edit check**
Experienced builders pre-edit windows, floors, and cones as part of practiced sequences. They are not reacting to where you are — they are executing a routine they have practiced thousands of times. Replay shows their input timing. If the edit happened before they had any line of sight or audio, that is suspicious. If it was part of an obvious build sequence — it's just skill.

**Reaction time check**
Human reaction to a visual stimulus can be under 150ms for elite players on fast hardware. A 1ms monitor at 240fps makes a real player look superhuman to someone on 60fps with input lag. Check multiple clips. A pattern of sub-50ms reactions across many engagements is suspicious. One fast reaction is not.

**Headshot rate in context**
95%+ headshots over 15+ eliminations is a strong indicator. One clip of three headshots in a row is not. Check the full game stats, not just the clip.

**The standard:** if you cannot explain specifically WHAT they did that is physically impossible — not just impressive, but impossible — do not file. The community will dismiss the case and your credibility takes the hit.`,
  },
  {
    id: "cronus-zen",
    category: "How Cheats Work",
    q: "What is a Cronus Zen and why is it cheating?",
    tags: ["cronus", "zen", "xim", "hardware", "aim assist", "controller"],
    a: `The Cronus Zen (and similar devices like XIM Apex) is a hardware adapter that sits between your controller and your console or PC. It manipulates your inputs before they reach the game, exploiting the game's aim assist system at a hardware level.

**What it does:**
• Eliminates all weapon recoil by making tiny automatic counter-movements
• Maximizes aim assist "bubble" activation time
• Allows a mouse to be detected by the game as a controller, giving mouse precision with full aim assist
• Runs pre-programmed "scripts" for specific weapons — the device knows the recoil pattern and compensates automatically

**Why it is cheating:**
Every other player deals with weapon recoil. Every other player chooses between mouse precision (no aim assist) or controller aim assist (with its limitations). The Cronus Zen removes those limitations. It is an unfair mechanical advantage that is not available to players following the rules.

**Why it's hard to detect:**
Anti-cheat software cannot easily detect a hardware device. The game sees legitimate controller inputs — it does not know those inputs were modified before arrival. Epic Games has banned Cronus Zen in their ToS but enforcement is extremely difficult.

**How to spot it in replay:**
• Zero recoil on weapons that have significant recoil (ARs, SMGs at range)
• Perfectly vertical spray control that does not match human capability
• Suspiciously high accuracy at ranges where the weapon's spread should make it impractical

It looks less flashy than aimbot but it is still cheating. The player did not earn that accuracy. A device earned it for them.`,
  },
  {
    id: "eac-why-fails",
    category: "Anti-Cheat & Epic",
    q: "Why doesn't Epic's anti-cheat stop cheaters?",
    tags: ["epic", "anti-cheat", "EAC", "easy anti-cheat", "ban", "why"],
    a: `Fortnite uses Easy Anti-Cheat (EAC), a kernel-level anti-cheat system. It is one of the most widely used in gaming. It is also not enough.

**What EAC does:**
• Scans for known cheat software signatures in memory
• Monitors for unauthorized memory injection
• Checks game file integrity
• Runs at kernel level (the deepest level of your OS) so it has broad access

**Why cheats still get through:**

**The cat-and-mouse problem** — Cheat developers update their software the moment EAC updates its signatures. Private cheat subscriptions ($30-100/month) fund full-time developers whose only job is bypassing EAC. They are often faster than Epic's security team.

**Ban waves, not real-time bans** — EAC often detects cheaters but does not ban them immediately. It waits and bans in waves — sometimes weeks later. This means a cheater can ruin thousands of matches before a ban lands. BiteThatThing catches them while they are still active.

**Kernel cheats** — The most sophisticated cheats load at a deeper kernel level or boot level than EAC, making themselves invisible to the scanner before EAC initializes.

**Hardware cheats** — Cronus Zen and hardware ESP never touch the game's code or memory. EAC cannot see them. They are entirely outside its detection model.

**Account cycling** — Fortnite accounts are free. A banned cheater creates a new account in minutes and continues. EAC banning is not a long-term deterrent for determined cheaters.

**What this site does differently:** Community detection through replay analysis catches what software cannot — behavioral patterns that are mechanically impossible. A human watching a replay at 0.1× speed sees what EAC cannot detect in the code.`,
  },
  {
    id: "report-to-epic",
    category: "Anti-Cheat & Epic",
    q: "Should I still report cheaters to Epic directly?",
    tags: ["epic", "report", "in-game", "both", "official"],
    a: `Yes — always report in-game to Epic AND file a case here. They serve different purposes.

**Report to Epic in-game:**
Open the scoreboard during or after the match. Click the player's name. Select "Report." Choose "Cheating." Submit.

This goes into Epic's system. It contributes to their data. Enough reports on one account may accelerate a ban. Epic does act on reports — they just do not tell you when or confirm it.

**Why you also need this site:**
Epic's report goes into a black hole. You never hear back. You do not know if it worked. The cheater continues playing for weeks while Epic's process runs.

This site does what Epic cannot: it creates a public record, names the account, documents the evidence, and applies immediate community accountability. Other players can see the case, vote on it, and know to watch out for that account.

**The combination is the most powerful:**
• Epic report → works toward a system ban (eventually)
• bitethatthing case → immediate public record, community verdict, permanent Wall of Yella brand

Do both. Always. One is the official channel. This is the community's answer while the official channel catches up.`,
  },
  {
    id: "stat-anomaly",
    category: "Catching Cheaters",
    q: "What stats are suspicious enough to be evidence?",
    tags: ["stats", "headshots", "kd", "accuracy", "evidence", "anomaly"],
    a: `Stats alone are rarely enough to convict. But extreme stat anomalies combined with clip evidence make a much stronger case.

**Headshot rate**
The most useful stat. Legitimate competitive players average 30-60% headshots. Pro players occasionally spike higher in specific matches.
• 70-80%: Impressive, look closer, not alone enough
• 85-94%: Very suspicious, especially over many games
• 95%+: Over 10+ eliminations, this is a statistical near-impossibility without assistance

**Accuracy / Hit rate**
Fortnite's AR has natural spread. Long-range hits are inconsistent for legitimate players.
• Sustained 80%+ accuracy with a weapon that has spread is suspicious
• Perfect accuracy on every shot of a spray is impossible without no-spread cheat

**Reaction time (from clip timestamps)**
• Under 50ms consistently across many engagements: suspicious
• A single 80ms reaction: a great player on fast hardware
• Consistent sub-80ms on pre-aims where they did not have visual information: wallhack territory

**Kill/Death ratio in context**
A 20 KD in casual lobbies alone does not prove cheating — some players are just that good.
A 20 KD where every kill is a headshot from across the map is different.
A 20 KD where their replay shows mechanical impossibilities is evidence.

**The rule:** stats build context. They do not stand alone. A replay clip showing the mechanical impossibility is always the primary evidence. Stats are the supporting argument that says "this is a pattern, not a coincidence."`,
  },
  {
    id: "soft-aim",
    category: "How Cheats Work",
    q: "What is soft aim and why is it so hard to prove?",
    tags: ["soft aim", "subtle", "aim assist", "gray area", "hard to detect"],
    a: `Soft aim is the hardest cheat to prove because it is designed specifically to be invisible.

**What it does:**
Fortnite's controller aim assist has a maximum strength value. Soft aim slightly increases that value beyond its legal cap — not enough to snap to heads like a rage aimbot, but enough to make tracking measurably easier than any legitimate player can achieve.

Think of it as aim assist turned up from 10 to 12. Legal players are capped at 10. The difference feels invisible in a clip. It shows up in patterns over thousands of shots.

**Why it is hard to detect:**
• It looks exactly like strong aim assist — because it is, just stronger
• No obvious snap. No teleporting crosshair. Just slightly tighter tracking.
• You need statistical analysis over many games to see the deviation from what aim assist can legitimately produce
• Most clips cannot prove it alone

**What to look for:**
• Tracking through edits and structures where even the strongest legitimate aim assist would lose the target
• Consistency of headshots on targets that are actively jumping and building — where legitimate aim assist would struggle
• Comparing their tracking to known pro controller players in similar situations
• Stats deviating significantly from what documented pro controller players achieve

**Our advice:** do not file a soft aim case without statistical evidence AND at least one mechanical clip that shows tracking beyond what any documented legitimate aim assist ceiling can explain. These cases are the hardest for the community to judge. The evidence standard must be higher.`,
  },
  {
    id: "streamer-cheating",
    category: "Streamers & Content",
    q: "Do streamers cheat? Why would someone with an audience risk it?",
    tags: ["streamer", "twitch", "youtube", "content", "views", "ttv", "yt"],
    a: `Yes. Streamer cheating is real and it is arguably more damaging than casual cheating because it influences thousands of viewers.

**Why streamers cheat:**
• Their entire income depends on impressive content. Views come from highlights. Highlights require kills. Kills require accuracy.
• Humanized aimbot and soft aim can be invisible on stream — they look like godlike skill, not software.
• The financial incentive is enormous. A streamer with 10,000 viewers earns real money. Cheating to maintain that is a business decision for some.
• The "raw aim" persona is a content niche. Claiming to have untouched, unassisted aim when you do not is active fraud on your audience.

**Why it is worse:**
• Viewers try to learn from them. They watch the "technique" that is actually software.
• New players believe the game looks like that legitimately. It sets impossible expectations.
• The streamer builds community trust on a lie.
• They have more to hide and more resources to hide it with — better cheat software, more experience disguising it.

**Why bitethatthing treats streamers differently:**
Cases against accounts with "ttv" or "yt" in their name receive the **Streamer · Extra Scrutiny** badge. This means:
• The case surfaces higher in the feed — more eyes on the evidence
• Voters are reminded the accused has a public platform and the accusation carries amplified weight in both directions
• Extra scrutiny also means: be MORE careful before voting guilty. A false accusation against a streamer harms their livelihood. The evidence must be especially solid.`,
  },
  {
    id: "buy-new-account",
    category: "The System",
    q: "Can't cheaters just buy a new account and come back?",
    tags: ["new account", "ban", "permanent", "smurfing", "fresh start"],
    a: `Yes — and this is the most important reason why a public record matters more than a ban alone.

A Fortnite account is free. An EAC ban takes 60 seconds to circumvent: create new Epic account, re-download game, continue cheating. Epic's ban system is a revolving door.

**What a ban cannot do:**
• A ban does not follow the person — it follows the account
• A new account starts fresh. No record. No consequence. No accountability.

**What bitethatthing does differently:**
The Wall of Yella brands the cheater's **real name** — the Epic account name pulled from the replay roster. When they make a new account, the old account's record remains. The community knows the pattern. When a new case is filed on a similar name with similar behavior, players can connect the dots.

Future feature: when we add user accounts, verified reporters will be able to flag "known returner" on a new case, linking it to a previous YELLA branded account. The history follows the person, not the account.

**The honest answer:** no accountability system stops a determined cheater completely. What we do is raise the cost. Cheating used to be completely free — infinite accounts, zero public record, no social consequence. Here, at minimum, there is a permanent public record of what they did. That matters to some people more than an Epic ban does.`,
  },
  {
    id: "make-gaming-great",
    category: "The Mission",
    q: "What is bitethatthing actually trying to accomplish?",
    tags: ["mission", "purpose", "why", "community", "make gaming great again"],
    a: `**Make Fortnite Great Again. Cheating is for rats and cho-mos.**

That is what we are doing here.

Fortnite is one of the most played games in the world. Millions of people — kids, adults, competitive players, casual players — log in expecting a fair match. Cheaters decide that their desire to appear skilled is worth ruining those matches for everyone else. That is not a small thing. That is a choice to take something from other people.

Epic bans accounts. We brand names.

**What we are building:**
A community that holds cheaters accountable beyond what game systems can do. A permanent public record. A tribunal where evidence is required and false accusations are punished just as seriously. A place where the honest players — the ones who grind, who lose, who improve, who play clean — have a voice that carries weight.

**What "make gaming great again" means:**
It means the lobby should be fair. It means a ten-year-old who saved up for a battle pass should be able to play a match without getting demolished by someone who paid $50 for software to do the work for them. It means the ranked system should reflect skill. It means streaming should show real plays from real players.

**The deal we offer:**
Bring real evidence. Let the community judge it fairly. Get it right and your word carries more weight next time. Get it wrong and you answer for it. This is how trust gets built. This is how the community takes its game back.

Cheating is for rats and cho-mos. Real players play clean. This site exists to make that difference permanent.`,
  },
  {
    id: "credibility-system",
    category: "The System",
    q: "How does the credibility system work and why does it matter?",
    tags: ["credibility", "reputation", "tiers", "marshal", "sheriff", "trusted", "unproven"],
    a: `The credibility system is what separates this site from a mob.

Anyone can make an accusation. The question is whether the community should take it seriously. The credibility system answers that question based on track record, not on who yells loudest.

**How it works:**

Every account starts at 50 — "Unproven." You have no history. Your reports will be seen but they start without pre-existing trust.

When the community votes your case as verified: **+8 credibility**
When the community votes your case as dismissed: **-12 credibility**

The asymmetry is intentional. Losing credibility hurts more than gaining it helps. This discourages speculative or careless reports.

**Tiers:**
• **Unproven (0-59)** — New. No track record. Vote weight: 1×
• **Trusted (60-77)** — Proven. Has won verified cases. Vote weight: 1.5×
• **Sheriff (78-91)** — Consistent. Their reports surface prominently. Vote weight: 2×
• **Marshal (92-100)** — Elite. Maximum credibility. Their cases pre-load with community weight. Vote weight: 3×

**Why vote weight matters:**
A Marshal's guilty vote counts as 3 Unproven votes. This reflects reality: someone who has accurately identified 40 cheaters deserves more weight than someone on their first case. The system rewards track record.

**Why this protects the accused:**
A single angry player cannot tank someone's reputation alone. The weighted voting system means a group of Unproven users voting guilty on an innocent player can be counterbalanced by a smaller number of high-credibility players voting not-guilty. Mob mentality is structurally disadvantaged.`,
  },
  {
    id: "false-accusation-consequences",
    category: "The System",
    q: "What happens if I falsely accuse someone?",
    tags: ["false report", "consequences", "ban", "credibility loss", "punishment"],
    a: `Filing a false report on this site is treated as seriously as the cheating itself. Here is exactly what happens:

**If your case is dismissed:**
Your credibility drops by 12 points. This is automatic and immediate.

**If your case is dismissed AND flagged as bad-faith:**
You receive one bad-faith strike in addition to the credibility loss. The flag means the community determined you did not make an honest mistake — you filed knowing the evidence did not support the accusation.

**First honest mistake:**
Everyone gets one forgiveness pass. If you file a case in good faith and get it wrong — you misread the replay, you did not notice the footstep audio ring — that is noted but no bad-faith strike is issued. The credibility loss still applies.

**Three bad-faith strikes:**
You go on trial. The community votes on whether you are a bad-faith actor. This is the same tribunal system — evidence is presented, votes are cast.

**If the community finds you guilty of bad-faith reporting (30 net votes):**
Permanent ban. Your account is removed. When we ban you, you are gone. This is not a timeout. There is no appeals process. No contact email. The community has spoken.

**Why so serious:**
A false accusation can damage a real player's reputation permanently. It costs them time (they have to watch their name on the accused list). It can expose them to harassment. The person who did that to them deserves accountability just as much as a cheater does. We mean this.`,
  },
  {
    id: "what-evidence-do-i-need",
    category: "Catching Cheaters",
    q: "What evidence do I need to file a strong case?",
    tags: ["evidence", "what to submit", "replay", "clip", "screenshot", "strong case"],
    a: `You need at minimum one piece of evidence to file at all. A strong case has three.

**Tier 1 — Identity evidence (who)**
A screenshot of the Fortnite replay scoreboard showing the accused player's real Epic account name. Without this, the case cannot permanently identify the cheater. It is not required to file, but a case without a name is much harder to act on.

**Tier 2 — Mechanical evidence (what they did)**
A clip or frame-by-frame replay screenshot showing the specific impossible behavior:
• Crosshair teleport (single frame snap) = aimbot
• Crosshair tracking through solid wall = wallhack
• Perfect pre-aim at exact head height before they can see you = wallhack
• Zero recoil on a weapon with significant recoil = no-recoil or Cronus
• Reaction to your position before any audio or visual cue = ESP

This is the most important evidence. Without it, you have no proof of anything impossible.

**Tier 3 — Statistical evidence (the pattern)**
Headshot rate over 10+ eliminations. Accuracy percentage. Kill/death in context. This supports Tier 2 by showing this is a pattern, not a one-time lucky shot.

**The combination that gets a verdict:**
Name from replay scoreboard + slow-motion clip of aimbot snap or pre-aim + stat anomaly over the game = the community will very likely vote guilty.

**What gets a case dismissed:**
"He killed me in one shot" — not evidence.
"He was moving really fast" — not specific enough.
A clip of a skilled play that looks suspicious but has a legitimate explanation.
No replay analysis — just a feeling.

Do the work. Watch the replay. Find the specific moment. That is what gets verified.`,
  },
];

const KB_CATEGORIES = [...new Set(KB_ARTICLES.map((a) => a.category))];

function KnowledgeBase({ setRoute }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return KB_ARTICLES.filter((a) => {
      const matchesCat = activeCategory === "All" || a.category === activeCategory;
      const matchesSearch = !q || a.q.toLowerCase().includes(q) || a.a.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q));
      return matchesCat && matchesSearch;
    });
  }, [search, activeCategory]);

  const renderAnswer = (text) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
      const bullet = line.startsWith("•");
      return bullet
        ? <div key={i} style={S.kbBullet} dangerouslySetInnerHTML={{ __html: "• " + bold.slice(2) }} />
        : <p key={i} style={S.kbPara} dangerouslySetInnerHTML={{ __html: bold }} />;
    });

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.kbHeader}>
        <div style={S.heroBrand}>MAKE FORTNITE GREAT AGAIN · CHEATING IS FOR RATS</div>
        <h2 style={S.wallTitle}>Cheater Encyclopedia</h2>
        <p style={S.kbSubtitle}>
          Everything you need to know about cheating in Fortnite — how it works, how to catch it,
          how to prove it, and why it matters. If you have a question, the answer is here.
        </p>
        {/* Search */}
        <div style={S.kbSearchWrap}>
          <span style={S.kbSearchIcon}>🔍</span>
          <input
            style={S.kbSearch}
            placeholder="Search questions, topics, cheats…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenId(null); }}
          />
          {search && (
            <button style={S.kbClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
      </div>

      {/* Featured video */}
      <div style={S.kbVideoWrap}>
        <div style={S.kbVideoLabel}>FEATURED · SEE IT IN ACTION</div>
        <div style={S.kbVideoFrame}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/7D99RsvmtiQ?si=SmQF857W17RKYElk"
            title="Fortnite Cheater Caught — Real Example"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: 10 }}
          />
        </div>
      </div>

      {/* Category filters */}
      <div style={S.kbCatRow}>
        {["All", ...KB_CATEGORIES].map((cat) => (
          <button
            key={cat}
            className="seg"
            style={{ ...S.seg, ...(activeCategory === cat ? S.segOn : {}), fontSize: 13, padding: "7px 14px" }}
            onClick={() => { setActiveCategory(cat); setOpenId(null); }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      <div style={S.kbCount}>
        {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <div style={S.empty}>No articles found. Try a different search term.</div>
      ) : (
        <div style={S.kbList}>
          {filtered.map((article) => {
            const isOpen = openId === article.id;
            return (
              <div key={article.id} style={{ ...S.kbCard, ...(isOpen ? S.kbCardOpen : {}) }}>
                <button
                  style={S.kbQuestion}
                  onClick={() => setOpenId(isOpen ? null : article.id)}
                >
                  <div style={S.kbQLeft}>
                    <span style={S.kbCatBadge}>{article.category}</span>
                    <span style={S.kbQText}>{article.q}</span>
                  </div>
                  <span style={{ ...S.kbChevron, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                </button>
                {isOpen && (
                  <div style={S.kbAnswer}>
                    <div style={S.kbAnswerInner}>
                      {renderAnswer(article.a)}
                    </div>
                    <div style={S.kbTags}>
                      {article.tags.map((t) => (
                        <button key={t} style={S.kbTag} onClick={() => { setSearch(t); setOpenId(null); }}>
                          #{t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div style={S.kbCta}>
        <div style={S.kbCtaTitle}>Caught one? Bring the receipts.</div>
        <p style={S.kbCtaBody}>
          You now know exactly what to look for and how to prove it.
          Pull the name from the replay, document the evidence, and file your case.
          The community is waiting to judge it.
        </p>
        <button className="btn-primary" style={S.btnPrimaryLg} onClick={() => setRoute({ name: "report" })}>
          Expose a cheater →
        </button>
      </div>
    </div>
  );
}

/* ----------------------- FOOTER -------------------------- */
function Footer({ setRoute }) {
  return (
    <footer style={S.footer}>
      <div style={S.footBrand}><img src={bearImg} alt="" style={{ width: 20, height: 20, verticalAlign: "middle", marginRight: 6 }} />bitethatthing</div>
      <div style={S.footTag}>A community tribunal. Cheating is for rats and cho-mos. Make Fortnite Great Again.</div>
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
    borderBottom: `2px solid ${blood}`, flexWrap: "nowrap" },
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

  hamburger: { display: "none", flexDirection: "column", justifyContent: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 8, marginLeft: "auto" },
  hamLine: { display: "block", width: 24, height: 2, background: ink, borderRadius: 2, transition: "transform 0.2s ease, opacity 0.2s ease" },
  hamLineTop: { transform: "translateY(7px) rotate(45deg)" },
  hamLineMid: { opacity: 0 },
  hamLineBot: { transform: "translateY(-7px) rotate(-45deg)" },
  mobileMenu: { position: "absolute", top: "100%", left: 0, right: 0, background: "#0a1628", borderBottom: `2px solid #00c2ff`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8, zIndex: 50 },
  mobileLink: { background: "none", border: "none", cursor: "pointer", font: "inherit", fontSize: 16, fontWeight: 600, color: ink, padding: "10px 0", textAlign: "left", borderBottom: "1px solid #1a3a6a" },
  btnPrimary: { background: blood, color: "#001a2c", border: "none", borderRadius: 8, padding: "9px 16px",
    fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px" },
  btnPrimaryLg: { background: blood, color: "#001a2c", border: "none", borderRadius: 8, padding: "14px 28px",
    fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px" },
  btnGhost: { background: "none", color: ink, border: `1.5px solid ${card_border}`, borderRadius: 8, padding: "8px 14px",
    fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  btnGhostLg: { background: "none", color: ink, border: `1.5px solid ${ink}`, borderRadius: 8, padding: "13px 22px",
    fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },

  heroRow: { display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" },
  heroImgWrap: { flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  heroImg: { width: 380, maxWidth: "100%", borderRadius: 16, filter: "drop-shadow(0 8px 40px rgba(0,194,255,0.18))" },
  heroBanner: { width: "100%", overflow: "hidden" },
  heroBannerImg: { width: "100%", maxHeight: 340, objectFit: "cover", objectPosition: "center", display: "block" },
  hero: { padding: "48px 0 48px", flex: 1, minWidth: 300 },
  heroBrand: { fontSize: 12, fontWeight: 700, letterSpacing: "3px", color: blood, marginBottom: 20, fontFamily: "'Oswald', sans-serif", textShadow: `0 0 8px ${blood}` },
  heroTitle: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(38px, 7vw, 78px)", lineHeight: 0.95,
    fontWeight: 700, letterSpacing: "-1px", margin: "0 0 24px", color: "#ffffff" },
  heroAccent: { color: gold, textShadow: `0 0 20px ${gold}88` },
  loreBox: { borderLeft: `3px solid ${blood}`, paddingLeft: 16, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 },
  loreLine: { fontSize: 14, lineHeight: 1.65, color: "#7ba7d4", fontStyle: "italic" },
  loreCredit: { fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: blood, textTransform: "uppercase", marginTop: 4, fontFamily: "'Oswald', sans-serif" },
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
  cardHot: { borderColor: "#f5c400", boxShadow: "0 0 12px rgba(245,196,0,0.2)" },
  hotTag: { fontSize: 10, fontWeight: 800, letterSpacing: "0.5px", color: "#f5c400", border: "1px solid #f5c400", borderRadius: 4, padding: "3px 6px" },
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
  stepPillDone: { borderColor: green, color: green, background: "rgba(0,230,118,0.06)" },
  stepNum: { width: 22, height: 22, borderRadius: 99, background: blood, color: "#001a2c", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 },
  stepNumDone: { background: green, color: "#001a2c" },

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

  kbHeader: { maxWidth: 720, marginBottom: 32 },
  kbSubtitle: { fontSize: 16, lineHeight: 1.7, color: "#7ba7d4", margin: "12px 0 28px" },
  kbSearchWrap: { position: "relative", display: "flex", alignItems: "center", maxWidth: 560 },
  kbSearchIcon: { position: "absolute", left: 14, fontSize: 16, pointerEvents: "none" },
  kbSearch: { width: "100%", padding: "13px 44px", border: `2px solid ${card_border}`, borderRadius: 10, fontSize: 16, fontFamily: "inherit", background: "#071020", color: ink, boxSizing: "border-box" },
  kbClear: { position: "absolute", right: 12, background: "none", border: "none", color: "#5a7fa8", cursor: "pointer", fontSize: 16, fontFamily: "inherit", padding: 4 },
  kbVideoWrap: { maxWidth: 720, marginBottom: 36 },
  kbVideoLabel: { fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: blood, marginBottom: 12, fontFamily: "'Oswald', sans-serif" },
  kbVideoFrame: { position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 10, overflow: "hidden", border: `2px solid ${card_border}`, background: "#000" },
  kbCatRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  kbCount: { fontSize: 13, color: "#5a7fa8", marginBottom: 20, fontWeight: 600 },
  kbList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 48 },
  kbCard: { background: card_bg, border: `1px solid ${card_border}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s ease" },
  kbCardOpen: { borderColor: blood, boxShadow: `0 0 16px rgba(0,194,255,0.12)` },
  kbQuestion: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  kbQLeft: { display: "flex", flexDirection: "column", gap: 6 },
  kbCatBadge: { fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: blood },
  kbQText: { fontSize: 16, fontWeight: 700, color: "#e8f0fe", lineHeight: 1.4 },
  kbChevron: { color: "#5a7fa8", fontSize: 12, flexShrink: 0, transition: "transform .2s ease" },
  kbAnswer: { borderTop: `1px solid ${card_border}`, padding: "20px 20px 16px" },
  kbAnswerInner: { maxWidth: 700 },
  kbPara: { fontSize: 15, lineHeight: 1.75, color: "#a0c4e8", margin: "0 0 12px" },
  kbBullet: { fontSize: 15, lineHeight: 1.7, color: "#a0c4e8", padding: "2px 0 2px 16px", margin: "0 0 4px" },
  kbTags: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${card_border}` },
  kbTag: { background: "none", border: `1px solid ${card_border}`, borderRadius: 99, padding: "4px 10px", fontSize: 12, color: "#5a7fa8", cursor: "pointer", fontFamily: "inherit" },
  kbCta: { background: card_bg, border: `2px solid ${blood}`, borderRadius: 16, padding: "36px 32px", maxWidth: 640, boxShadow: `0 0 32px rgba(0,194,255,0.1)` },
  kbCtaTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12 },
  kbCtaBody: { fontSize: 16, lineHeight: 1.6, color: "#7ba7d4", marginBottom: 24 },

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
.kb-question:hover .kb-q-text { color: #00c2ff; }
button[style*="kbQuestion"]:hover { background: rgba(0,194,255,0.04) !important; }
@media (max-width: 700px) {
  .nav-desktop { display: none !important; }
  .nav-mobile { display: flex !important; }
  .hamburger { display: flex !important; }
}
@media (min-width: 701px) {
  .nav-mobile { display: none !important; }
  .hamburger { display: none !important; }
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes hotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.hot-pulse { animation: hotPulse 1.4s ease-in-out infinite; }
.page-fade { animation: fadeIn 200ms ease-out both; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } .page-fade { animation: none; } }
`;
