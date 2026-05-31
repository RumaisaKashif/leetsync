import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const GITHUB_USER = "RumaisaKashif";
const GITHUB_REPO = "leetcode-solutions";
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN || "";

const PALETTE = {
  page: "#f5efe3", dark: "#1a1208", green: "#2d5a3d",
  gold: "#9b7a2f", coffee: "#6b3a1f", cream: "#fdf9f2",
  muted: "#8a7a65",
};

const WASHI = ["#8fad8f","#d4a843","#c4957a","#9b8fad","#a8c4a8","#c4a87a","#7a9bad"];

const CODE_SNIPPETS = [
  "two_sum = set()","left, right = 0, n-1","return dp[n-1]",
  "if not root: return","stack.append(node)","memo = {}",
  "for i in range(n):","res = float('inf')","slow = fast = head",
  "graph = defaultdict(list)","heapq.heappush(h,val)","seen = set()",
  "while left < right:","curr = curr.next","dp = [0]*(n+1)",
  "q = deque([root])","max_area = 0","lo,hi = 0,len(arr)",
];

const DIFF_COLOR = { Easy: "#3a6b4a", Medium: "#9b7a2f", Hard: "#8b3a3a" };

const ALL_TOPICS = [
  "arrays","strings","hash-tables","linked-lists","trees","graphs",
  "dynamic-programming","binary-search","stack-and-queue","math",
  "two-pointers","sliding-window","backtracking","greedy",
  "bit-manipulation","heap-priority-queue","trie","recursion","sorting",
];

// Torn edge overlay paths — top and bottom variants
const TORN_BOTTOM = [
  "polygon(0% 100%,100% 100%,100% 45%,96% 12%,92% 55%,87% 18%,82% 60%,77% 22%,72% 52%,67% 8%,62% 48%,57% 18%,52% 58%,47% 24%,42% 62%,37% 15%,32% 50%,27% 20%,22% 58%,17% 28%,12% 62%,7% 18%,3% 52%,0% 35%)",
  "polygon(0% 100%,100% 100%,100% 38%,97% 62%,93% 22%,88% 55%,83% 10%,79% 50%,74% 28%,69% 60%,64% 18%,59% 52%,54% 32%,49% 65%,44% 20%,39% 55%,34% 25%,29% 68%,24% 32%,19% 58%,14% 15%,9% 55%,4% 30%,0% 55%)",
  "polygon(0% 100%,100% 100%,100% 52%,95% 20%,90% 58%,85% 28%,80% 62%,75% 18%,70% 48%,65% 25%,60% 60%,55% 15%,50% 52%,45% 30%,40% 65%,35% 22%,30% 55%,25% 18%,20% 60%,15% 32%,10% 58%,5% 22%,2% 48%,0% 40%)",
];
const TORN_TOP = [
  "polygon(0% 0%,100% 0%,100% 65%,97% 40%,93% 72%,88% 38%,83% 68%,78% 42%,73% 75%,68% 45%,63% 70%,58% 35%,53% 65%,48% 38%,43% 72%,38% 45%,33% 70%,28% 38%,23% 68%,18% 42%,13% 72%,8% 38%,4% 65%,0% 45%)",
  "polygon(0% 0%,100% 0%,100% 58%,96% 75%,91% 42%,86% 72%,81% 35%,76% 65%,71% 42%,66% 78%,61% 48%,56% 70%,51% 38%,46% 68%,41% 45%,36% 78%,31% 48%,26% 72%,21% 42%,16% 68%,11% 40%,6% 72%,2% 50%,0% 65%)",
];

