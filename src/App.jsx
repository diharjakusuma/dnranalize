import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// ─── GROQ API KEY — Ganti dengan key kamu dari console.groq.com ───
const GROQ_API_KEY = "GANTI_DENGAN_GROQ_API_KEY_KAMU";

const PAIRS = [
  "EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","USDCAD","NZDUSD",
  "EURGBP","EURJPY","EURCAD","EURAUD","EURNZD","EURCHF",
  "GBPJPY","GBPAUD","GBPCAD","GBPCHF","GBPNZD",
  "AUDJPY","AUDCAD","AUDCHF","AUDNZD","CADJPY","CHFJPY","NZDJPY",
  "XAUUSD","XAGUSD","USOIL","UKOIL",
  "USTEC","US30","US500",
  "BTCUSD","ETHUSD",
];
const GROUPS = {
  FX:     ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","USDCAD","NZDUSD"],
  CROSS:  ["EURGBP","EURJPY","EURCAD","EURAUD","EURNZD","EURCHF","GBPJPY","GBPAUD","GBPCAD","GBPCHF","GBPNZD","AUDJPY","AUDCAD","AUDCHF","AUDNZD","CADJPY","CHFJPY","NZDJPY"],
  METAL:  ["XAUUSD","XAGUSD"],
  ENERGY: ["USOIL","UKOIL"],
  INDEX:  ["USTEC","US30","US500"],
  CRYPTO: ["BTCUSD","ETHUSD"],
};
const PAIR_FLAGS = {
  EURUSD:"EU",GBPUSD:"GB",USDJPY:"JP",AUDUSD:"AU",USDCHF:"CH",USDCAD:"CA",NZDUSD:"NZ",
  EURGBP:"EG",EURJPY:"EJ",EURCAD:"EC",EURAUD:"EA",EURNZD:"EN",EURCHF:"EF",
  GBPJPY:"GJ",GBPAUD:"GA",GBPCAD:"GC",GBPCHF:"GF",GBPNZD:"GN",
  AUDJPY:"AJ",AUDCAD:"AC",AUDCHF:"AF",AUDNZD:"AN",CADJPY:"CJ",CHFJPY:"XJ",NZDJPY:"NJ",
  XAUUSD:"XAU",XAGUSD:"XAG",USOIL:"OIL",UKOIL:"OIL",
  USTEC:"NQ",US30:"DJ",US500:"SP",BTCUSD:"BTC",ETHUSD:"ETH",
};
const PAIR_NAMES = {
  EURUSD:"Euro / Dollar",GBPUSD:"Pound / Dollar",USDJPY:"Dollar / Yen",AUDUSD:"Aussie / Dollar",
  USDCHF:"Dollar / Franc",USDCAD:"Dollar / CAD",NZDUSD:"Kiwi / Dollar",
  EURGBP:"Euro / Pound",EURJPY:"Euro / Yen",EURCAD:"Euro / CAD",EURAUD:"Euro / Aussie",
  EURNZD:"Euro / Kiwi",EURCHF:"Euro / Franc",GBPJPY:"Pound / Yen",GBPAUD:"Pound / Aussie",
  GBPCAD:"Pound / CAD",GBPCHF:"Pound / Franc",GBPNZD:"Pound / Kiwi",
  AUDJPY:"Aussie / Yen",AUDCAD:"Aussie / CAD",AUDCHF:"Aussie / Franc",AUDNZD:"Aussie / Kiwi",
  CADJPY:"CAD / Yen",CHFJPY:"Franc / Yen",NZDJPY:"Kiwi / Yen",
  XAUUSD:"Gold / Dollar",XAGUSD:"Silver / Dollar",USOIL:"US Oil (WTI)",UKOIL:"UK Oil (Brent)",
  USTEC:"NASDAQ 100",US30:"Dow Jones 30",US500:"S&P 500",BTCUSD:"Bitcoin / Dollar",ETHUSD:"Ethereum / Dollar",
};
const TIMEFRAMES = ["M1","M5","M15","H1","H4","D1"];
const BASE_PRICES = {
  EURUSD:1.0845,GBPUSD:1.2734,USDJPY:154.21,AUDUSD:0.6412,USDCHF:0.9023,USDCAD:1.3650,NZDUSD:0.5980,
  EURGBP:0.8512,EURJPY:167.40,EURCAD:1.4801,EURAUD:1.6910,EURNZD:1.8130,EURCHF:0.9740,
  GBPJPY:196.60,GBPAUD:1.9870,GBPCAD:1.7390,GBPCHF:1.1440,GBPNZD:2.1290,
  AUDJPY:99.01,AUDCAD:0.8820,AUDCHF:0.5840,AUDNZD:1.0870,CADJPY:112.97,CHFJPY:170.80,NZDJPY:92.10,
  XAUUSD:2345.50,XAGUSD:28.40,USOIL:78.40,UKOIL:82.10,USTEC:18250.0,US30:39800.0,US500:5280.0,
  BTCUSD:67500.0,ETHUSD:3450.0,
};
const DIGITS = {
  EURUSD:5,GBPUSD:5,USDJPY:3,AUDUSD:5,USDCHF:5,USDCAD:5,NZDUSD:5,
  EURGBP:5,EURJPY:3,EURCAD:5,EURAUD:5,EURNZD:5,EURCHF:5,
  GBPJPY:3,GBPAUD:5,GBPCAD:5,GBPCHF:5,GBPNZD:5,
  AUDJPY:3,AUDCAD:5,AUDCHF:5,AUDNZD:5,CADJPY:3,CHFJPY:3,NZDJPY:3,
  XAUUSD:2,XAGUSD:3,USOIL:2,UKOIL:2,USTEC:1,US30:1,US500:1,BTCUSD:2,ETHUSD:2,
};

const VOL_MAP = {
  USDJPY:0.12,EURJPY:0.14,GBPJPY:0.18,AUDJPY:0.08,CADJPY:0.1,CHFJPY:0.13,NZDJPY:0.07,
  XAUUSD:2.0,XAGUSD:0.12,USOIL:0.3,UKOIL:0.32,USTEC:30,US30:70,US500:8,BTCUSD:200,ETHUSD:12,
};
const SPR_MAP = {
  XAUUSD:30,BTCUSD:50,USTEC:15,US30:20,USDJPY:2,EURJPY:2,GBPJPY:3,ETHUSD:5,USOIL:3,UKOIL:3,
};

// ─── Default SL/TP per instrument (fallback jika AI tidak return nilai) ───
// Nilai dalam PIPS sesuai karakteristik volatilitas masing-masing instrument
// ─── SL/TP default + buffer anti-SL-hunter per instrument ───
// sl   = SL base dari AI atau default (pips)
// tp   = TP target (pips)
// buf  = buffer tambahan di luar SL (pips) — untuk hindari spike/SL hunter
// SL final yang dikirim ke MT5 = sl + buf
const DEFAULT_SLTP = {
  // FX Major — spread rendah, buffer 5-8p
  EURUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  GBPUSD:{sl:40,  tp:80,  buf:8,   desc:"40+8p / 80p"},
  USDJPY:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  AUDUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  USDCHF:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  USDCAD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  NZDUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  // FX Cross — spread lebih lebar, buffer 8-15p
  EURGBP:{sl:25,  tp:50,  buf:8,   desc:"25+8p / 50p"},
  EURJPY:{sl:40,  tp:80,  buf:10,  desc:"40+10p / 80p"},
  EURCAD:{sl:35,  tp:70,  buf:10,  desc:"35+10p / 70p"},
  EURAUD:{sl:40,  tp:80,  buf:10,  desc:"40+10p / 80p"},
  EURNZD:{sl:40,  tp:80,  buf:10,  desc:"40+10p / 80p"},
  EURCHF:{sl:25,  tp:50,  buf:8,   desc:"25+8p / 50p"},
  GBPJPY:{sl:60,  tp:120, buf:15,  desc:"60+15p / 120p"},
  GBPAUD:{sl:55,  tp:110, buf:12,  desc:"55+12p / 110p"},
  GBPCAD:{sl:50,  tp:100, buf:12,  desc:"50+12p / 100p"},
  GBPCHF:{sl:40,  tp:80,  buf:10,  desc:"40+10p / 80p"},
  GBPNZD:{sl:55,  tp:110, buf:12,  desc:"55+12p / 110p"},
  AUDJPY:{sl:35,  tp:70,  buf:10,  desc:"35+10p / 70p"},
  AUDCAD:{sl:30,  tp:60,  buf:8,   desc:"30+8p / 60p"},
  AUDCHF:{sl:30,  tp:60,  buf:8,   desc:"30+8p / 60p"},
  AUDNZD:{sl:30,  tp:60,  buf:8,   desc:"30+8p / 60p"},
  CADJPY:{sl:35,  tp:70,  buf:10,  desc:"35+10p / 70p"},
  CHFJPY:{sl:35,  tp:70,  buf:10,  desc:"35+10p / 70p"},
  NZDJPY:{sl:35,  tp:70,  buf:10,  desc:"35+10p / 70p"},
  // Metals — noise tinggi, buffer 50-80p
  XAUUSD:{sl:200, tp:400, buf:60,  desc:"200+60p / 400p"},
  XAGUSD:{sl:150, tp:300, buf:40,  desc:"150+40p / 300p"},
  // Energy — spike sering, buffer 20-30p
  USOIL: {sl:100, tp:200, buf:25,  desc:"100+25p / 200p"},
  UKOIL: {sl:100, tp:200, buf:25,  desc:"100+25p / 200p"},
  // Indices — volatile, buffer 30-50p
  USTEC: {sl:150, tp:300, buf:40,  desc:"150+40p / 300p"},
  US30:  {sl:200, tp:400, buf:50,  desc:"200+50p / 400p"},
  US500: {sl:120, tp:240, buf:35,  desc:"120+35p / 240p"},
  // Crypto — ekstrem, buffer 200-300p
  BTCUSD:{sl:800, tp:1600,buf:250, desc:"800+250p / 1600p"},
  ETHUSD:{sl:400, tp:800, buf:150, desc:"400+150p / 800p"},
};

