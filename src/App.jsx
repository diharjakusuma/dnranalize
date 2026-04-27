import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// ─── GROQ API KEY — Ganti dengan key kamu dari console.groq.com ───
const GROQ_API_KEY = "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";

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

  return (
    <div style={{
      background:"#020408",
      height:"100vh",
      overflow:"hidden",
      fontFamily:"'JetBrains Mono',monospace",
      color:"#e0e0e0",
      display:"flex",
      flexDirection:"column",
      position:"relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&family=Orbitron:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px;height:2px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ffffff11;border-radius:1px}
        input,select{outline:none!important}
        button{transition:all .15s}
        button:hover{opacity:.8}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes flicker{0%,100%{opacity:1}92%{opacity:.95}94%{opacity:.8}96%{opacity:.95}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{text-shadow:0 0 8px #00ff8888}50%{text-shadow:0 0 20px #00ff88cc,0 0 40px #00ff8844}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .pair-row:hover{background:#ffffff06!important}
        .pair-row.active{background:#00ff8808!important;border-left:2px solid #00ff88!important}
        .tab-btn{background:none;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;padding:8px 14px;color:#333;border-bottom:1px solid transparent;transition:all .2s}
        .tab-btn.active{color:#00ff88;border-bottom:1px solid #00ff88}
        .tab-btn:hover{color:#666}
        .tf-btn{background:none;border:1px solid #111;color:#333;font-family:'JetBrains Mono',monospace;font-size:9px;padding:3px 8px;border-radius:2px;cursor:pointer;letter-spacing:1px}
        .tf-btn.active{border-color:#00ff8844;color:#00ff88;background:#00ff8808}
        .grp-btn{background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;padding:5px 6px;color:#222;cursor:pointer;border-bottom:1px solid transparent}
        .grp-btn.active{color:#00ff88;border-bottom:1px solid #00ff88}
        .order-btn-buy{background:linear-gradient(135deg,#00311a,#004d28);border:1px solid #00ff8833;color:#00ff88;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;letter-spacing:2px;cursor:pointer;padding:10px;border-radius:3px;width:100%}
        .order-btn-buy:hover{background:linear-gradient(135deg,#004d28,#006635);border-color:#00ff8866}
        .order-btn-sell{background:linear-gradient(135deg,#310000,#4d0000);border:1px solid #ff444433;color:#ff4444;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;letter-spacing:2px;cursor:pointer;padding:10px;border-radius:3px;width:100%}
        .order-btn-sell:hover{background:linear-gradient(135deg,#4d0000,#660000);border-color:#ff444466}
        .inp{background:#080e1a;border:1px solid #ffffff0d;color:#e0e0e0;font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 8px;border-radius:2px;width:100%}
        .inp:focus{border-color:#00ff8833}
      `}</style>

      {/* SCANLINE EFFECT */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,#00000018 2px,#00000018 4px)",mixBlendMode:"overlay"}}/>

      {/* GRID BACKGROUND */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,
        backgroundImage:"linear-gradient(#00ff8804 1px,transparent 1px),linear-gradient(90deg,#00ff8804 1px,transparent 1px)",
        backgroundSize:"40px 40px"
      }}/>

      {/* ══ TOPBAR ══ */}
      <div style={{
        position:"relative",zIndex:10,
        height:42,flexShrink:0,
        display:"flex",alignItems:"center",gap:0,
        borderBottom:"1px solid #00ff8815",
        background:"linear-gradient(90deg,#020c06,#020408,#020408,#020c06)",
      }}>
        {/* LOGO */}
        <div style={{padding:"0 16px",borderRight:"1px solid #00ff8815",height:"100%",display:"flex",alignItems:"center",gap:10,minWidth:160}}>
          <div style={{
            width:28,height:28,
            background:"linear-gradient(135deg,#00ff88,#00cc6a)",
            clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>
            <span style={{color:"#000",fontSize:11,fontWeight:900,fontFamily:"'Orbitron',monospace"}}>D</span>
          </div>
          <div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:700,color:"#00ff88",letterSpacing:3,lineHeight:1,animation:"flicker 8s infinite"}}>DnR</div>
            <div style={{fontSize:7,color:"#00ff8844",letterSpacing:4}}>TERMINAL</div>
          </div>
        </div>

        {/* CONNECTION */}
        <div style={{padding:"0 14px",borderRight:"1px solid #ffffff08",height:"100%",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:stColor,boxShadow:`0 0 6px ${stColor}`,animation:wsStatus==="connecting"?"pulse 1s infinite":"none"}}/>
          <span style={{fontSize:9,color:stColor,letterSpacing:2}}>{wsStatus.toUpperCase()}</span>
          <span style={{fontSize:8,color:demoMode?"#ffaa00":"#00ff8866",letterSpacing:1,marginLeft:4,border:`1px solid ${demoMode?"#ffaa0033":"#00ff8822"}`,padding:"1px 5px",borderRadius:1}}>{demoMode?"DEMO":"LIVE"}</span>
        </div>

        {/* WS INPUT */}
        <div style={{padding:"0 10px",borderRight:"1px solid #ffffff08",height:"100%",display:"flex",alignItems:"center",gap:6}}>
          <input value={wsUrl} onChange={e=>setWsUrl(e.target.value)} className="inp" style={{width:160,fontSize:9,padding:"4px 7px",background:"#00000044"}}/>
          {connected
            ? <button onClick={()=>{wsRef.current?.close();setWsStatus("disconnected");startDemo();}} style={{background:"#1a0000",border:"1px solid #ff444433",color:"#ff4444",fontSize:8,padding:"3px 8px",borderRadius:2,cursor:"pointer",letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>DISCONNECT</button>
            : <button onClick={()=>{
                if(wsRef.current)wsRef.current.close();
                setWsStatus("connecting");
                const ws=new WebSocket(wsUrl);wsRef.current=ws;
                ws.onopen=()=>{setWsStatus("connected");setDemoMode(false);clearInterval(demoInterval.current);PAIRS.forEach(p=>ws.send(JSON.stringify({type:"get_candles",symbol:p,timeframe:timeframe,count:100})));};
                ws.onmessage=e=>{try{const msg=JSON.parse(e.data);
                  if(msg.type==="ticks")setTicks(prev=>({...prev,...msg.data}));
                  else if(msg.type==="candles"){setCandles(prev=>({...prev,[msg.symbol]:msg.data}));}
                  else if(msg.type==="account"||msg.type==="init"){const pos=msg.positions||[];setPositions(pos);positionsRef.current=pos;setAccount(msg.account);}
                  else if(msg.type==="order_result"){
                    if(msg.success){const rm=`✓ ${msg.action} #${msg.ticket} @ ${msg.price}`;setOrderResult({ok:true,msg:rm});addAutoLog(msg.symbol||"","ORDER",rm,true);setAutoStatus(prev=>({...prev,[msg.symbol]:{lastAction:msg.action,lastTime:new Date().toLocaleTimeString("id-ID"),ticket:msg.ticket}}));setTimeout(()=>{if(wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify({type:"get_positions"}));},800);}
                    else{setOrderResult({ok:false,msg:`✗ ${msg.error||"Order gagal"}`});}
                    setTimeout(()=>setOrderResult(null),6000);
                  }
                  else if(msg.type==="close_result"){if(msg.success){setPositions(prev=>prev.filter(p=>p.ticket!==msg.ticket));positionsRef.current=positionsRef.current.filter(p=>p.ticket!==msg.ticket);}}
                }catch{}};
                ws.onerror=()=>setWsStatus("error");
                ws.onclose=()=>{setWsStatus("disconnected");startDemo();};
              }} style={{background:"#001a0d",border:"1px solid #00ff8833",color:"#00ff88",fontSize:8,padding:"3px 8px",borderRadius:2,cursor:"pointer",letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>CONNECT</button>
          }
        </div>

        {/* ACCOUNT */}
        {account && (
          <div style={{marginLeft:"auto",display:"flex",gap:0,height:"100%"}}>
            {[
              ["BAL", `$${account.balance?.toLocaleString()}`, "#888"],
              ["EQ",  `$${account.equity?.toLocaleString()}`,  "#00ff88"],
              ["P&L", `${account.profit>=0?"+":""}$${account.profit?.toFixed(2)}`, account.profit>=0?"#00ff88":"#ff4444"],
            ].map(([k,v,c])=>(
              <div key={k} style={{padding:"0 14px",borderLeft:"1px solid #ffffff06",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"right"}}>
                <div style={{fontSize:7,color:"#333",letterSpacing:2}}>{k}</div>
                <div style={{fontSize:11,color:c,fontWeight:700,letterSpacing:1}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* CLOCK */}
        <div style={{padding:"0 14px",borderLeft:"1px solid #ffffff06",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-end"}}>
          <div style={{fontSize:8,color:"#222",letterSpacing:2}}>SERVER</div>
          <div style={{fontSize:11,color:"#333",fontFamily:"'Orbitron',monospace",letterSpacing:1}}>{new Date().toLocaleTimeString("id-ID")}</div>
        </div>
      </div>

      {/* ══ MAIN LAYOUT ══ */}
      <div style={{display:"grid",gridTemplateColumns:"200px 1fr",flex:1,overflow:"hidden",position:"relative",zIndex:1}}>

        {/* ══ LEFT SIDEBAR ══ */}
        <div style={{borderRight:"1px solid #00ff8810",display:"flex",flexDirection:"column",overflow:"hidden",background:"#020408"}}>

          {/* Group tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #00ff8810",flexShrink:0}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} className={`grp-btn${group===g?" active":""}`} onClick={()=>setGroup(g)}>{g}</button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 52px",padding:"5px 8px",borderBottom:"1px solid #00ff8808",flexShrink:0}}>
            <span style={{fontSize:7,color:"#222",letterSpacing:2}}>INSTRUMENT</span>
            <span style={{fontSize:7,color:"#222",letterSpacing:1,textAlign:"right"}}>PRICE</span>
          </div>

          {/* Pair list */}
          <div style={{overflowY:"auto",flex:1}}>
            {filteredPairs.map(sym=>{
              const t=ticks[sym],c=candles[sym];
              const isUp=t&&c?.length>1?t.bid>=c[0].close:true;
              const chg=c?.length>1?(((t?.bid-c[0].close)/c[0].close)*100):0;
              const isActive=selected===sym;
              const an=analyses[sym];
              return(
                <div key={sym} className={`pair-row${isActive?" active":""}`}
                  onClick={()=>{setSelected(sym);if(connected&&wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify({type:"get_candles",symbol:sym,timeframe:timeframe,count:100}));}}
                  style={{display:"grid",gridTemplateColumns:"1fr 52px",padding:"5px 8px",cursor:"pointer",borderBottom:"1px solid #ffffff03",borderLeft:"2px solid transparent",animation:isActive?"slideIn .2s ease":""}}
                >
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                      <span style={{fontSize:10,fontWeight:700,color:isActive?"#00ff88":"#aaa",letterSpacing:.5}}>{sym}</span>
                      {an&&<span style={{fontSize:7,padding:"0 3px",borderRadius:1,background:an.signal==="BUY"?"#00ff8822":an.signal==="SELL"?"#ff444422":"#ffffff11",color:an.signal==="BUY"?"#00ff88":an.signal==="SELL"?"#ff4444":"#555",letterSpacing:1}}>{an.signal}</span>}
                      {autoStatus[sym]&&<span style={{fontSize:7,color:autoStatus[sym].lastAction==="BUY"?"#00ff88":"#ff4444"}}>{autoStatus[sym].lastAction==="BUY"?"▲":"▼"}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:8,color:parseFloat(chg)>=0?"#00ff8866":"#ff444466"}}>{parseFloat(chg)>=0?"+":""}{chg.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,fontWeight:700,color:isUp?"#00ff88":"#ff4444",letterSpacing:.3}}>{t?t.bid.toFixed(DIGITS[sym]||5):"—"}</div>
                    <div style={{fontSize:7,color:"#222"}}>{t?.spread||""}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto indicator */}
          <div style={{borderTop:"1px solid #00ff8810",padding:"6px 10px",background:"#020408",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:8,color:autoEnabled?"#00ff88":"#222",letterSpacing:2,animation:autoEnabled?"glow 2s infinite":"none"}}>
                {autoEnabled?"● AUTO ON":"○ AUTO"}
              </span>
              <span style={{fontSize:8,color:"#222"}}>{autoPairs.length} pairs</span>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#020408"}}>

          {/* Pair header */}
          <div style={{borderBottom:"1px solid #00ff8810",padding:"0 16px",height:50,display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
            <div>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,color:"#00ff88",letterSpacing:3,lineHeight:1}}>{selected}</div>
              <div style={{fontSize:8,color:"#333",letterSpacing:2,marginTop:2}}>{PAIR_NAMES[selected]}</div>
            </div>
            <div style={{fontSize:22,fontWeight:700,color:tick?(ticks[selected]?.bid>=(candles[selected]?.[0]?.close||0)?"#00ff88":"#ff4444"):"#333",fontFamily:"'Orbitron',monospace",letterSpacing:1}}>
              {tick?tick.bid.toFixed(d):"———"}
            </div>
            {tick&&<div style={{fontSize:9,color:"#333"}}>ASK <span style={{color:"#00ff8866"}}>{tick.ask?.toFixed(d)}</span></div>}

            {/* Timeframes */}
            <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
              {["M1","M5","M15","H1","H4","D1"].map(t=>(
                <button key={t} className={`tf-btn${timeframe===t?" active":""}`} onClick={()=>{setTimeframe(t);if(connected)wsRef.current.send(JSON.stringify({type:"get_candles",symbol:selected,timeframe:t,count:100}));}}>{t}</button>
              ))}
            </div>

            {/* Analyze button */}
            <button onClick={()=>handleAnalyze(selected)} style={{background:"#00ff8808",border:"1px solid #00ff8822",color:"#00ff8888",fontSize:9,padding:"4px 10px",borderRadius:2,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>
              {analyzing[selected]?"◌ AI...":"⚡ AI"}
            </button>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #00ff8808",flexShrink:0}}>
            {[["chart","CHART"],["positions",`POSITIONS${positions.length?` [${positions.length}]`:""}`],["auto",`AUTO${autoEnabled?" ●":""}`]].map(([k,l])=>(
              <button key={k} className={`tab-btn${tab===k?" active":""}`} onClick={()=>setTab(k)} style={{color:tab===k?"#00ff88":k==="auto"&&autoEnabled?"#00ff8844":"#333"}}>{l}</button>
            ))}
          </div>

          {/* ── CONTENT ── */}
          <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:10}}>

            {/* ══ CHART TAB ══ */}
            {tab==="chart"&&(
              <>
                {/* Chart */}
                <div style={{background:"#030810",border:"1px solid #00ff8810",borderRadius:3,padding:"8px 4px"}}>
                  <MainChart data={candles[selected]} symbol={selected}/>
                </div>

                {/* AI Result */}
                {analyses[selected]&&(
                  <div style={{background:"#030810",border:"1px solid #00ff8815",borderRadius:3,padding:12,animation:"fadeUp .3s ease"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:8,color:"#00ff8844",letterSpacing:3}}>AI SIGNAL</span>
                      <span style={{
                        fontSize:11,fontWeight:700,letterSpacing:2,padding:"2px 10px",borderRadius:1,
                        background:analyses[selected].signal==="BUY"?"#00ff8815":analyses[selected].signal==="SELL"?"#ff444415":"#ffffff08",
                        border:`1px solid ${analyses[selected].signal==="BUY"?"#00ff8833":analyses[selected].signal==="SELL"?"#ff444433":"#333"}`,
                        color:analyses[selected].signal==="BUY"?"#00ff88":analyses[selected].signal==="SELL"?"#ff4444":"#555",
                      }}>{analyses[selected].signal}</span>
                      <span style={{fontSize:8,color:analyses[selected].confidence==="HIGH"?"#00ff88":analyses[selected].confidence==="MEDIUM"?"#ffaa00":"#ff4444",letterSpacing:1}}>{analyses[selected].confidence}</span>
                    </div>
                    <p style={{fontSize:10,color:"#666",lineHeight:1.6,marginBottom:8}}>{analyses[selected].summary||analyses[selected].trend}</p>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                      {[["S",analyses[selected].support,"#00ff8866"],["R",analyses[selected].resistance,"#ff444466"],["SL",`${analyses[selected].sl_pips}p`,"#ffaa0088"],["TP",`${analyses[selected].tp_pips}p`,"#8888ff88"]].map(([k,v,c])=>(
                        <span key={k} style={{fontSize:9,color:"#333"}}>{k} <b style={{color:c}}>{v}</b></span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Panel */}
                <div style={{background:"#030810",border:"1px solid #ffffff08",borderRadius:3,padding:12}}>
                  <div style={{fontSize:8,color:"#00ff8833",letterSpacing:3,marginBottom:10}}>QUICK ORDER — {selected}</div>

                  {/* BID/ASK */}
                  {tick&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:0,marginBottom:10,border:"1px solid #ffffff06",borderRadius:2,overflow:"hidden"}}>
                      <div style={{padding:"6px 10px",background:"#0d0000",textAlign:"center"}}>
                        <div style={{fontSize:7,color:"#333",letterSpacing:2}}>BID</div>
                        <div style={{fontSize:14,fontWeight:700,color:"#ff4444",fontFamily:"'Orbitron',monospace",letterSpacing:.5}}>{tick.bid?.toFixed(d)}</div>
                      </div>
                      <div style={{padding:"6px 8px",background:"#030810",textAlign:"center",borderLeft:"1px solid #ffffff06",borderRight:"1px solid #ffffff06"}}>
                        <div style={{fontSize:7,color:"#222"}}>SPR</div>
                        <div style={{fontSize:9,color:"#333"}}>{tick.spread}</div>
                      </div>
                      <div style={{padding:"6px 10px",background:"#000d00",textAlign:"center"}}>
                        <div style={{fontSize:7,color:"#333",letterSpacing:2}}>ASK</div>
                        <div style={{fontSize:14,fontWeight:700,color:"#00ff88",fontFamily:"'Orbitron',monospace",letterSpacing:.5}}>{tick.ask?.toFixed(d)}</div>
                      </div>
                    </div>
                  )}

                  <OrderPanel symbol={selected} tick={tick} onOrder={handleOrder} connected={connected} demoMode={demoMode} orderResult={orderResult}/>
                </div>
              </>
            )}

            {/* ══ POSITIONS TAB ══ */}
            {tab==="positions"&&(
              <div style={{background:"#030810",border:"1px solid #ffffff08",borderRadius:3,padding:12}}>
                <div style={{fontSize:8,color:"#00ff8833",letterSpacing:3,marginBottom:10}}>OPEN POSITIONS [{positions.length}]</div>
                <PositionsTable positions={positions} onClose={handleClose}/>
              </div>
            )}

            {/* ══ AUTO TRADING TAB ══ */}
            {tab==="auto"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>

                {/* Engine Control */}
                <div style={{background:"#030810",border:`1px solid ${autoEnabled?"#00ff8822":"#ffffff08"}`,borderRadius:3,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:9,color:"#00ff8866",letterSpacing:3,marginBottom:3}}>AUTO TRADING ENGINE</div>
                      <div style={{fontSize:8,color:"#333",letterSpacing:1}}>H1 candle close · AI H1 · BUY/SELL direct · 1 pos/pair · SL buffer active</div>
                    </div>
                    <button onClick={handleAutoToggle} disabled={autoPairs.length===0} style={{
                      padding:"8px 20px",borderRadius:2,border:`1px solid ${autoEnabled?"#ff444433":"#00ff8833"}`,cursor:autoPairs.length===0?"not-allowed":"pointer",
                      fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:2,
                      background:autoEnabled?"#0d0000":"#000d00",color:autoEnabled?"#ff4444":"#00ff88",
                      opacity:autoPairs.length===0?0.3:1,
                    }}>{autoEnabled?"⏹ STOP":"▶ START"}</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:10}}>
                    <div>
                      <div style={{fontSize:7,color:"#333",letterSpacing:2,marginBottom:3}}>LOT SIZE</div>
                      <input className="inp" value={autoLot} onChange={e=>setAutoLot(e.target.value)} disabled={autoEnabled} style={{opacity:autoEnabled?0.3:1}}/>
                    </div>
                    <div style={{border:"1px solid #ffffff06",borderRadius:2,padding:"6px 8px"}}>
                      <div style={{fontSize:7,color:"#333",letterSpacing:2,marginBottom:3}}>SL/TP MODE</div>
                      <div style={{fontSize:8,color:"#444",lineHeight:1.6}}>
                        AI → default per instrument → buffer anti-hunter ·
                        <span style={{color:"#00ff8844"}}> FX +6p</span>
                        <span style={{color:"#ffaa0044"}}> XAU +60p</span>
                        <span style={{color:"#ff444444"}}> BTC +250p</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:8}}>
                    <span style={{color:"#333"}}>STATUS <span style={{color:autoEnabled?"#00ff88":"#444",animation:autoEnabled?"glow 2s infinite":""}}>{autoEnabled?"RUNNING":"IDLE"}</span></span>
                    <span style={{color:"#333"}}>PAIRS <span style={{color:"#00ff8866"}}>{autoPairs.length}</span></span>
                    <span style={{color:"#333"}}>POSITIONS <span style={{color:"#ffaa0066"}}>{positions.length}</span></span>
                  </div>
                  {autoPairs.length===0&&<div style={{marginTop:8,fontSize:8,color:"#ffaa0066",letterSpacing:1}}>⚠ select pairs below to enable</div>}
                </div>

                {/* Pair Selector */}
                <div style={{background:"#030810",border:"1px solid #ffffff08",borderRadius:3,padding:12}}>
                  <div style={{fontSize:8,color:"#00ff8833",letterSpacing:3,marginBottom:8}}>PAIR SELECTION [{autoPairs.length}]</div>
                  {Object.entries(GROUPS).map(([grpName,grpPairs])=>(
                    <div key={grpName} style={{marginBottom:8}}>
                      <div style={{fontSize:7,color:"#222",letterSpacing:3,marginBottom:4}}>{grpName}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                        {grpPairs.map(sym=>{
                          const isOn=autoPairs.includes(sym);
                          const hasPos=positions.some(p=>p.symbol===sym);
                          const def=getDefaultSLTP(sym);
                          const lst=autoStatus[sym];
                          return(
                            <div key={sym}>
                              <button
                                onClick={()=>!autoEnabled&&toggleAutoPair(sym)}
                                title={`SL:${def.sl}+${def.buf}p | TP:${def.tp}p`}
                                style={{
                                  padding:"3px 7px",borderRadius:1,fontSize:8,letterSpacing:.5,
                                  border:`1px solid ${isOn?"#00ff8833":"#ffffff08"}`,
                                  background:isOn?"#00ff8808":"transparent",
                                  color:isOn?"#00ff88":"#333",
                                  cursor:autoEnabled?"not-allowed":"pointer",
                                  opacity:autoEnabled&&!isOn?0.3:1,
                                  fontFamily:"'JetBrains Mono',monospace",
                                }}>
                                {sym}
                                {hasPos&&<span style={{color:"#00ff88",marginLeft:2}}>·</span>}
                                {lst&&<span style={{color:lst.lastAction==="BUY"?"#00ff8888":"#ff444488",marginLeft:2,fontSize:7}}>{lst.lastAction==="BUY"?"▲":"▼"}</span>}
                              </button>
                              {isOn&&<div style={{fontSize:6,color:"#00ff8833",textAlign:"center",marginTop:1}}>{def.sl}+{def.buf}/{def.tp}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity Log */}
                <div style={{background:"#030810",border:"1px solid #ffffff08",borderRadius:3,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:8,color:"#00ff8833",letterSpacing:3}}>ACTIVITY LOG [{autoLog.length}]</span>
                    <button onClick={()=>setAutoLog([])} style={{background:"none",border:"1px solid #ffffff08",color:"#333",padding:"1px 6px",borderRadius:1,cursor:"pointer",fontSize:7,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>CLR</button>
                  </div>
                  <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:1}}>
                    {autoLog.length===0&&<div style={{color:"#222",fontSize:9,textAlign:"center",padding:"16px 0",letterSpacing:2}}>NO ACTIVITY</div>}
                    {autoLog.map(log=>(
                      <div key={log.id} style={{
                        display:"grid",gridTemplateColumns:"50px 52px 52px 1fr",gap:6,
                        padding:"3px 6px",fontSize:8,
                        borderLeft:`2px solid ${log.ok===true?"#00ff88":log.ok===false?"#ff4444":"#ffffff11"}`,
                        background:log.ok===true?"#00ff8806":log.ok===false?"#ff44440a":"transparent",
                        animation:"fadeUp .2s ease",
                      }}>
                        <span style={{color:"#222"}}>{log.time}</span>
                        <span style={{color:"#00ff8866",fontWeight:700}}>{log.symbol}</span>
                        <span style={{color:log.action==="ORDER"?"#00ff88":log.action==="ERROR"?"#ff4444":log.action==="SKIP"?"#333":"#555",fontWeight:700}}>{log.action}</span>
                        <span style={{color:"#444"}}>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer bar */}
          <div style={{borderTop:"1px solid #00ff8808",padding:"4px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#020408"}}>
            <span style={{fontSize:7,color:"#111",letterSpacing:3}}>DnR TERMINAL © 2026</span>
            <span style={{fontSize:7,color:"#111",letterSpacing:2}}>{demoMode?"DEMO MODE":"LIVE TRADING"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