// ─── Mouse Coffee Trail ───────────────────────────────────────────────────────
function MouseCoffeeTrail() {
  const [drops, setDrops] = useState([]);
  useEffect(() => {
    let last = 0;
    const onMove = (e) => {
      const now = Date.now();
      if (now - last < 40) return;
      last = now;
      const id = now + Math.random();
      const size = 4 + Math.random() * 6;
      setDrops(d => [...d.slice(-22), { id, x: e.clientX, y: e.clientY, size }]);
      setTimeout(() => setDrops(d => d.filter(p => p.id !== id)), 900);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      <AnimatePresence>
        {drops.map(d => (
          <motion.div key={d.id}
            initial={{ opacity: 0.75, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.2, y: 28 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: d.x - d.size / 2, top: d.y,
              width: d.size, height: d.size * 1.5,
              borderRadius: "50% 50% 50% 50% / 30% 30% 70% 70%",
              backgroundColor: PALETTE.coffee,
              transformOrigin: "top center",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Graph Constellation ─────────────────────────────────────────────────────
function ConstellationBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const nodes = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: 1.5 + Math.random() * 2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(107,58,31,${0.09 * (1 - dist / 160)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(107,58,31,0.2)";
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0 }} />;
}

// ─── Coffee Stains ───────────────────────────────────────────────────────────
const STAINS = [
  { x: "6%", y: 140, s: 115, o: 0.17, r: -10 }, { x: "83%", y: 320, s: 72, o: 0.13, r: 18 },
  { x: "89%", y: 900, s: 88, o: 0.14, r: 6 }, { x: "2%", y: 1200, s: 58, o: 0.11, r: -22 },
  { x: "48%", y: 1750, s: 132, o: 0.09, r: 4 }, { x: "76%", y: 2400, s: 68, o: 0.12, r: 14 },
  { x: "8%", y: 2900, s: 98, o: 0.13, r: -7 },
];
function CoffeeRing({ x, y, s, o, r }) {
  return (
    <svg style={{ position: "absolute", left: x, top: y, opacity: o, transform: `rotate(${r}deg)`, pointerEvents: "none" }}
      width={s} height={s} viewBox="0 0 120 120">
      <ellipse cx="60" cy="60" rx="52" ry="49" fill="none" stroke="#6b3a1f" strokeWidth="7" strokeDasharray="3 2" opacity="0.65" />
      <ellipse cx="60" cy="60" rx="47" ry="45" fill="none" stroke="#8b5c2a" strokeWidth="2.5" opacity="0.35" />
      <ellipse cx="63" cy="57" rx="51" ry="48" fill="rgba(107,58,31,0.04)" />
    </svg>
  );
}

// ─── Torn Newspaper Card ─────────────────────────────────────────────────────
function TornCard({ problem, index }) {
  const tilt = useRef((-2.2 + Math.random() * 4.4).toFixed(2)).current;
  const tapeColor = WASHI[index % WASHI.length];
  const btmPath = TORN_BOTTOM[index % TORN_BOTTOM.length];
  const topPath = TORN_TOP[index % TORN_TOP.length];

  return (
    <motion.a
      href={`https://github.com/${GITHUB_USER}/${GITHUB_REPO}/tree/main/${problem.path}`}
      target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 28, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.38, delay: (index % 10) * 0.03 }}
      whileHover={{ rotate: 0, y: -10, scale: 1.06, zIndex: 30 }}
      style={{ display: "block", position: "relative", textDecoration: "none",
        margin: "14px 6px", transformOrigin: "center" }}
    >
      {/* Torn top overlay */}
      <div style={{
        position: "absolute", top: -10, left: -3, right: -3, height: 18,
        backgroundColor: PALETTE.page, clipPath: topPath, zIndex: 2,
      }} />

      {/* Washi tape — outside card body so overflow:hidden doesn't clip it */}
      <div style={{
        position: "absolute", top: -5, left: -16,
        width: 36, height: 11,
        backgroundColor: tapeColor,
        opacity: 0.96,
        transform: "rotate(-45deg)",
        transformOrigin: "center",
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.22) 3px, rgba(255,255,255,0.22) 4px)`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)",
        zIndex: 3,
      }} />

      {/* Card body */}
      <div style={{
        backgroundColor: PALETTE.cream, position: "relative", overflow: "hidden",
        padding: "18px 14px 18px",
        boxShadow: "0 4px 18px rgba(26,18,8,0.12), 0 1px 4px rgba(26,18,8,0.08)",
        zIndex: 1,
      }}>

        {/* Category tag */}
        <p style={{
          fontFamily: "'Courier New', monospace", fontSize: "9px",
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: PALETTE.muted, marginBottom: "10px", paddingTop: "8px",
        }}>
          {problem.topic.replace(/-/g, " ")}
        </p>

        {/* Problem name */}
        <p style={{
          fontFamily: "Playfair Display, serif", fontSize: "14px",
          color: PALETTE.dark, lineHeight: 1.4, fontWeight: 600,
        }}>
          {problem.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </p>

        {/* Difficulty */}
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%",
            backgroundColor: DIFF_COLOR[problem.difficulty] || PALETTE.muted }} />
          <span style={{ fontFamily: "Caveat, cursive", fontSize: "12px",
            color: DIFF_COLOR[problem.difficulty] || PALETTE.muted }}>
            {problem.difficulty || "—"}
          </span>
        </div>
      </div>

      {/* Torn bottom overlay */}
      <div style={{
        position: "absolute", bottom: -10, left: -3, right: -3, height: 18,
        backgroundColor: PALETTE.page, clipPath: btmPath, zIndex: 2,
      }} />
    </motion.a>
  );
}

// ─── Crossword Topics ─────────────────────────────────────────────────────────
function CrosswordTopics({ topics, selected, onSelect, problemsByTopic }) {
  return (
    <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "5rem 1.5rem" }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{ display: "flex", alignItems: "baseline", gap: "24px", marginBottom: "3rem" }}>
        <span style={{ fontFamily: "Playfair Display, serif",
          fontSize: "clamp(2rem,5vw,3.2rem)", color: PALETTE.dark }}>Topics</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: PALETTE.green, opacity: 0.55 }} />
        <span style={{ fontFamily: "Caveat, cursive", fontSize: "14px",
          color: PALETTE.muted, letterSpacing: "0.1em" }}>ACROSS</span>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[{ name: "all-problems", display: "ALL PROBLEMS", count: Object.values(problemsByTopic).reduce((a,b)=>a+b,0) || "—" },
          ...topics.map(t => ({ name: t.name, display: t.name.toUpperCase().replace(/-/g," "), count: problemsByTopic[t.name] ?? "—" }))
        ].map((topic, i) => {
          const isSelected = selected === (topic.name === "all-problems" ? "All" : topic.name);
          return (
            <motion.div key={topic.name}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.055 }}
              onClick={() => onSelect(topic.name === "all-problems" ? "All" : (isSelected ? "All" : topic.name))}
              style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
            >
              {/* Clue number */}
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px",
                color: PALETTE.muted, minWidth: "20px", textAlign: "right" }}>{i + 1}.</span>

              {/* Letter cells */}
              <div style={{ display: "flex", gap: "2px" }}>
                {topic.display.split("").map((ch, j) =>
                  ch === " " ? (
                    <div key={j} style={{ width: 8 }} />
                  ) : (
                    <motion.div key={j}
                      animate={{ backgroundColor: isSelected ? PALETTE.green : PALETTE.cream,
                        color: isSelected ? PALETTE.cream : PALETTE.dark }}
                      transition={{ duration: 0.2, delay: j * 0.02 }}
                      style={{
                        width: 28, height: 28, border: `1.5px solid ${isSelected ? PALETTE.green : "rgba(26,18,8,0.22)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Courier New', monospace", fontSize: "11px", fontWeight: "bold",
                        position: "relative", userSelect: "none",
                        ...(j === 0 ? { borderTopLeftRadius: "2px" } : {}),
                      }}
                    >
                      {j === 0 && (
                        <span style={{ position: "absolute", top: 1, left: 2,
                          fontSize: "7px", color: isSelected ? "rgba(245,239,227,0.6)" : PALETTE.muted,
                          lineHeight: 1 }}>{i + 1}</span>
                      )}
                      {ch}
                    </motion.div>
                  )
                )}
              </div>

              {/* Count */}
              <span style={{ fontFamily: "Caveat, cursive", fontSize: "16px",
                color: isSelected ? PALETTE.green : PALETTE.gold, marginLeft: "8px" }}>
                {topic.count}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Data Structure Visualisations ───────────────────────────────────────────
function DataViz({ topic }) {
  if (!topic || topic === "All") return null;
  const vizMap = {
    arrays: <ArrayViz />, trees: <TreeViz />,
    "linked-lists": <LinkedListViz />, "stack-and-queue": <StackViz />,
    "hash-tables": <HashViz />, "binary-search": <BinarySearchViz />,
    strings: <StringsViz />, math: <MathViz />,
    graphs: <GraphsViz />, "two-pointers": <TwoPointersViz />,
    "sliding-window": <SlidingWindowViz />, "dynamic-programming": <DPViz />,
    greedy: <GreedyViz />, "bit-manipulation": <BitViz />,
    backtracking: <BacktrackingViz />, "heap-priority-queue": <HeapViz />,
    trie: <TrieViz />, recursion: <RecursionViz />,
    sorting: <SortingViz />,
  };
  const Viz = vizMap[topic];
  if (!Viz) return null;
  return (
    <motion.div key={topic} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ pointerEvents: "none", display: "flex", alignItems: "center" }}>
      {Viz}
    </motion.div>
  );
}

function ArrayViz() {
  const cells = [3,1,4,1,5,9,2,6];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, opacity: 0.55, height: 80 }}>
      {cells.map((v, i) => (
        <motion.div key={i} animate={{ height: [28+v*4, 28+v*4+10, 28+v*4] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: i*0.15, ease: "easeInOut" }}
          style={{ width: 26, backgroundColor: PALETTE.green }} />
      ))}
    </div>
  );
}