// Helper: get config for a symbol (with last-resort fallback)
function getDefaultSLTP(symbol) {
  return DEFAULT_SLTP[symbol] || {sl:50, tp:100, buf:10, desc:"50+10p / 100p"};
}

// Helper: calculate final SL with buffer
// If AI gives sl_pips, use that as base + symbol buffer
// If AI gives nothing, use table default + buffer
function calcFinalSL(symbol, aiSL) {
  const cfg = getDefaultSLTP(symbol);
  const base = (aiSL > 0) ? aiSL : cfg.sl;
  const total = base + cfg.buf;
  const source = aiSL > 0 ? "AI" : "default";
  return { total, base, buf: cfg.buf, source };
}

function getVol(s){ return VOL_MAP[s]||0.0007; }
function getSpr(s){ return SPR_MAP[s]||1.2; }

function generateMockCandles(symbol, count=80) {
  const base = BASE_PRICES[symbol]||1;
  const vol = getVol(symbol);
  const d = DIGITS[symbol]||5;
  const data = [];
  let price = base;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.49) * vol;
    const open = price;
    price += change;
    const high = Math.max(open, price) + Math.random() * vol * 0.4;
    const low  = Math.min(open, price) - Math.random() * vol * 0.4;
    data.push({
      time: new Date(now - i * 5 * 60000).toISOString(),
      open: +open.toFixed(d),
      high: +high.toFixed(d),
      low:  +low.toFixed(d),
      close: +price.toFixed(d),
      volume: Math.floor(Math.random() * 2000 + 300),
    });
  }
  return data;
}

function generateMockTick(symbol, prev) {
  const base = prev?.bid || BASE_PRICES[symbol]||1;
  const vol = getVol(symbol)*0.18;
  const d = DIGITS[symbol]||5;
  const pip = {XAUUSD:0.1,XAGUSD:0.01,USOIL:0.01,UKOIL:0.01,USTEC:1,US30:1,US500:0.1,BTCUSD:1,ETHUSD:0.1}[symbol]||0.0001;
  const bid = +(base + (Math.random()-0.49)*vol).toFixed(d);
  const spr = getSpr(symbol);
  const ask = +(bid + spr*pip).toFixed(d);
  return { symbol, bid, ask, spread: spr, time: new Date().toISOString(), digits: d };
}

async function analyzeWithClaude(symbol, candles, tick) {
  const recent = candles.slice(-20);
  const closes = recent.map(c => c.close);
  const last = closes[closes.length-1];
  const first = closes[0];
  const trend = last > first ? "naik" : "turun";
  const change = (((last - first)/first)*100).toFixed(3);
  const high20 = Math.max(...recent.map(c=>c.high));
  const low20  = Math.min(...recent.map(c=>c.low));

  const prompt = `Kamu adalah analis forex profesional. Berikan analisis teknikal singkat dalam Bahasa Indonesia.

Pair: ${symbol}
Bid: ${tick.bid} | Ask: ${tick.ask} | Spread: ${tick.spread} pips
20 candle terakhir (M5):
- Harga awal: ${first} → Harga saat ini: ${last}
- Trend: ${trend} ${change}%
- High 20 bar: ${high20} | Low 20 bar: ${low20}
- Close prices: ${closes.slice(-5).join(", ")}

Berikan:
1. Analisis trend (2 kalimat)
2. Level support & resistance penting
3. Sinyal: BUY / SELL / WAIT (dengan alasan singkat)
4. Saran SL dan TP (dalam pips)

Format output JSON seperti ini:
{
  "trend": "...",
  "support": ...,
  "resistance": ...,
  "signal": "BUY|SELL|WAIT",
  "signal_reason": "...",
  "sl_pips": ...,
  "tp_pips": ...,
  "confidence": "HIGH|MEDIUM|LOW",
  "summary": "..."
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: "Kamu analis forex profesional. Selalu jawab dalam format JSON valid saja, tanpa markdown, tanpa penjelasan tambahan di luar JSON." },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const clean = text.replace(/```json|```/g,"").trim();
    return JSON.parse(clean);
  } catch(e) {
    return { signal:"WAIT", summary:"Gagal mengambil analisis AI.", confidence:"LOW", trend:"—", sl_pips:0, tp_pips:0 };
  }
}

// Reusable Groq call for auto trading engine (supports timeframe param)
async function callGroqAI(symbol, candles, tick, tf="M5") {
  const closes = candles.slice(-20).map(c=>c.close);
  const last = closes[closes.length-1] || 0;
  const first = closes[0] || 0;
  const trend = last >= first ? "naik" : "turun";
  const change = first ? (((last-first)/first)*100).toFixed(3) : "0";
  const high20 = candles.length ? Math.max(...candles.slice(-20).map(c=>c.high)) : 0;
  const low20  = candles.length ? Math.min(...candles.slice(-20).map(c=>c.low))  : 0;

  const prompt = `Kamu analis forex. Analisis teknikal ${symbol} timeframe ${tf}.
Data: trend ${trend} ${change}%, high=${high20}, low=${low20}, closes terbaru: ${closes.slice(-5).join(", ")}.
Jawab JSON saja:
{"signal":"BUY|SELL|WAIT","confidence":"HIGH|MEDIUM|LOW","trend":"...","support":0,"resistance":0,"sl_pips":50,"tp_pips":100,"summary":"..."}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${GROQ_API_KEY}`},
      body: JSON.stringify({
        model:"llama-3.3-70b-versatile", max_tokens:400,
        messages:[
          {role:"system",content:"Jawab hanya JSON valid, tanpa markdown."},
          {role:"user",content:prompt}
        ]
      })
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content||"{}";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  } catch {
    return {signal:"WAIT",confidence:"LOW",trend:"—",sl_pips:50,tp_pips:100,summary:"Error"};
  }
}

function MiniChart({ data, color }) {
  if (!data || data.length < 2) return <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:11}}>No data</div>;
  const chartData = data.slice(-30).map((c,i)=>({ i, v: c.close }));
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={chartData} margin={{top:2,right:0,bottom:0,left:0}}>
        <defs>
          <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g${color.replace("#","")})`} dot={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MainChart({ data, symbol }) {
  if (!data || data.length < 2) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:260,color:"#475569",fontFamily:"monospace"}}>No chart data</div>;
  const chartData = data.map(c => ({ t: c.time.slice(11,16), v: c.close, h: c.high, l: c.low }));
  const vals = data.map(c=>c.close);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx-mn)*0.1;
  const color = vals[vals.length-1] >= vals[0] ? "#22d3ee" : "#f43f5e";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{top:10,right:8,bottom:0,left:8}}>
        <defs>
          <linearGradient id="mainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="t" tick={{fill:"#475569",fontSize:10,fontFamily:"monospace"}} tickLine={false} axisLine={false} interval={Math.floor(chartData.length/6)}/>
        <YAxis domain={[mn-pad, mx+pad]} tick={{fill:"#475569",fontSize:10,fontFamily:"monospace"}} tickLine={false} axisLine={false} width={60} tickFormatter={v=>v.toFixed(DIGITS[symbol]||5)}/>
        <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,fontFamily:"monospace",fontSize:11}} labelStyle={{color:"#94a3b8"}} itemStyle={{color}}/>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#mainGrad)" dot={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SignalBadge({ signal, confidence }) {
  const cfg = {
    BUY:  { bg:"#052e16", border:"#16a34a", text:"#4ade80", label:"▲ BUY" },
    SELL: { bg:"#2d0b0b", border:"#dc2626", text:"#f87171", label:"▼ SELL" },
    WAIT: { bg:"#1c1917", border:"#78716c", text:"#a8a29e", label:"◼ WAIT" },
  };
  const c = cfg[signal] || cfg.WAIT;
  return (
    <span style={{background:c.bg, border:`1px solid ${c.border}`, color:c.text, padding:"2px 10px", borderRadius:4, fontSize:12, fontFamily:"monospace", fontWeight:700, letterSpacing:1}}>
      {c.label}
    </span>
  );
}

