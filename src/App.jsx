import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
const DEFAULT_SLTP = {
  EURUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  GBPUSD:{sl:40,  tp:80,  buf:8,   desc:"40+8p / 80p"},
  USDJPY:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  AUDUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  USDCHF:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  USDCAD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
  NZDUSD:{sl:30,  tp:60,  buf:6,   desc:"30+6p / 60p"},
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
  XAUUSD:{sl:200, tp:400, buf:60,  desc:"200+60p / 400p"},
  XAGUSD:{sl:150, tp:300, buf:40,  desc:"150+40p / 300p"},
  USOIL: {sl:100, tp:200, buf:25,  desc:"100+25p / 200p"},
  UKOIL: {sl:100, tp:200, buf:25,  desc:"100+25p / 200p"},
  USTEC: {sl:150, tp:300, buf:40,  desc:"150+40p / 300p"},
  US30:  {sl:200, tp:400, buf:50,  desc:"200+50p / 400p"},
  US500: {sl:120, tp:240, buf:35,  desc:"120+35p / 240p"},
  BTCUSD:{sl:800, tp:1600,buf:250, desc:"800+250p / 1600p"},
  ETHUSD:{sl:400, tp:800, buf:150, desc:"400+150p / 800p"},
};

function getDefaultSLTP(symbol) {
  return DEFAULT_SLTP[symbol] || {sl:50, tp:100, buf:10, desc:"50+10p / 100p"};
}
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
      open: +open.toFixed(d), high: +high.toFixed(d),
      low:  +low.toFixed(d),  close: +price.toFixed(d),
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
{"trend":"...","support":0,"resistance":0,"signal":"BUY|SELL|WAIT","signal_reason":"...","sl_pips":0,"tp_pips":0,"confidence":"HIGH|MEDIUM|LOW","summary":"..."}`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${GROQ_API_KEY}`},
      body: JSON.stringify({
        model:"llama-3.3-70b-versatile", max_tokens:1000,
        messages:[
          {role:"system",content:"Kamu analis forex profesional. Selalu jawab dalam format JSON valid saja, tanpa markdown, tanpa penjelasan tambahan di luar JSON."},
          {role:"user",content:prompt}
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

// ═══════════════════════════════════════════════════════════════
//  CYBER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MiniChart({ data, color }) {
  if (!data || data.length < 2) return (
    <div style={{width:64,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:"#122a1c",fontSize:8}}>──</div>
  );
  const chartData = data.slice(-24).map((c,i)=>({ i, v: c.close }));
  return (
    <div style={{width:64,height:28,flexShrink:0}}>
      <ResponsiveContainer width="100%" height={28}>
        <AreaChart data={chartData} margin={{top:1,right:0,bottom:1,left:0}}>
          <defs>
            <linearGradient id={`cg${color.replace(/[#,]/g,"")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.45}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#cg${color.replace(/[#,]/g,"")})`} dot={false} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MainChart({ data, symbol }) {
  if (!data || data.length < 2) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:220,
      color:"#122a1c",fontFamily:"monospace",fontSize:11,letterSpacing:3}}>
      ── NO DATA STREAM ──
    </div>
  );
  const chartData = data.map(c => ({ t: c.time.slice(11,16), v: c.close, h: c.high, l: c.low }));
  const vals = data.map(c=>c.close);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx-mn)*0.1;
  const bullish = vals[vals.length-1] >= vals[0];
  const color = bullish ? "#00ff41" : "#ff1f4b";
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{top:10,right:8,bottom:0,left:8}}>
        <defs>
          <linearGradient id="mainGradCyber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="t"
          tick={{fill:"#1a4030",fontSize:8,fontFamily:"monospace"}}
          tickLine={false} axisLine={false}
          interval={Math.floor(chartData.length/6)}/>
        <YAxis
          domain={[mn-pad, mx+pad]}
          tick={{fill:"#1a4030",fontSize:8,fontFamily:"monospace"}}
          tickLine={false} axisLine={false} width={62}
          tickFormatter={v=>v.toFixed(DIGITS[symbol]||5)}/>
        <Tooltip
          contentStyle={{background:"#000e08",border:"1px solid #0c2e1a",borderRadius:2,
            fontFamily:"monospace",fontSize:9,color:"#a0ffc0",padding:"4px 8px"}}
          labelStyle={{color:"#2a5038"}}
          itemStyle={{color}}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill="url(#mainGradCyber)" dot={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SignalBadge({ signal, confidence }) {
  const cfg = {
    BUY:  { bg:"#001808", border:"#00ff41", text:"#00ff41", label:"▲ BUY",  glow:"0 0 10px #00ff4144" },
    SELL: { bg:"#200008", border:"#ff1f4b", text:"#ff1f4b", label:"▼ SELL", glow:"0 0 10px #ff1f4b44" },
    WAIT: { bg:"#110e00", border:"#ffb300", text:"#ffb300", label:"◼ WAIT", glow:"none" },
  };
  const c = cfg[signal] || cfg.WAIT;
  return (
    <span style={{
      background:c.bg, border:`1px solid ${c.border}`, color:c.text,
      padding:"2px 10px", borderRadius:2, fontSize:10,
      fontFamily:"monospace", fontWeight:700, letterSpacing:2,
      boxShadow:c.glow, display:"inline-block",
    }}>
      {c.label}
    </span>
  );
}

function OrderPanel({ symbol, tick, onOrder, connected, demoMode, orderResult }) {
  const [vol, setVol]       = useState("0.01");
  const [slPips, setSlPips] = useState("");
  const [tpPips, setTpPips] = useState("");

  const d = DIGITS[symbol] || 5;
  const pip = {XAUUSD:0.1,XAGUSD:0.01,USOIL:0.01,UKOIL:0.01,USTEC:1,US30:1,US500:0.1,BTCUSD:1,ETHUSD:0.1}[symbol]||0.0001;
  const sl = parseFloat(slPips) || 0;
  const tp = parseFloat(tpPips) || 0;
  const slBuy  = sl && tick ? +(tick.ask - sl*pip).toFixed(d) : null;
  const slSell = sl && tick ? +(tick.bid + sl*pip).toFixed(d) : null;
  const tpBuy  = tp && tick ? +(tick.ask + tp*pip).toFixed(d) : null;
  const tpSell = tp && tick ? +(tick.bid - tp*pip).toFixed(d) : null;
  const rr = sl && tp ? (tp/sl).toFixed(1) : null;

  const go = (action) => {
    if (!connected || demoMode) { onOrder(symbol, action, vol, 0, 0); return; }
    const slPrice = action==="BUY" ? (slBuy||0) : (slSell||0);
    const tpPrice = action==="BUY" ? (tpBuy||0) : (tpSell||0);
    onOrder(symbol, action, vol, slPrice, tpPrice);
  };

  const inp = (accent) => ({
    width:"100%", background:"#000a06", border:`1px solid ${accent}30`,
    borderRadius:2, padding:"5px 8px", color:"#a0ffc0",
    fontFamily:"monospace", fontSize:11, boxSizing:"border-box",
    outline:"none", transition:"border-color 0.15s",
  });

  return (
    <div style={{background:"#00080a",border:"1px solid #0c2618",borderRadius:2,padding:12}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#1a4030",fontSize:8,fontFamily:"monospace",letterSpacing:2}}>
          ◈ EXECUTE ORDER // {symbol}
        </span>
        {!connected
          ? <span style={{color:"#ffb300",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>⚠ DEMO ONLY</span>
          : <span style={{color:"#00ff41",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>◉ LIVE FEED</span>
        }
      </div>

      {/* BID / ASK */}
      {tick && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 48px 1fr",marginBottom:8,border:"1px solid #0c2618",borderRadius:2,overflow:"hidden"}}>
          <div style={{padding:"5px 8px",background:"#1a000a",textAlign:"center"}}>
            <div style={{color:"#2a1020",fontSize:7,letterSpacing:2,marginBottom:1}}>BID</div>
            <div style={{color:"#ff1f4b",fontSize:13,fontWeight:700,fontFamily:"monospace",letterSpacing:1}}>
              {tick.bid?.toFixed(d)}
            </div>
          </div>
          <div style={{padding:"5px 4px",background:"#000e08",textAlign:"center",
            borderLeft:"1px solid #0c2618",borderRight:"1px solid #0c2618"}}>
            <div style={{color:"#122a1c",fontSize:7,marginBottom:1}}>SPR</div>
            <div style={{color:"#2a5038",fontSize:10,fontFamily:"monospace"}}>{tick.spread}</div>
          </div>
          <div style={{padding:"5px 8px",background:"#001a0a",textAlign:"center"}}>
            <div style={{color:"#122a1c",fontSize:7,letterSpacing:2,marginBottom:1}}>ASK</div>
            <div style={{color:"#00ff41",fontSize:13,fontWeight:700,fontFamily:"monospace",letterSpacing:1}}>
              {tick.ask?.toFixed(d)}
            </div>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
        <div>
          <div style={{color:"#2a5038",fontSize:7,letterSpacing:2,marginBottom:2}}>LOT SIZE</div>
          <input value={vol} onChange={e=>setVol(e.target.value)} style={inp("#00ff41")}/>
          <div style={{color:"#122a1c",fontSize:7,marginTop:2}}>min 0.01</div>
        </div>
        <div>
          <div style={{color:"#ff1f4b",fontSize:7,letterSpacing:2,marginBottom:2}}>STOP LOSS</div>
          <input value={slPips} onChange={e=>setSlPips(e.target.value)} placeholder="pips" style={inp("#ff1f4b")}/>
          {sl > 0 && tick && (
            <div style={{color:"#ff1f4b55",fontSize:7,marginTop:2,lineHeight:1.4}}>
              ▲{slBuy} / ▼{slSell}
            </div>
          )}
        </div>
        <div>
          <div style={{color:"#bb55ff",fontSize:7,letterSpacing:2,marginBottom:2}}>TAKE PROFIT</div>
          <input value={tpPips} onChange={e=>setTpPips(e.target.value)} placeholder="pips" style={inp("#bb55ff")}/>
          {tp > 0 && tick && (
            <div style={{color:"#bb55ff55",fontSize:7,marginTop:2,lineHeight:1.4}}>
              ▲{tpBuy} / ▼{tpSell}
            </div>
          )}
        </div>
      </div>

      {rr && (
        <div style={{color:"#1a4030",fontSize:8,fontFamily:"monospace",marginBottom:8,letterSpacing:1}}>
          RISK:REWARD <span style={{color:"#00e8ff",fontWeight:700,fontSize:10}}>1:{rr}</span>
        </div>
      )}

      {/* BUY / SELL */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <button onClick={()=>go("BUY")}
          style={{
            padding:"9px 0",background:"#001808",border:"1px solid #00ff41",
            borderRadius:2,color:"#00ff41",fontFamily:"monospace",fontSize:12,
            fontWeight:700,cursor:"pointer",letterSpacing:2,
            boxShadow:"0 0 12px #00ff4122,inset 0 0 8px #00ff4108",
            transition:"all 0.1s",
          }}
          onMouseOver={e=>{e.currentTarget.style.background="#002810";e.currentTarget.style.boxShadow="0 0 24px #00ff4155,inset 0 0 12px #00ff4115";}}
          onMouseOut={e=>{e.currentTarget.style.background="#001808";e.currentTarget.style.boxShadow="0 0 12px #00ff4122,inset 0 0 8px #00ff4108";}}>
          ▲ BUY<br/>
          <span style={{fontSize:9,opacity:.7}}>{tick?.ask?.toFixed(d)}</span>
        </button>
        <button onClick={()=>go("SELL")}
          style={{
            padding:"9px 0",background:"#1a0008",border:"1px solid #ff1f4b",
            borderRadius:2,color:"#ff1f4b",fontFamily:"monospace",fontSize:12,
            fontWeight:700,cursor:"pointer",letterSpacing:2,
            boxShadow:"0 0 12px #ff1f4b22,inset 0 0 8px #ff1f4b08",
            transition:"all 0.1s",
          }}
          onMouseOver={e=>{e.currentTarget.style.background="#280010";e.currentTarget.style.boxShadow="0 0 24px #ff1f4b55,inset 0 0 12px #ff1f4b15";}}
          onMouseOut={e=>{e.currentTarget.style.background="#1a0008";e.currentTarget.style.boxShadow="0 0 12px #ff1f4b22,inset 0 0 8px #ff1f4b08";}}>
          ▼ SELL<br/>
          <span style={{fontSize:9,opacity:.7}}>{tick?.bid?.toFixed(d)}</span>
        </button>
      </div>

      {orderResult && (
        <div style={{
          marginTop:6,padding:"5px 8px",borderRadius:2,fontSize:8,fontFamily:"monospace",
          background:orderResult.ok===true?"#001808":orderResult.ok===false?"#1a0008":"#0a0800",
          border:`1px solid ${orderResult.ok===true?"#00ff4133":orderResult.ok===false?"#ff1f4b33":"#ffb30033"}`,
          color:orderResult.ok===true?"#00ff41":orderResult.ok===false?"#ff1f4b":"#ffb300",
          letterSpacing:.5,
        }}>
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
  const priceColor = isUp ? "#00ff41" : "#ff1f4b";
  const changeColor = isPos ? "#00c030" : "#c01038";

  return (
    <div
      onClick={()=>onSelect(symbol)}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding:"5px 8px",
        background: selected ? "#001a0e" : "transparent",
        borderLeft:`2px solid ${selected?"#00ff41":"transparent"}`,
        cursor:"pointer",
        borderBottom:"1px solid #060f09",
        transition:"all 0.1s",
      }}
    >
      <span style={{color:"#1a4030",fontSize:7,fontFamily:"monospace",width:22,flexShrink:0,letterSpacing:.5}}>
        {PAIR_FLAGS[symbol]}
      </span>
      <span style={{
        color:selected?"#a0ffc0":"#2a5a3a",
        fontSize:10,fontFamily:"monospace",fontWeight:700,
        letterSpacing:.5,width:54,flexShrink:0,
      }}>
        {symbol}
      </span>
      <span style={{
        color:priceColor,fontSize:10,fontFamily:"monospace",fontWeight:700,
        flex:1,letterSpacing:.5,minWidth:0,
        textShadow:selected?`0 0 6px ${priceColor}88`:"none",
      }}>
        {tick ? tick.bid.toFixed(DIGITS[symbol]) : "──────"}
      </span>
      <span style={{color:changeColor,fontSize:8,fontFamily:"monospace",width:42,textAlign:"right",flexShrink:0}}>
        {isPos?"+":""}{dayChange}%
      </span>
      <MiniChart data={candles} color={priceColor}/>
      {analysis ? (
        <span style={{
          fontSize:9, fontFamily:"monospace", fontWeight:700,
          width:12, textAlign:"center", flexShrink:0,
          color: analysis.signal==="BUY"?"#00ff41":analysis.signal==="SELL"?"#ff1f4b":"#ffb300",
        }}>
          {analysis.signal==="BUY"?"▲":analysis.signal==="SELL"?"▼":"■"}
        </span>
      ) : <span style={{width:12,flexShrink:0}}/>}
      <button
        onClick={e=>{e.stopPropagation();onAnalyze(symbol);}}
        style={{
          background:"transparent",border:"1px solid #0c2618",
          color:analyzing?"#00e8ff":"#1a4030",
          fontSize:7,fontFamily:"monospace",padding:"1px 4px",borderRadius:2,
          cursor:"pointer",flexShrink:0,letterSpacing:.5,
          boxShadow:analyzing?"0 0 6px #00e8ff44":"none",
          transition:"all 0.1s",
        }}>
        {analyzing?"◌":"⚡"}
      </button>
    </div>
  );
}

function PositionsTable({ positions, onClose }) {
  if (!positions?.length) return (
    <div style={{textAlign:"center",color:"#122a1c",fontFamily:"monospace",fontSize:10,
      padding:"24px 0",letterSpacing:3}}>
      ── NO OPEN POSITIONS ──
    </div>
  );
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:9}}>
        <thead>
          <tr style={{color:"#1a4030",borderBottom:"1px solid #0c2618"}}>
            {["#TKT","SYM","TYPE","VOL","OPEN","CUR","SL","TP","P&L","X"].map(h=>(
              <th key={h} style={{padding:"4px 6px",textAlign:"left",fontWeight:600,letterSpacing:1}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(p=>(
            <tr key={p.ticket} style={{borderBottom:"1px solid #060f09",color:"#2a5038"}}>
              <td style={{padding:"4px 6px",color:"#1a4030"}}>{p.ticket}</td>
              <td style={{padding:"4px 6px",color:"#a0ffc0",fontWeight:700}}>{p.symbol}</td>
              <td style={{padding:"4px 6px",color:p.type==="BUY"?"#00ff41":"#ff1f4b",fontWeight:700}}>
                {p.type==="BUY"?"▲ BUY":"▼ SELL"}
              </td>
              <td style={{padding:"4px 6px"}}>{p.volume}</td>
              <td style={{padding:"4px 6px"}}>{p.price_open}</td>
              <td style={{padding:"4px 6px"}}>{p.price_current}</td>
              <td style={{padding:"4px 6px",color:"#ff7700"}}>{p.sl||"─"}</td>
              <td style={{padding:"4px 6px",color:"#bb55ff"}}>{p.tp||"─"}</td>
              <td style={{padding:"4px 6px",color:p.profit>=0?"#00ff41":"#ff1f4b",fontWeight:700}}>
                {p.profit>=0?"+":""}{p.profit?.toFixed(2)}
              </td>
              <td style={{padding:"4px 6px"}}>
                <button onClick={()=>onClose(p.ticket)}
                  style={{background:"#1a0008",border:"1px solid #ff1f4b44",color:"#ff1f4b",
                    padding:"1px 6px",borderRadius:2,cursor:"pointer",fontSize:8,fontFamily:"monospace"}}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [wsUrl, setWsUrl]         = useState("ws://localhost:8765");
  const [wsStatus, setWsStatus]   = useState("disconnected");
  const [demoMode, setDemoMode]   = useState(true);
  const [ticks, setTicks]         = useState({});
  const [candles, setCandles]     = useState({});
  const [positions, setPositions] = useState([]);
  const [account, setAccount]     = useState(null);
  const [selected, setSelected]   = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M5");
  const [analyses, setAnalyses]   = useState({});
  const [analyzing, setAnalyzing] = useState({});
  const [tab, setTab]             = useState("chart");
  const [group, setGroup]         = useState("FX");
  const [orderResult, setOrderResult] = useState(null);
  const [clock, setClock]         = useState(new Date());

  // ── AUTO TRADING ──
  const [autoEnabled, setAutoEnabled]       = useState(false);
  const [autoPairs, setAutoPairs]           = useState([]);
  const [autoLot, setAutoLot]               = useState("0.01");
  const [autoLog, setAutoLog]               = useState([]);
  const [autoStatus, setAutoStatus]         = useState({});
  const [lastCandleTime, setLastCandleTime] = useState({});

  const wsRef          = useRef(null);
  const demoInterval   = useRef(null);
  const autoRef        = useRef(null);
  const autoPairsRef   = useRef([]);
  const autoEnabledRef = useRef(false);
  const positionsRef   = useRef([]);
  const autoLotRef     = useRef("0.01");

  // clock tick
  useEffect(()=>{
    const t = setInterval(()=>setClock(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);

  const startDemo = useCallback(() => {
    setDemoMode(true);
    const initCandles = {};
    const initTicks   = {};
    PAIRS.forEach(p => {
      initCandles[p] = generateMockCandles(p, 80);
      initTicks[p]   = generateMockTick(p, null);
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
        if (msg.type==="ticks") {
          setTicks(prev=>({...prev,...msg.data}));
        } else if (msg.type==="candles") {
          setCandles(prev=>({...prev,[msg.symbol]:msg.data}));
        } else if (msg.type==="account"||msg.type==="init") {
          const pos = msg.positions||[];
          setPositions(pos); positionsRef.current=pos; setAccount(msg.account);
        } else if (msg.type==="order_result") {
          if (msg.success) {
            const r = `✓ ${msg.action||"Order"} OK! Ticket #${msg.ticket} @ ${msg.price}`;
            setOrderResult({ok:true,msg:r});
            addAutoLog(msg.symbol||"","ORDER",r,true);
            setAutoStatus(prev=>({...prev,[msg.symbol]:{lastAction:msg.action,lastTime:new Date().toLocaleTimeString("id-ID"),ticket:msg.ticket}}));
            setTimeout(()=>{if(wsRef.current?.readyState===1)wsRef.current.send(JSON.stringify({type:"get_positions"}));},800);
          } else {
            const r=`✗ Order gagal: ${msg.error||"Unknown error"}`;
            setOrderResult({ok:false,msg:r});
            addAutoLog(msg.symbol||"","ERROR",r,false);
          }
          setTimeout(()=>setOrderResult(null),6000);
        } else if (msg.type==="close_result") {
          if (msg.success) setPositions(prev=>prev.filter(p=>p.ticket!==msg.ticket));
        }
      } catch {}
    };
    ws.onerror  = ()=>setWsStatus("error");
    ws.onclose  = ()=>{setWsStatus("disconnected");startDemo();};
  }, [wsUrl, timeframe, startDemo]);

  const disconnect = () => { wsRef.current?.close(); setWsStatus("disconnected"); startDemo(); };

  const handleAnalyze = async (symbol) => {
    setAnalyzing(p=>({...p,[symbol]:true}));
    const result = await analyzeWithClaude(symbol, candles[symbol]||[], ticks[symbol]||{});
    setAnalyses(p=>({...p,[symbol]:result}));
    setAnalyzing(p=>({...p,[symbol]:false}));
  };
  const analyzeAll = async () => { for (const p of PAIRS) await handleAnalyze(p); };

  const addAutoLog = (symbol,action,msg,ok) => {
    const entry={time:new Date().toLocaleTimeString("id-ID"),symbol,action,msg,ok,id:Date.now()};
    setAutoLog(prev=>[entry,...prev].slice(0,100));
  };

  useEffect(()=>{autoPairsRef.current=autoPairs;},[autoPairs]);
  useEffect(()=>{autoEnabledRef.current=autoEnabled;},[autoEnabled]);
  useEffect(()=>{autoLotRef.current=autoLot;},[autoLot]);

  useEffect(()=>{
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current=setInterval(()=>{
      if (!autoEnabledRef.current) return;
      const now=new Date(); const hour=now.getHours(); const mins=now.getMinutes(); const secs=now.getSeconds();
      const isH1Close=(mins===0)&&(secs<15);
      if (!isH1Close) return;
      const candleKey=`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-H${hour}`;
      setLastCandleTime(prev=>{
        const pairs=autoPairsRef.current;
        pairs.forEach(sym=>{
          if (prev[sym]===candleKey) return;
          prev={...prev,[sym]:candleKey};
          runAutoCheck(sym);
        });
        return {...prev};
      });
    },15000);
    return ()=>clearInterval(autoRef.current);
  },[autoEnabled]);

  const runAutoCheck = async (symbol) => {
    if (!wsRef.current||wsRef.current.readyState!==1) {
      addAutoLog(symbol,"ERROR",`${symbol}: Not connected to MT5`,false); return;
    }
    addAutoLog(symbol,"SCAN",`H1 candle close — scanning ${symbol}`,null);
    try {
      const hasPosition=positionsRef.current.some(p=>p.symbol===symbol);
      if (hasPosition) { addAutoLog(symbol,"SKIP",`${symbol}: position open, skip`,null); return; }
      wsRef.current.send(JSON.stringify({type:"get_candles",symbol,timeframe:"H1",count:100}));
      await new Promise(r=>setTimeout(r,2000));
      addAutoLog(symbol,"AI",`${symbol}: H1 analysis...`,null);
      const result=await callGroqAI(symbol,[],{},"H1");
      addAutoLog(symbol,"H1",`${symbol} → ${result.signal} (${result.confidence}) | ${result.trend||""} | ${result.summary||""}`,result.signal!=="WAIT"?true:null);
      if (result.signal==="WAIT") { addAutoLog(symbol,"SKIP",`${symbol}: WAIT signal — no order`,null); return; }
      const pip={XAUUSD:0.1,XAGUSD:0.01,USOIL:0.01,UKOIL:0.01,USTEC:1,US30:1,US500:0.1,BTCUSD:1,ETHUSD:0.1}[symbol]||0.0001;
      const lot=parseFloat(autoLotRef.current)||0.01;
      const cfg=getDefaultSLTP(symbol);
      const slInfo=calcFinalSL(symbol,result.sl_pips||0);
      const finalSL=slInfo.total;
      const finalTP=(result.tp_pips>0)?result.tp_pips:cfg.tp;
      const rr=(finalTP/finalSL).toFixed(2);
      addAutoLog(symbol,"SL/TP",`SL=${slInfo.base}p+buf${slInfo.buf}p=${finalSL}p | TP=${finalTP}p | R:R 1:${rr} [${slInfo.source}]`,null);
      wsRef.current.send(JSON.stringify({type:"send_order",symbol,action:result.signal,volume:lot,sl:finalSL*pip,tp:finalTP*pip}));
      addAutoLog(symbol,"ORDER",`🚀 ${result.signal} ${lot}L ${symbol} | SL:${finalSL}p TP:${finalTP}p | R:R 1:${rr}`,null);
    } catch(err) {
      addAutoLog(symbol,"ERROR",`${symbol}: Exception — ${err.message}`,false);
    }
  };

  const handleAutoToggle = () => {
    const next=!autoEnabled;
    setAutoEnabled(next);
    if (next) addAutoLog("SYS","START",`Auto engine online — ${autoPairs.length} pairs | H1 trigger | Direct entry`,true);
    else addAutoLog("SYS","STOP","Auto engine halted",null);
  };
  const toggleAutoPair = (sym) => {
    setAutoPairs(prev=>prev.includes(sym)?prev.filter(p=>p!==sym):[...prev,sym]);
  };
  const handleOrder = (symbol,action,volume,sl,tp) => {
    if (!demoMode&&wsRef.current?.readyState===1) {
      wsRef.current.send(JSON.stringify({type:"send_order",symbol,action,volume:parseFloat(volume)||0.01,sl:parseFloat(sl)||0,tp:parseFloat(tp)||0}));
      setOrderResult({ok:null,msg:`⟳ Sending ${action} ${volume}L ${symbol}...`});
    } else {
      setOrderResult({ok:false,msg:"⚠ Demo mode — connect MT5 for live orders"});
      setTimeout(()=>setOrderResult(null),4000);
    }
  };
  const handleClose = (ticket) => {
    if (!demoMode&&wsRef.current?.readyState===1) wsRef.current.send(JSON.stringify({type:"close_position",ticket}));
    else setPositions(p=>p.filter(pos=>pos.ticket!==ticket));
  };

  const statusColor = {connected:"#00ff41",connecting:"#ffb300",disconnected:"#2a5038",error:"#ff1f4b"}[wsStatus];
  const selPrice = ticks[selected]?.bid;
  const selOpen  = candles[selected]?.[0]?.close;
  const priceUp  = selPrice && selOpen ? selPrice >= selOpen : true;

  return (
    <div style={{background:"#000805",minHeight:"100vh",fontFamily:"'JetBrains Mono',monospace",color:"#2a5038",display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #000805; }
        ::-webkit-scrollbar-thumb { background: #0c2618; border-radius: 1px; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff41; }
        input { font-family: 'JetBrains Mono', monospace !important; }
        input:focus { border-color: #00ff4155 !important; box-shadow: 0 0 8px #00ff4120 !important; }
        @keyframes blink { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }
        @keyframes glitch {
          0%,90%,100% { text-shadow: none; transform: none; clip-path: none; }
          91% { text-shadow: 2px 0 #ff1f4b, -2px 0 #00e8ff; transform: skewX(-1deg); }
          92% { text-shadow: -2px 0 #ff1f4b, 2px 0 #00e8ff; transform: skewX(1deg) translateX(1px); }
          93% { text-shadow: none; transform: none; }
          96% { text-shadow: 1px 0 #00e8ff; transform: none; }
          97% { text-shadow: none; }
        }
        @keyframes scanPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes priceFlash { 0%{opacity:0.5} 100%{opacity:1} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:none} }
        .cyber-panel {
          background: #000e08;
          border: 1px solid #0c2618;
          border-radius: 2px;
        }
        .cyber-panel::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00ff4122, transparent);
          margin: 0;
        }
      `}</style>

      {/* ════════════ TOP BAR ════════════ */}
      <div style={{
        background:"#000e08",borderBottom:"1px solid #0c2618",
        padding:"0 14px",height:44,display:"flex",alignItems:"center",
        justifyContent:"space-between",flexWrap:"nowrap",gap:8,flexShrink:0,
        boxShadow:"0 1px 0 #00ff4108",
      }}>

        {/* ── Logo block ── */}
        <div style={{display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{
              width:22,height:22,background:"#00ff41",borderRadius:2,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 0 12px #00ff4177",flexShrink:0,
            }}>
              <span style={{color:"#000",fontSize:10,fontWeight:900,letterSpacing:0}}>D</span>
            </div>
            <div>
              <div style={{
                color:"#00ff41",fontSize:11,fontWeight:700,letterSpacing:4,lineHeight:1.1,
                animation:"glitch 8s infinite",
                textShadow:"0 0 8px #00ff4166",
              }}>DnR TERMINAL</div>
              <div style={{color:"#122a1c",fontSize:6,letterSpacing:4}}>MT5 · CYBER TRADING SYSTEM · v2.026</div>
            </div>
          </div>

          <span style={{color:"#0c2618",fontSize:16}}>│</span>

          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{
              width:6,height:6,borderRadius:"50%",background:demoMode?"#ffb300":"#00ff41",
              display:"inline-block",
              boxShadow:demoMode?"0 0 6px #ffb300":"0 0 8px #00ff41",
              animation:"scanPulse 2s infinite",
              flexShrink:0,
            }}/>
            <span style={{color:demoMode?"#ffb300":"#00ff41",fontSize:9,letterSpacing:2}}>
              {demoMode?"DEMO MODE":"LIVE MT5"}
            </span>
          </div>
        </div>

        {/* ── Connection block ── */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <input
            value={wsUrl} onChange={e=>setWsUrl(e.target.value)}
            style={{
              background:"#000a06",border:"1px solid #0c2618",borderRadius:2,
              padding:"3px 8px",color:"#2a5038",fontSize:9,width:148,
              fontFamily:"monospace",outline:"none",
            }}
          />
          {wsStatus==="connected"
            ? <button onClick={disconnect} style={{
                background:"#1a0008",border:"1px solid #ff1f4b44",color:"#ff1f4b",
                padding:"3px 10px",borderRadius:2,cursor:"pointer",fontSize:8,
                fontFamily:"monospace",letterSpacing:1,
              }}>✕ DISC</button>
            : <button onClick={connect} style={{
                background:"#001808",border:"1px solid #00ff4155",color:"#00ff41",
                padding:"3px 10px",borderRadius:2,cursor:"pointer",fontSize:8,
                fontFamily:"monospace",letterSpacing:1,
                boxShadow:"0 0 8px #00ff4122",
              }}>⚡ CONNECT</button>
          }
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{
              width:5,height:5,borderRadius:"50%",background:statusColor,
              display:"inline-block",boxShadow:`0 0 5px ${statusColor}`,flexShrink:0,
            }}/>
            <span style={{color:statusColor,fontSize:8,letterSpacing:1}}>{wsStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* ── Account strip ── */}
        {account ? (
          <div style={{display:"flex",gap:14,fontSize:9,fontFamily:"monospace",flexShrink:0}}>
            {[
              ["BAL", `$${account.balance?.toLocaleString()}`, "#2a5038"],
              ["EQ",  `$${account.equity?.toLocaleString()}`,  "#00e8ff"],
              ["PnL", `${account.profit>=0?"+":""}$${account.profit?.toFixed(2)}`, account.profit>=0?"#00ff41":"#ff1f4b"],
              ["LVR", `1:${account.leverage}`, "#2a5038"],
            ].map(([k,v,c])=>(
              <span key={k} style={{display:"flex",alignItems:"center",gap:3}}>
                <span style={{color:"#122a1c",letterSpacing:1}}>{k}</span>
                <span style={{color:c,fontWeight:700}}>{v}</span>
              </span>
            ))}
          </div>
        ) : (
          <div style={{fontSize:8,color:"#122a1c",letterSpacing:2}}>── NO ACCOUNT ──</div>
        )}

        {/* ── Clock ── */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}>
          <span style={{color:"#1a4030",fontSize:10,fontFamily:"monospace",letterSpacing:2,fontWeight:700}}>
            {clock.toLocaleTimeString("en-GB")}
          </span>
          <span style={{color:"#0c2618",fontSize:7,letterSpacing:1}}>
            {clock.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
          </span>
        </div>
      </div>

      {/* ════════════ MAIN GRID ════════════ */}
      <div style={{display:"grid",gridTemplateColumns:"234px 1fr",flex:1,overflow:"hidden",minHeight:0}}>

        {/* ── LEFT PANEL ── */}
        <div style={{borderRight:"1px solid #0c2618",display:"flex",flexDirection:"column",overflow:"hidden",background:"#000a06"}}>

          {/* Group tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #0c2618",flexShrink:0}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} onClick={()=>setGroup(g)} style={{
                flex:1, padding:"5px 2px",
                background:group===g?"#001a0e":"transparent",
                border:"none",
                borderBottom:`2px solid ${group===g?"#00ff41":"transparent"}`,
                color:group===g?"#00ff41":"#122a1c",
                cursor:"pointer",fontSize:7,letterSpacing:.5,
                fontFamily:"monospace",fontWeight:700,
                textShadow:group===g?"0 0 6px #00ff4166":"none",
                transition:"all 0.1s",
              }}>{g}</button>
            ))}
          </div>

          {/* List header */}
          <div style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"3px 8px",borderBottom:"1px solid #060f09",flexShrink:0,
          }}>
            <span style={{color:"#1a4030",fontSize:7,letterSpacing:2}}>
              {group} /{(GROUPS[group]||PAIRS).length}/
            </span>
            <button onClick={analyzeAll} style={{
              background:"transparent",border:"1px solid #0c2618",color:"#00e8ff",
              padding:"1px 5px",borderRadius:2,cursor:"pointer",fontSize:6,
              letterSpacing:1,fontFamily:"monospace",
            }}>⚡ ALL</button>
          </div>

          {/* Pair rows */}
          <div style={{overflowY:"auto",flex:1}}>
            {/* Column labels */}
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"2px 8px 2px 8px",
              borderBottom:"1px solid #060f09",background:"#000a06"}}>
              <span style={{color:"#0c2618",fontSize:6,letterSpacing:1,width:22,flexShrink:0}}>CCY</span>
              <span style={{color:"#0c2618",fontSize:6,letterSpacing:1,width:54,flexShrink:0}}>PAIR</span>
              <span style={{color:"#0c2618",fontSize:6,flex:1}}>BID</span>
              <span style={{color:"#0c2618",fontSize:6,width:42,textAlign:"right",flexShrink:0}}>CHG%</span>
              <span style={{color:"#0c2618",fontSize:6,width:64,textAlign:"center",flexShrink:0}}>CHART</span>
              <span style={{color:"#0c2618",fontSize:6,width:12,flexShrink:0}}/>
              <span style={{color:"#0c2618",fontSize:6,width:16,flexShrink:0}}>AI</span>
            </div>
            {(GROUPS[group]||PAIRS).map(p=>(
              <PairCard
                key={p} symbol={p}
                tick={ticks[p]} candles={candles[p]}
                analysis={analyses[p]} analyzing={analyzing[p]}
                selected={selected===p}
                onSelect={setSelected} onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8,
          backgroundImage:[
            "linear-gradient(rgba(0,255,65,0.015) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(0,255,65,0.015) 1px, transparent 1px)",
          ].join(","),
          backgroundSize:"28px 28px",
        }}>

          {/* ── PAIR HEADER ── */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#1a4030",fontSize:8,letterSpacing:1,fontFamily:"monospace"}}>[{PAIR_FLAGS[selected]}]</span>
                  <span style={{color:"#a0ffc0",fontSize:20,fontWeight:700,letterSpacing:3,textShadow:"0 0 10px #a0ffc044"}}>
                    {selected}
                  </span>
                  <span style={{color:"#1a4030",fontSize:9}}>─</span>
                  <span style={{color:"#1a4030",fontSize:9,letterSpacing:.5}}>{PAIR_NAMES[selected]}</span>
                </div>
              </div>
              <div style={{
                color: priceUp ? "#00ff41" : "#ff1f4b",
                fontSize:22,fontWeight:700,fontFamily:"monospace",letterSpacing:2,
                textShadow:`0 0 14px ${priceUp?"#00ff4188":"#ff1f4b88"}`,
                animation:"priceFlash 0.3s ease",
              }}>
                {selPrice?.toFixed(DIGITS[selected])||"──────"}
              </div>
              {ticks[selected] && (
                <div style={{fontSize:8,fontFamily:"monospace",color:"#1a4030",letterSpacing:1}}>
                  <div>ASK <span style={{color:"#2a5038"}}>{ticks[selected].ask?.toFixed(DIGITS[selected])}</span></div>
                  <div>SPR <span style={{color:"#2a5038"}}>{ticks[selected].spread}</span></div>
                </div>
              )}
            </div>

            {/* Timeframes */}
            <div style={{display:"flex",gap:3}}>
              {TIMEFRAMES.map(tf=>(
                <button key={tf} onClick={()=>{
                  setTimeframe(tf);
                  if(!demoMode&&wsRef.current?.readyState===1)
                    wsRef.current.send(JSON.stringify({type:"get_candles",symbol:selected,timeframe:tf,count:100}));
                }} style={{
                  background:timeframe===tf?"#001a0e":"transparent",
                  border:`1px solid ${timeframe===tf?"#00ff41":"#0c2618"}`,
                  color:timeframe===tf?"#00ff41":"#1a4030",
                  padding:"3px 10px",borderRadius:2,cursor:"pointer",
                  fontSize:9,fontFamily:"monospace",letterSpacing:1,
                  boxShadow:timeframe===tf?"0 0 8px #00ff4122":"none",
                  transition:"all 0.1s",
                }}>{tf}</button>
              ))}
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{display:"flex",gap:0,borderBottom:"1px solid #0c2618",flexShrink:0}}>
            {[
              ["chart","◈ CHART & ORDER"],
              ["positions",`◈ POSITIONS${positions.length?` [${positions.length}]`:""}`],
              ["auto",`◈ AUTO ENGINE${autoEnabled?" ●":""}`],
            ].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={{
                background:"transparent",border:"none",
                borderBottom:`2px solid ${tab===key?"#00ff41":"transparent"}`,
                color:tab===key?"#00ff41":key==="auto"&&autoEnabled?"#00c030":"#1a4030",
                padding:"6px 14px",cursor:"pointer",
                fontFamily:"monospace",fontSize:9,letterSpacing:1.5,
                fontWeight:700,transition:"all 0.1s",
                textShadow:tab===key?"0 0 8px #00ff4166":"none",
              }}>{label}{key==="auto"&&autoEnabled&&tab!=="auto"?
                <span style={{marginLeft:4,color:"#00ff41",animation:"blink 1s infinite"}}>●</span>
                :null}
              </button>
            ))}
          </div>

          {/* ══ CHART TAB ══ */}
          {tab==="chart" && (
            <>
              {/* Price chart */}
              <div className="cyber-panel" style={{padding:"8px 6px",position:"relative"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 6px",marginBottom:4}}>
                  <span style={{color:"#1a4030",fontSize:7,letterSpacing:2}}>
                    ◈ PRICE ACTION // {selected} // {timeframe}
                  </span>
                  <span style={{color:"#0c2618",fontSize:7,letterSpacing:1,animation:"blink 1.5s infinite"}}>
                    ● LIVE
                  </span>
                </div>
                <MainChart data={candles[selected]} symbol={selected}/>
              </div>

              {/* AI Analysis */}
              {analyses[selected] && (
                <div className="cyber-panel" style={{padding:10,animation:"fadeSlide 0.3s ease"}}>
                  <div style={{color:"#1a4030",fontSize:7,letterSpacing:2,marginBottom:8}}>
                    ◈ SIGNAL INTELLIGENCE // {selected} ──────────────────────────
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <SignalBadge signal={analyses[selected].signal} confidence={analyses[selected].confidence}/>
                    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:8}}>
                      <span style={{color:"#122a1c",letterSpacing:1}}>CONFIDENCE</span>
                      <span style={{
                        color:analyses[selected].confidence==="HIGH"?"#00ff41":
                          analyses[selected].confidence==="MEDIUM"?"#ffb300":"#ff1f4b",
                        fontWeight:700,letterSpacing:1,
                      }}>{analyses[selected].confidence}</span>
                    </div>
                  </div>
                  <p style={{color:"#2a5038",fontSize:10,lineHeight:1.7,margin:"0 0 8px 0",fontFamily:"monospace"}}>
                    {analyses[selected].summary||analyses[selected].trend}
                  </p>
                  <div style={{display:"flex",gap:14,fontSize:8,fontFamily:"monospace",flexWrap:"wrap",borderTop:"1px solid #0c2618",paddingTop:8}}>
                    {[
                      ["TREND",    analyses[selected].trend,             "#2a5038"],
                      ["SUPPORT",  analyses[selected].support,           "#00ff41"],
                      ["RESIST",   analyses[selected].resistance,        "#ff1f4b"],
                      ["SL",       `${analyses[selected].sl_pips}p`,     "#ff7700"],
                      ["TP",       `${analyses[selected].tp_pips}p`,     "#bb55ff"],
                    ].map(([k,v,c])=>(
                      <span key={k} style={{letterSpacing:1}}>
                        <span style={{color:"#122a1c"}}>{k} </span>
                        <span style={{color:c,fontWeight:700}}>{v}</span>
                      </span>
                    ))}
                  </div>
                  {analyses[selected].signal_reason && (
                    <p style={{color:"#122a1c",fontSize:8,marginTop:6,paddingTop:6,borderTop:"1px solid #060f09",fontFamily:"monospace",lineHeight:1.6}}>
                      {analyses[selected].signal_reason}
                    </p>
                  )}
                </div>
              )}

              {!analyses[selected] && (
                <div style={{textAlign:"center",padding:"10px 0"}}>
                  <button onClick={()=>handleAnalyze(selected)} style={{
                    background:"#001808",border:"1px solid #00ff41",color:"#00ff41",
                    padding:"8px 22px",borderRadius:2,cursor:"pointer",
                    fontFamily:"monospace",fontSize:9,letterSpacing:2,
                    boxShadow:"0 0 14px #00ff4122",transition:"all 0.15s",
                  }}
                    onMouseOver={e=>{e.currentTarget.style.boxShadow="0 0 24px #00ff4155";}}
                    onMouseOut={e=>{e.currentTarget.style.boxShadow="0 0 14px #00ff4122";}}>
                    {analyzing[selected]?"◌ SCANNING MARKET...":"⚡ ACQUIRE SIGNAL — "+selected}
                  </button>
                </div>
              )}

              <OrderPanel
                symbol={selected} tick={ticks[selected]}
                onOrder={handleOrder}
                connected={wsStatus==="connected"} demoMode={demoMode}
                orderResult={orderResult}
              />
            </>
          )}

          {/* ══ POSITIONS TAB ══ */}
          {tab==="positions" && (
            <div className="cyber-panel" style={{padding:10}}>
              <div style={{color:"#1a4030",fontSize:7,letterSpacing:2,marginBottom:10}}>
                ◈ OPEN POSITIONS [{positions.length}] ──────────────────────────────────────
              </div>
              <PositionsTable positions={positions} onClose={handleClose}/>
            </div>
          )}

          {/* ══ AUTO TRADING TAB ══ */}
          {tab==="auto" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>

              {/* Control Panel */}
              <div style={{
                background:"#000e08",
                border:`1px solid ${autoEnabled?"#00ff4133":"#0c2618"}`,
                borderRadius:2,padding:12,
                boxShadow:autoEnabled?"0 0 24px #00ff4108,inset 0 0 30px #00ff4104":"none",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{
                      color:autoEnabled?"#00ff41":"#2a5038",fontSize:11,
                      fontWeight:700,letterSpacing:2,
                      textShadow:autoEnabled?"0 0 10px #00ff4166":"none",
                    }}>
                      {autoEnabled?"◉":"○"} AUTO TRADING ENGINE
                    </div>
                    <div style={{color:"#122a1c",fontSize:7,marginTop:3,letterSpacing:1,lineHeight:1.8}}>
                      TRIGGER: H1 CANDLE CLOSE · ANALYSIS: AI · ENTRY: BUY/SELL · MAX: 1 POS/PAIR
                    </div>
                  </div>
                  <button
                    onClick={handleAutoToggle}
                    disabled={autoPairs.length===0}
                    style={{
                      padding:"7px 18px",borderRadius:2,
                      border:`1px solid ${autoEnabled?"#ff1f4b":"#00ff41"}`,
                      cursor:autoPairs.length===0?"not-allowed":"pointer",
                      fontFamily:"monospace",fontSize:9,fontWeight:700,letterSpacing:2,
                      background:autoEnabled?"#1a0008":"#001808",
                      color:autoEnabled?"#ff1f4b":"#00ff41",
                      boxShadow:autoEnabled?"0 0 12px #ff1f4b22":"0 0 12px #00ff4122",
                      opacity:autoPairs.length===0?0.35:1,
                      transition:"all 0.1s",
                      flexShrink:0,
                    }}>
                    {autoEnabled?"⏹ STOP":"▶ START"}
                  </button>
                </div>

                {/* Settings */}
                <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:10}}>
                  <div>
                    <div style={{color:"#122a1c",fontSize:7,letterSpacing:1,marginBottom:2}}>LOT SIZE</div>
                    <input
                      value={autoLot} onChange={e=>setAutoLot(e.target.value)}
                      disabled={autoEnabled}
                      style={{
                        width:"100%",background:"#000a06",border:"1px solid #0c2618",
                        borderRadius:2,padding:"4px 6px",color:"#a0ffc0",
                        fontFamily:"monospace",fontSize:10,outline:"none",
                        opacity:autoEnabled?0.4:1,
                      }}
                    />
                  </div>
                  <div style={{background:"#000a06",border:"1px solid #0c2618",borderRadius:2,padding:"5px 8px"}}>
                    <div style={{color:"#122a1c",fontSize:7,letterSpacing:1,marginBottom:3}}>SL/TP BUFFER — AUTO ANTI-HUNTER</div>
                    <div style={{color:"#1a4030",fontSize:7,fontFamily:"monospace",letterSpacing:.5}}>
                      AI sets SL/TP. Buffer added automatically per instrument type:&nbsp;
                      <span style={{color:"#00ff41"}}>FX+6p</span>&nbsp;
                      <span style={{color:"#ffb300"}}>XAU+60p</span>&nbsp;
                      <span style={{color:"#ff1f4b"}}>BTC+250p</span>&nbsp;
                      <span style={{color:"#bb55ff"}}>OIL+25p</span>
                    </div>
                  </div>
                </div>

                {/* Status strip */}
                <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>
                  <span style={{color:"#122a1c"}}>STATUS <span style={{
                    color:autoEnabled?"#00ff41":"#1a4030",fontWeight:700,
                    animation:autoEnabled?"scanPulse 2s infinite":"none",
                  }}>{autoEnabled?"ACTIVE":"STANDBY"}</span></span>
                  <span style={{color:"#122a1c"}}>PAIRS <span style={{color:"#00e8ff",fontWeight:700}}>{autoPairs.length}</span></span>
                  <span style={{color:"#122a1c"}}>POSITIONS <span style={{color:"#ff7700",fontWeight:700}}>{positions.length}</span></span>
                </div>

                {autoPairs.length===0 && (
                  <div style={{marginTop:8,padding:"4px 8px",background:"#110e00",border:"1px solid #ffb30033",borderRadius:2,color:"#ffb300",fontSize:7,fontFamily:"monospace",letterSpacing:1}}>
                    ⚠ SELECT AT LEAST 1 INSTRUMENT BELOW TO ACTIVATE ENGINE
                  </div>
                )}
              </div>

              {/* Pair Selector */}
              <div className="cyber-panel" style={{padding:10}}>
                <div style={{color:"#1a4030",fontSize:7,letterSpacing:2,marginBottom:8}}>
                  ◈ INSTRUMENT MATRIX [{autoPairs.length} ACTIVE] ───────────────────────────
                </div>
                {Object.entries(GROUPS).map(([grpName,grpPairs])=>(
                  <div key={grpName} style={{marginBottom:8}}>
                    <div style={{color:"#0c2618",fontSize:7,letterSpacing:3,marginBottom:4,fontFamily:"monospace"}}>{grpName}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {grpPairs.map(sym=>{
                        const isOn  = autoPairs.includes(sym);
                        const hasPos= positions.some(p=>p.symbol===sym);
                        const lastSt= autoStatus[sym];
                        const def   = getDefaultSLTP(sym);
                        return (
                          <button
                            key={sym}
                            onClick={()=>!autoEnabled&&toggleAutoPair(sym)}
                            title={`SL:${def.sl}+${def.buf}p | TP:${def.tp}p | R:R 1:${(def.tp/(def.sl+def.buf)).toFixed(1)}`}
                            style={{
                              padding:"2px 7px",borderRadius:2,
                              border:`1px solid ${isOn?"#00ff4155":"#0c2618"}`,
                              background:isOn?"#001a0e":"transparent",
                              color:isOn?"#00ff41":"#1a4030",
                              fontFamily:"monospace",fontSize:8,letterSpacing:.5,
                              cursor:autoEnabled?"not-allowed":"pointer",
                              opacity:autoEnabled&&!isOn?0.25:1,
                              boxShadow:isOn?"0 0 6px #00ff4122":"none",
                              transition:"all 0.1s",
                            }}>
                            {sym}
                            {hasPos&&<span style={{marginLeft:2,color:"#00ff41",fontSize:7}}>●</span>}
                            {lastSt&&<span style={{marginLeft:2,fontSize:7,
                              color:lastSt.lastAction==="BUY"?"#00ff41":"#ff1f4b"}}>
                              {lastSt.lastAction==="BUY"?"▲":"▼"}
                            </span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Log */}
              <div className="cyber-panel" style={{padding:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{color:"#1a4030",fontSize:7,letterSpacing:2}}>◈ ACTIVITY LOG [{autoLog.length}]</span>
                  <button onClick={()=>setAutoLog([])} style={{
                    background:"transparent",border:"1px solid #0c2618",color:"#1a4030",
                    padding:"1px 6px",borderRadius:2,cursor:"pointer",
                    fontSize:7,fontFamily:"monospace",letterSpacing:1,
                  }}>CLEAR</button>
                </div>
                <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:1}}>
                  {autoLog.length===0 && (
                    <div style={{color:"#0c2618",fontSize:9,fontFamily:"monospace",textAlign:"center",
                      padding:"20px 0",letterSpacing:3}}>
                      ── AWAITING SIGNAL EVENTS ──
                    </div>
                  )}
                  {autoLog.map(log=>(
                    <div key={log.id} style={{
                      display:"grid",gridTemplateColumns:"52px 46px 50px 1fr",gap:5,
                      padding:"3px 5px",borderRadius:1,
                      background:log.ok===true?"#001808":log.ok===false?"#1a0008":"#000a06",
                      borderLeft:`2px solid ${log.ok===true?"#00ff41":log.ok===false?"#ff1f4b":"#0c2618"}`,
                      fontSize:8,fontFamily:"monospace",letterSpacing:.5,
                      animation:"fadeSlide 0.2s ease",
                    }}>
                      <span style={{color:"#1a4030"}}>{log.time}</span>
                      <span style={{color:"#00e8ff",fontWeight:700}}>{log.symbol}</span>
                      <span style={{fontWeight:700,color:
                        log.action==="SIGNAL"?"#ffb300":log.action==="ORDER"?"#bb55ff":
                        log.action==="ERROR"?"#ff1f4b":log.action==="SKIP"?"#1a4030":
                        log.action==="START"||log.action==="STOP"?"#00ff41":"#2a5038"
                      }}>{log.action}</span>
                      <span style={{color:"#2a5038",wordBreak:"break-all"}}>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>{/* end right panel */}
      </div>{/* end grid */}

      {/* ════════════ FOOTER ════════════ */}
      <div style={{
        background:"#000a06",borderTop:"1px solid #060f09",
        padding:"3px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",
        flexShrink:0,
      }}>
        <span style={{color:"#0c2618",fontSize:7,letterSpacing:3,fontFamily:"monospace"}}>
          DnR TERMINAL © 2026 ── MT5 CYBER TRADING DASHBOARD ── PROFESSIONAL USE ONLY
        </span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:"#0c2618",fontSize:7,fontFamily:"monospace",letterSpacing:1}}>
            {clock.toLocaleTimeString("en-GB")}
          </span>
          <span style={{color:"#00ff41",fontSize:6,animation:"blink 1s infinite"}}>●</span>
        </div>
      </div>
    </div>
  );
}