function TreeViz() {
  return (
    <svg width={165} height={120} viewBox="0 0 120 90" style={{ opacity: 0.5 }}>
      {[[60,10],[30,42],[90,42],[15,74],[45,74],[75,74],[105,74]].map(([x,y],i) => (
        <motion.circle key={i} cx={x} cy={y} r={9} fill={PALETTE.green}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i*0.1 }} />
      ))}
      {[[60,10,30,42],[60,10,90,42],[30,42,15,74],[30,42,45,74],[90,42,75,74],[90,42,105,74]].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={PALETTE.dark} strokeWidth={1.2} opacity={0.4} />
      ))}
    </svg>
  );
}

function LinkedListViz() {
  const nodes = [7,13,1,6];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.55 }}>
      {nodes.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 38, height: 38, border: `2px solid ${PALETTE.green}`, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 12, color: PALETTE.green }}>{v}</div>
          {i < nodes.length-1 && <span style={{ color: PALETTE.green, fontSize: 14 }}>→</span>}
        </div>
      ))}
      <span style={{ fontFamily: "monospace", fontSize: 13, color: PALETTE.green }}>∅</span>
    </div>
  );
}

function StackViz() {
  const items = ["D","C","B","A"];
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 3, opacity: 0.55 }}>
      {items.map((v, i) => (
        <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i*0.1 }}
          style={{ width: 48, height: 22, backgroundColor: PALETTE.green,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 12, color: PALETTE.cream }}>{v}</motion.div>
      ))}
    </div>
  );
}