function OrderPanel({ symbol, tick, onOrder, connected, demoMode, orderResult }) {
  const [vol, setVol] = useState("0.01");
  const [slPips, setSlPips] = useState("");
  const [tpPips, setTpPips] = useState("");

  const d = DIGITS[symbol] || 5;
  const pip = {XAUUSD:0.1,XAGUSD:0.01,USOIL:0.01,UKOIL:0.01,USTEC:1,US30:1,US500:0.1,BTCUSD:1,ETHUSD:0.1}[symbol]||0.0001;
  const sl = parseFloat(slPips) || 0;
  const tp = parseFloat(tpPips) || 0;

  const slBuy  = sl && tick ? +(tick.ask - sl * pip).toFixed(d) : null;
  const slSell = sl && tick ? +(tick.bid + sl * pip).toFixed(d) : null;
  const tpBuy  = tp && tick ? +(tick.ask + tp * pip).toFixed(d) : null;
  const tpSell = tp && tick ? +(tick.bid - tp * pip).toFixed(d) : null;
  const rr = sl && tp ? (tp/sl).toFixed(1) : null;

  const go = (action) => {
    if (!connected || demoMode) {
      onOrder(symbol, action, vol, 0, 0);
      return;
    }
    const slPrice = action==="BUY" ? (slBuy||0) : (slSell||0);
    const tpPrice = action==="BUY" ? (tpBuy||0) : (tpSell||0);
    onOrder(symbol, action, vol, slPrice, tpPrice);
  };

  const inpStyle = (color) => ({
    width:"100%", background:"#070e1d", border:`1px solid ${color}33`,
    borderRadius:4, padding:"6px 8px", color:"#e2e8f0",
    fontFamily:"monospace", fontSize:12, boxSizing:"border-box", outline:"none",
  });

  return (
    <div style={{background:"#0a1628",border:"1px solid #1e293b",borderRadius:8,padding:14,marginTop:12}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{color:"#64748b",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>QUICK ORDER — {symbol}</span>
        {!connected && <span style={{color:"#f97316",fontSize:9,fontFamily:"monospace"}}>⚠ DEMO ONLY</span>}
        {connected && <span style={{color:"#4ade80",fontSize:9,fontFamily:"monospace"}}>● LIVE</span>}
      </div>

      {/* BID / ASK display */}
      {tick && (
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:0,marginBottom:10,border:"1px solid #1e293b",borderRadius:6,overflow:"hidden"}}>
          <div style={{padding:"6px 10px",background:"#1a0a0a",textAlign:"center"}}>
            <div style={{color:"#64748b",fontSize:8,letterSpacing:1}}>BID</div>
            <div style={{color:"#f87171",fontSize:15,fontWeight:700,fontFamily:"monospace"}}>{tick.bid?.toFixed(d)}</div>
          </div>
          <div style={{padding:"6px 8px",background:"#0f172a",textAlign:"center",borderLeft:"1px solid #1e293b",borderRight:"1px solid #1e293b"}}>
            <div style={{color:"#64748b",fontSize:8}}>SPR</div>
            <div style={{color:"#475569",fontSize:11,fontFamily:"monospace"}}>{tick.spread}</div>
          </div>
          <div style={{padding:"6px 10px",background:"#0a1a0a",textAlign:"center"}}>
            <div style={{color:"#64748b",fontSize:8,letterSpacing:1}}>ASK</div>
            <div style={{color:"#4ade80",fontSize:15,fontWeight:700,fontFamily:"monospace"}}>{tick.ask?.toFixed(d)}</div>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div>
          <div style={{color:"#94a3b8",fontSize:9,fontFamily:"monospace",marginBottom:3,letterSpacing:1}}>LOT SIZE</div>
          <input value={vol} onChange={e=>setVol(e.target.value)} style={inpStyle("#94a3b8")}/>
          <div style={{color:"#475569",fontSize:8,marginTop:2}}>min 0.01</div>
        </div>
        <div>
          <div style={{color:"#f87171",fontSize:9,fontFamily:"monospace",marginBottom:3,letterSpacing:1}}>STOP LOSS</div>
          <input value={slPips} onChange={e=>setSlPips(e.target.value)} placeholder="pips" style={inpStyle("#f87171")}/>
          {sl > 0 && tick && (
            <div style={{color:"#f8717199",fontSize:8,marginTop:2,lineHeight:1.4}}>
              ▲{slBuy} / ▼{slSell}
            </div>
          )}
        </div>
        <div>
          <div style={{color:"#a78bfa",fontSize:9,fontFamily:"monospace",marginBottom:3,letterSpacing:1}}>TAKE PROFIT</div>
          <input value={tpPips} onChange={e=>setTpPips(e.target.value)} placeholder="pips" style={inpStyle("#a78bfa")}/>
          {tp > 0 && tick && (
            <div style={{color:"#a78bfa99",fontSize:8,marginTop:2,lineHeight:1.4}}>
              ▲{tpBuy} / ▼{tpSell}
            </div>
          )}
        </div>
      </div>

      {/* R:R ratio */}
      {rr && (
        <div style={{color:"#64748b",fontSize:9,fontFamily:"monospace",marginBottom:8}}>
          Risk:Reward = <span style={{color:"#22d3ee",fontWeight:700}}>1 : {rr}</span>
        </div>
      )}

      {/* BUY / SELL buttons */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button
          onClick={()=>go("BUY")}
          style={{padding:"10px 0",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"1px solid #16a34a55",borderRadius:6,color:"#fff",fontFamily:"monospace",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"opacity .15s"}}
          onMouseOver={e=>e.currentTarget.style.opacity=".85"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
          ▲ BUY<br/>
          <span style={{fontSize:10,opacity:.8}}>{tick?.ask?.toFixed(d)}</span>
        </button>
        <button
          onClick={()=>go("SELL")}
          style={{padding:"10px 0",background:"linear-gradient(135deg,#dc2626,#b91c1c)",border:"1px solid #dc262655",borderRadius:6,color:"#fff",fontFamily:"monospace",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:1,transition:"opacity .15s"}}
          onMouseOver={e=>e.currentTarget.style.opacity=".85"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
          ▼ SELL<br/>
          <span style={{fontSize:10,opacity:.8}}>{tick?.bid?.toFixed(d)}</span>
        </button>
      </div>

      {/* Result notification from parent */}
      {orderResult && (
        <div style={{marginTop:8,padding:"6px 10px",borderRadius:4,fontSize:10,fontFamily:"monospace",
          background:orderResult.ok?"#052e16":"#2d0b0b",
          border:`1px solid ${orderResult.ok?"#16a34a44":"#dc262644"}`,
          color:orderResult.ok?"#4ade80":"#f87171"}}>
          {orderResult.msg}
        </div>
      )}
    </div>
  );
}

function PairCard({ symbol, tick, candles, analysis, selected, analyzing, onSelect, onAnalyze }) {
  const prev = candles?.slice(-2,-1)[0]?.close;
  const cur  = tick?.bid;
  const isUp = cur && prev ? cur >= prev : true;
  const dayChange = candles?.length > 1
    ? (((cur - candles[0].close)/candles[0].close)*100).toFixed(2)
    : "0.00";
  const isPos = parseFloat(dayChange) >= 0;
  return (
    <div onClick={()=>onSelect(symbol)} style={{
      background: selected ? "#0f1f3a" : "#0a0f1e",
      border: `1px solid ${selected ? "#1e40af" : "#1e293b"}`,
      borderRadius:10, padding:"14px 16px", cursor:"pointer",
      transition:"all 0.2s", position:"relative",
      boxShadow: selected ? "0 0 0 1px #1d4ed8 inset, 0 4px 20px #1d4ed820" : "none",
    }}>
      {selected && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#1d4ed8,#06b6d4)",borderRadius:"10px 10px 0 0"}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16}}>{PAIR_FLAGS[symbol]}</span>
            <span style={{color:"#e2e8f0",fontFamily:"monospace",fontWeight:700,fontSize:14,letterSpacing:1}}>{symbol}</span>
          </div>
          <div style={{color:"#475569",fontSize:10,fontFamily:"monospace",marginTop:1}}>{PAIR_NAMES[symbol]}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color: isUp?"#22d3ee":"#f43f5e", fontFamily:"monospace", fontWeight:700, fontSize:18, letterSpacing:1}}>
            {tick ? tick.bid.toFixed(DIGITS[symbol]) : "—"}
          </div>
          <div style={{color: isPos?"#4ade80":"#f87171", fontSize:11, fontFamily:"monospace"}}>
            {isPos?"+":""}{dayChange}%
          </div>
        </div>
      </div>
      <MiniChart data={candles} color={isUp?"#22d3ee":"#f43f5e"}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <div style={{display:"flex",gap:12}}>
          <span style={{color:"#64748b",fontSize:10,fontFamily:"monospace"}}>ASK <span style={{color:"#94a3b8"}}>{tick?.ask?.toFixed(DIGITS[symbol])||"—"}</span></span>
          <span style={{color:"#64748b",fontSize:10,fontFamily:"monospace"}}>SPR <span style={{color:"#94a3b8"}}>{tick?.spread||"—"}</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {analysis && <SignalBadge signal={analysis.signal} confidence={analysis.confidence}/>}
          <button onClick={e=>{e.stopPropagation();onAnalyze(symbol);}} style={{
            background:"#1e293b",border:"1px solid #334155",color:analyzing?"#06b6d4":"#64748b",
            fontSize:10,fontFamily:"monospace",padding:"3px 8px",borderRadius:4,cursor:"pointer",letterSpacing:0.5,
          }}>
            {analyzing?"◌ AI...":"⚡ AI"}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{background:"#070e1d",borderTop:"1px solid #0f172a",padding:"5px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#2a2d38",fontSize:9,letterSpacing:2,fontFamily:"monospace"}}>DnR TERMINAL © 2026 — MT5 Web Dashboard</span>
        <span style={{color:"#2a2d38",fontSize:9,fontFamily:"monospace",letterSpacing:1}}>{new Date().toLocaleTimeString("id-ID")}</span>
      </div>
    </div>
  );
}

function PositionsTable({ positions, onClose }) {
  if (!positions?.length) return (
    <div style={{textAlign:"center",color:"#334155",fontFamily:"monospace",fontSize:12,padding:"20px 0"}}>
      Tidak ada posisi terbuka
    </div>
  );
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11}}>
        <thead>
          <tr style={{color:"#475569",borderBottom:"1px solid #1e293b"}}>
            {["Ticket","Symbol","Type","Vol","Open","Current","SL","TP","P&L",""].map(h=>(
              <th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:600,letterSpacing:0.5}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(p=>(
            <tr key={p.ticket} style={{borderBottom:"1px solid #0f172a",color:"#94a3b8"}}>
              <td style={{padding:"6px 8px",color:"#475569"}}>{p.ticket}</td>
              <td style={{padding:"6px 8px",color:"#e2e8f0",fontWeight:700}}>{p.symbol}</td>
              <td style={{padding:"6px 8px",color:p.type==="BUY"?"#4ade80":"#f87171",fontWeight:700}}>{p.type}</td>
              <td style={{padding:"6px 8px"}}>{p.volume}</td>
              <td style={{padding:"6px 8px"}}>{p.price_open}</td>
              <td style={{padding:"6px 8px"}}>{p.price_current}</td>
              <td style={{padding:"6px 8px",color:"#f97316"}}>{p.sl||"—"}</td>
              <td style={{padding:"6px 8px",color:"#a78bfa"}}>{p.tp||"—"}</td>
              <td style={{padding:"6px 8px",color:p.profit>=0?"#4ade80":"#f87171",fontWeight:700}}>
                {p.profit>=0?"+":""}{p.profit?.toFixed(2)}
              </td>
              <td style={{padding:"6px 8px"}}>
                <button onClick={()=>onClose(p.ticket)} style={{background:"#2d0b0b",border:"1px solid #7f1d1d",color:"#f87171",padding:"2px 8px",borderRadius:3,cursor:"pointer",fontSize:10,fontFamily:"monospace"}}>✕ Close</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [wsUrl, setWsUrl] = useState("ws://localhost:8765");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [demoMode, setDemoMode] = useState(true);
  const [ticks, setTicks] = useState({});
  const [candles, setCandles] = useState({});
  const [positions, setPositions] = useState([]);
  const [account, setAccount] = useState(null);
  const [selected, setSelected] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M5");
  const [analyses, setAnalyses] = useState({});
  const [analyzing, setAnalyzing] = useState({});
  const [tab, setTab] = useState("chart");
  const [group, setGroup] = useState("FX");

  // ── AUTO TRADING STATE ──
  const [autoEnabled, setAutoEnabled]     = useState(false);
  const [autoPairs, setAutoPairs]         = useState([]);       // pairs yg dipilih user
  const [autoLot, setAutoLot]             = useState("0.01");
  const [autoLog, setAutoLog]             = useState([]);       // activity log
  const [autoStatus, setAutoStatus]       = useState({});       // per-pair status
  const [lastCandleTime, setLastCandleTime] = useState({});    // track candle close

  const wsRef = useRef(null);
  const demoInterval = useRef(null);
  const autoRef = useRef(null);
  const autoPairsRef = useRef([]);
  const autoEnabledRef = useRef(false);
  const positionsRef = useRef([]);
  const autoLotRef = useRef("0.01");

  const startDemo = useCallback(() => {
    setDemoMode(true);
    const initCandles = {};
    const initTicks = {};
    PAIRS.forEach(p => {
      initCandles[p] = generateMockCandles(p, 80);
      initTicks[p] = generateMockTick(p, null);
    });
    setCandles(initCandles);
    setTicks(initTicks);
    setAccount({ balance:10000, equity:10050, free_margin:9500, profit:50, leverage:100, currency:"USD" });

    if (demoInterval.current) clearInterval(demoInterval.current);
    demoInterval.current = setInterval(() => {
      setTicks(prev => {
        const next = {};
        PAIRS.forEach(p => { next[p] = generateMockTick(p, prev[p]); });
        return next;
      });
      setCandles(prev => {
        const next = {...prev};
        PAIRS.forEach(p => {
          if (!next[p]) return;
          const last = next[p][next[p].length-1];
          const newClose = generateMockTick(p, {bid:last.close}).bid;
          next[p] = [...next[p].slice(-79), {
            ...last, close: newClose,
            high: Math.max(last.high, newClose),
            low:  Math.min(last.low,  newClose),
            time: new Date().toISOString(),
          }];
        });
        return next;
      });
    }, 1000);
  }, []);

  useEffect(() => { startDemo(); return ()=>clearInterval(demoInterval.current); }, [startDemo]);

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      setWsStatus("connected");
      setDemoMode(false);
      clearInterval(demoInterval.current);
      PAIRS.forEach(p => ws.send(JSON.stringify({type:"get_candles",symbol:p,timeframe,count:100})));
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "ticks") {
          setTicks(prev => ({...prev, ...msg.data}));
        } else if (msg.type === "candles") {
          setCandles(prev => ({...prev, [msg.symbol]: msg.data}));
        } else if (msg.type === "account" || msg.type === "init") {
          const pos = msg.positions || [];
          setPositions(pos);
          positionsRef.current = pos;
          setAccount(msg.account);
        } else if (msg.type === "order_result") {
          if (msg.success) {
            const resultMsg = `✓ ${msg.action||"Order"} berhasil! Ticket #${msg.ticket} @ ${msg.price}`;
            setOrderResult({ok:true, msg: resultMsg});
            // log auto trading activity
            addAutoLog(msg.symbol||"", msg.action||"ORDER", resultMsg, true);
            setAutoStatus(prev=>({...prev, [msg.symbol]:{
              lastAction: msg.action,
              lastTime: new Date().toLocaleTimeString("id-ID"),
              ticket: msg.ticket,
            }}));
            // refresh positions
            setTimeout(()=>{
              if(wsRef.current?.readyState===1)
                wsRef.current.send(JSON.stringify({type:"get_positions"}));
            }, 800);
          } else {
            const errMsg = `✗ Order gagal: ${msg.error||"Unknown error"}`;
            setOrderResult({ok:false, msg: errMsg});
            addAutoLog(msg.symbol||"", "ERROR", errMsg, false);
          }
          setTimeout(()=>setOrderResult(null), 6000);
        } else if (msg.type === "close_result") {
          if (msg.success) {
            setPositions(prev => prev.filter(p => p.ticket !== msg.ticket));
          }
        }
      } catch {}
    };
    ws.onerror = () => setWsStatus("error");
    ws.onclose = () => { setWsStatus("disconnected"); startDemo(); };
  }, [wsUrl, timeframe, startDemo]);

  const disconnect = () => {
    wsRef.current?.close();
    setWsStatus("disconnected");
    startDemo();
  };

  const handleAnalyze = async (symbol) => {
    setAnalyzing(p=>({...p,[symbol]:true}));
    const result = await analyzeWithClaude(symbol, candles[symbol]||[], ticks[symbol]||{});
    setAnalyses(p=>({...p,[symbol]:result}));
    setAnalyzing(p=>({...p,[symbol]:false}));
  };

  const analyzeAll = async () => {
    for (const p of PAIRS) await handleAnalyze(p);
  };

  const [orderResult, setOrderResult] = useState(null);

  // ── AUTO TRADING ENGINE ──
  const addAutoLog = (symbol, action, msg, ok) => {
    const entry = {
      time: new Date().toLocaleTimeString("id-ID"),
      symbol, action, msg, ok,
      id: Date.now(),
    };
    setAutoLog(prev => [entry, ...prev].slice(0, 100)); // keep last 100 logs
  };

  // Sync refs so interval can access latest state
  useEffect(()=>{ autoPairsRef.current = autoPairs; }, [autoPairs]);
  useEffect(()=>{ autoEnabledRef.current = autoEnabled; }, [autoEnabled]);
  useEffect(()=>{ autoLotRef.current = autoLot; }, [autoLot]);

  // ── H1 CANDLE CLOSE DETECTOR ──
  // Checks every 15s if the hour just changed (H1 candle closed)
  // H1 candle closes at XX:00:00 — we trigger during :00:00–:00:14
  useEffect(()=>{
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(()=>{
      if (!autoEnabledRef.current) return;
      const now = new Date();
      const hour = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();

      // H1 candle closes at the start of each new hour (:00:00)
      const isH1Close = (mins === 0) && (secs < 15);
      if (!isH1Close) return;

      // candleKey = unique per-hour, prevents double trigger
      const candleKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-H${hour}`;

      setLastCandleTime(prev=>{
        const pairs = autoPairsRef.current;
        pairs.forEach(sym=>{
          if (prev[sym] === candleKey) return; // already triggered this hour
          prev = {...prev, [sym]: candleKey};
          runAutoCheck(sym);
        });
        return {...prev};
      });
    }, 15000); // check every 15s
    return ()=>clearInterval(autoRef.current);
  }, [autoEnabled]);

  const runAutoCheck = async (symbol) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) {
      addAutoLog(symbol, "ERROR", `${symbol}: Tidak terhubung ke MT5`, false);
      return;
    }

    addAutoLog(symbol, "SCAN", `H1 candle close — scan ${symbol}`, null);

    try {
      // ── Guard: Cek posisi terbuka ──
      const hasPosition = positionsRef.current.some(p => p.symbol === symbol);
      if (hasPosition) {
        addAutoLog(symbol, "SKIP", `${symbol}: posisi sudah ada, skip`, null);
        return;
      }

      // ── Step 1: Fetch candles H1 ──
      wsRef.current.send(JSON.stringify({type:"get_candles", symbol, timeframe:"H1", count:100}));
      await new Promise(r=>setTimeout(r,2000));

      // ── Step 2: Analisis AI H1 ──
      addAutoLog(symbol, "AI", `${symbol}: analisis H1...`, null);
      const result = await callGroqAI(symbol, [], {}, "H1");

      addAutoLog(symbol, "H1",
        `${symbol} → ${result.signal} (${result.confidence}) | ${result.trend||""} | ${result.summary||""}`,
        result.signal !== "WAIT" ? true : null
      );

      // ── Step 3: Skip hanya kalau WAIT ──
      if (result.signal === "WAIT") {
        addAutoLog(symbol, "SKIP", `${symbol}: AI signal WAIT, tidak ada order`, null);
        return;
      }

      // ── Step 4: Hitung SL/TP + buffer ──
      const pip = {XAUUSD:0.1,XAGUSD:0.01,USOIL:0.01,UKOIL:0.01,USTEC:1,US30:1,US500:0.1,BTCUSD:1,ETHUSD:0.1}[symbol]||0.0001;
      const lot = parseFloat(autoLotRef.current) || 0.01;
      const cfg = getDefaultSLTP(symbol);

      const slInfo  = calcFinalSL(symbol, result.sl_pips || 0);
      const finalSL = slInfo.total;
      const finalTP = (result.tp_pips > 0) ? result.tp_pips : cfg.tp;
      const rr = (finalTP / finalSL).toFixed(2);

      addAutoLog(symbol, "SL/TP",
        `SL=${slInfo.base}p+buf${slInfo.buf}p=${finalSL}p | TP=${finalTP}p | R:R 1:${rr} [${slInfo.source}]`,
        null
      );

      // ── Step 5: Fire order ──
      wsRef.current.send(JSON.stringify({
        type:   "send_order",
        symbol,
        action: result.signal,
        volume: lot,
        sl:     finalSL * pip,
        tp:     finalTP * pip,
      }));

      addAutoLog(symbol, "ORDER",
        `🚀 ${result.signal} ${lot} lot ${symbol} | SL:${finalSL}p TP:${finalTP}p | R:R 1:${rr}`,
        null
      );

    } catch(err) {
      addAutoLog(symbol, "ERROR", `${symbol}: Exception — ${err.message}`, false);
    }
  };

  const handleAutoToggle = () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    if (next) {
      addAutoLog("SYSTEM", "START", `Auto trading dimulai — ${autoPairs.length} pairs aktif | H1 candle close | Entry: BUY/SELL langsung`, true);
    } else {
      addAutoLog("SYSTEM", "STOP", "Auto trading dihentikan", null);
    }
  };

  const toggleAutoPair = (sym) => {
    setAutoPairs(prev =>
      prev.includes(sym) ? prev.filter(p=>p!==sym) : [...prev, sym]
    );
  };

  const handleOrder = (symbol, action, volume, sl, tp) => {
    if (!demoMode && wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: "send_order",
        symbol, action,
        volume: parseFloat(volume) || 0.01,
        sl: parseFloat(sl) || 0,
        tp: parseFloat(tp) || 0,
      }));
      setOrderResult({ok:null, msg:`⟳ Mengirim ${action} ${volume} lot ${symbol}...`});
    } else {
      setOrderResult({ok:false, msg:"⚠ Demo mode — hubungkan ke MT5 untuk order nyata"});
      setTimeout(()=>setOrderResult(null), 4000);
    }
  };

  const handleClose = (ticket) => {
    if (!demoMode && wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({type:"close_position", ticket}));
    } else {
      setPositions(p=>p.filter(pos=>pos.ticket!==ticket));
    }
  };

  const statusColor = {connected:"#4ade80",connecting:"#fb923c",disconnected:"#475569",error:"#f87171"}[wsStatus];

  const connected = wsStatus === "connected";
  const stColor = {connected:"#00ff88",connecting:"#ffaa00",disconnected:"#444",error:"#ff4444"}[wsStatus];
  const filteredPairs = GROUPS[group] || PAIRS;
  const tick = ticks[selected];
  const d = DIGITS[selected] || 5;

  const connected = wsStatus === "connected";
  const stColor = {connected:"#39ff14",connecting:"#ffff00",disconnected:"#1a3a1a",error:"#ff0000"}[wsStatus];
  const filteredPairs = GROUPS[group] || PAIRS;
  const tick = ticks[selected];
  const d = DIGITS[selected] || 5;

  return (
    <div style={{background:"#000000",height:"100vh",overflow:"hidden",fontFamily:"'Share Tech Mono','Courier New',monospace",color:"#39ff14",display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#000}
        ::-webkit-scrollbar-thumb{background:#39ff1433}
        @keyframes matrix-rain{0%{transform:translateY(-100%);opacity:1}100%{transform:translateY(100vh);opacity:0}}
        @keyframes blink{0%,100%{opacity:1}49%{opacity:1}50%{opacity:0}}
        @keyframes flicker{0%,100%{opacity:1}93%{opacity:.85}94%{opacity:1}97%{opacity:.9}98%{opacity:1}}
        @keyframes scan{0%{top:-10%}100%{top:110%}}
        @keyframes glitch{0%,100%{text-shadow:2px 0 #ff0000,-2px 0 #0000ff}25%{text-shadow:-2px 0 #ff0000,2px 0 #0000ff}50%{text-shadow:2px 2px #ff0000,-2px -2px #0000ff}75%{text-shadow:0 0 #ff0000,0 0 #0000ff}}
        @keyframes type{from{width:0}to{width:100%}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse-green{0%,100%{box-shadow:0 0 4px #39ff14}50%{box-shadow:0 0 16px #39ff14,0 0 30px #39ff1444}}
        @keyframes scroll-up{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
        .hack-row:hover{background:#39ff1408!important;color:#fff!important}
        .hack-row.sel{background:#39ff1412!important;border-left:2px solid #39ff14!important}
        .hack-btn{background:none;border:1px solid #39ff1433;color:#39ff1488;font-family:'Share Tech Mono',monospace;font-size:9px;padding:2px 8px;cursor:pointer;letter-spacing:1px;text-transform:uppercase}
        .hack-btn:hover{border-color:#39ff14;color:#39ff14;background:#39ff1408}
        .hack-btn.active{border-color:#39ff14;color:#39ff14;background:#39ff1410}
        .hack-inp{background:#000;border:1px solid #39ff1433;color:#39ff14;font-family:'Share Tech Mono',monospace;font-size:11px;padding:5px 8px;width:100%;outline:none}
        .hack-inp:focus{border-color:#39ff14;box-shadow:0 0 8px #39ff1433}
        .tab{background:none;border:none;color:#1a5a1a;font-family:'Share Tech Mono',monospace;font-size:10px;padding:6px 14px;cursor:pointer;letter-spacing:2px;border-bottom:1px solid transparent}
        .tab.on{color:#39ff14;border-bottom:1px solid #39ff14}
        .tab:hover{color:#39ff1488}
        .grp{background:none;border:none;color:#1a4a1a;font-family:'Share Tech Mono',monospace;font-size:8px;padding:4px 6px;cursor:pointer;letter-spacing:1px}
        .grp.on{color:#39ff14;border-bottom:1px solid #39ff1466}
        .buy-btn{width:100%;padding:10px;background:#001a00;border:1px solid #39ff1444;color:#39ff14;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:2px;text-transform:uppercase}
        .buy-btn:hover{background:#003300;border-color:#39ff14;box-shadow:0 0 12px #39ff1422}
        .sell-btn{width:100%;padding:10px;background:#1a0000;border:1px solid #ff000044;color:#ff0000;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:2px;text-transform:uppercase}
        .sell-btn:hover{background:#330000;border-color:#ff0000;box-shadow:0 0 12px #ff000022}
        .tf{background:none;border:1px solid #1a3a1a;color:#1a5a1a;font-family:'Share Tech Mono',monospace;font-size:9px;padding:3px 7px;cursor:pointer;letter-spacing:1px}
        .tf.on{border-color:#39ff1444;color:#39ff14;background:#39ff1408}
      `}</style>

      {/* CRT SCANLINE */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,#00000022 0px,#00000022 1px,transparent 1px,transparent 4px)"}}/>
      {/* MOVING SCAN LINE */}
      <div style={{position:"fixed",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#39ff1411,transparent)",animation:"scan 6s linear infinite",zIndex:998,pointerEvents:"none"}}/>
      {/* VIGNETTE */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,transparent 60%,#000000cc 100%)",pointerEvents:"none",zIndex:997}}/>

      {/* ══ TOPBAR ══ */}
      <div style={{height:44,flexShrink:0,display:"flex",alignItems:"stretch",borderBottom:"1px solid #39ff1422",background:"#000",position:"relative",zIndex:10}}>

        {/* LOGO */}
        <div style={{padding:"0 16px",borderRight:"1px solid #39ff1422",display:"flex",alignItems:"center",gap:10,minWidth:170}}>
          <div style={{border:"1px solid #39ff14",padding:"2px 6px",animation:"pulse-green 2s infinite"}}>
            <span style={{fontFamily:"'VT323',monospace",fontSize:20,color:"#39ff14",letterSpacing:2,animation:"flicker 4s infinite"}}>DnR</span>
          </div>
          <div>
            <div style={{fontSize:8,color:"#39ff1466",letterSpacing:4}}>TERMINAL</div>
            <div style={{fontSize:7,color:"#1a3a1a",letterSpacing:2}}>v2.6.0_HACK</div>
          </div>
        </div>

        {/* STATUS */}
        <div style={{padding:"0 12px",borderRight:"1px solid #39ff1411",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,background:stColor,boxShadow:`0 0 8px ${stColor}`,animation:"blink 1s infinite"}}/>
          <span style={{fontSize:8,color:stColor,letterSpacing:2}}>{wsStatus.toUpperCase()}</span>
          <span style={{fontSize:7,color:demoMode?"#ffff0066":"#39ff1444",border:`1px solid ${demoMode?"#ffff0033":"#39ff1422"}`,padding:"1px 4px",letterSpacing:1}}>{demoMode?"//DEMO":"//LIVE"}</span>
        </div>

        {/* WS */}
        <div style={{padding:"0 10px",borderRight:"1px solid #39ff1411",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:8,color:"#1a5a1a"}}>$</span>
          <input value={wsUrl} onChange={e=>setWsUrl(e.target.value)} className="hack-inp" style={{width:155,fontSize:9,padding:"3px 6px"}}/>
          {connected
            ?<button className="hack-btn" onClick={()=>{wsRef.current?.close();setWsStatus("disconnected");startDemo();}} style={{borderColor:"#ff000033",color:"#ff000088"}}>KILL</button>
            :<button className="hack-btn" onClick={()=>{
                if(wsRef.current)wsRef.current.close();
                setWsStatus("connecting");
                const ws=new WebSocket(wsUrl);wsRef.current=ws;
                ws.onopen=()=>{setWsStatus("connected");setDemoMode(false);clearInterval(demoInterval.current);PAIRS.forEach(p=>ws.send(JSON.stringify({type:"get_candles",symbol:p,timeframe:timeframe,count:100})));};
                ws.onmessage=e=>{try{const msg=JSON.parse(e.data);
                  if(msg.type==="ticks")setTicks(prev=>({...prev,...msg.data}));
                  else if(msg.type==="candles")setCandles(prev=>({...prev,[msg.symbol]:msg.data}));
                  else if(msg.type==="account"||msg.type==="init"){const pos=msg.positions||[];setPositions(pos);positionsRef.current=pos;setAccount(msg.account);}
                  else if(msg.type==="order_result"){
                    if(msg.success){const rm=`[OK] ${msg.action} #${msg.ticket} @ ${msg.price}`;setOrderResult({ok:true,msg:rm});addAutoLog(msg.symbol||"","ORDER",rm,true);setAutoStatus(prev=>({...prev,[msg.symbol]:{lastAction:msg.action,lastTime:new Date().toLocaleTimeString(),ticket:msg.ticket}}));setTimeout(()=>{if(wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify({type:"get_positions"}));},800);}
                    else{setOrderResult({ok:false,msg:`[ERR] ${msg.error||"failed"}`});}
                    setTimeout(()=>setOrderResult(null),6000);
                  }
                  else if(msg.type==="close_result"){if(msg.success){setPositions(prev=>prev.filter(p=>p.ticket!==msg.ticket));positionsRef.current=positionsRef.current.filter(p=>p.ticket!==msg.ticket);}}
                }catch{}};
                ws.onerror=()=>setWsStatus("error");
                ws.onclose=()=>{setWsStatus("disconnected");startDemo();};
              }} style={{color:"#39ff14",borderColor:"#39ff1444"}}>EXEC</button>
          }
        </div>

        {/* ACCOUNT */}
        {account&&(
          <div style={{display:"flex",marginLeft:"auto"}}>
            {[
              ["[BAL]",`$${account.balance?.toLocaleString()}`,"#39ff1488"],
              ["[EQ]", `$${account.equity?.toLocaleString()}`,"#39ff14"],
              ["[PNL]",`${account.profit>=0?"+":""}$${account.profit?.toFixed(2)}`,account.profit>=0?"#39ff14":"#ff0000"],
            ].map(([k,v,c])=>(
              <div key={k} style={{padding:"0 12px",borderLeft:"1px solid #39ff1411",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"right"}}>
                <div style={{fontSize:7,color:"#1a4a1a",letterSpacing:1}}>{k}</div>
                <div style={{fontSize:11,color:c,letterSpacing:1,fontFamily:"'VT323',monospace"}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* CLOCK */}
        <div style={{padding:"0 12px",borderLeft:"1px solid #39ff1411",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-end"}}>
          <div style={{fontSize:7,color:"#1a4a1a",letterSpacing:2}}>[SYS_TIME]</div>
          <div style={{fontSize:13,color:"#39ff1066",fontFamily:"'VT323',monospace",letterSpacing:2}}>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div style={{display:"grid",gridTemplateColumns:"195px 1fr",flex:1,overflow:"hidden",position:"relative",zIndex:1}}>

        {/* ══ LEFT ══ */}
        <div style={{borderRight:"1px solid #39ff1418",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* group */}
          <div style={{display:"flex",borderBottom:"1px solid #39ff1415",flexShrink:0,background:"#000"}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} className={`grp${group===g?" on":""}`} onClick={()=>setGroup(g)}>{g}</button>
            ))}
          </div>

          {/* header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 56px",padding:"4px 8px",borderBottom:"1px solid #39ff1410",background:"#000",flexShrink:0}}>
            <span style={{fontSize:7,color:"#1a4a1a",letterSpacing:2}}>// SYMBOL</span>
            <span style={{fontSize:7,color:"#1a4a1a",letterSpacing:1,textAlign:"right"}}>PRICE</span>
          </div>

          {/* pairs */}
          <div style={{overflowY:"auto",flex:1,background:"#000"}}>
            {filteredPairs.map(sym=>{
              const t=ticks[sym],c=candles[sym];
              const isUp=t&&c?.length>1?t.bid>=c[0].close:true;
              const chg=c?.length>1?(((t?.bid-c[0].close)/c[0].close)*100):0;
              const isSel=selected===sym;
              const an=analyses[sym];
              const lst=autoStatus[sym];
              return(
                <div key={sym} className={`hack-row${isSel?" sel":""}`}
                  onClick={()=>{setSelected(sym);if(connected&&wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify({type:"get_candles",symbol:sym,timeframe:timeframe,count:100}));}}
                  style={{display:"grid",gridTemplateColumns:"1fr 56px",padding:"5px 8px",cursor:"pointer",borderBottom:"1px solid #39ff1408",borderLeft:"2px solid transparent"}}>
                  <div>
                    <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:1}}>
                      <span style={{fontSize:9,fontWeight:700,color:isSel?"#39ff14":"#2a6a2a",letterSpacing:.5}}>{sym}</span>
                      {an&&<span style={{fontSize:6,padding:"0 3px",border:`1px solid ${an.signal==="BUY"?"#39ff1444":an.signal==="SELL"?"#ff000044":"#333"}`,color:an.signal==="BUY"?"#39ff14":an.signal==="SELL"?"#ff0000":"#444"}}>{an.signal}</span>}
                      {lst&&<span style={{fontSize:7,color:lst.lastAction==="BUY"?"#39ff1488":"#ff000088"}}>{lst.lastAction==="BUY"?"▲":"▼"}</span>}
                    </div>
                    <span style={{fontSize:7,color:parseFloat(chg)>=0?"#39ff1055":"#ff000055"}}>{parseFloat(chg)>=0?"+":""}{chg.toFixed(2)}%</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:isUp?"#39ff14":"#ff0000",fontFamily:"'VT323',monospace",letterSpacing:.3}}>{t?t.bid.toFixed(DIGITS[sym]||5):"-.--"}</div>
                    <div style={{fontSize:6,color:"#1a3a1a"}}>{t?.spread&&`spd:${t.spread}`}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* auto status */}
          <div style={{borderTop:"1px solid #39ff1415",padding:"5px 8px",background:"#000",flexShrink:0}}>
            <div style={{fontSize:7,color:autoEnabled?"#39ff14":"#1a3a1a",letterSpacing:2,animation:autoEnabled?"blink 2s infinite":""}}>{autoEnabled?`> AUTO_TRADE [${autoPairs.length}P] RUNNING`:"> AUTO_TRADE IDLE"}</div>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#000"}}>

          {/* pair header */}
          <div style={{borderBottom:"1px solid #39ff1415",padding:"0 14px",height:46,display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
            <div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:22,color:"#39ff14",letterSpacing:4,animation:"glitch 8s infinite",lineHeight:1}}>{selected}</div>
              <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:2}}>{PAIR_NAMES[selected]?.toUpperCase()}</div>
            </div>
            <div style={{fontFamily:"'VT323',monospace",fontSize:26,color:tick?(ticks[selected]?.bid>=(candles[selected]?.[0]?.close||0)?"#39ff14":"#ff0000"):"#1a3a1a",letterSpacing:1}}>
              {tick?tick.bid.toFixed(d):"-.------"}
            </div>
            {tick&&<div style={{fontSize:8,color:"#1a5a1a"}}>ASK<br/><span style={{color:"#39ff1066",fontFamily:"'VT323',monospace",fontSize:13}}>{tick.ask?.toFixed(d)}</span></div>}

            {/* TF */}
            <div style={{display:"flex",gap:3,marginLeft:"auto"}}>
              {["M1","M5","M15","H1","H4","D1"].map(t=>(
                <button key={t} className={`tf${timeframe===t?" on":""}`} onClick={()=>{setTimeframe(t);if(connected)wsRef.current.send(JSON.stringify({type:"get_candles",symbol:selected,timeframe:t,count:100}));}}>{t}</button>
              ))}
            </div>
            <button className="hack-btn" onClick={()=>handleAnalyze(selected)} style={{color:"#39ff1088",borderColor:"#39ff1033"}}>
              {analyzing[selected]?"[PROC...]":"[AI_SCAN]"}
            </button>
          </div>

          {/* tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #39ff1411",background:"#000",flexShrink:0}}>
            <span style={{fontSize:7,color:"#1a3a1a",padding:"7px 10px",alignSelf:"center"}}>root@dnr:~$</span>
            {[["chart","chart.exe"],["positions",`positions.exe${positions.length?` [${positions.length}]`:""}`],["auto",`auto_trade.exe${autoEnabled?" [ON]":""}`]].map(([k,l])=>(
              <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {/* content */}
          <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8}}>

            {/* ── CHART ── */}
            {tab==="chart"&&(<>
              <div style={{border:"1px solid #39ff1418",background:"#000",padding:"6px 2px"}}>
                <div style={{fontSize:7,color:"#1a4a1a",padding:"0 8px",marginBottom:4,letterSpacing:2}}>// PRICE_CHART :: {selected} :: {timeframe}</div>
                <MainChart data={candles[selected]} symbol={selected}/>
              </div>

              {/* AI result */}
              {analyses[selected]&&(
                <div style={{border:"1px solid #39ff1420",background:"#000",padding:10,animation:"fadeIn .3s"}}>
                  <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:3,marginBottom:6}}>// AI_ANALYSIS_OUTPUT</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{
                      fontFamily:"'VT323',monospace",fontSize:16,letterSpacing:3,padding:"0 10px",
                      border:`1px solid ${analyses[selected].signal==="BUY"?"#39ff14":analyses[selected].signal==="SELL"?"#ff0000":"#333"}`,
                      color:analyses[selected].signal==="BUY"?"#39ff14":analyses[selected].signal==="SELL"?"#ff0000":"#444",
                      background:analyses[selected].signal==="BUY"?"#001a00":analyses[selected].signal==="SELL"?"#1a0000":"#111",
                    }}>{analyses[selected].signal}</span>
                    <span style={{fontSize:8,color:analyses[selected].confidence==="HIGH"?"#39ff14":analyses[selected].confidence==="MEDIUM"?"#ffff00":"#ff0000"}}>CONF:{analyses[selected].confidence}</span>
                    <span style={{fontSize:8,color:"#1a5a1a",marginLeft:"auto"}}>{timeframe}</span>
                  </div>
                  <div style={{fontSize:9,color:"#2a6a2a",lineHeight:1.7,marginBottom:6,borderLeft:"2px solid #39ff1433",paddingLeft:8}}>{analyses[selected].summary||analyses[selected].trend}</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:8}}>
                    {[["S//",analyses[selected].support,"#39ff1066"],["R//",analyses[selected].resistance,"#ff000066"],["SL",`${analyses[selected].sl_pips}p`,"#ffff0077"],["TP",`${analyses[selected].tp_pips}p`,"#00aaff77"]].map(([k,v,c])=>(
                      <span key={k} style={{color:"#1a4a1a"}}>{k} <b style={{color:c,fontFamily:"'VT323',monospace",fontSize:12}}>{v}</b></span>
                    ))}
                  </div>
                </div>
              )}

              {/* order */}
              <div style={{border:"1px solid #39ff1415",background:"#000",padding:10}}>
                <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:3,marginBottom:8}}>// EXECUTE_ORDER :: {selected}</div>
                {tick&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:0,marginBottom:8,border:"1px solid #39ff1418"}}>
                    <div style={{padding:"6px 8px",background:"#0d0000",textAlign:"center"}}>
                      <div style={{fontSize:6,color:"#3a1a1a",letterSpacing:2}}>BID</div>
                      <div style={{fontSize:16,color:"#ff0000",fontFamily:"'VT323',monospace",letterSpacing:1}}>{tick.bid?.toFixed(d)}</div>
                    </div>
                    <div style={{padding:"6px 8px",textAlign:"center",borderLeft:"1px solid #39ff1415",borderRight:"1px solid #39ff1415"}}>
                      <div style={{fontSize:6,color:"#1a3a1a"}}>SPD</div>
                      <div style={{fontSize:10,color:"#1a4a1a",fontFamily:"'VT323',monospace"}}>{tick.spread}</div>
                    </div>
                    <div style={{padding:"6px 8px",background:"#000d00",textAlign:"center"}}>
                      <div style={{fontSize:6,color:"#1a3a1a",letterSpacing:2}}>ASK</div>
                      <div style={{fontSize:16,color:"#39ff14",fontFamily:"'VT323',monospace",letterSpacing:1}}>{tick.ask?.toFixed(d)}</div>
                    </div>
                  </div>
                )}
                <OrderPanel symbol={selected} tick={tick} onOrder={handleOrder} connected={connected} demoMode={demoMode} orderResult={orderResult}/>
              </div>
            </>)}

            {/* ── POSITIONS ── */}
            {tab==="positions"&&(
              <div style={{border:"1px solid #39ff1415",background:"#000",padding:10}}>
                <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:3,marginBottom:8}}>// OPEN_POSITIONS [{positions.length}]</div>
                <PositionsTable positions={positions} onClose={handleClose}/>
              </div>
            )}

            {/* ── AUTO ── */}
            {tab==="auto"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>

                <div style={{border:`1px solid ${autoEnabled?"#39ff1444":"#39ff1415"}`,background:"#000",padding:10}}>
                  <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:3,marginBottom:8}}>// AUTO_TRADE_ENGINE</div>
                  <div style={{fontFamily:"'VT323',monospace",fontSize:13,color:"#1a5a1a",marginBottom:8,lineHeight:1.6}}>
                    <span style={{color:"#39ff1044"}}>$</span> trigger    = H1_CANDLE_CLOSE<br/>
                    <span style={{color:"#39ff1044"}}>$</span> model      = groq/llama-3.3-70b<br/>
                    <span style={{color:"#39ff1044"}}>$</span> filter     = SKIP_IF_WAIT<br/>
                    <span style={{color:"#39ff1044"}}>$</span> sl_mode    = AI + BUFFER_ANTI_HUNTER<br/>
                    <span style={{color:"#39ff1044"}}>$</span> max_pos    = 1_PER_PAIR<br/>
                    <span style={{color:"#39ff1044"}}>$</span> status     = <span style={{color:autoEnabled?"#39ff14":"#ff0000",animation:autoEnabled?"blink 1s infinite":""}}>{autoEnabled?"RUNNING":"STOPPED"}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:7,color:"#1a4a1a",letterSpacing:2,marginBottom:3}}>LOT_SIZE</div>
                      <input className="hack-inp" value={autoLot} onChange={e=>setAutoLot(e.target.value)} disabled={autoEnabled} style={{opacity:autoEnabled?0.3:1}}/>
                    </div>
                    <div style={{border:"1px solid #39ff1415",padding:"6px 8px"}}>
                      <div style={{fontSize:7,color:"#1a4a1a",letterSpacing:2,marginBottom:3}}>SL_BUFFER_TABLE</div>
                      <div style={{fontFamily:"'VT323',monospace",fontSize:11,color:"#1a4a1a",lineHeight:1.5}}>
                        FX_MAJ: +6p &nbsp;| CROSS: +10-15p<br/>
                        METALS: +40-60p | ENERGY: +25p<br/>
                        INDEX:  +35-50p | CRYPTO: +150-250p
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <button onClick={handleAutoToggle} disabled={autoPairs.length===0} style={{
                      padding:"7px 18px",border:`1px solid ${autoEnabled?"#ff000066":"#39ff1466"}`,
                      color:autoEnabled?"#ff0000":"#39ff14",background:autoEnabled?"#0d0000":"#001a00",
                      fontFamily:"'Share Tech Mono',monospace",fontSize:10,cursor:autoPairs.length===0?"not-allowed":"pointer",
                      letterSpacing:2,opacity:autoPairs.length===0?0.3:1,
                    }}>{autoEnabled?"[TERMINATE]":"[INITIALIZE]"}</button>
                    <span style={{fontSize:8,color:"#1a4a1a"}}>pairs_active=<span style={{color:"#39ff1066"}}>{autoPairs.length}</span> &nbsp;positions=<span style={{color:"#ffff0066"}}>{positions.length}</span></span>
                  </div>
                  {autoPairs.length===0&&<div style={{marginTop:6,fontSize:7,color:"#ff000044",letterSpacing:1}}>ERROR: no pairs selected — cannot initialize</div>}
                </div>

                {/* pair selector */}
                <div style={{border:"1px solid #39ff1415",background:"#000",padding:10}}>
                  <div style={{fontSize:7,color:"#1a5a1a",letterSpacing:3,marginBottom:8}}>// SELECT_PAIRS [{autoPairs.length} ACTIVE]</div>
                  {Object.entries(GROUPS).map(([g,gp])=>(
                    <div key={g} style={{marginBottom:8}}>
                      <div style={{fontSize:7,color:"#1a3a1a",letterSpacing:3,marginBottom:4}}>[{g}]</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                        {gp.map(sym=>{
                          const on=autoPairs.includes(sym);
                          const hp=positions.some(p=>p.symbol===sym);
                          const def=getDefaultSLTP(sym);
                          const lst=autoStatus[sym];
                          return(
                            <div key={sym}>
                              <button onClick={()=>!autoEnabled&&toggleAutoPair(sym)}
                                title={`SL:${def.sl}+${def.buf}p | TP:${def.tp}p`}
                                style={{padding:"2px 6px",fontSize:8,border:`1px solid ${on?"#39ff1444":"#1a3a1a"}`,background:on?"#001a00":"transparent",color:on?"#39ff14":"#1a5a1a",cursor:autoEnabled?"not-allowed":"pointer",opacity:autoEnabled&&!on?0.2:1,fontFamily:"'Share Tech Mono',monospace",letterSpacing:.5}}>
                                {sym}{hp&&<span style={{color:"#39ff14"}}>·</span>}{lst&&<span style={{color:lst.lastAction==="BUY"?"#39ff14":"#ff0000",fontSize:7}}>{lst.lastAction==="BUY"?"▲":"▼"}</span>}
                              </button>
                              {on&&<div style={{fontSize:6,color:"#39ff1033",textAlign:"center",marginTop:1}}>{def.sl}+{def.buf}p</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* log */}
                <div style={{border:"1px solid #39ff1415",background:"#000",padding:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:7,color:"#1a5a1a",letterSpacing:3}}>// SYSTEM_LOG [{autoLog.length}]</span>
                    <button className="hack-btn" onClick={()=>setAutoLog([])} style={{fontSize:7,padding:"1px 6px"}}>CLR</button>
                  </div>
                  <div style={{maxHeight:260,overflowY:"auto",fontFamily:"'VT323',monospace",fontSize:12}}>
                    {autoLog.length===0&&<div style={{color:"#1a3a1a",letterSpacing:2,padding:"10px 0"}}>{">"} AWAITING INPUT...</div>}
                    {autoLog.map(log=>(
                      <div key={log.id} style={{display:"grid",gridTemplateColumns:"52px 54px 54px 1fr",gap:4,padding:"2px 0",borderBottom:"1px solid #39ff1408",color:log.ok===true?"#39ff14":log.ok===false?"#ff0000":"#2a6a2a",animation:"fadeIn .2s"}}>
                        <span style={{color:"#1a4a1a"}}>{log.time}</span>
                        <span style={{color:"#39ff1088"}}>{log.symbol}</span>
                        <span style={{color:log.action==="ORDER"?"#39ff14":log.action==="ERROR"?"#ff0000":log.action==="SKIP"?"#1a4a1a":"#2a5a2a",fontWeight:700}}>{log.action}</span>
                        <span style={{color:"#2a5a2a",fontSize:10}}>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* footer */}
          <div style={{borderTop:"1px solid #39ff1411",padding:"3px 12px",display:"flex",justifyContent:"space-between",background:"#000",flexShrink:0}}>
            <span style={{fontSize:7,color:"#1a3a1a",letterSpacing:2,animation:"blink 3s infinite"}}>root@dnr-terminal:~$ <span style={{animation:"blink .8s infinite"}}>_</span></span>
            <span style={{fontSize:7,color:"#1a3a1a",letterSpacing:2}}>{demoMode?"//DEMO_ENV":"//LIVE_ENV"} | DnR © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