function HashViz() {
  const pairs = [["key","val"],["abc","123"],["foo","bar"]];
  return (
    <div style={{ opacity: 0.55 }}>
      {pairs.map(([k,v], i) => (
        <div key={i} style={{ display: "flex", gap: 3, marginBottom: 3 }}>
          <div style={{ padding: "3px 9px", backgroundColor: PALETTE.gold, fontFamily: "monospace", fontSize: 11, color: PALETTE.cream }}>{k}</div>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: PALETTE.muted, alignSelf: "center" }}>→</span>
          <div style={{ padding: "3px 9px", border: `1px solid ${PALETTE.green}`, fontFamily: "monospace", fontSize: 11, color: PALETTE.green }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function BinarySearchViz() {
  const cells = [1,3,5,7,9,11,13]; const mid = 3;
  return (
    <div style={{ display: "flex", gap: 4, opacity: 0.55 }}>
      {cells.map((v, i) => (
        <motion.div key={i} animate={{ backgroundColor: i===mid ? [PALETTE.coffee,PALETTE.green,PALETTE.coffee] : "transparent" }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ width: 30, height: 30, border: `1.5px solid ${i===mid ? PALETTE.coffee : PALETTE.green}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 11, color: i===mid ? PALETTE.cream : PALETTE.green }}>{v}</motion.div>
      ))}
    </div>
  );
}

function StringsViz() {
  const word = "HELLO".split("");
  return (
    <div style={{ display: "flex", gap: 4, opacity: 0.55 }}>
      {word.map((ch, i) => (
        <motion.div key={i}
          animate={{ backgroundColor: [PALETTE.cream, PALETTE.green, PALETTE.cream] }}
          transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.3 }}
          style={{ width: 34, height: 34, border: `1.5px solid ${PALETTE.green}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 14, color: PALETTE.dark }}>{ch}</motion.div>
      ))}
    </div>
  );
}

function MathViz() {
  return (
    <svg width={135} height={105} viewBox="0 0 90 70" style={{ opacity: 0.5 }}>
      <motion.circle cx="45" cy="35" r="28" fill="none" stroke={PALETTE.green} strokeWidth={1.5}
        animate={{ r: [26, 30, 26] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} />
      <line x1="17" y1="35" x2="73" y2="35" stroke={PALETTE.dark} strokeWidth={1} opacity={0.5} />
      <line x1="45" y1="7" x2="45" y2="63" stroke={PALETTE.dark} strokeWidth={1} opacity={0.5} />
      <motion.text x="28" y="28" fontFamily="serif" fontSize="12" fill={PALETTE.gold} opacity={0.8}
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>π</motion.text>
    </svg>
  );
}

function GraphsViz() {
  const pts = [[20,20],[70,15],[55,55],[15,60],[85,55]];
  const edges = [[0,1],[0,3],[1,2],[2,3],[2,4]];
  return (
    <svg width={150} height={120} viewBox="0 0 100 80" style={{ opacity: 0.5 }}>
      {edges.map(([a,b],i) => (
        <motion.line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke={PALETTE.green} strokeWidth={1.2}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i*0.15 }} />
      ))}
      {pts.map(([x,y],i) => (
        <motion.circle key={i} cx={x} cy={y} r={6} fill={PALETTE.green}
          animate={{ r: [5,7,5] }} transition={{ repeat: Infinity, duration: 2, delay: i*0.3 }} />
      ))}
    </svg>
  );
}

function TwoPointersViz() {
  const cells = [1,3,5,7,9,11];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity: 0.55 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {cells.map((v, i) => (
          <div key={i} style={{ width: 30, height: 30, border: `1.5px solid ${PALETTE.green}`,
            backgroundColor: (i===0||i===cells.length-1) ? PALETTE.green : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 11,
            color: (i===0||i===cells.length-1) ? PALETTE.cream : PALETTE.green }}>{v}</div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 1, paddingRight: 1 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: PALETTE.coffee }}>L↑</span>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: PALETTE.coffee }}>↑R</span>
      </div>
    </div>
  );
}

function SlidingWindowViz() {
  const cells = [2,1,5,1,3,2];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.55 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {cells.map((v, i) => (
          <motion.div key={i}
            animate={{ backgroundColor: (i>=1&&i<=3) ? [PALETTE.gold,"rgba(155,122,47,0.3)",PALETTE.gold] : "transparent" }}
            transition={{ repeat: Infinity, duration: 2, delay: i*0.1 }}
            style={{ width: 30, height: 30, border: `1.5px solid ${(i>=1&&i<=3)?PALETTE.gold:PALETTE.green}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "monospace", fontSize: 11, color: PALETTE.dark }}>{v}</motion.div>
        ))}
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: PALETTE.gold }}>window →</span>
    </div>
  );
}

function DPViz() {
  const cells = [0,1,1,2,3,5,8];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.55 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {cells.map((v, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i*0.12 }}
            style={{ width: 30, height: 30, backgroundColor: PALETTE.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "monospace", fontSize: 11, color: PALETTE.cream }}>{v}</motion.div>
        ))}
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: PALETTE.green }}>dp[i]</span>
    </div>
  );
}

function GreedyViz() {
  const steps = [8,3,6,1,4];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, opacity: 0.55, height: 72 }}>
      {steps.map((v, i) => (
        <motion.div key={i} animate={{ height: [v*5, v*5+8, v*5] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: i*0.2 }}
          style={{ width: 22, backgroundColor: i===0?PALETTE.coffee:PALETTE.green }} />
      ))}
    </div>
  );
}

function BitViz() {
  const bits = [1,0,1,1,0,1,0,0];
  return (
    <div style={{ display: "flex", gap: 2, opacity: 0.55 }}>
      {bits.map((b, i) => (
        <motion.div key={i} animate={{ opacity: [0.4,1,0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i*0.15 }}
          style={{ width: 22, height: 32, backgroundColor: b?PALETTE.dark:"transparent",
            border: `1px solid ${PALETTE.dark}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 12, color: b?PALETTE.cream:PALETTE.dark }}>{b}</motion.div>
      ))}
    </div>
  );
}

function BacktrackingViz() {
  const pts = [[50,10],[25,35],[75,35],[12,60],[38,60],[62,60],[88,60]];
  return (
    <svg width={150} height={112} viewBox="0 0 100 75" style={{ opacity: 0.5 }}>
      {[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].map(([a,b],i) => (
        <motion.line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke={PALETTE.green} strokeWidth={1} strokeDasharray="3 2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i*0.2 }} />
      ))}
      {pts.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={6} fill={i===3||i===4?PALETTE.coffee:PALETTE.green} opacity={0.8} />
      ))}
    </svg>
  );
}

function HeapViz() {
  const vals = [1,3,2,7,5,6,4];
  return (
    <svg width={150} height={112} viewBox="0 0 100 75" style={{ opacity: 0.5 }}>
      {[[50,8],[25,32],[75,32],[12,58],[38,58],[62,58],[88,58]].map(([x,y],i) => (
        <g key={i}>
          {i>0&&<line x1={[[50,8],[25,32],[75,32],[12,58],[38,58],[62,58],[88,58]][Math.floor((i-1)/2)][0]}
            y1={[[50,8],[25,32],[75,32],[12,58],[38,58],[62,58],[88,58]][Math.floor((i-1)/2)][1]}
            x2={x} y2={y} stroke={PALETTE.green} strokeWidth={1} opacity={0.4} />}
          <circle cx={x} cy={y} r={9} fill={i===0?PALETTE.coffee:PALETTE.green} opacity={0.85} />
          <text x={x} y={y+4} textAnchor="middle" fontFamily="monospace" fontSize="8" fill={PALETTE.cream}>{vals[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function TrieViz() {
  return (
    <svg width={150} height={112} viewBox="0 0 100 75" style={{ opacity: 0.5 }}>
      {[[50,8],[25,30],[75,30],[12,55],[38,55],[62,55],[88,55]].map(([x,y],i) => {
        const labels = ["","a","b","p","r","a","t"];
        return (
          <g key={i}>
            {i>0&&<line x1={[[50,8],[25,30],[75,30],[12,55],[38,55],[62,55],[88,55]][Math.floor((i-1)/2)][0]}
              y1={[[50,8],[25,30],[75,30],[12,55],[38,55],[62,55],[88,55]][Math.floor((i-1)/2)][1]}
              x2={x} y2={y} stroke={PALETTE.green} strokeWidth={1} opacity={0.4} />}
            <circle cx={x} cy={y} r={8} fill={PALETTE.green} opacity={0.75} />
            <text x={x} y={y+3} textAnchor="middle" fontFamily="monospace" fontSize="7" fill={PALETTE.cream}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function RecursionViz() {
  const layers = [80,64,48,32,16];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.55 }}>
      {layers.map((w, i) => (
        <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: i*0.15 }}
          style={{ height: 14, width: w, backgroundColor: PALETTE.green,
            opacity: 1 - i*0.15, borderRadius: 1 }} />
      ))}
    </div>
  );
}

function SortingViz() {
  const bars = [5,2,8,1,6,3,7,4];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, opacity: 0.55, height: 80 }}>
      {bars.map((v, i) => (
        <motion.div key={i}
          animate={{ height: [v*8, v*8+6, v*8] }}
          transition={{ repeat: Infinity, duration: 1.6, delay: i*0.1 }}
          style={{ width: 18, backgroundColor: i%2===0?PALETTE.green:PALETTE.gold }} />
      ))}
    </div>
  );
}

// ─── Tech Stack Comic Strip ───────────────────────────────────────────────────
const PANELS = [
  { title: "Python", caption: "Scrapes LeetCode's GraphQL API at midnight...",
    speech: "Fetching 52 solutions!", icon: "🐍", color: "#3a6b4a" },
  { title: "Docker", caption: "Packages everything into a portable container",
    speech: "Works on MY machine AND yours.", icon: "🐳", color: "#2d5a8a" },
  { title: "AWS ECR", caption: "Stores the image in the cloud",
    speech: "I'll keep this safe.", icon: "📦", color: "#9b7a2f" },
  { title: "Lambda", caption: "Fires every 3 days automatically",
    speech: "No servers harmed!", icon: "λ", color: "#8b3a3a" },
  { title: "GitHub", caption: "Solutions appear in your repo",
    speech: "52 problems, committed.", icon: "🐙", color: "#1a1208" },
];

function TechStackComic() {
  return (
    <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "5rem 1.5rem" }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{ display: "flex", alignItems: "baseline", gap: "24px", marginBottom: "3rem" }}>
        <span style={{ fontFamily: "Playfair Display, serif",
          fontSize: "clamp(2rem,5vw,3.2rem)", color: PALETTE.dark }}>How it works</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: PALETTE.green, opacity: 0.55 }} />
      </motion.div>

      <div style={{ display: "flex", gap: 0, border: `2.5px solid ${PALETTE.dark}`, overflowX: "auto" }}>
        {PANELS.map((p, i) => (
          <motion.div key={p.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            style={{
              flex: "1 0 180px", borderRight: i < PANELS.length - 1 ? `2.5px solid ${PALETTE.dark}` : "none",
              position: "relative", overflow: "hidden",
              backgroundImage: `radial-gradient(circle, rgba(26,18,8,0.12) 1px, transparent 1px)`,
              backgroundSize: "8px 8px",
              backgroundColor: PALETTE.cream,
            }}
          >
            {/* Panel number */}
            <div style={{ position: "absolute", top: 6, left: 8,
              fontFamily: "'Courier New', monospace", fontSize: "10px",
              color: PALETTE.muted, fontWeight: "bold" }}>{i + 1}</div>

            <div style={{ padding: "28px 14px 16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 220 }}>
              {/* Icon */}
              <div style={{ fontSize: 32, textAlign: "center" }}>{p.icon}</div>

              {/* Speech bubble */}
              <div style={{
                backgroundColor: "white", border: `1.5px solid ${PALETTE.dark}`,
                borderRadius: "8px 8px 8px 2px", padding: "8px 10px", position: "relative",
              }}>
                <p style={{ fontFamily: "Caveat, cursive", fontSize: "13px",
                  color: PALETTE.dark, lineHeight: 1.4, margin: 0 }}>"{p.speech}"</p>
                <div style={{ position: "absolute", bottom: -7, left: 10,
                  width: 0, height: 0,
                  borderLeft: "6px solid transparent", borderRight: "4px solid transparent",
                  borderTop: `7px solid ${PALETTE.dark}` }} />
              </div>

              {/* Title */}
              <div style={{ marginTop: "auto" }}>
                <p style={{ fontFamily: "Playfair Display, serif", fontWeight: "bold",
                  fontSize: "15px", color: p.color, marginBottom: 4 }}>{p.title}</p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px",
                  color: PALETTE.muted, lineHeight: 1.5 }}>{p.caption}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <p style={{ fontFamily: "'Courier New', monospace", fontSize: "10px",
        color: PALETTE.muted, textAlign: "right", marginTop: 6, letterSpacing: "0.1em" }}>
        * no servers were harmed in the making of this project
      </p>
    </section>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [problemsByTopic, setProblemsByTopic] = useState({});

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);

  useEffect(() => {
    setTopics(ALL_TOPICS.map(name => ({ name })));
    const ghFetch = (url) => fetch(url, GITHUB_TOKEN ? { headers: { Authorization: `token ${GITHUB_TOKEN}` } } : {});

    ghFetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setLoading(false); return []; }
        const dirs = data.filter(d => d.type === "dir");
        return Promise.all(
          dirs.map(t =>
            ghFetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${t.name}`)
              .then(r => r.json())
              .then(ps => Array.isArray(ps) ? ps.map(p => ({ ...p, topic: t.name, difficulty: null })) : [])
          )
        );
      })
      .then(all => {
        if (!all) return;
        const flat = all.flat();
        setProblems(flat);
        const byTopic = {};
        flat.forEach(p => { byTopic[p.topic] = (byTopic[p.topic] || 0) + 1; });
        setProblemsByTopic(byTopic);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? problems : problems.filter(p => p.topic === filter);

  return (
    <div style={{ backgroundColor: PALETTE.page, minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <MouseCoffeeTrail />

      {/* Constellation background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <ConstellationBg />
      </div>

      {/* Coffee stains */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
        {STAINS.map((s, i) => <CoffeeRing key={i} {...s} />)}
      </div>

      {/* Hero */}
      <motion.section style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 2 }}
        className="px-8 md:px-16 pt-40 pb-24">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontFamily: "Caveat, cursive", color: PALETTE.green, fontSize: "20px", marginBottom: 14 }}>
          a collection of solutions
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          style={{ fontFamily: "Playfair Display, serif",
            fontSize: "clamp(3.5rem,10vw,8rem)", lineHeight: 0.95,
            color: PALETTE.dark, maxWidth: "900px" }}>
          LeetCode,<br />
          <em style={{ color: PALETTE.green }}>solved.</em>
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 36 }}>
          <div style={{ width: 1, height: 52, backgroundColor: "rgba(45,90,61,0.35)" }} />
          <p style={{ fontFamily: "Inter, sans-serif", color: "#6b5d4e",
            fontSize: 14, lineHeight: 1.9, maxWidth: 340 }}>
            Every accepted submission, organised by topic —<br />automatically synced from LeetCode.
          </p>
        </motion.div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ marginTop: 56, fontFamily: "Caveat, cursive",
            color: "rgba(45,90,61,0.45)", fontSize: 13, letterSpacing: "0.2em" }}>
          scroll ↓
        </motion.div>
      </motion.section>

      {/* Body */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ margin: "0 2rem", height: 1, backgroundColor: "rgba(45,90,61,0.18)" }} />
        <CrosswordTopics topics={topics} selected={filter} onSelect={setFilter} problemsByTopic={problemsByTopic} />
        <div style={{ margin: "0 2rem", height: 1, backgroundColor: "rgba(45,90,61,0.18)" }} />

        {/* Problems */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem", position: "relative" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
            justifyContent: "space-between", gap: 16, marginBottom: "3rem", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
              <motion.span
                key={filter}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(2rem,5vw,3.2rem)", color: PALETTE.dark, textTransform: "capitalize" }}>
                {filter === "All" ? "All problems" : filter.replace(/-/g, " ")}
              </motion.span>
              <span style={{ fontFamily: "Caveat, cursive", color: PALETTE.gold, fontSize: 20 }}>
                {loading ? "loading..." : `${filtered.length} shown`}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {filter !== "All" && <DataViz key={filter} topic={filter} />}
            </AnimatePresence>
          </div>

          {loading ? (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ fontFamily: "Caveat, cursive", fontSize: 22,
                color: PALETTE.muted, textAlign: "center", paddingTop: 60 }}>
              brewing your solutions...
            </motion.p>
          ) : (
            <motion.div layout style={{
              display: "grid", position: "relative", zIndex: 1,
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 4,
            }}>
              <AnimatePresence>
                {filtered.map((p, i) => <TornCard key={p.path} problem={p} index={i} />)}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <div style={{ margin: "0 2rem", height: 1, backgroundColor: "rgba(45,90,61,0.18)" }} />
        <TechStackComic />

        <footer style={{ textAlign: "center", padding: "32px", borderTop: `1px solid rgba(45,90,61,0.12)` }}>
          <p style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic",
            fontSize: 14, color: PALETTE.muted }}>
            built with python, docker & aws · synced every three days
          </p>
        </footer>
      </div>
    </div>
  );
}
