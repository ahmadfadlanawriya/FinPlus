import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase.js";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  Wallet, LayoutDashboard, ListOrdered, Upload, CreditCard, Target,
  Plus, Trash2, Sparkles, AlertTriangle, Check, Loader2, X, Search,
  FileText, Banknote, ChevronDown, RefreshCw, PiggyBank, Plane, Ban, RotateCcw, Users, Menu, MessageCircle, Landmark, Image as ImageIcon, ChevronRight, ArrowDownLeft, ArrowUpRight, LogOut, UserCircle, HandCoins, LayoutList, TableIcon,
} from "lucide-react";

/* ----------------------------- brand palette ----------------------------- */
const BRAND = {
  blue: "#476C9B", blueDark: "#33526F", blueLight: "#ADD9F4", blueTint: "#EAF3FB",
  red: "#984447", redDark: "#7A3638", redLight: "#D9AEB0", redTint: "#F7E9E9",
  gold: "#B98B4E", goldDark: "#8C6A3A", goldLight: "#E8C988", goldTint: "#FBF1DE",
  plum: "#6B5B7A", plumDark: "#52415F", plumLight: "#C9B9D6", plumTint: "#F0EBF4",
  success: "#7A8B5E", successLight: "#C7D1B5", successTint: "#F1F4EC",
  slate: "#5B8AA6", olive: "#8C9D55", ink: "#1A181B",
};

/* ----------------------------- constants ----------------------------- */
const CATEGORIES = [
  "Food & Dining", "Groceries", "Transport", "Shopping", "Bills & Utilities",
  "Subscriptions", "Entertainment", "Health", "Education", "Travel",
  "Transfers", "Cash & ATM", "Fees & Interest", "Card Payment", "Salary", "Income", "Other",
];
const INCOME_CATEGORIES = ["Salary", "Income", "Transfers", "Other"];
const DEFAULT_SCOPES = [
  { name: "personal", color: BRAND.blue },
  { name: "family", color: BRAND.slate },
  { name: "friends", color: BRAND.gold },
  { name: "work", color: BRAND.red },
];
const SWATCHES = [BRAND.blue, BRAND.slate, BRAND.red, BRAND.gold, BRAND.plum, BRAND.ink, "#A65D5D", BRAND.olive, "#3A8E8C", "#7C6B8F"];
const ACCOUNT_TYPES = ["credit", "debit", "qris", "e-wallet", "cash"];
const PALETTE = [BRAND.blue, BRAND.red, BRAND.gold, BRAND.plum, BRAND.slate, BRAND.olive, "#A65D5D", "#3A8E8C", "#C9A227", "#7C6B8F", "#5C7A99", "#B5773F", "#6F8FAE", "#9C6B6E", "#7A8B6F"];
const ACCOUNT_COLORS = [BRAND.blue, BRAND.red, BRAND.gold, BRAND.plum, BRAND.slate, BRAND.olive, "#A65D5D"];
const RELATIONS = ["Family", "Friends", "Work Colleagues"];
const RELATION_COLOR = { Family: BRAND.slate, Friends: BRAND.gold, "Work Colleagues": BRAND.red };
const MAX_PARTIES = 20;
const TRIP_GAP_DAYS = 5;

const ID_MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MEI: 5, JUN: 6, JUL: 7, AGU: 8, AGS: 8, SEP: 9, OKT: 10, NOV: 11, DES: 12 };
const SAAS = [
  "datadog", "mongodb", "mongo atlas", "amazon web", "aws", "google cloud", "gcp", "vercel", "netlify",
  "cloudflare", "digitalocean", "heroku", "render.com", "openai", "anthropic", "claude.ai", "github", "gitlab",
  "atlassian", "jira", "linear.app", "notion", "figma", "framer", "slack", "zoom", "twilio", "sendgrid", "stripe",
  "wati.io", "wati", "bolt", "stackblitz", "supabase", "planetscale", "sentry", "hubspot", "intercom",
  "airtable", "zapier", "adobe", "microsoft 365", "office 365", "canva", "loom", "postman", "retool",
  "clerk", "auth0", "algolia", "snowflake", "openrouter", "huggingface", "replicate", "fly.io", "railway", "spotify", "netflix", "youtube premium",
];
const FEE_KW = ["membership fee", "e-statement fee", "statement fee", "biaya notifikasi", "annual fee", "iuran", "admin fee"];
const CURRENCY = {
  MYR: { c: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" }, HKD: { c: "Hong Kong", flag: "\u{1F1ED}\u{1F1F0}" },
  SGD: { c: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" }, USD: { c: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  THB: { c: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" }, JPY: { c: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  EUR: { c: "Europe", flag: "\u{1F1EA}\u{1F1FA}" }, GBP: { c: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  AUD: { c: "Australia", flag: "\u{1F1E6}\u{1F1FA}" }, KRW: { c: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  VND: { c: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" }, PHP: { c: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  CNY: { c: "China", flag: "\u{1F1E8}\u{1F1F3}" }, TWD: { c: "Taiwan", flag: "\u{1F1F9}\u{1F1FC}" },
  AED: { c: "UAE", flag: "\u{1F1E6}\u{1F1EA}" }, INR: { c: "India", flag: "\u{1F1EE}\u{1F1F3}" },
};

function enrich(desc) {
  const d = (desc || "").toLowerCase();
  if (SAAS.some((k) => d.includes(k))) return { category: "Subscriptions", scope: "work", recurring: true };
  if (FEE_KW.some((k) => d.includes(k))) return { category: "Fees & Interest", scope: "personal", recurring: true };
  return null;
}
function isSaaSlike(t) { const d = (t.desc || "").toLowerCase(); return t.recurring || t.category === "Subscriptions" || SAAS.some((k) => d.includes(k)); }
function fxCode(fx) { const tok = (fx || "").trim().split(/\s+/)[0]; return /^[A-Za-z]{3}$/.test(tok || "") ? tok.toUpperCase() : ""; }
const CITY_TO_CODE = {
  "kuala lumpur": "MYR", "petaling jaya": "MYR", "shah alam": "MYR", "cheras": "MYR", "subang": "MYR", "johor": "MYR",
  "hong kong": "HKD", "tsim sha tsui": "HKD", "kowloon": "HKD",
  "singapore": "SGD", "chinatown": "SGD", "orchard": "SGD",
  "bangkok": "THB", "phuket": "THB", "pattaya": "THB",
  "tokyo": "JPY", "osaka": "JPY", "kyoto": "JPY",
  "seoul": "KRW", "busan": "KRW",
  "ho chi minh": "VND", "hanoi": "VND",
  "london": "GBP", "manila": "PHP", "taipei": "TWD", "shanghai": "CNY", "beijing": "CNY",
  "sydney": "AUD", "melbourne": "AUD", "dubai": "AED",
};
function inferFxFromDesc(desc) {
  const d = (desc || "").toLowerCase();
  for (const [city, code] of Object.entries(CITY_TO_CODE)) { if (d.includes(city)) return code; }
  return "";
}
function looksLikeTravel(t) {
  if (t.notTravel) return false;
  if (t.tripCountry) return true;
  if (t.category === "Travel") return true;
  if (isSaaSlike(t)) return false;
  return !!(t.fx || inferFxFromDesc(t.desc));
}

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const idr = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));
const monthKey = (d) => (d || "").slice(0, 7);
const monthLabel = (mk) => { if (!mk) return "—"; const [y, m] = mk.split("-"); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); };
const merchantKey = (desc) => (desc || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 3).join(" ");
const planOf = (t) => (t.fx || "").trim();
const splitsSum = (t) => (t.splits || []).reduce((a, s) => a + (Number(s.amount) || 0), 0);
const netOf = (t) => Math.max(0, (t.amount || 0) - splitsSum(t));

function normDate(s) {
  s = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`; }
  return today();
}
function parseIndoDate(s) {
  s = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // "13 MEI" or "13MEI" — UOB style
  const m = s.match(/(\d{1,2})\s*([A-Za-z]{3,4})/);
  if (m) {
    const day = m[1].padStart(2, "0"); const mo = ID_MONTHS[m[2].toUpperCase().slice(0, 3)];
    if (mo) { const y = new Date().getFullYear(); let iso = `${y}-${String(mo).padStart(2, "0")}-${day}`; if (new Date(iso) > new Date(Date.now() + 86400000)) iso = `${y - 1}-${String(mo).padStart(2, "0")}-${day}`; return iso; }
  }
  // "17/05" — Danamon style (DD/MM, no year)
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m2) {
    const day = m2[1].padStart(2, "0"); const mo = m2[2].padStart(2, "0");
    const y = new Date().getFullYear(); let iso = `${y}-${mo}-${day}`;
    if (new Date(iso) > new Date(Date.now() + 86400000)) iso = `${y - 1}-${mo}-${day}`;
    return iso;
  }
  return normDate(s);
}
function nextMonth(iso) { const d = new Date(iso); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); }

/* ----------------------------- transaction classifier ----------------------------- */
// AI kind labels are unreliable; re-derive deterministically from the description + CR flag.
const PAYMENT_KW = ["paymt", "pembayaran", "thru e-bank", "homeb", "cyberb", "payment thru", "pelunasan"];
function classifyDirection(desc, aiKind, hasCR) {
  const d = (desc || "").toLowerCase();
  const isPaymentText = PAYMENT_KW.some((k) => d.includes(k));
  if (isPaymentText) return "payment";                  // genuine card bill payment
  if (hasCR || aiKind === "refund") return "income";    // credits / reversals
  return "expense";                                       // default: a real purchase
}

/* ----------------------------- period (monthly / quarterly / YTD) ----------------------------- */
function quarterOf(monthStr) { const [y, m] = monthStr.split("-").map(Number); const q = Math.ceil(m / 3); return { year: y, q, startMonth: (q - 1) * 3 + 1, endMonth: (q - 1) * 3 + 3 }; }
function inPeriod(dateStr, mode, monthStr) {
  const dk = monthKey(dateStr); const [dy, dm] = dk.split("-").map(Number);
  const [y, m] = monthStr.split("-").map(Number);
  if (mode === "quarter") { const { year, startMonth, endMonth } = quarterOf(monthStr); return dy === year && dm >= startMonth && dm <= endMonth; }
  if (mode === "ytd") return dy === y && dm <= m;
  return dk === monthStr;
}
function shiftMonth(monthStr, delta) { const [y, m] = monthStr.split("-").map(Number); const total = y * 12 + (m - 1) + delta; const ny = Math.floor(total / 12); const nm = (total % 12) + 1; return `${ny}-${String(nm).padStart(2, "0")}`; }
function prevAnchor(mode, monthStr) {
  if (mode === "quarter") return shiftMonth(monthStr, -3);
  if (mode === "ytd") return shiftMonth(monthStr, -12);
  return shiftMonth(monthStr, -1);
}
function periodLabel(mode, monthStr) {
  if (mode === "quarter") { const { year, q } = quarterOf(monthStr); return `Q${q} ${year}`; }
  if (mode === "ytd") { const [y] = monthStr.split("-").map(Number); return `Jan\u2013${monthLabel(monthStr).split(" ")[0]} ${y}`; }
  return monthLabel(monthStr);
}
function periodCompareLabel(mode) { return mode === "quarter" ? "vs last quarter" : mode === "ytd" ? "vs last year" : "vs last month"; }

/* ----------------------------- debit / QRIS balance ----------------------------- */
const CURRENCY_LIST = ["IDR", "USD", "SGD", "MYR", "HKD", "EUR", "GBP", "JPY", "AUD"];
function fmtMoney(amount, currency) {
  try { return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", { style: "currency", currency: currency || "IDR", maximumFractionDigits: currency === "IDR" ? 0 : 2 }).format(Number(amount) || 0); }
  catch { return idr(amount); }
}
function resolveDebitTarget(accounts, accountId) {
  const acc = accounts.find((a) => a.id === accountId); if (!acc) return null;
  if (acc.type === "debit") return acc.id;
  if (acc.type === "qris" && acc.linkedAccountId) return acc.linkedAccountId;
  return null;
}
function signedAmount(t) { return t.direction === "expense" ? -t.amount : t.direction === "income" ? t.amount : 0; }
function applyBalanceDelta(accounts, accountId, delta) {
  const target = resolveDebitTarget(accounts, accountId);
  if (!target || !delta) return accounts;
  return accounts.map((a) => (a.id === target ? { ...a, balance: (Number(a.balance) || 0) + delta } : a));
}

/* ----------------------------- WhatsApp settle-up ----------------------------- */
function normalizePhone(phone) {
  let p = (phone || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}
function settleMessage(name, totalOwed) {
  return `Halo ${name}, total tagihan FadlanPayLater kamu sebesar ${idr(totalOwed)}, Jika membutuhkan detail transaksinya, kirimkan pesan "Detail Transaksi". Mohon segera melakukan pembayaran ya!`;
}
function whatsappLink(phone, message) { return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`; }

/* ----------------------------- drafts (local only) ----------------------------- */
function loadDrafts() { try { const v = localStorage.getItem("drafts"); return v ? JSON.parse(v) : null; } catch { return null; } }
function saveDrafts(d) { try { localStorage.setItem("drafts", JSON.stringify(d)); } catch (e) { console.error("drafts save failed", e); } }

/* ----------------------------- db mapping ----------------------------- */
const toDbAccount = (a, uid) => ({ id: a.id, user_id: uid, name: a.name, bank: a.bank || null, type: a.type, color: a.color, balance: a.balance ?? null, currency: a.currency || "IDR", linked_account_id: a.linkedAccountId || null, holder: a.holder || null, number: a.number || null, credit_limit: a.creditLimit ?? null, balance_owed: a.balanceOwed ?? null, points: a.points ?? null });
const fromDbAccount = (r) => ({ id: r.id, name: r.name, bank: r.bank, type: r.type, color: r.color, balance: r.balance, currency: r.currency, linkedAccountId: r.linked_account_id, holder: r.holder, number: r.number, creditLimit: r.credit_limit, balanceOwed: r.balance_owed, points: r.points });
const toDbTx = (t, uid) => ({ id: t.id, user_id: uid, date: t.date, desc: t.desc, amount: t.amount, direction: t.direction, fx: t.fx || null, payer: t.payer || null, category: t.category || null, scope: t.scope || null, recurring: !!t.recurring, account_id: t.accountId || null, splits: t.splits || [], trip_country: t.tripCountry || null, not_travel: !!t.notTravel });
const fromDbTx = (r) => ({ id: r.id, date: r.date, desc: r.desc, amount: r.amount, direction: r.direction, fx: r.fx || "", payer: r.payer || "", category: r.category || "", scope: r.scope || "", recurring: r.recurring, accountId: r.account_id, splits: r.splits || [], tripCountry: r.trip_country, notTravel: r.not_travel });
const toDbGoal = (g, uid) => ({ id: g.id, user_id: uid, kind: g.kind, name: g.name, category: g.category || null, limit: g.limit ?? null, target: g.target ?? null });
const fromDbGoal = (r) => ({ id: r.id, kind: r.kind, name: r.name, category: r.category, limit: r.limit, target: r.target });
const toDbSub = (s, uid) => ({ id: s.id, user_id: uid, key: s.key, plan: s.plan || null, name: s.name, category: s.category || null, scope: s.scope || null, monthly: s.monthly, status: s.status, cancelled_at: s.cancelledAt || null });
const fromDbSub = (r) => ({ id: r.id, key: r.key, plan: r.plan, name: r.name, category: r.category, scope: r.scope, monthly: r.monthly, status: r.status, cancelledAt: r.cancelled_at });
const toDbParty = (p, uid) => ({ id: p.id, user_id: uid, name: p.name, phone: p.phone || null, relation: p.relation });
const fromDbParty = (r) => ({ id: r.id, name: r.name, phone: r.phone, relation: r.relation });
const toDbStatement = (s, uid) => ({ id: s.id, user_id: uid, account_id: s.accountId || null, month: s.month, statement_date: s.statementDate || null, due_date: s.dueDate || null, total_amount: s.totalAmount, min_payment: s.minPayment ?? null });
const fromDbStatement = (r) => ({ id: r.id, accountId: r.account_id, month: r.month, statementDate: r.statement_date, dueDate: r.due_date, totalAmount: Number(r.total_amount), minPayment: r.min_payment != null ? Number(r.min_payment) : null });
const fromDbLoan = (r) => ({ id: r.id, borrowerId: r.borrower_id, borrowerName: r.borrower_name, description: r.description || "", principal: Number(r.principal), sourceAccountId: r.source_account_id, issuedDate: r.issued_date, dueDate: r.due_date || "", status: r.status || "active", notes: r.notes || "" });
const fromDbLoanPayment = (r) => ({ id: r.id, loanId: r.loan_id, amount: Number(r.amount), paidDate: r.paid_date, note: r.note || "" });

async function loadAllData(userId) {
  const [ar, tr, gr, sr, pr, mr, tmr, profr, str] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("parties").select("*").eq("user_id", userId),
    supabase.from("memory").select("*").eq("user_id", userId),
    supabase.from("trip_meta").select("*").eq("user_id", userId),
    supabase.from("profiles").select("scopes").eq("id", userId).maybeSingle(),
    supabase.from("statements").select("*").eq("user_id", userId),
  ]);
  return {
    accounts: (ar.data || []).map(fromDbAccount),
    transactions: (tr.data || []).map(fromDbTx),
    goals: (gr.data || []).map(fromDbGoal),
    subscriptions: (sr.data || []).map(fromDbSub),
    parties: (pr.data || []).map(fromDbParty),
    memory: Object.fromEntries((mr.data || []).map((r) => [r.merchant_key, { category: r.category, scope: r.scope, recurring: r.recurring }])),
    tripMeta: Object.fromEntries((tmr.data || []).map((r) => [r.trip_key, { purpose: r.purpose, banner: r.banner, name: r.name || "" }])),
    scopes: Array.isArray(profr.data?.scopes) && profr.data.scopes.length ? profr.data.scopes : null,
    statements: (str.data || []).map(fromDbStatement),
  };
}

async function syncTable(table, userId, rows) {
  if (rows.length) {
    // Upsert first so Supabase always has the latest data before any deletes
    const { error: ue } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    if (ue) { console.error("[db] upsert", table, ue); return; }
    // Delete rows whose id is no longer in the local set
    const ids = rows.map((r) => r.id);
    const { error: de } = await supabase.from(table).delete().eq("user_id", userId).not("id", "in", `(${ids.map((id) => `'${id}'`).join(",")})`);
    if (de) console.error("[db] delete stale", table, de);
  } else {
    // Genuinely empty — user deleted everything, safe to wipe
    const { error: de } = await supabase.from(table).delete().eq("user_id", userId);
    if (de) console.error("[db] delete all", table, de);
  }
}
// For tables with a natural text key instead of uuid id (memory, trip_meta)
async function syncTableByKey(table, userId, rows, keyCol) {
  if (rows.length) {
    const { error: ue } = await supabase.from(table).upsert(rows, { onConflict: keyCol });
    if (ue) { console.error("[db] upsert", table, ue); return; }
    const keys = rows.map((r) => r[keyCol]);
    const { error: de } = await supabase.from(table).delete().eq("user_id", userId).not(keyCol, "in", `(${keys.map((k) => `'${k}'`).join(",")})`);
    if (de) console.error("[db] delete stale", table, de);
  } else {
    const { error: de } = await supabase.from(table).delete().eq("user_id", userId);
    if (de) console.error("[db] delete all", table, de);
  }
}

/* ----------------------------- AI ----------------------------- */
async function anthropic(content, maxTokens = 1000) {
  const res = await fetch("/api/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content }] }) });
  if (!res.ok) throw new Error("Couldn't reach the reader (status " + res.status + ").");
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
function parseJSON(text) {
  let t = (text || "").trim().replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = t.search(/[[{]/); if (s >= 0) t = t.slice(s);
  const end = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}")); if (end >= 0) t = t.slice(0, end + 1);
  try { return JSON.parse(t); } catch (e) {
    // statement may have been truncated mid-array; salvage the last complete element
    if (t.startsWith("[")) {
      let cut = t.lastIndexOf("},");
      if (cut === -1) cut = t.lastIndexOf("}");
      if (cut > 0) { try { return JSON.parse(t.slice(0, cut + 1) + "]"); } catch (e2) { /* fall through */ } }
    }
    throw e;
  }
}
function fileToBase64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(new Error("Couldn't read that file.")); r.readAsDataURL(file); }); }
async function extractFromFile(file) {
  const b64 = await fileToBase64(file);
  const isPdf = file.type === "application/pdf";
  const media = file.type || (isPdf ? "application/pdf" : "image/jpeg");
  const prompt =
    "You are reading an Indonesian bank credit card statement (UOB, Danamon, BCA, Mandiri, CIMB, or similar). Extract every individual transaction row. " +
    "Return ONLY a JSON array, no prose, no markdown. " +
    'Each item: {"date":"transaction date exactly as printed e.g. \'13 MEI\' or \'17/05\'","desc":"merchant or fee name","amount":number,"kind":"purchase"|"payment"|"refund","fx":"e.g. USD 109.12 or empty","hasCR":true/false}. ' +
    "Rules:\\n" +
    "- 'amount' is ALWAYS the IDR billed amount (rightmost column, labelled Jumlah Tagihan / JUMLAH TAGIHAN), a plain integer with no thousand separators. Never use the foreign-currency figure for amount \u2014 put that in 'fx'.\\n" +
    "- 'date': if the statement has two date columns (TGL TRANS. and TGL PENCATATAN), always use the first one (transaction date).\\n" +
    "- 'hasCR' is true ONLY when that row's amount is followed by the letters CR. Most purchase rows have hasCR=false.\\n" +
    "- 'kind': set 'payment' for card bill payments (desc contains PAYMT, PEMBAYARAN, THRU E-BANK, or PELUNASAN). Set 'refund' for other CR rows (cashbacks, fee reversals, loyalty credit, JCB_CB). Set 'purchase' for everything else.\\n" +
    "- Bank fees and charges are valid purchases: include BIAYA MATERAI, BIAYA NOTIFIKASI, BIAYA EMAIL STATEMENT, BIAYA TAHUNAN, BIAYA ADMINISTRASI.\\n" +
    "- SKIP these non-transaction lines: previous-balance rows (TAGIHAN SEBELUMNYA, TAGIHAN BULAN LALU, PREVIOUS BALANCE, OUTSTANDING BALANCE), totals (SUB TOTAL, TOTAL TAGIHAN, RINGKASAN TAGIHAN), bonus/point summaries, column headers, card-number-only rows, END OF STATEMENT, and any row whose amount is 0.\\n" +
    "Return [] if you find none.";
  const block = isPdf ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } } : { type: "image", source: { type: "base64", media_type: media, data: b64 } };
  const text = await anthropic([block, { type: "text", text: prompt }], 8000);
  const arr = parseJSON(text); return Array.isArray(arr) ? arr : [];
}
async function aiCategorize(descriptions) {
  if (!descriptions.length) return [];
  const prompt = "Categorize each transaction into exactly one category from this list: " + CATEGORIES.filter((c) => c !== "Card Payment" && c !== "Income").join(", ") + ". Return ONLY a JSON array of category strings, same order, same length, no prose.\\n" + descriptions.map((d, i) => `${i + 1}. ${d}`).join("\\n");
  const text = await anthropic(prompt, 2048); const arr = parseJSON(text); return Array.isArray(arr) ? arr : [];
}
async function aiSavingTips(summary) {
  const prompt = "You are a friendly Indonesian personal-finance coach. Based on this month's spending data (IDR), give 3-5 specific, actionable tips to spend less next month. Point at concrete categories and rough rupiah amounts to cut. " +
    'Return ONLY a JSON array of objects {"title":"short headline","detail":"1-2 sentences","priority":"high"|"medium"|"low"}. No prose.\\n' + JSON.stringify(summary);
  const text = await anthropic(prompt); const arr = parseJSON(text); return Array.isArray(arr) ? arr : [];
}

/* ----------------------------- small UI ----------------------------- */
function Card({ children, className = "" }) { return <div className={"bg-white border border-stone-200 rounded-xl " + className}>{children}</div>; }
function Num({ children, className = "" }) { return <span className={"num " + className}>{children}</span>; }
function Pill({ children, color }) { return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (color || "#78716c") + "1a", color: color || "#57534e" }}>{children}</span>; }
function Btn({ children, onClick, variant = "primary", disabled, className = "", type = "button" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const map = {
    primary: "fp-btn-primary px-3.5 py-2",
    ghost: "text-stone-600 hover:bg-stone-100 px-3 py-2",
    outline: "border border-stone-300 text-stone-700 hover:bg-stone-50 px-3.5 py-2",
    danger: "fp-text-danger fp-bg-danger-tint-hover px-2 py-2",
    warn: "border fp-border-danger-light fp-text-danger fp-bg-danger-tint-hover px-3 py-1.5",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]} ${className}`}>{children}</button>;
}
function Field({ label, children }) { return <label className="block"><span className="block text-xs font-medium text-stone-500 mb-1">{label}</span>{children}</label>; }
const inputCls = "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white fp-input";

function ScopeSelect({ value, onChange, scopes, scopeColor, bare }) {
  return <select value={value} onChange={onChange} style={{ color: scopeColor(value) }} className={(bare ? "bg-transparent border border-transparent hover:border-stone-300" : "border border-stone-200") + " rounded px-1.5 py-1 capitalize focus:outline-none fp-input"}>{scopes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select>;
}
function CatSelect({ value, onChange, bare, blankWarn }) {
  return <select value={value} onChange={onChange} className={(bare ? "bg-transparent border border-transparent hover:border-stone-300 text-stone-700" : blankWarn && !value ? "border fp-border-warn fp-bg-warn-tint-static" : "border border-stone-200") + " rounded px-1.5 py-1 focus:outline-none fp-input"}>{blankWarn && <option value="">— pick —</option>}{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>;
}

/* ===================================================================== */
function App({ user }) {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("overview");
  const [moreOpen, setMoreOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memory, setMemory] = useState({});
  const [scopes, setScopes] = useState(DEFAULT_SCOPES);
  const [subscriptions, setSubscriptions] = useState([]);
  const [parties, setParties] = useState([]);
  const [tripMeta, setTripMeta] = useState({});
  const [statements, setStatements] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [month, setMonth] = useState(monthKey(new Date().toISOString()));
  const [periodMode, setPeriodMode] = useState("month");
  const [focusAccount, setFocusAccount] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    (async () => {
      try {
        const d = await loadAllData(user.id);
        setAccounts(d.accounts); setGoals(d.goals); setMemory(d.memory);
        setScopes(d.scopes || DEFAULT_SCOPES);
        setSubscriptions(d.subscriptions); setParties(d.parties); setTripMeta(d.tripMeta); setStatements(d.statements);
        const repaired = d.transactions.map((t) => {
          if (t.direction === "payment") {
            const corrected = classifyDirection(t.desc, t.kind, false);
            if (corrected !== "payment") return { ...t, direction: corrected, category: t.category === "Card Payment" ? "" : t.category };
          }
          return t;
        });
        setTransactions(repaired);
        const dr = loadDrafts(); if (dr) setDrafts(dr);
        setReady(true); // only set ready after all state is populated
      } catch (e) {
        console.error("[db] load", e);
        setLoadError(true); // never touch ready — keeps sync effects disabled
      }
    })();
  }, [user.id]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("accounts", user.id, accounts.map((a) => toDbAccount(a, user.id))), 600); return () => clearTimeout(t); }, [accounts, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("transactions", user.id, transactions.map((tx) => toDbTx(tx, user.id))), 600); return () => clearTimeout(t); }, [transactions, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("goals", user.id, goals.map((g) => toDbGoal(g, user.id))), 600); return () => clearTimeout(t); }, [goals, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("subscriptions", user.id, subscriptions.map((s) => toDbSub(s, user.id))), 600); return () => clearTimeout(t); }, [subscriptions, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("parties", user.id, parties.map((p) => toDbParty(p, user.id))), 600); return () => clearTimeout(t); }, [parties, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const rows = Object.entries(memory).map(([merchant_key, v]) => ({ user_id: user.id, merchant_key, category: v.category || null, scope: v.scope || null, recurring: !!v.recurring })); const t = setTimeout(() => syncTableByKey("memory", user.id, rows, "merchant_key"), 600); return () => clearTimeout(t); }, [memory, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const rows = Object.entries(tripMeta).map(([trip_key, v]) => ({ user_id: user.id, trip_key, purpose: v.purpose || null, banner: v.banner || null, name: v.name || null })); const t = setTimeout(() => syncTableByKey("trip_meta", user.id, rows, "trip_key"), 600); return () => clearTimeout(t); }, [tripMeta, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => syncTable("statements", user.id, statements.map((s) => toDbStatement(s, user.id))), 600); return () => clearTimeout(t); }, [statements, ready]); // eslint-disable-line
  useEffect(() => { if (!ready) return; const t = setTimeout(() => supabase.from("profiles").upsert({ id: user.id, scopes }, { onConflict: "id" }).then(({ error: e }) => { if (e) console.error("[db] scopes", e); }), 600); return () => clearTimeout(t); }, [scopes, ready]); // eslint-disable-line
  useEffect(() => { if (ready) saveDrafts(drafts); }, [drafts, ready]);

  const months = useMemo(() => { const set = new Set(transactions.map((t) => monthKey(t.date)).filter(Boolean)); set.add(monthKey(new Date().toISOString())); return Array.from(set).sort().reverse(); }, [transactions]);
  const busiestMonth = useMemo(() => {
    const counts = {}; transactions.forEach((t) => { const k = monthKey(t.date); if (k) counts[k] = (counts[k] || 0) + 1; });
    const entries = Object.entries(counts); if (!entries.length) return monthKey(new Date().toISOString());
    return entries.sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0][0];
  }, [transactions]);
  const [monthTouched, setMonthTouched] = useState(false);
  const pickMonth = useCallback((m) => { setMonthTouched(true); setMonth(m); }, []);
  useEffect(() => { if (!monthTouched && busiestMonth) setMonth(busiestMonth); }, [busiestMonth, monthTouched]);
  useEffect(() => { if (months.length && !months.includes(month)) setMonth(months[0]); }, [months]); // eslint-disable-line

  const scopeColor = useCallback((name) => scopes.find((s) => s.name === name)?.color || "#78716c", [scopes]);
  const defaultScope = scopes[0]?.name || "personal";

  const learn = useCallback((desc, category, scope, recurring) => {
    const k = merchantKey(desc); if (!k) return;
    setMemory((m) => { const cur = m[k] || {}; return { ...m, [k]: { category: category ?? cur.category, scope: scope ?? cur.scope, recurring: recurring === undefined ? cur.recurring : recurring } }; });
  }, []);
  const recall = useCallback((desc) => { const k = merchantKey(desc); if (memory[k]) return memory[k]; const hit = Object.keys(memory).find((mk) => mk && (k.includes(mk) || mk.includes(k)) && mk.length > 2); return hit ? memory[hit] : null; }, [memory]);
  const matchSub = useCallback((desc, fx) => subscriptions.find((s) => s.key === merchantKey(desc) && (s.plan || "") === (fx || "").trim()), [subscriptions]);

  if (!ready) return (
    <div style={rootStyle} className="flex flex-col items-center justify-center gap-4">
      <FontStyle />
      {loadError ? (
        <>
          <AlertTriangle size={32} style={{ color: BRAND.red }} />
          <div className="text-center">
            <div className="font-semibold text-stone-800 mb-1">Failed to load your data</div>
            <div className="text-sm text-stone-500 mb-3">Check your connection and try again. Your data in Supabase is safe.</div>
            <button onClick={() => { setLoadError(false); window.location.reload(); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.blue }}>Retry</button>
          </div>
        </>
      ) : (
        <Loader2 className="animate-spin" style={{ color: BRAND.blue }} />
      )}
    </div>
  );

  const visibleTabs = [
    ["overview", "Overview", LayoutDashboard],
    ["transactions", "Transactions", ListOrdered],
    ["import", "Import", Upload],
  ];
  const moreTabs = [
    ["travel", "Travel", Plane],
    ["subscriptions", "Subscriptions", RefreshCw],
    ["people", "People", Users],
    ["loans", "Loans", HandCoins],
    ["accountsDetail", "My Accounts", Landmark],
    ["statements", "Statements", FileText],
    ["goals", "Goals", Target],
    ["about", "About Me", UserCircle],
  ];
  const activeMore = moreTabs.find(([id]) => id === tab);

  const signOut = async () => {
    setMoreOpen(false);
    await supabase.auth.signOut();
  };

  return (
    <div style={rootStyle}>
      <FontStyle />
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND.blue }}><Wallet size={17} className="text-white" /></div>
            <div className="leading-tight"><div className="font-semibold text-stone-900 tracking-tight">FinPlus</div><div className="text-[11px] text-stone-400 -mt-0.5">your money, sorted</div></div>
          </div>
          <div className="flex items-center gap-2">
            <MonthPicker months={months} month={month} setMonth={pickMonth} />
            <div className="relative">
              <button onClick={() => setMoreOpen((o) => !o)} className="relative border border-stone-300 rounded-lg p-2 bg-white hover:bg-stone-50" aria-label="More">
                <Menu size={17} className="text-stone-600" />
                {activeMore && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: BRAND.plum }} />}
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg z-40 p-1.5">
                    <div className="px-2 pb-1 pt-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Pages</span>
                    </div>
                    {moreTabs.map(([id, label, Icon]) => (
                      <button key={id} onClick={() => { setTab(id); setMoreOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 text-left" style={tab === id ? { backgroundColor: BRAND.blueTint, color: BRAND.blueDark } : undefined}>
                        <Icon size={15} /> {label}
                      </button>
                    ))}
                    <div className="my-1.5 border-t border-stone-200" />
                    <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-left" style={{ color: BRAND.red }} onMouseEnter={e => e.currentTarget.style.backgroundColor = BRAND.redTint} onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {visibleTabs.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={"flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors " + (tab === id ? "" : "border-transparent text-stone-500 hover:text-stone-800")} style={tab === id ? { borderColor: BRAND.blue, color: BRAND.blueDark } : undefined}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeMore && <h2 className="text-lg font-semibold text-stone-900 mb-4">{activeMore[1]}</h2>}
        {tab === "overview" && <Overview transactions={transactions} goals={goals} month={month} setTab={setTab} scopes={scopes} scopeColor={scopeColor} defaultScope={defaultScope} periodMode={periodMode} setPeriodMode={setPeriodMode} />}
        {tab === "transactions" && <Transactions transactions={transactions} setTransactions={setTransactions} accounts={accounts} setAccounts={setAccounts} month={month} learn={learn} scopes={scopes} scopeColor={scopeColor} defaultScope={defaultScope} parties={parties} setTab={setTab} />}
        {tab === "travel" && <Travel transactions={transactions} setTransactions={setTransactions} accounts={accounts} scopes={scopes} scopeColor={scopeColor} tripMeta={tripMeta} setTripMeta={setTripMeta} defaultScope={defaultScope} />}
        {tab === "subscriptions" && <Subscriptions subscriptions={subscriptions} setSubscriptions={setSubscriptions} transactions={transactions} setTransactions={setTransactions} learn={learn} scopes={scopes} scopeColor={scopeColor} setTab={setTab} />}
        {tab === "people" && <People parties={parties} setParties={setParties} transactions={transactions} setTransactions={setTransactions} setTab={setTab} />}
        {tab === "loans" && <LoansPage accounts={accounts} parties={parties} user={user} />}
        {tab === "import" && <Importer accounts={accounts} setAccounts={setAccounts} setTransactions={setTransactions} setSubscriptions={setSubscriptions} recall={recall} learn={learn} matchSub={matchSub} setTab={setTab} scopes={scopes} scopeColor={scopeColor} defaultScope={defaultScope} drafts={drafts} setDrafts={setDrafts} />}
        {tab === "accounts" && <Setup accounts={accounts} setAccounts={setAccounts} transactions={transactions} scopes={scopes} setScopes={setScopes} setTab={setTab} setFocusAccount={setFocusAccount} />}
        {tab === "accountsDetail" && <AccountsDetail accounts={accounts} setAccounts={setAccounts} transactions={transactions} setTab={setTab} focusAccount={focusAccount} setFocusAccount={setFocusAccount} />}
        {tab === "goals" && <Goals goals={goals} setGoals={setGoals} transactions={transactions} month={month} />}
        {tab === "statements" && <StatementsPage accounts={accounts} statements={statements} setStatements={setStatements} />}
        {tab === "about" && <AboutMe user={user} />}
      </main>
    </div>
  );
}

function MonthPicker({ months, month, setMonth }) {
  return <div className="relative"><select value={month} onChange={(e) => setMonth(e.target.value)} className="appearance-none border border-stone-300 rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium bg-white fp-input">{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</select><ChevronDown size={15} className="absolute right-2 top-2.5 text-stone-400 pointer-events-none" /></div>;
}

/* ----------------------------- OVERVIEW ----------------------------- */
function Overview({ transactions, goals, month, setTab, scopes, scopeColor, defaultScope, periodMode, setPeriodMode }) {
  const inMonth = useMemo(() => transactions.filter((t) => monthKey(t.date) === month), [transactions, month]);
  const monthExpenses = inMonth.filter((t) => t.direction === "expense");

  // Monthly uses the picker; Quarterly + YTD always anchor to the latest month that has data
  const latestDataMonth = useMemo(() => {
    const keys = transactions.map((t) => monthKey(t.date)).filter(Boolean).sort();
    return keys[keys.length - 1] || month;
  }, [transactions, month]);
  const periodAnchor = periodMode === "month" ? month : latestDataMonth;

  const inPeriodTx = useMemo(() => transactions.filter((t) => inPeriod(t.date, periodMode, periodAnchor)), [transactions, periodMode, periodAnchor]);
  const prevAnchorMonth = useMemo(() => prevAnchor(periodMode, periodAnchor), [periodMode, periodAnchor]);
  const prevSpent = useMemo(() => transactions.filter((t) => inPeriod(t.date, periodMode, prevAnchorMonth) && t.direction === "expense").reduce((a, t) => a + netOf(t), 0), [transactions, periodMode, prevAnchorMonth]);

  const expenses = inPeriodTx.filter((t) => t.direction === "expense");
  const spent = expenses.reduce((a, t) => a + netOf(t), 0);
  const income = inPeriodTx.filter((t) => t.direction === "income").reduce((a, t) => a + t.amount, 0);
  const payments = inPeriodTx.filter((t) => t.direction === "payment").reduce((a, t) => a + t.amount, 0);
  const delta = prevSpent ? ((spent - prevSpent) / prevSpent) * 100 : 0;
  const owedPeriod = expenses.reduce((a, t) => a + (t.splits || []).filter((s) => !s.paid).reduce((b, s) => b + (Number(s.amount) || 0), 0), 0);
  const owedPeople = new Set(expenses.flatMap((t) => (t.splits || []).filter((s) => !s.paid).map((s) => s.partyId))).size;

  const byCategory = useMemo(() => { const map = {}; expenses.forEach((t) => (map[t.category || "Other"] = (map[t.category || "Other"] || 0) + netOf(t))); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [expenses]);
  const byScope = useMemo(() => { const map = {}; expenses.forEach((t) => { const s = t.scope || defaultScope; map[s] = (map[s] || 0) + netOf(t); }); return Object.entries(map).map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value); }, [expenses, defaultScope]);
  const trendByDay = periodMode === "month";
  const trend = useMemo(() => {
    const map = {};
    expenses.forEach((t) => { const k = trendByDay ? t.date : monthKey(t.date); map[k] = (map[k] || 0) + netOf(t); });
    return Object.entries(map).map(([k, value]) => ({ date: trendByDay ? k.slice(8) : monthLabel(k).slice(0, 3), value })).sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses, trendByDay]);
  const topMerchants = useMemo(() => { const map = {}; expenses.forEach((t) => (map[t.desc] = (map[t.desc] || 0) + netOf(t))); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5); }, [expenses]);

  if (!transactions.length) return <Empty icon={LayoutDashboard} title="Nothing here yet" body="Set up an account, then import a statement to see your spending come to life." action={<Btn onClick={() => setTab("import")}><Upload size={15} /> Import transactions</Btn>} />;

  const PERIODS = [["month", "Monthly"], ["quarter", "Quarterly"], ["ytd", "YTD"]];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Your spend" value={idr(spent)} accent={BRAND.red} sub={prevSpent ? `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% ${periodCompareLabel(periodMode)}` : null} subColor={delta > 0 ? BRAND.red : BRAND.success} />
        <Stat label="Credits in" value={idr(income)} accent={BRAND.blue} />
        <Stat label="Card payments" value={idr(payments)} accent={BRAND.slate} />
        <Stat label="Transactions" value={inPeriodTx.length} accent={BRAND.plum} />
      </div>

      <div className="flex items-center gap-2 py-1">
        <div className="h-px flex-1 bg-stone-200" />
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full p-1 shadow-sm">
          {PERIODS.map(([id, label]) => (
            <button key={id} onClick={() => setPeriodMode(id)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors" style={periodMode === id ? { backgroundColor: BRAND.blue, color: "#fff" } : { color: "#78716c" }}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-400 whitespace-nowrap">{periodLabel(periodMode, periodAnchor)}</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {owedPeriod > 0 && (
        <Card className="p-4 flex items-center justify-between gap-3">
          <div className="text-sm text-stone-600">Still owed to you this period from <span className="font-medium text-stone-800">{owedPeople}</span> {owedPeople === 1 ? "person" : "people"}</div>
          <div className="flex items-center gap-3"><Num className="font-semibold" style={{ color: BRAND.red }}>{idr(owedPeriod)}</Num><Btn variant="outline" onClick={() => setTab("people")} className="text-xs py-1.5">View</Btn></div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">Where it went <span className="text-xs font-normal text-stone-400">(your share)</span></h3>
          {byCategory.length ? (
            <ResponsiveContainer width="100%" height={Math.max(180, byCategory.length * 30)}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#57534e" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => idr(v)} cursor={{ fill: "#f5f5f4" }} /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{byCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Muted>No expenses in this period.</Muted>}
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">By profile</h3>
          {byScope.length ? (
            <>
              <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={byScope} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>{byScope.map((s) => <Cell key={s.name} fill={scopeColor(s.name)} />)}</Pie><Tooltip formatter={(v) => idr(v)} /></PieChart></ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">{byScope.map((s) => <span key={s.name} className="flex items-center gap-1 text-xs capitalize text-stone-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: scopeColor(s.name) }} /> {s.name}</span>)}</div>
            </>
          ) : <Muted>No expenses in this period.</Muted>}
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">{trendByDay ? "Daily spend" : "Spend by month"}</h3>
          {trend.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trend} margin={{ left: -18, right: 8 }}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.blue} stopOpacity={0.25} /><stop offset="100%" stopColor={BRAND.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1e6 ? v / 1e6 + "jt" : v / 1e3 + "rb")} />
                <Tooltip formatter={(v) => idr(v)} /><Area type="monotone" dataKey="value" stroke={BRAND.blue} strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Muted>No expenses in this period.</Muted>}
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">Top merchants</h3>
          {topMerchants.length ? <ul className="space-y-2.5">{topMerchants.map((m, i) => <li key={i} className="flex items-center justify-between gap-2 text-sm"><span className="truncate text-stone-700">{m.name}</span><Num className="text-stone-900 font-medium">{idr(m.value)}</Num></li>)}</ul> : <Muted>No expenses in this period.</Muted>}
        </Card>
      </div>

      <GoalStrip goals={goals} expenses={monthExpenses} income={inMonth.filter((t) => t.direction === "income").reduce((a, t) => a + t.amount, 0)} spent={monthExpenses.reduce((a, t) => a + netOf(t), 0)} setTab={setTab} />
      <Coach summary={{ month: periodLabel(periodMode, periodAnchor), spent, income, byCategory, byScope, prevSpent, goals }} hasData={expenses.length > 0} />
    </div>
  );
}

function Stat({ label, value, sub, accent, subColor }) { return <Card className="p-4"><div className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</div><Num className="block text-xl md:text-2xl font-semibold mt-1"><span style={{ color: accent }}>{value}</span></Num>{sub && <div className="text-xs mt-0.5" style={{ color: subColor }}>{sub}</div>}</Card>; }
function Muted({ children }) { return <div className="text-sm text-stone-400 py-6 text-center">{children}</div>; }

function GoalStrip({ goals, expenses, income, spent, setTab }) {
  if (!goals.length) return <Card className="p-4 flex items-center justify-between gap-3"><div className="text-sm text-stone-500">No goals yet. Cap a category or set a savings target to steer next month.</div><Btn variant="outline" onClick={() => setTab("goals")}><Target size={15} /> Set a goal</Btn></Card>;
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-stone-800 mb-3">Goals this month</h3>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {goals.map((g) => {
          if (g.kind === "save") { const saved = Math.max(0, income - spent); const pct = g.target ? Math.min(100, (saved / g.target) * 100) : 0; const met = saved >= g.target; return <div key={g.id}><div className="flex justify-between text-sm mb-1"><span className="text-stone-700 flex items-center gap-1"><PiggyBank size={13} style={{ color: BRAND.blue }} /> {g.name}</span><Num className="font-medium" style={{ color: met ? BRAND.success : "#57534e" }}>{idr(saved)} / {idr(g.target)}</Num></div><div className="h-2 rounded-full bg-stone-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: pct + "%", background: met ? BRAND.success : BRAND.blue }} /></div></div>; }
          const s = expenses.filter((t) => (g.category === "__total__" ? true : t.category === g.category)).reduce((a, t) => a + netOf(t), 0);
          const pct = g.limit ? Math.min(100, (s / g.limit) * 100) : 0; const over = s > g.limit;
          return <div key={g.id}><div className="flex justify-between text-sm mb-1"><span className="text-stone-700">{g.name}</span><Num className="font-medium" style={{ color: over ? BRAND.red : "#57534e" }}>{idr(s)} / {idr(g.limit)}</Num></div><div className="h-2 rounded-full bg-stone-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: pct + "%", background: over ? BRAND.red : pct > 80 ? BRAND.gold : BRAND.blue }} /></div></div>;
        })}
      </div>
    </Card>
  );
}

function Coach({ summary, hasData }) {
  const [tips, setTips] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const run = async () => { setLoading(true); setErr(""); try { const compact = { spent: summary.spent, credits: summary.income, lastMonthSpent: summary.prevSpent, topCategories: summary.byCategory.slice(0, 8), byScope: summary.byScope, goals: summary.goals.map((g) => ({ name: g.name, limit: g.limit, target: g.target })) }; setTips(await aiSavingTips(compact)); } catch (e) { setErr(e.message); } finally { setLoading(false); } };
  const pc = { high: BRAND.red, medium: BRAND.gold, low: BRAND.olive };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-1"><h3 className="text-sm font-semibold text-stone-800 flex items-center gap-1.5"><Sparkles size={15} style={{ color: BRAND.blue }} /> Savings coach</h3><Btn variant="outline" onClick={run} disabled={loading || !hasData}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{tips ? "Refresh tips" : "How can I save next month?"}</Btn></div>
      {!hasData && <Muted>Add some expenses first, then ask the coach where to cut.</Muted>}
      {err && <div className="text-sm py-2" style={{ color: BRAND.red }}>{err}</div>}
      {tips && <ul className="space-y-2.5 mt-2">{tips.map((t, i) => <li key={i} className="flex gap-3"><span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: pc[t.priority] || "#78716c" }} /><div><div className="text-sm font-medium text-stone-800">{t.title}</div><div className="text-sm text-stone-500">{t.detail}</div></div></li>)}</ul>}
    </Card>
  );
}

/* ----------------------------- TRANSACTIONS ----------------------------- */
function SplitBadge({ t, onClick }) { const total = splitsSum(t); return <button onClick={onClick} className={"text-xs px-2 py-1 rounded-full border whitespace-nowrap " + (total > 0 ? "fp-border-accent2-light fp-text-accent2 fp-bg-accent2-tint-static" : "border-stone-200 text-stone-400 hover:bg-stone-50")}>{total > 0 ? `${t.splits.length} · ${idr(total)}` : "Split"}</button>; }

function SplitEditorRow({ t, parties, onChange, colSpan, setTab }) {
  const [partyId, setPartyId] = useState(parties[0]?.id || ""); const [amt, setAmt] = useState("");
  const splits = t.splits || []; const splitTotal = splitsSum(t); const remaining = Math.max(0, t.amount - splitTotal); const over = splitTotal > t.amount;
  const add = () => { const n = parseFloat(String(amt).replace(/[^\d.]/g, "")) || 0; if (!partyId || n <= 0) return; onChange([...splits, { id: uid(), partyId, amount: n, paid: false, paidDate: null }]); setAmt(""); };
  const remove = (id) => onChange(splits.filter((s) => s.id !== id));
  const setPaid = (id, paid) => onChange(splits.map((s) => (s.id === id ? { ...s, paid, paidDate: paid ? today() : null } : s)));
  if (!parties.length) return <tr><td colSpan={colSpan} className="p-3 bg-stone-50"><div className="flex items-center justify-between text-sm"><span className="text-stone-500">Add people first to split this with them.</span><Btn variant="outline" onClick={() => setTab("people")} className="text-xs py-1">Go to People</Btn></div></td></tr>;
  return (
    <tr><td colSpan={colSpan} className="p-3 bg-stone-50">
      <div className="space-y-2">
        {splits.map((s) => { const p = parties.find((x) => x.id === s.partyId); return (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <span className="w-32 truncate text-stone-700">{p?.name || "(removed)"}</span>
            <Num className="w-28 text-stone-900">{idr(s.amount)}</Num>
            <button onClick={() => setPaid(s.id, !s.paid)} className={"text-xs px-2 py-0.5 rounded-full border " + (s.paid ? "fp-border-success-light fp-text-success fp-bg-success-tint-static" : "border-stone-300 text-stone-500")}>{s.paid ? "Paid" : "Unpaid"}</button>
            <Btn variant="danger" onClick={() => remove(s.id)}><Trash2 size={13} /></Btn>
          </div>
        ); })}
        <div className="flex items-center gap-2 text-sm pt-1 flex-wrap">
          <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="border border-stone-300 rounded px-2 py-1 text-sm fp-input">{parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="amount" className="num border border-stone-300 rounded px-2 py-1 w-28 text-sm fp-input" />
          <button type="button" onClick={() => setAmt(String(remaining))} className="text-xs underline" style={{ color: BRAND.blue }}>full remaining ({idr(remaining)})</button>
          <Btn onClick={add} disabled={!partyId || !amt} className="text-xs py-1"><Plus size={13} /> Add split</Btn>
        </div>
        <div className="text-xs text-stone-500 pt-1">Your share after splits: <Num className="font-medium text-stone-700">{idr(Math.max(0, t.amount - splitTotal))}</Num>{over && <span className="ml-2" style={{ color: BRAND.red }}>splits exceed the transaction amount</span>}</div>
      </div>
    </td></tr>
  );
}

function Transactions({ transactions, setTransactions, accounts, setAccounts, month, learn, scopes, scopeColor, defaultScope, parties, setTab }) {
  const [q, setQ] = useState(""); const [fCat, setFCat] = useState(""); const [fScope, setFScope] = useState(""); const [fAcct, setFAcct] = useState(""); const [sel, setSel] = useState({}); const [splitOpen, setSplitOpen] = useState(null);
  const acctName = (id) => accounts.find((a) => a.id === id)?.name || "—";
  const acctColor = (id) => accounts.find((a) => a.id === id)?.color || "#78716c";
  const rows = useMemo(() => transactions.filter((t) => monthKey(t.date) === month).filter((t) => !fCat || t.category === fCat).filter((t) => !fScope || t.scope === fScope).filter((t) => !fAcct || t.accountId === fAcct).filter((t) => !q || t.desc.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [transactions, month, fCat, fScope, fAcct, q]);
  const update = (id, patch) => setTransactions((prev) => prev.map((t) => { if (t.id !== id) return t; const next = { ...t, ...patch }; if (patch.category) learn(t.desc, patch.category, next.scope, next.recurring); if (patch.scope) learn(t.desc, next.category, patch.scope, next.recurring); return next; }));
  const updateSplits = (id, splits) => setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, splits } : t)));
  const del = (id) => { const t = transactions.find((x) => x.id === id); if (t) setAccounts((prev) => applyBalanceDelta(prev, t.accountId, -signedAmount(t))); setTransactions((prev) => prev.filter((x) => x.id !== id)); };
  const selected = Object.keys(sel).filter((k) => sel[k]);
  const bulkSet = (patch) => { setTransactions((prev) => prev.map((t) => (sel[t.id] ? { ...t, ...patch } : t))); rows.filter((t) => sel[t.id]).forEach((t) => learn(t.desc, patch.category || t.category, patch.scope || t.scope, t.recurring)); setSel({}); };
  const bulkDel = () => { const toDelete = rows.filter((t) => sel[t.id]); setAccounts((prev) => toDelete.reduce((accs, t) => applyBalanceDelta(accs, t.accountId, -signedAmount(t)), prev)); setTransactions((prev) => prev.filter((t) => !sel[t.id])); setSel({}); };

  if (!transactions.length) return <Empty icon={ListOrdered} title="No transactions" body="Import a statement or add transactions to start tracking." />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]"><Search size={15} className="absolute left-2.5 top-2.5 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant…" className={inputCls + " pl-8"} /></div>
        <select value={fAcct} onChange={(e) => setFAcct(e.target.value)} className={inputCls + " w-auto"}><option value="">All accounts</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={inputCls + " w-auto"}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={fScope} onChange={(e) => setFScope(e.target.value)} className={inputCls + " w-auto capitalize"}><option value="">All profiles</option>{scopes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm border" style={{ backgroundColor: BRAND.blueTint, borderColor: BRAND.blueLight }}>
          <span className="font-medium" style={{ color: BRAND.blueDark }}>{selected.length} selected</span><span style={{ color: BRAND.blue }}>· profile:</span>
          {scopes.map((s) => <button key={s.name} onClick={() => bulkSet({ scope: s.name })} className="capitalize px-2 py-0.5 rounded border hover:opacity-80" style={{ borderColor: BRAND.blueLight, color: BRAND.blueDark }}>{s.name}</button>)}
          <select onChange={(e) => e.target.value && bulkSet({ category: e.target.value })} value="" className="border rounded px-2 py-0.5 bg-white" style={{ borderColor: BRAND.blueLight, color: BRAND.blueDark }}><option value="">category…</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <Btn variant="danger" onClick={bulkDel}><Trash2 size={14} /> Delete</Btn>
        </div>
      )}
      <Card className="overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-stone-400 border-b border-stone-200"><th className="p-2 pl-3 w-8"></th><th className="p-2 font-medium">Date</th><th className="p-2 font-medium">Merchant</th><th className="p-2 font-medium">Account</th><th className="p-2 font-medium">Category</th><th className="p-2 font-medium">Profile</th><th className="p-2 font-medium">Split</th><th className="p-2 font-medium text-right pr-3">Amount</th><th className="w-8"></th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const net = netOf(t); const covered = t.amount > 0 && splitsSum(t) > 0 && net === 0;
              return (
              <React.Fragment key={t.id}>
                <tr className="border-b border-stone-100 hover:bg-stone-50/60">
                  <td className="p-2 pl-3"><input type="checkbox" checked={!!sel[t.id]} onChange={(e) => setSel((s) => ({ ...s, [t.id]: e.target.checked }))} className="fp-accent-brand" /></td>
                  <td className="p-2 text-stone-500 whitespace-nowrap"><Num>{t.date}</Num></td>
                  <td className="p-2 text-stone-800 max-w-[210px]"><div className="flex items-center gap-1.5 truncate" title={t.desc}>{t.recurring && <RefreshCw size={12} className="fp-text-accent2 shrink-0" />}<span className="truncate">{t.desc}</span>{covered && <span className="text-[10px] fp-text-success fp-bg-success-tint-static border fp-border-success-light rounded-full px-1.5 shrink-0">not yours</span>}</div>{t.fx && <div className="text-[11px] text-stone-400 num">{t.fx}</div>}</td>
                  <td className="p-2"><span className="inline-flex items-center gap-1.5 text-stone-600"><span className="w-2 h-2 rounded-full" style={{ background: acctColor(t.accountId) }} />{acctName(t.accountId)}</span></td>
                  <td className="p-2"><CatSelect value={t.category || "Other"} onChange={(e) => update(t.id, { category: e.target.value })} bare /></td>
                  <td className="p-2"><ScopeSelect value={t.scope || defaultScope} onChange={(e) => update(t.id, { scope: e.target.value })} scopes={scopes} scopeColor={scopeColor} bare /></td>
                  <td className="p-2"><SplitBadge t={t} onClick={() => setSplitOpen(splitOpen === t.id ? null : t.id)} /></td>
                  <td className="p-2 text-right pr-3 whitespace-nowrap">
                    <Num className="font-medium" style={{ color: t.direction === "income" ? BRAND.success : t.direction === "payment" ? "#a8a29e" : "#1c1917" }}>{t.direction === "income" ? "+" : t.direction === "payment" ? "" : "−"}{idr(t.amount)}</Num>
                    {t.direction === "expense" && net !== t.amount && <div className="text-[11px] fp-text-success">your share {idr(net)}</div>}
                  </td>
                  <td className="p-2"><Btn variant="danger" onClick={() => del(t.id)}><Trash2 size={14} /></Btn></td>
                </tr>
                {splitOpen === t.id && <SplitEditorRow t={t} parties={parties} onChange={(splits) => updateSplits(t.id, splits)} colSpan={9} setTab={setTab} />}
              </React.Fragment>
            ); })}
          </tbody>
        </table>
        {!rows.length && <Muted>No transactions match these filters.</Muted>}
      </div></Card>
    </div>
  );
}

/* ----------------------------- TRAVEL ----------------------------- */
function buildTrips(transactions, tripMeta) {
  const items = transactions.filter((t) => t.direction === "expense" && looksLikeTravel(t));
  const codeFor = (t) => {
    if (t.tripCountry) { const e = Object.entries(CURRENCY).find(([, v]) => v.c === t.tripCountry); return e ? e[0] : "LOCAL#" + t.tripCountry; }
    const c = fxCode(t.fx) || inferFxFromDesc(t.desc); return c && CURRENCY[c] ? c : "LOCAL";
  };
  const byCode = {};
  items.forEach((t) => { const key = codeFor(t); (byCode[key] = byCode[key] || []).push(t); });
  const clusters = [];
  Object.entries(byCode).forEach(([code, list]) => {
    list.sort((a, b) => a.date.localeCompare(b.date));
    let cluster = []; let prevDate = null;
    const flush = () => { if (cluster.length) { clusters.push({ code, items: cluster.slice() }); cluster = []; } };
    list.forEach((t) => { if (prevDate && (new Date(t.date) - new Date(prevDate)) / 86400000 > TRIP_GAP_DAYS) flush(); cluster.push(t); prevDate = t.date; });
    flush();
  });
  return clusters.map((cl) => {
    const isCustomLocal = cl.code.startsWith("LOCAL#");
    const known = !cl.code.startsWith("LOCAL") && CURRENCY[cl.code];
    const total = cl.items.reduce((a, t) => a + t.amount, 0);
    const net = cl.items.reduce((a, t) => a + netOf(t), 0);
    const cats = {}; cl.items.forEach((t) => (cats[t.category || "Other"] = (cats[t.category || "Other"] || 0) + t.amount));
    const dates = cl.items.map((t) => t.date).sort();
    const key = cl.code + "#" + dates[0];
    const label = known ? CURRENCY[cl.code].c : isCustomLocal ? cl.code.slice(6) : "Trip / bookings";
    return { key, code: known ? cl.code : "LOCAL", label, flag: known ? CURRENCY[cl.code].flag : "\u{1F9F3}", items: cl.items, total, net, cats, start: dates[0], end: dates[dates.length - 1], purpose: (tripMeta[key] || {}).purpose || "" };
  }).sort((a, b) => b.start.localeCompare(a.start));
}

function TripCard({ trip, otherTrips, scopes, scopeColor, banner, tripName, onSetBanner, onSetPurpose, onSetName, onApply, onAddNew, onAssignExisting, onRemoveItem, onMoveItem, candidates }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [moveOpenId, setMoveOpenId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(tripName || "");
  const [nf, setNf] = useState({ date: trip.start, desc: "", amount: "", category: "Food & Dining" });
  const range = trip.start === trip.end ? trip.start : `${trip.start} → ${trip.end}`;
  const displayName = tripName || trip.label;
  const commitName = () => { onSetName(nameVal.trim() || ""); setEditingName(false); };
  const cats = Object.entries(trip.cats).sort((a, b) => b[1] - a[1]);
  const showNet = trip.net !== trip.total;
  const submitNew = () => { if (!nf.desc || !nf.amount) return; onAddNew(trip, nf); setNf({ date: trip.start, desc: "", amount: "", category: "Food & Dining" }); setAdding(false); };
  const onBanner = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 1.8 * 1024 * 1024) { alert("Please pick an image under ~1.8MB."); return; }
    const r = new FileReader(); r.onload = () => onSetBanner(String(r.result)); r.readAsDataURL(file); e.target.value = "";
  };
  const bannerId = "banner-" + trip.key.replace(/[^a-z0-9]/gi, "");
  return (
    <Card className="p-0 overflow-hidden">
      {banner ? (
        <div className="relative h-32 w-full" style={{ backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))" }} />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white">
            <div className="flex items-center gap-2"><span className="text-2xl">{trip.flag}</span><div>
              {editingName ? <input autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)} onBlur={commitName} onKeyDown={(e) => e.key === "Enter" && commitName()} className="font-semibold bg-white/20 text-white border border-white/40 rounded px-1.5 py-0.5 text-sm w-40" /> : <div className="font-semibold drop-shadow flex items-center gap-1.5 cursor-pointer" onClick={() => { setNameVal(tripName || ""); setEditingName(true); }}>{displayName} <span className="opacity-60 text-xs">(edit)</span></div>}
              <div className="text-xs text-white/80"><Num>{range}</Num> · {trip.items.length} transactions</div>
            </div></div>
            <Num className="font-semibold drop-shadow">{idr(trip.total)}</Num>
          </div>
          <label htmlFor={bannerId} className="absolute top-2 right-2 cursor-pointer bg-black/40 hover:bg-black/60 text-white rounded-lg px-2 py-1 text-[11px] flex items-center gap-1"><ImageIcon size={12} /> Change</label>
          <input id={bannerId} type="file" accept="image/*" onChange={onBanner} className="hidden" />
        </div>
      ) : null}
      <div className="p-4">
      {!banner && (
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left flex-1 min-w-0">
            <span className="text-2xl shrink-0">{trip.flag}</span>
            <div className="min-w-0">
              {editingName ? <input autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)} onBlur={commitName} onKeyDown={(e) => e.key === "Enter" && commitName()} className="font-semibold border border-stone-300 rounded px-1.5 py-0.5 text-sm w-40 fp-input" /> : <div className="font-semibold text-stone-900 flex items-center gap-1.5 cursor-pointer" onClick={() => { setNameVal(tripName || ""); setEditingName(true); }}>{displayName} <span className="text-stone-400 text-xs font-normal">(edit)</span></div>}
              <div className="text-xs text-stone-400"><Num>{range}</Num> · {trip.items.length} transactions</div>
            </div>
          </button>
          <div className="text-right shrink-0 flex items-center gap-2">
            <div><Num className="font-semibold text-stone-900">{idr(trip.total)}</Num>{showNet && <div className="text-xs fp-text-success">your share {idr(trip.net)}</div>}</div>
            <label htmlFor={bannerId} className="cursor-pointer text-stone-400 hover:text-stone-600" title="Add a banner photo"><ImageIcon size={16} /></label>
            <input id={bannerId} type="file" accept="image/*" onChange={onBanner} className="hidden" />
          </div>
        </div>
      )}
      {banner && showNet && <div className="text-xs fp-text-success text-right -mt-1 mb-1">your share {idr(trip.net)}</div>}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-stone-400">Trip with:</span>
        <select value={trip.purpose} onChange={(e) => onSetPurpose(trip.key, e.target.value)} style={{ color: trip.purpose ? scopeColor(trip.purpose) : BRAND.goldDark }} className={(trip.purpose ? "border-stone-200" : "fp-border-warn fp-bg-warn-tint-static") + " border rounded-lg px-2 py-1 text-sm capitalize focus:outline-none fp-input"}>
          <option value="">tag purpose…</option>{scopes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        {trip.purpose && <Btn variant="ghost" onClick={() => onApply(trip)} className="text-xs py-1">Apply to these transactions</Btn>}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">{cats.map(([c, v]) => <Pill key={c} color={PALETTE[CATEGORIES.indexOf(c) % PALETTE.length]}>{c} · {idr(v)}</Pill>)}</div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Btn variant="outline" onClick={() => { setAdding(!adding); setPicking(false); }} className="text-xs py-1.5"><Plus size={13} /> Add expense</Btn>
        <Btn variant="ghost" onClick={() => { setPicking(!picking); setAdding(false); }} className="text-xs py-1.5">Assign existing…</Btn>
        <Btn variant="ghost" onClick={() => setOpen(!open)} className="text-xs py-1.5">{open ? "Hide" : "Show"} items</Btn>
      </div>

      {adding && (
        <div className="mt-3 border-t border-stone-100 pt-3 grid sm:grid-cols-5 gap-2 items-end">
          <Field label="Date"><input type="date" value={nf.date} onChange={(e) => setNf({ ...nf, date: e.target.value })} className={inputCls} /></Field>
          <Field label="Merchant"><input value={nf.desc} onChange={(e) => setNf({ ...nf, desc: e.target.value })} placeholder="e.g. Lunch in KL" className={inputCls} /></Field>
          <Field label="Amount (IDR)"><input value={nf.amount} onChange={(e) => setNf({ ...nf, amount: e.target.value })} placeholder="150000" className={inputCls + " num"} /></Field>
          <Field label="Category"><CatSelect value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })} /></Field>
          <Btn onClick={submitNew} disabled={!nf.desc || !nf.amount}><Plus size={15} /> Add</Btn>
        </div>
      )}

      {picking && (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <p className="text-xs text-stone-400 mb-2">Pick transactions to move into this trip (tags them Travel, {trip.label}).</p>
          {candidates.length ? (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {candidates.map((t) => (
                <button key={t.id} onClick={() => onAssignExisting(trip, t)} className="w-full flex items-center justify-between gap-3 text-sm px-2 py-1.5 rounded-lg hover:bg-stone-50 text-left">
                  <span className="truncate"><span className="text-stone-700">{t.desc}</span> <span className="num text-xs text-stone-400">{t.date}</span></span>
                  <span className="flex items-center gap-2 shrink-0"><Num className="text-stone-900">{idr(t.amount)}</Num><Plus size={13} className="text-stone-400" /></span>
                </button>
              ))}
            </div>
          ) : <Muted>No other expenses to assign.</Muted>}
        </div>
      )}

      {open && (
        <div className="mt-3 border-t border-stone-100 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><tbody>
              {trip.items.slice().sort((a, b) => a.date.localeCompare(b.date)).map((t) => (
                <React.Fragment key={t.id}>
                  <tr className="border-b border-stone-50">
                    <td className="py-1.5 text-stone-500 whitespace-nowrap pr-3"><Num>{t.date}</Num></td>
                    <td className="py-1.5 text-stone-800">{t.desc}{t.fx && <span className="text-[11px] text-stone-400 num ml-1">{t.fx}</span>}{splitsSum(t) > 0 && <span className="text-[10px] fp-text-accent2 fp-bg-accent2-tint-static border fp-border-accent2-light rounded-full px-1.5 ml-1.5">split</span>}</td>
                    <td className="py-1.5 text-stone-400 text-xs">{t.category}</td>
                    <td className="py-1.5 text-right whitespace-nowrap pr-2"><Num className="text-stone-900">{idr(t.amount)}</Num></td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      <button onClick={() => setMoveOpenId(moveOpenId === t.id ? null : t.id)} className="text-xs px-2 py-0.5 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50 mr-1">Move</button>
                      <Btn variant="danger" onClick={() => onRemoveItem(t)}><X size={13} /></Btn>
                    </td>
                  </tr>
                  {moveOpenId === t.id && (
                    <tr><td colSpan={5} className="bg-stone-50 px-2 py-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-stone-400">Move "{t.desc}" to:</span>
                        {otherTrips.length ? otherTrips.map((ot) => (
                          <button key={ot.key} onClick={() => { onMoveItem(t, ot); setMoveOpenId(null); }} className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-white bg-white flex items-center gap-1">
                            <span>{ot.flag}</span> {ot.label} <span className="text-stone-400">({ot.start.slice(5)})</span>
                          </button>
                        )) : <span className="text-stone-400">No other trips yet — add one from the Travel page first.</span>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody></table>
          </div>
        </div>
      )}
      </div>
    </Card>
  );
}

function Travel({ transactions, setTransactions, accounts, scopes, scopeColor, tripMeta, setTripMeta, defaultScope }) {
  const trips = useMemo(() => buildTrips(transactions, tripMeta), [transactions, tripMeta]);
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [tf, setTf] = useState({ country: "Malaysia", date: today(), desc: "", amount: "", category: "Food & Dining" });

  const setPurpose = (key, purpose) => setTripMeta((prev) => ({ ...prev, [key]: { ...prev[key], purpose } }));
  const applyPurpose = (trip) => { if (!trip.purpose) return; const ids = new Set(trip.items.map((t) => t.id)); setTransactions((prev) => prev.map((t) => (ids.has(t.id) ? { ...t, scope: trip.purpose } : t))); };

  // add a brand-new expense, dated within the trip so it clusters into it
  const addNewToTrip = (trip, nf) => {
    const acctId = accounts[0]?.id || null;
    const tx = { id: uid(), date: nf.date || trip.start, desc: nf.desc, amount: Math.abs(parseFloat(String(nf.amount).replace(/[^\d.]/g, "")) || 0), direction: "expense", fx: trip.code && trip.code !== "LOCAL" ? `${trip.code} 0.00` : "", category: nf.category === "Travel" ? "Travel" : nf.category, scope: trip.purpose || defaultScope, recurring: false, accountId: acctId, splits: [], tripCountry: trip.label };
    if (tx.amount <= 0) return;
    setTransactions((prev) => [...prev, tx]);
  };
  // move an existing transaction into this trip: tag Travel + stamp its country so it groups here
  const assignExisting = (trip, t) => {
    setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, category: "Travel", fx: x.fx || (trip.code && trip.code !== "LOCAL" ? `${trip.code} 0.00` : x.fx), tripCountry: trip.label, notTravel: false } : x)));
  };
  // pull a transaction out of every trip permanently (e.g. billing-entity location ≠ where you actually spent it)
  const removeItem = (t) => {
    setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, notTravel: true, tripCountry: undefined } : x)));
  };
  // move a transaction from its current trip into a different one
  const moveItem = (t, targetTrip) => {
    setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, notTravel: false, category: "Travel", tripCountry: targetTrip.label, fx: targetTrip.code && targetTrip.code !== "LOCAL" ? `${targetTrip.code} 0.00` : x.fx } : x)));
  };
  // candidates = expenses not already considered travel
  const candidates = useMemo(() => transactions.filter((t) => t.direction === "expense" && !looksLikeTravel(t)).sort((a, b) => b.date.localeCompare(a.date)), [transactions]);

  const createTrip = () => {
    if (!tf.desc || !tf.amount) return;
    const code = Object.entries(CURRENCY).find(([, v]) => v.c === tf.country)?.[0] || "";
    const acctId = accounts[0]?.id || null;
    const tx = { id: uid(), date: tf.date, desc: tf.desc, amount: Math.abs(parseFloat(String(tf.amount).replace(/[^\d.]/g, "")) || 0), direction: "expense", fx: code ? `${code} 0.00` : "", category: tf.category === "Travel" ? "Travel" : tf.category, scope: defaultScope, recurring: false, accountId: acctId, splits: [], tripCountry: tf.country };
    if (tx.amount <= 0) return;
    setTransactions((prev) => [...prev, tx]);
    setTf({ country: "Malaysia", date: today(), desc: "", amount: "", category: "Food & Dining" }); setNewTripOpen(false);
  };

  const totalGross = trips.reduce((a, t) => a + t.total, 0); const totalNet = trips.reduce((a, t) => a + t.net, 0);
  const itemCount = trips.reduce((a, t) => a + t.items.length, 0);
  const chart = trips.map((t) => ({ name: `${t.label} · ${t.start.slice(5)}`, value: t.total }));
  const COUNTRY_OPTS = Object.values(CURRENCY).map((v) => v.c);

  const NewTripForm = (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-stone-800">Start a trip / add travel expense</h3><Btn variant="ghost" onClick={() => setNewTripOpen(false)} className="text-xs"><X size={14} /></Btn></div>
      <div className="grid sm:grid-cols-5 gap-2 items-end">
        <Field label="Destination"><select value={tf.country} onChange={(e) => setTf({ ...tf, country: e.target.value })} className={inputCls}>{COUNTRY_OPTS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={tf.date} onChange={(e) => setTf({ ...tf, date: e.target.value })} className={inputCls} /></Field>
        <Field label="Merchant"><input value={tf.desc} onChange={(e) => setTf({ ...tf, desc: e.target.value })} placeholder="e.g. Hotel" className={inputCls} /></Field>
        <Field label="Amount (IDR)"><input value={tf.amount} onChange={(e) => setTf({ ...tf, amount: e.target.value })} placeholder="500000" className={inputCls + " num"} /></Field>
        <Btn onClick={createTrip} disabled={!tf.desc || !tf.amount}><Plus size={15} /> Add</Btn>
      </div>
    </Card>
  );

  if (!trips.length) return (
    <div className="space-y-4">
      <Empty icon={Plane} title="No travel spend yet" body="Foreign-currency purchases and anything tagged Travel show up here, split into trips by date gaps. Or start one manually below." action={<Btn onClick={() => setNewTripOpen(true)}><Plus size={15} /> Add a trip</Btn>} />
      {newTripOpen && NewTripForm}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 md:p-5" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDark})` }}>
        <div className="flex items-center gap-2 mb-3 text-white/90"><Plane size={16} /><span className="text-sm font-semibold">Travel summary</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["Your share", idr(totalNet)], ["Gross spend", idr(totalGross)], ["Trips", trips.length], ["Transactions", itemCount]].map(([label, value]) => (
            <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.14)" }}>
              <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</div>
              <Num className="block text-lg md:text-xl font-semibold text-white mt-0.5">{value}</Num>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end"><Btn variant="outline" onClick={() => setNewTripOpen(!newTripOpen)} className="text-xs"><Plus size={14} /> Add a trip / expense</Btn></div>
      {newTripOpen && NewTripForm}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Spend by trip</h3>
        <ResponsiveContainer width="100%" height={Math.max(120, chart.length * 38)}>
          <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#57534e" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => idr(v)} cursor={{ fill: "#f5f5f4" }} /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{chart.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div className="space-y-3">{trips.map((t) => <TripCard key={t.key} trip={t} otherTrips={trips.filter((x) => x.key !== t.key)} scopes={scopes} scopeColor={scopeColor} banner={tripMeta[t.key]?.banner} tripName={tripMeta[t.key]?.name || ""} onSetBanner={(b) => setTripMeta((prev) => ({ ...prev, [t.key]: { ...prev[t.key], banner: b } }))} onSetPurpose={setPurpose} onSetName={(name) => setTripMeta((prev) => ({ ...prev, [t.key]: { ...prev[t.key], name } }))} onApply={applyPurpose} onAddNew={addNewToTrip} onAssignExisting={assignExisting} onRemoveItem={removeItem} onMoveItem={moveItem} candidates={candidates} />)}</div>
    </div>
  );
}

/* ----------------------------- SUBSCRIPTIONS ----------------------------- */
function Subscriptions({ subscriptions, setSubscriptions, transactions, setTransactions, learn, scopes, scopeColor, setTab }) {
  const active = subscriptions.filter((s) => s.status === "active").sort((a, b) => b.monthly - a.monthly);
  const cancelled = subscriptions.filter((s) => s.status === "cancelled");
  const monthlyBurn = active.reduce((a, s) => a + s.monthly, 0); const cancelledSaving = cancelled.reduce((a, s) => a + s.monthly, 0);
  const lastSeen = (s) => { const ds = transactions.filter((t) => merchantKey(t.desc) === s.key && planOf(t) === (s.plan || "")).map((t) => t.date).sort(); return ds[ds.length - 1] || null; };
  const editSub = (s, patch) => {
    setSubscriptions((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
    if (patch.category || patch.scope) { setTransactions((prev) => prev.map((t) => (merchantKey(t.desc) === s.key && planOf(t) === (s.plan || "") ? { ...t, category: patch.category ?? t.category, scope: patch.scope ?? t.scope } : t))); learn(s.name, patch.category ?? s.category, patch.scope ?? s.scope, true); }
  };
  const cancel = (s) => setSubscriptions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "cancelled", cancelledAt: today() } : x)));
  const reactivate = (s) => setSubscriptions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "active", cancelledAt: null } : x)));
  const remove = (s) => setSubscriptions((prev) => prev.filter((x) => x.id !== s.id));
  const suggestions = useMemo(() => {
    const g = {};
    transactions.filter((t) => t.direction === "expense" && !t.recurring).forEach((t) => { const k = merchantKey(t.desc) + "||" + planOf(t); if (!g[k]) g[k] = { key: merchantKey(t.desc), plan: planOf(t), name: t.desc, months: new Set(), latest: t }; g[k].months.add(monthKey(t.date)); if (t.date > g[k].latest.date) g[k].latest = t; });
    return Object.values(g).filter((x) => x.months.size >= 2 && !subscriptions.some((s) => s.key === x.key && (s.plan || "") === x.plan));
  }, [transactions, subscriptions]);
  const track = (x) => { setSubscriptions((prev) => [...prev, { id: uid(), key: x.key, plan: x.plan, name: x.name, category: x.latest.category || "Subscriptions", scope: x.latest.scope || "personal", monthly: x.latest.amount, status: "active", cancelledAt: null }]); setTransactions((prev) => prev.map((t) => (merchantKey(t.desc) === x.key && planOf(t) === x.plan ? { ...t, recurring: true } : t))); };

  if (!transactions.length) return <Empty icon={RefreshCw} title="No subscriptions yet" body="Import a statement — known SaaS like Datadog, Framer or Vercel is flagged automatically. Same merchant, different plan price = tracked separately." action={<Btn onClick={() => setTab("import")}><Upload size={15} /> Import</Btn>} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat label="Active / month" value={idr(monthlyBurn)} accent={BRAND.plum} /><Stat label="Per year" value={idr(monthlyBurn * 12)} accent={BRAND.slate} /><Stat label="Active subs" value={active.length} accent={BRAND.blue} /><Stat label="Cancelled saving" value={idr(cancelledSaving)} accent={BRAND.success} /></div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200"><h3 className="text-sm font-semibold text-stone-800">Active subscriptions</h3><p className="text-xs text-stone-400">Set the profile per plan. The price chip separates two subscriptions to the same service.</p></div>
        {active.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-stone-400 border-b border-stone-200"><th className="p-2 pl-4 font-medium">Service</th><th className="p-2 font-medium">Plan</th><th className="p-2 font-medium">Category</th><th className="p-2 font-medium">Profile</th><th className="p-2 font-medium">Next due</th><th className="p-2 font-medium text-right">/ month</th><th className="w-24"></th></tr></thead>
            <tbody>{active.map((s) => { const ls = lastSeen(s); return (
              <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/60">
                <td className="p-2 pl-4 text-stone-800"><div className="flex items-center gap-1.5"><RefreshCw size={12} className="fp-text-accent2" /><span className="truncate max-w-[170px]" title={s.name}>{s.name}</span></div></td>
                <td className="p-2">{s.plan ? <Pill color={BRAND.slate}><span className="num">{s.plan}</span></Pill> : <span className="text-stone-300 text-xs">—</span>}</td>
                <td className="p-2"><CatSelect value={s.category || "Subscriptions"} onChange={(e) => editSub(s, { category: e.target.value })} /></td>
                <td className="p-2"><ScopeSelect value={s.scope || "personal"} onChange={(e) => editSub(s, { scope: e.target.value })} scopes={scopes} scopeColor={scopeColor} /></td>
                <td className="p-2 text-stone-500"><Num>{ls ? nextMonth(ls) : "—"}</Num></td>
                <td className="p-2 text-right"><Num className="text-stone-900 font-medium">{idr(s.monthly)}</Num></td>
                <td className="p-2"><Btn variant="warn" onClick={() => cancel(s)}><Ban size={13} /> Cancel</Btn></td>
              </tr>
            ); })}</tbody>
          </table></div>
        ) : <Muted>Nothing tracked yet. Import a statement, or track a detected one below.</Muted>}
      </Card>
      {cancelled.length > 0 && (
        <Card className="p-4"><h3 className="text-sm font-semibold text-stone-800 mb-1">Cancelled</h3><p className="text-xs text-stone-400 mb-3">If any of these charge you again on a future import, it'll be flagged.</p>
          <div className="space-y-2">{cancelled.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-500 line-through truncate">{s.name}{s.plan && <span className="num text-xs ml-1 no-underline">{s.plan}</span>}</span>
              <div className="flex items-center gap-2"><Num className="text-stone-400">{idr(s.monthly)}/mo</Num><Btn variant="ghost" onClick={() => reactivate(s)} className="text-xs"><RotateCcw size={13} /> Reactivate</Btn><Btn variant="danger" onClick={() => remove(s)}><Trash2 size={14} /></Btn></div>
            </div>
          ))}</div>
        </Card>
      )}
      {suggestions.length > 0 && (
        <Card className="p-4"><h3 className="text-sm font-semibold text-stone-800 mb-1">Looks recurring</h3><p className="text-xs text-stone-400 mb-3">Showed up in 2+ months. Track as a subscription?</p>
          <div className="space-y-2">{suggestions.map((x) => (
            <div key={x.key + x.plan} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-700 truncate">{x.name} {x.plan && <span className="num text-xs text-stone-400">{x.plan}</span>} <span className="text-stone-400">· {x.months.size} months</span></span>
              <div className="flex items-center gap-2"><Num className="text-stone-600">{idr(x.latest.amount)}</Num><Btn variant="outline" onClick={() => track(x)} className="text-xs py-1"><Plus size={13} /> Track</Btn></div>
            </div>
          ))}</div>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- PEOPLE ----------------------------- */
function People({ parties, setParties, transactions, setTransactions, setTab }) {
  const [f, setF] = useState({ name: "", phone: "", relation: RELATIONS[0] }); const [openId, setOpenId] = useState(null);
  const totals = useMemo(() => {
    const map = {}; parties.forEach((p) => (map[p.id] = { owed: 0, paid: 0, items: [] }));
    transactions.forEach((t) => (t.splits || []).forEach((s) => { if (!map[s.partyId]) return; if (s.paid) map[s.partyId].paid += Number(s.amount) || 0; else map[s.partyId].owed += Number(s.amount) || 0; map[s.partyId].items.push({ tx: t, split: s }); }));
    return map;
  }, [parties, transactions]);
  const totalOwed = Object.values(totals).reduce((a, x) => a + x.owed, 0); const totalCollected = Object.values(totals).reduce((a, x) => a + x.paid, 0);
  const add = () => { if (!f.name || parties.length >= MAX_PARTIES) return; setParties((prev) => [...prev, { id: uid(), name: f.name, phone: f.phone, relation: f.relation }]); setF({ name: "", phone: "", relation: RELATIONS[0] }); };
  const del = (id) => { const t = totals[id]; if (t && (t.owed > 0 || t.paid > 0)) return; setParties((prev) => prev.filter((p) => p.id !== id)); };
  const setSplitPaid = (txId, splitId, paid) => setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, splits: (t.splits || []).map((s) => (s.id === splitId ? { ...s, paid, paidDate: paid ? today() : null } : s)) } : t)));
  const markAllPaid = (partyId) => setTransactions((prev) => prev.map((t) => ({ ...t, splits: (t.splits || []).map((s) => (s.partyId === partyId && !s.paid ? { ...s, paid: true, paidDate: today() } : s)) })));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><Stat label="People tracked" value={`${parties.length}/${MAX_PARTIES}`} accent={BRAND.plum} /><Stat label="Owed to you" value={idr(totalOwed)} accent={BRAND.red} /><Stat label="Collected" value={idr(totalCollected)} accent={BRAND.success} /></div>
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Add a person</h3>
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Dimas" className={inputCls} /></Field>
          <Field label="Phone number"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="08123456789" className={inputCls} /></Field>
          <Field label="Relation"><select value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })} className={inputCls}>{RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Btn onClick={add} disabled={!f.name || parties.length >= MAX_PARTIES} className="w-full"><Plus size={15} /> Add</Btn>
        </div>
        {parties.length >= MAX_PARTIES && <p className="text-xs mt-2" style={{ color: BRAND.red }}>You've reached the 20-person limit.</p>}
      </Card>
      {!parties.length ? <Empty icon={Users} title="No one added yet" body="Add family, friends, or colleagues here so you can split costs and track who still owes you." /> : (
        <div className="space-y-2">
          {parties.map((p) => { const t = totals[p.id] || { owed: 0, paid: 0, items: [] }; const open = openId === p.id; return (
            <Card key={p.id} className="p-4">
              <button onClick={() => setOpenId(open ? null : p.id)} className="w-full flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600 shrink-0">{p.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="font-medium text-stone-900 truncate">{p.name}</div><div className="text-xs text-stone-400">{p.phone || "—"}</div></div></div>
                <div className="flex items-center gap-3 shrink-0">
                  <Pill color={RELATION_COLOR[p.relation]}>{p.relation}</Pill>
                  {t.owed > 0 ? <Num className="font-medium" style={{ color: BRAND.red }}>{idr(t.owed)} owed</Num> : t.items.length ? <Num className="fp-text-success">settled</Num> : <Num className="text-stone-300">no splits</Num>}
                  {p.phone && t.items.length > 0 && (
                    <a href={whatsappLink(p.phone, settleMessage(p.name, t.owed))} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ backgroundColor: BRAND.successTint, color: BRAND.success }} title="Message on WhatsApp">
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              </button>
              {open && (
                <div className="mt-3 border-t border-stone-100 pt-3 space-y-2">
                  {t.items.length ? t.items.slice().sort((a, b) => b.tx.date.localeCompare(a.tx.date)).map(({ tx, split }) => (
                    <div key={split.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="truncate min-w-0"><span className="text-stone-700">{tx.desc}</span> <span className="text-stone-400 num text-xs">{tx.date}</span></div>
                      <div className="flex items-center gap-2 shrink-0"><Num className={split.paid ? "text-stone-400 line-through" : "text-stone-900"}>{idr(split.amount)}</Num><button onClick={() => setSplitPaid(tx.id, split.id, !split.paid)} className={"text-xs px-2 py-0.5 rounded-full border " + (split.paid ? "fp-border-success-light fp-text-success fp-bg-success-tint-static" : "border-stone-300 text-stone-500")}>{split.paid ? "Paid" : "Mark paid"}</button></div>
                    </div>
                  )) : <Muted>No splits yet.</Muted>}
                  <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                    <Btn variant="danger" onClick={() => del(p.id)} disabled={t.owed > 0 || t.paid > 0} className="text-xs">{t.owed > 0 || t.paid > 0 ? "Linked to transactions" : <><Trash2 size={13} /> Remove</>}</Btn>
                    <div className="flex items-center gap-2">
                      {t.owed > 0 && <Btn variant="outline" onClick={() => markAllPaid(p.id)} className="text-xs py-1"><Check size={13} /> Mark all paid</Btn>}
                      {t.items.length > 0 && (p.phone ? (
                        <a href={whatsappLink(p.phone, settleMessage(p.name, t.owed))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium" style={{ backgroundColor: BRAND.success, color: "#fff" }}>
                          <MessageCircle size={13} /> {t.owed > 0 ? "Settle up via WhatsApp" : "Message on WhatsApp"}
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400">Add a phone number to message via WhatsApp</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ); })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- IMPORT ----------------------------- */
function Importer({ accounts, setAccounts, setTransactions, setSubscriptions, recall, learn, matchSub, setTab, scopes, scopeColor, defaultScope, drafts, setDrafts }) {
  const [mode, setMode] = useState("file"); const [acctId, setAcctId] = useState(accounts[0]?.id || ""); const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { if (!acctId && accounts[0]) setAcctId(accounts[0].id); }, [accounts]); // eslint-disable-line
  const selectedAccount = accounts.find((a) => a.id === acctId);
  const enrichItems = (items) => items.map((d) => {
    const amount = Math.abs(Number(d.amount) || 0);
    const direction = d.direction === "income" || d.direction === "payment" || d.direction === "expense"
      ? d.direction
      : classifyDirection(d.desc, d.kind, d.hasCR);
    const isPay = direction === "payment";
    const sub = direction === "expense" ? matchSub(d.desc, d.fx) : null; const mem = recall(d.desc); const en = enrich(d.desc);
    const incomeCat = /salary|gaji|payroll/i.test(d.desc || "") ? "Salary" : "Income";
    return { id: uid(), date: d.date, desc: d.desc || "Unknown", amount, direction, fx: d.fx || "", payer: d.payer || "", category: isPay ? "Card Payment" : direction === "income" ? incomeCat : (sub ? sub.category : (mem?.category || en?.category || "")), scope: sub ? sub.scope : (mem?.scope || en?.scope || defaultScope), recurring: sub ? true : !!(mem?.recurring || en?.recurring), accountId: acctId, splits: [], _include: true, _reappeared: !!(sub && sub.status === "cancelled") };
  }).filter((x) => x.amount > 0);
  const onFile = async (e) => { const file = e.target.files?.[0]; if (!file) return; setErr(""); setBusy("Reading your statement…"); try { const raw = await extractFromFile(file); if (!raw.length) { setErr("No transactions found. Try a clearer file, or paste the rows as CSV."); setBusy(""); return; } const dated = raw.map((r) => ({ ...r, date: parseIndoDate(r.date) })); setDrafts(enrichItems(dated)); setBusy(""); } catch (e2) { setErr(e2.message); setBusy(""); } e.target.value = ""; };
  const onCSV = (text) => { setErr(""); const lines = text.trim().split(/\r?\n/).filter(Boolean); if (!lines.length) return; const hasHeader = /date|amount|desc|tanggal|jumlah|keterangan/.test(lines[0].toLowerCase()); const body = hasHeader ? lines.slice(1) : lines; const items = body.map((line) => { const cols = splitCSV(line); const amt = parseFloat((cols[2] ?? cols[cols.length - 1] ?? "0").toString().replace(/[^\d.-]/g, "")) || 0; return { date: normDate((cols[0] || "").trim()), desc: (cols[1] || cols[0] || "").trim(), amount: Math.abs(amt), kind: "purchase" }; }).filter((i) => i.amount > 0); if (!items.length) { setErr("Couldn't read any rows. Expected: date, description, amount."); return; } setDrafts(enrichItems(items)); };
  const autoTag = async () => { const need = drafts.map((d, i) => ({ i, d })).filter((x) => !x.d.category && x.d.direction === "expense"); if (!need.length) return; setBusy("Tagging categories…"); setErr(""); try { const cats = await aiCategorize(need.map((x) => x.d.desc)); setDrafts((prev) => { const next = [...prev]; need.forEach((x, k) => { if (cats[k] && CATEGORIES.includes(cats[k])) next[x.i] = { ...next[x.i], category: cats[k] }; }); return next; }); } catch (e) { setErr(e.message); } finally { setBusy(""); } };
  const save = () => {
    const keep = drafts.filter((d) => d._include).map(({ _include, _reappeared, ...t }) => ({ ...t, category: t.category || (t.direction === "payment" ? "Card Payment" : "Other") }));
    keep.forEach((t) => learn(t.desc, t.category, t.scope, t.recurring));
    setSubscriptions((prev) => { const next = [...prev]; keep.filter((t) => t.recurring && t.direction === "expense").forEach((t) => { const key = merchantKey(t.desc); const plan = planOf(t); const idx = next.findIndex((s) => s.key === key && (s.plan || "") === plan); if (idx >= 0) next[idx] = { ...next[idx], monthly: t.amount, name: t.desc, status: "active", cancelledAt: null }; else next.push({ id: uid(), key, plan, name: t.desc, category: t.category, scope: t.scope, monthly: t.amount, status: "active", cancelledAt: null }); }); return next; });
    setAccounts((prev) => keep.reduce((accs, t) => applyBalanceDelta(accs, t.accountId, signedAmount(t)), prev));
    setTransactions((prev) => [...prev, ...keep]); setDrafts([]); setTab("transactions");
  };
  const editDraft = (id, patch) => setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  if (!accounts.length) return <Empty icon={CreditCard} title="Set up an account first" body="Tell FinPlus which bank or wallet this is (credit, debit, QRIS, etc.) so imports land in the right place." action={<Btn onClick={() => setTab("accounts")}><Plus size={15} /> Go to Setup</Btn>} />;
  const reappeared = drafts.filter((d) => d._reappeared).length;
  return (
    <div className="space-y-4">
      {!drafts.length ? (
        <>
          <Card className="p-4"><div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]"><Field label="Import into account">
              <select value={acctId} onChange={(e) => setAcctId(e.target.value)} className={inputCls}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              {selectedAccount && <div className="text-xs text-stone-400 mt-1">{selectedAccount.bank ? selectedAccount.bank + " · " : ""}<span className="capitalize">{selectedAccount.type}</span></div>}
            </Field></div>
            <div className="flex gap-1 bg-stone-100 rounded-lg p-1">{[["file", "Upload file", FileText], ["csv", "Paste CSV", ListOrdered], ["manual", "Add one", Plus]].map(([m, label, Icon]) => <button key={m} onClick={() => setMode(m)} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium " + (mode === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-500")}><Icon size={14} /> {label}</button>)}</div>
          </div></Card>
          {mode === "file" && <Card className="p-6 text-center border-dashed"><input id="file" type="file" accept="application/pdf,image/*" onChange={onFile} className="hidden" /><label htmlFor="file" className="cursor-pointer inline-flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND.blueTint }}>{busy ? <Loader2 size={22} className="animate-spin" style={{ color: BRAND.blue }} /> : <Upload size={22} style={{ color: BRAND.blue }} />}</div><span className="text-sm font-medium text-stone-800">{busy || "Upload a card or bank statement"}</span><span className="text-xs text-stone-400">PDF or photo · detects expenses vs. money-in automatically</span></label><p className="text-[11px] text-stone-400 mt-4 max-w-md mx-auto">The file is sent to Claude to extract the rows. For anything you'd rather keep on-device, use Paste CSV or Add one.</p></Card>}
          {mode === "csv" && <CSVPaste onParse={onCSV} />}
          {mode === "manual" && <ManualAdd onAdd={(t) => setDrafts(enrichItems([t]))} />}
          {err && <div className="text-sm" style={{ color: BRAND.red }}>{err}</div>}
        </>
      ) : (
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-semibold text-stone-900">Review {drafts.length} transactions</h3><p className="text-xs text-stone-400">Known merchants & subscriptions are pre-tagged. <RefreshCw size={11} className="inline fp-text-accent2" /> = recurring. Fix anything, then save.</p></div>
            <div className="flex gap-2"><Btn variant="outline" onClick={autoTag} disabled={!!busy}>{busy === "Tagging categories…" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Auto-tag rest</Btn><Btn variant="ghost" onClick={() => setDrafts([])}><X size={15} /> Cancel</Btn><Btn onClick={save}><Check size={15} /> Save</Btn></div>
          </div>
          {reappeared > 0 && <div className="text-sm rounded-lg px-3 py-2 flex items-center gap-2 border fp-text-warn fp-bg-warn-tint-static fp-border-warn"><AlertTriangle size={15} /> {reappeared} cancelled subscription{reappeared > 1 ? "s" : ""} charged again — check the highlighted rows.</div>}
          {err && <div className="text-sm" style={{ color: BRAND.red }}>{err}</div>}
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-stone-400 border-b border-stone-200"><th className="p-2 w-8"></th><th className="p-2">Date</th><th className="p-2">Merchant / source</th><th className="p-2">Category</th><th className="p-2">Profile</th><th className="p-2 text-center">Recurs</th><th className="p-2 text-right">Amount</th></tr></thead>
            <tbody>{drafts.map((d) => (
              <tr key={d.id} className={"border-b border-stone-100 " + (d._include ? "" : "opacity-40")} style={d._reappeared ? { backgroundColor: BRAND.goldTint } : d.direction === "income" ? { backgroundColor: BRAND.successTint } : undefined}>
                <td className="p-2"><input type="checkbox" checked={d._include} onChange={(e) => editDraft(d.id, { _include: e.target.checked })} className="fp-accent-brand" /></td>
                <td className="p-2"><input value={d.date} onChange={(e) => editDraft(d.id, { date: e.target.value })} className="num w-24 border border-transparent hover:border-stone-300 rounded px-1 py-0.5 fp-input" /></td>
                <td className="p-2">
                  <div className="flex items-center gap-1">{d.direction === "income" ? <ArrowDownLeft size={13} className="fp-text-success shrink-0" /> : d.direction === "payment" ? null : <ArrowUpRight size={13} className="text-stone-300 shrink-0" />}<input value={d.desc} onChange={(e) => editDraft(d.id, { desc: e.target.value })} className="w-full min-w-[140px] border border-transparent hover:border-stone-300 rounded px-1 py-0.5 fp-input" />{d.fx && <span className="text-[11px] text-stone-400 num ml-1">{d.fx}</span>}</div>
                  {d.direction === "income" && <input value={d.payer} onChange={(e) => editDraft(d.id, { payer: e.target.value })} placeholder="From whom? (e.g. PT Acme — payroll)" className="mt-1 w-full min-w-[140px] text-xs border border-stone-200 rounded px-1.5 py-0.5 fp-input" />}
                </td>
                <td className="p-2">
                  <select value={d.category} onChange={(e) => editDraft(d.id, { category: e.target.value })} className={((d.category) ? "border border-stone-200" : "border fp-border-warn fp-bg-warn-tint-static") + " rounded px-1.5 py-1 focus:outline-none fp-input"}>
                    <option value="">— pick —</option>
                    {(d.direction === "income" ? INCOME_CATEGORIES : CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="p-2"><ScopeSelect value={d.scope} onChange={(e) => editDraft(d.id, { scope: e.target.value })} scopes={scopes} scopeColor={scopeColor} /></td>
                <td className="p-2 text-center"><input type="checkbox" checked={d.recurring} onChange={(e) => editDraft(d.id, { recurring: e.target.checked })} className="fp-accent-accent2" /></td>
                <td className="p-2 text-right whitespace-nowrap"><select value={d.direction} onChange={(e) => editDraft(d.id, { direction: e.target.value, category: e.target.value === "income" ? "Income" : e.target.value === "payment" ? "Card Payment" : "" })} className="text-xs text-stone-400 border-0 focus:outline-none bg-transparent mr-1"><option value="expense">− expense</option><option value="income">+ income</option><option value="payment">payment</option></select><input value={d.amount} onChange={(e) => editDraft(d.id, { amount: parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0 })} className="num w-28 text-right border border-transparent hover:border-stone-300 rounded px-1 py-0.5 fp-input" /></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      )}
    </div>
  );
}

function CSVPaste({ onParse }) { const [text, setText] = useState(""); return <Card className="p-4 space-y-3"><p className="text-sm text-stone-600">Paste rows as <Num>date, description, amount</Num> — one per line. Header optional.</p><textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={"2026-06-08, DATADOG INC, 17241780\n2026-06-13, UNIQLO MARGOCITY, 399000"} className={inputCls + " font-mono text-xs"} /><Btn onClick={() => onParse(text)} disabled={!text.trim()}><Check size={15} /> Read rows</Btn></Card>; }
function ManualAdd({ onAdd }) { const [f, setF] = useState({ date: today(), desc: "", amount: "", direction: "expense" }); const submit = () => { if (!f.desc || !f.amount) return; onAdd({ date: f.date, desc: f.desc, amount: Math.abs(parseFloat(f.amount) || 0), direction: f.direction, kind: f.direction === "income" ? "refund" : "purchase" }); setF({ date: today(), desc: "", amount: "", direction: "expense" }); }; return <Card className="p-4"><div className="grid sm:grid-cols-4 gap-3 items-end"><Field label="Date"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} /></Field><Field label="Merchant"><input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="e.g. Kopi Kenangan" className={inputCls} /></Field><Field label="Amount (IDR)"><input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="35000" className={inputCls + " num"} /></Field><Field label="Type"><select value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })} className={inputCls}><option value="expense">Expense</option><option value="income">Income / credit</option></select></Field></div><div className="mt-3"><Btn onClick={submit} disabled={!f.desc || !f.amount}><Plus size={15} /> Add to review</Btn></div></Card>; }

/* ----------------------------- SETUP ----------------------------- */
function Setup({ accounts, setAccounts, transactions, scopes, setScopes, setTab, setFocusAccount }) {
  const [f, setF] = useState({ name: "", bank: "", type: "credit", balance: "", currency: "IDR", linkedAccountId: "" });
  const add = () => {
    if (!f.name) return;
    setAccounts((prev) => [...prev, {
      id: uid(), name: f.name, bank: f.bank, type: f.type, color: ACCOUNT_COLORS[prev.length % ACCOUNT_COLORS.length],
      balance: f.type === "debit" ? (parseFloat(String(f.balance).replace(/[^\d.-]/g, "")) || 0) : undefined,
      currency: f.type === "debit" ? f.currency : "IDR",
      linkedAccountId: f.type === "qris" ? (f.linkedAccountId || null) : undefined,
    }]);
    setF({ name: "", bank: "", type: "credit", balance: "", currency: "IDR", linkedAccountId: "" });
  };
  const del = (id) => setAccounts((prev) => prev.filter((a) => a.id !== id)); const count = (id) => transactions.filter((t) => t.accountId === id).length;
  const openDetail = (id) => { setFocusAccount(id); setTab("accountsDetail"); };
  const [q, setQ] = useState(""); const [ft, setFt] = useState("");
  const filtered = accounts.filter((a) => (!ft || a.type === ft) && (!q || (a.name + " " + (a.bank || "")).toLowerCase().includes(q.toLowerCase())));
  const [ns, setNs] = useState("");
  const addScope = () => { const name = ns.trim().toLowerCase(); if (!name || scopes.some((s) => s.name === name)) return; setScopes((prev) => [...prev, { name, color: SWATCHES[prev.length % SWATCHES.length] }]); setNs(""); };
  const renameScope = (i, name) => setScopes((prev) => prev.map((s, idx) => (idx === i ? { ...s, name: name.toLowerCase() } : s)));
  const colorScope = (i, color) => setScopes((prev) => prev.map((s, idx) => (idx === i ? { ...s, color } : s)));
  const delScope = (i) => { if (scopes.length <= 1) return; setScopes((prev) => prev.filter((_, idx) => idx !== i)); };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setTab("accountsDetail")} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"><ChevronRight size={15} className="rotate-180" /> Back to My Accounts</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 h-fit">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">Add account</h3>
          <div className="space-y-3">
            <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="UOB PRIVIMILES" className={inputCls} /></Field>
            <Field label="Bank / issuer"><input value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} placeholder="UOB, BCA, GoPay…" className={inputCls} /></Field>
            <Field label="Type"><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={inputCls + " capitalize"}>{ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            {f.type === "debit" && (
              <>
                <Field label="Starting balance"><input value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} placeholder="5000000" className={inputCls + " num"} /></Field>
                <Field label="Currency"><select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className={inputCls}>{CURRENCY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              </>
            )}
            {f.type === "qris" && (
              <Field label="Linked debit account">
                <select value={f.linkedAccountId} onChange={(e) => setF({ ...f, linkedAccountId: e.target.value })} className={inputCls}>
                  <option value="">— set later —</option>
                  {accounts.filter((a) => a.type === "debit").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
            )}
            <Btn onClick={add} disabled={!f.name} className="w-full"><Plus size={15} /> Add account</Btn>
            <p className="text-[11px] text-stone-400">Add bank/card details (account number, holder, points) on the <button onClick={() => setTab("accountsDetail")} className="underline" style={{ color: BRAND.blue }}>My Accounts</button> page.</p>
          </div>
        </Card>
        <div className="md:col-span-2 space-y-3">
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]"><Search size={15} className="absolute left-2.5 top-2.5 text-stone-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts…" className={inputCls + " pl-8"} /></div>
              <select value={ft} onChange={(e) => setFt(e.target.value)} className={inputCls + " w-auto capitalize"}><option value="">All types</option>{ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </Card>
          {!accounts.length && <Empty icon={CreditCard} title="No accounts yet" body="Add your cards, bank accounts, and e-wallets here." />}
          {accounts.length > 0 && !filtered.length && <Muted>No accounts match your search.</Muted>}
          {filtered.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
              <button onClick={() => openDetail(a.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.color + "1a" }}>{a.type === "cash" ? <Banknote size={18} style={{ color: a.color }} /> : <CreditCard size={18} style={{ color: a.color }} />}</div>
                <div className="min-w-0"><div className="font-medium text-stone-900 truncate">{a.name}</div><div className="text-xs text-stone-400">{a.bank || "—"} · {count(a.id)} transactions</div></div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <Pill color={a.color}><span className="capitalize">{a.type}</span></Pill>
                <Btn variant="outline" onClick={() => openDetail(a.id)} className="text-xs py-1.5">Details <ChevronRight size={13} /></Btn>
                <Btn variant="danger" onClick={() => del(a.id)}><Trash2 size={15} /></Btn>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-stone-800 mb-1">Spending profiles</h3>
        <p className="text-xs text-stone-400 mb-3">How you split spending — personal, family, friends, work, or your own buckets like "work · part-time".</p>
        <div className="space-y-2">
          {scopes.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex gap-1">{SWATCHES.slice(0, 6).map((c) => <button key={c} onClick={() => colorScope(i, c)} className="w-5 h-5 rounded-full border-2" style={{ background: c, borderColor: s.color === c ? BRAND.ink : "transparent" }} />)}</div>
              <input value={s.name} onChange={(e) => renameScope(i, e.target.value)} className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm capitalize fp-input" style={{ color: s.color }} />
              <Btn variant="danger" onClick={() => delScope(i)} disabled={scopes.length <= 1}><Trash2 size={15} /></Btn>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1"><input value={ns} onChange={(e) => setNs(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addScope()} placeholder="e.g. work · part-time" className={inputCls} /><Btn variant="outline" onClick={addScope} disabled={!ns.trim()}><Plus size={15} /> Add</Btn></div>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- MY ACCOUNTS (detail) ----------------------------- */
function AccountsDetail({ accounts, setAccounts, transactions, setTab, focusAccount, setFocusAccount }) {
  const [view, setView] = useState(() => { const fa = accounts.find((a) => a.id === focusAccount); return fa && fa.type === "debit" ? "debit" : "credit"; });
  useEffect(() => { const fa = accounts.find((a) => a.id === focusAccount); if (fa) setView(fa.type === "debit" ? "debit" : "credit"); }, [focusAccount]); // eslint-disable-line
  const update = (id, patch) => setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const intField = (v) => parseFloat(String(v).replace(/[^\d.-]/g, "")) || 0;

  const credit = accounts.filter((a) => a.type === "credit");
  const debit = accounts.filter((a) => a.type === "debit");
  const list = view === "credit" ? credit : debit;
  const balanceOf = (id) => transactions.filter((t) => t.accountId === id);

  const Tabs = (
    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full p-1 shadow-sm w-fit">
      {[["credit", "Credit", credit.length], ["debit", "Debit", debit.length]].map(([id, label, n]) => (
        <button key={id} onClick={() => setView(id)} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors" style={view === id ? { backgroundColor: BRAND.blue, color: "#fff" } : { color: "#78716c" }}>
          {label} <span className="opacity-70">({n})</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {Tabs}
        <Btn variant="outline" onClick={() => setTab("accounts")}><CreditCard size={15} /> Manage Accounts</Btn>
      </div>
      {!list.length && <Empty icon={Landmark} title={`No ${view} accounts`} body={`Use "Manage Accounts" above to add your first ${view} account.`} action={<Btn onClick={() => setTab("accounts")}><Plus size={15} /> Manage Accounts</Btn>} />}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((a) => {
          const txs = balanceOf(a.id);
          const focused = a.id === focusAccount;
          return (
            <Card key={a.id} className="p-0 overflow-hidden" >
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: a.color, color: "#fff" }}>
                <div className="flex items-center gap-2"><CreditCard size={18} /><span className="font-semibold truncate">{a.name}</span></div>
                <span className="text-xs uppercase tracking-wide opacity-80">{a.type}</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bank name"><input value={a.bank || ""} onChange={(e) => update(a.id, { bank: e.target.value })} placeholder="UOB" className={inputCls} /></Field>
                  <Field label="Account holder"><input value={a.holder || ""} onChange={(e) => update(a.id, { holder: e.target.value })} placeholder="Full name" className={inputCls} /></Field>
                  <Field label="Account number"><input value={a.number || ""} onChange={(e) => update(a.id, { number: e.target.value.replace(/[^\d]/g, "") })} inputMode="numeric" placeholder="1234567890" className={inputCls + " num"} /></Field>
                  <Field label="Currency"><select value={a.currency || "IDR"} onChange={(e) => update(a.id, { currency: e.target.value })} className={inputCls}>{CURRENCY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
                </div>
                {view === "debit" ? (
                  <Field label="Total savings (balance)"><input value={a.balance ?? 0} onChange={(e) => update(a.id, { balance: intField(e.target.value) })} className={inputCls + " num"} /></Field>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Credit limit"><input value={a.creditLimit ?? 0} onChange={(e) => update(a.id, { creditLimit: intField(e.target.value) })} className={inputCls + " num"} /></Field>
                    <Field label="Current balance owed"><input value={a.balanceOwed ?? 0} onChange={(e) => update(a.id, { balanceOwed: intField(e.target.value) })} className={inputCls + " num"} /></Field>
                    <Field label="Card points"><input value={a.points ?? 0} onChange={(e) => update(a.id, { points: intField(e.target.value) })} className={inputCls + " num"} /></Field>
                    <div className="flex items-end"><div className="text-xs text-stone-400">Available: <Num className="font-medium text-stone-700">{fmtMoney((a.creditLimit || 0) - (a.balanceOwed || 0), a.currency || "IDR")}</Num></div></div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <span className="text-xs text-stone-400">{txs.length} transactions</span>
                  {view === "debit"
                    ? <span className="text-sm">Savings: <Num className="font-semibold" style={{ color: BRAND.blue }}>{fmtMoney(a.balance || 0, a.currency || "IDR")}</Num></span>
                    : <span className="text-sm">Points: <Num className="font-semibold" style={{ color: BRAND.gold }}>{(a.points || 0).toLocaleString("id-ID")}</Num></span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- GOALS ----------------------------- */
function Goals({ goals, setGoals, transactions, month }) {
  const [f, setF] = useState({ kind: "limit", name: "", category: "__total__", amount: "" });
  const monthTx = transactions.filter((t) => monthKey(t.date) === month); const expenses = monthTx.filter((t) => t.direction === "expense");
  const income = monthTx.filter((t) => t.direction === "income").reduce((a, t) => a + t.amount, 0); const spent = expenses.reduce((a, t) => a + netOf(t), 0);
  const add = () => { if (!f.amount) return; const amt = parseFloat(String(f.amount).replace(/[^\d.]/g, "")) || 0; if (f.kind === "save") setGoals((prev) => [...prev, { id: uid(), kind: "save", name: f.name || "Monthly savings", target: amt }]); else { const name = f.name || (f.category === "__total__" ? "Total monthly budget" : f.category + " budget"); setGoals((prev) => [...prev, { id: uid(), kind: "limit", name, category: f.category, limit: amt }]); } setF({ kind: "limit", name: "", category: "__total__", amount: "" }); };
  const del = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="p-4 h-fit">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">New goal</h3>
        <div className="space-y-3">
          <Field label="Goal type"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={inputCls}><option value="limit">Spending limit</option><option value="save">Savings target</option></select></Field>
          {f.kind === "limit" && <Field label="Applies to"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={inputCls}><option value="__total__">Total spending</option>{CATEGORIES.filter((c) => c !== "Income" && c !== "Card Payment").map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>}
          <Field label={f.kind === "save" ? "Monthly target (IDR)" : "Monthly limit (IDR)"}><input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="5000000" className={inputCls + " num"} /></Field>
          <Field label="Name (optional)"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={f.kind === "save" ? "Emergency fund" : "Eating out cap"} className={inputCls} /></Field>
          <Btn onClick={add} disabled={!f.amount} className="w-full">{f.kind === "save" ? <PiggyBank size={15} /> : <Target size={15} />} Set goal</Btn>
          {f.kind === "save" && <p className="text-[11px] text-stone-400">Savings = credits/income minus your net spend this month.</p>}
        </div>
      </Card>
      <div className="md:col-span-2 space-y-3">
        {!goals.length && <Empty icon={Target} title="No goals yet" body="Cap a category, cap the whole month, or set a savings target." />}
        {goals.map((g) => {
          if (g.kind === "save") { const saved = Math.max(0, income - spent); const pct = g.target ? (saved / g.target) * 100 : 0; const met = saved >= g.target; return <Card key={g.id} className="p-4"><div className="flex items-center justify-between mb-2"><div><div className="font-medium text-stone-900 flex items-center gap-1.5"><PiggyBank size={15} style={{ color: BRAND.blue }} /> {g.name} {met && <span className="text-xs fp-text-success">· reached</span>}</div><div className="text-xs text-stone-400">Savings target · {monthLabel(month)}</div></div><Btn variant="danger" onClick={() => del(g.id)}><Trash2 size={15} /></Btn></div><div className="h-2.5 rounded-full bg-stone-100 overflow-hidden mb-1.5"><div className="h-full rounded-full" style={{ width: Math.min(100, pct) + "%", background: met ? BRAND.success : BRAND.blue }} /></div><div className="flex justify-between text-sm"><Num className="text-stone-600">{idr(saved)} of {idr(g.target)}</Num><Num className="font-medium fp-text-success">{met ? "target met" : idr(g.target - saved) + " to go"}</Num></div></Card>; }
          const s = expenses.filter((t) => (g.category === "__total__" ? true : t.category === g.category)).reduce((a, t) => a + netOf(t), 0); const pct = g.limit ? (s / g.limit) * 100 : 0; const over = s > g.limit; const left = g.limit - s;
          return <Card key={g.id} className="p-4"><div className="flex items-center justify-between mb-2"><div><div className="font-medium text-stone-900 flex items-center gap-2">{g.name} {over && <span className="inline-flex items-center gap-1 text-xs" style={{ color: BRAND.red }}><AlertTriangle size={13} /> over budget</span>}</div><div className="text-xs text-stone-400">{g.category === "__total__" ? "All spending" : g.category} · {monthLabel(month)}</div></div><Btn variant="danger" onClick={() => del(g.id)}><Trash2 size={15} /></Btn></div><div className="h-2.5 rounded-full bg-stone-100 overflow-hidden mb-1.5"><div className="h-full rounded-full" style={{ width: Math.min(100, pct) + "%", background: over ? BRAND.red : pct > 80 ? BRAND.gold : BRAND.blue }} /></div><div className="flex justify-between text-sm"><Num className="text-stone-600">{idr(s)} of {idr(g.limit)}</Num><Num className="font-medium" style={{ color: over ? BRAND.red : BRAND.success }}>{over ? idr(-left) + " over" : idr(left) + " left"}</Num></div></Card>;
        })}
      </div>
    </div>
  );
}

/* ----------------------------- misc ----------------------------- */
function Empty({ icon: Icon, title, body, action }) { return <Card className="p-10 text-center"><div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3"><Icon size={22} className="text-stone-400" /></div><h3 className="font-semibold text-stone-800">{title}</h3><p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">{body}</p>{action && <div className="mt-4 flex justify-center">{action}</div>}</Card>; }
function splitCSV(line) { const out = []; let cur = ""; let q = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"') q = !q; else if (c === "," && !q) { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; }

/* ----------------------------- ABOUT ME ----------------------------- */
function ProfileRow({ label, value, mono = false }) {
  return (
    <div className="py-3 flex items-start justify-between gap-6 first:pt-0 last:pb-0">
      <span className="text-sm text-stone-500 shrink-0 w-32">{label}</span>
      <span className={"text-sm font-medium text-stone-800 text-right break-all " + (mono ? "num" : "")}>{value || <span className="text-stone-400 font-normal">—</span>}</span>
    </div>
  );
}

function AboutMe({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user.id]); // eslint-disable-line

  const initial = (user.email || "?")[0].toUpperCase();
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const providers = user.app_metadata?.providers?.join(", ") || user.app_metadata?.provider || "email";

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND.blue }} /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ background: BRAND.blue }}>
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-stone-900 truncate">{profile?.display_name || user.email?.split("@")[0] || "—"}</div>
            <div className="text-sm text-stone-500 truncate">{user.email}</div>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: BRAND.blueTint, color: BRAND.blueDark }}>
              {profile?.role || "member"}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 divide-y divide-stone-100">
        <ProfileRow label="Email" value={user.email} />
        <ProfileRow label="Display name" value={profile?.display_name} />
        <ProfileRow label="Role" value={profile?.role} />
        <ProfileRow label="Sign-in method" value={providers} />
        <ProfileRow label="Member since" value={joinedDate} />
        <ProfileRow label="User ID" value={user.id} mono />
      </Card>
    </div>
  );
}

/* ----------------------------- LOANS ----------------------------- */
function loanWAMessage(borrowerName, remainingAmt, principalAmt) {
  return `Halo ${borrowerName}, mengingatkan bahwa kamu masih memiliki pinjaman sebesar ${idr(remainingAmt)} dari total ${idr(principalAmt)}. Mohon segera melakukan pembayaran ya! Terima kasih 🙏`;
}

function LoansPage({ accounts, parties, user }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const debitAccounts = accounts.filter((a) => a.type === "debit");
  const blankLoan = { borrowerMode: "party", borrowerId: parties[0]?.id || "", borrowerName: parties[0]?.name || "", description: "", principal: "", sourceAccountId: debitAccounts[0]?.id || "", issuedDate: todayStr, dueDate: "", notes: "" };
  const blankPay = { amount: "", paidDate: todayStr, note: "" };

  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [showForm, setShowForm] = useState(false);
  const [loanForm, setLoanForm] = useState(blankLoan);
  const [expandedId, setExpandedId] = useState(null);
  const [payFormId, setPayFormId] = useState(null);
  const [payForm, setPayForm] = useState(blankPay);
  const [deleteLoanId, setDeleteLoanId] = useState(null);
  const [deletePayId, setDeletePayId] = useState(null);
  const [sortCol, setSortCol] = useState("issuedDate");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    (async () => {
      const [lr, pr] = await Promise.all([
        supabase.from("loans").select("*").eq("user_id", user.id).order("issued_date", { ascending: false }),
        supabase.from("loan_payments").select("*").eq("user_id", user.id).order("paid_date", { ascending: false }),
      ]);
      if (lr.error) console.error("[loans]", lr.error);
      if (pr.error) console.error("[loan_payments]", pr.error);
      setLoans((lr.data || []).map(fromDbLoan));
      setPayments((pr.data || []).map(fromDbLoanPayment));
      setLoading(false);
    })();
  }, [user.id]); // eslint-disable-line

  /* ---- derived ---- */
  const loanPayments = (loanId) => payments.filter((p) => p.loanId === loanId);
  const paidTotal = (loanId) => loanPayments(loanId).reduce((s, p) => s + p.amount, 0);
  const remaining = (loan) => Math.max(0, loan.principal - paidTotal(loan.id));
  const isOverdue = (loan) => !!(loan.dueDate && loan.dueDate < todayStr && loan.status === "active" && remaining(loan) > 0);
  const effectiveStatus = (loan) => {
    if (loan.status === "paid_off" || remaining(loan) <= 0) return "paid_off";
    if (isOverdue(loan)) return "overdue";
    return "active";
  };
  const partyPhone = (borrowerId) => parties.find((p) => p.id === borrowerId)?.phone || "";

  /* ---- writes ---- */
  const addLoan = async () => {
    const name = loanForm.borrowerMode === "party" ? (parties.find((p) => p.id === loanForm.borrowerId)?.name || loanForm.borrowerName) : loanForm.borrowerName;
    if (!name || !loanForm.principal) return;
    const row = { id: crypto.randomUUID(), user_id: user.id, borrower_id: loanForm.borrowerMode === "party" ? (loanForm.borrowerId || null) : null, borrower_name: name, description: loanForm.description || null, principal: parseFloat(loanForm.principal), source_account_id: loanForm.sourceAccountId || null, issued_date: loanForm.issuedDate, due_date: loanForm.dueDate || null, status: "active", notes: loanForm.notes || null };
    const { data, error } = await supabase.from("loans").insert(row).select().single();
    if (error) { console.error("[loans] insert", error); return; }
    setLoans((prev) => [fromDbLoan(data || row), ...prev]);
    setLoanForm(blankLoan);
    setShowForm(false);
  };

  const deleteLoan = async (id) => {
    const { error } = await supabase.from("loans").delete().eq("id", id);
    if (error) { console.error("[loans] delete", error); return; }
    setLoans((prev) => prev.filter((l) => l.id !== id));
    setPayments((prev) => prev.filter((p) => p.loanId !== id));
    setDeleteLoanId(null);
  };

  const addPayment = async (loanId) => {
    if (!payForm.amount) return;
    const loan = loans.find((l) => l.id === loanId);
    const row = { id: crypto.randomUUID(), user_id: user.id, loan_id: loanId, amount: parseFloat(payForm.amount), paid_date: payForm.paidDate, note: payForm.note || null };
    const { data, error } = await supabase.from("loan_payments").insert(row).select().single();
    if (error) { console.error("[loan_payments] insert", error); return; }
    const newPay = fromDbLoanPayment(data || row);
    const updated = [...payments, newPay];
    setPayments(updated);
    const nowPaid = updated.filter((p) => p.loanId === loanId).reduce((s, p) => s + p.amount, 0);
    if (loan && nowPaid >= loan.principal && loan.status === "active") {
      await supabase.from("loans").update({ status: "paid_off" }).eq("id", loanId);
      setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...l, status: "paid_off" } : l)));
    }
    setPayForm(blankPay);
    setPayFormId(null);
  };

  const deletePayment = async (id) => {
    const { error } = await supabase.from("loan_payments").delete().eq("id", id);
    if (error) { console.error("[loan_payments] delete", error); return; }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    setDeletePayId(null);
  };

  /* ---- summary ---- */
  const activeLoans = loans.filter((l) => effectiveStatus(l) !== "paid_off");
  const overdueLoans = loans.filter((l) => isOverdue(l));
  const totalLent = loans.reduce((s, l) => s + l.principal, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalRemaining = activeLoans.reduce((s, l) => s + remaining(l), 0);
  const overdueAmt = overdueLoans.reduce((s, l) => s + remaining(l), 0);

  /* ---- status badge ---- */
  const renderStatusBadge = (loan) => {
    const st = effectiveStatus(loan);
    const cfg = { active: [BRAND.blue, "Active"], paid_off: [BRAND.success, "Paid Off"], overdue: [BRAND.red, "Overdue"] }[st] || [BRAND.plum, st];
    return <Pill color={cfg[0]}>{cfg[1]}</Pill>;
  };

  /* ---- table sort ---- */
  const getSortVal = (loan, col) => ({ issuedDate: loan.issuedDate, dueDate: loan.dueDate || "", borrowerName: loan.borrowerName, principal: loan.principal, paid: paidTotal(loan.id), remaining: remaining(loan), status: effectiveStatus(loan) }[col] ?? "");
  const sortH = (col) => { if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc")); else { setSortCol(col); setSortDir("desc"); } };
  const renderSortIcon = (col) => sortCol !== col ? null : <ChevronDown size={11} className={"inline ml-0.5 transition-transform " + (sortDir === "asc" ? "rotate-180" : "")} />;
  const sortedLoans = [...loans].sort((a, b) => {
    const va = getSortVal(a, sortCol), vb = getSortVal(b, sortCol);
    return typeof va === "number" ? (sortDir === "asc" ? va - vb : vb - va) : (sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)));
  });

  /* ---- render helpers (called as functions, not JSX, to avoid remount on keystroke) ---- */
  const renderPayHistory = (loan) => {
    const pays = loanPayments(loan.id).slice().sort((a, b) => b.paidDate.localeCompare(a.paidDate));
    return (
      <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Payment history</div>
        {pays.length === 0 ? <Muted>No payments yet.</Muted> : pays.map((pay) => (
          <div key={pay.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="num text-xs text-stone-400 shrink-0">{pay.paidDate}</span>
              <span className="text-stone-600 truncate">{pay.note || "—"}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Num className="font-medium text-stone-900">{idr(pay.amount)}</Num>
              {deletePayId === pay.id ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <button onClick={() => deletePayment(pay.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  <button onClick={() => setDeletePayId(null)} className="text-stone-400">Cancel</button>
                </span>
              ) : (
                <button onClick={() => setDeletePayId(pay.id)} className="text-stone-300 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              )}
            </div>
          </div>
        ))}
        {pays.length > 0 && <div className="flex justify-between pt-2 border-t border-stone-100 text-sm font-medium"><span className="text-stone-500">Total received</span><Num>{idr(paidTotal(loan.id))}</Num></div>}
      </div>
    );
  };

  const renderPayForm = (loanId) => (
    <div className="mt-3 pt-3 border-t border-stone-100">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Record payment</div>
      <div className="grid sm:grid-cols-4 gap-3 items-end">
        <Field label="Amount (IDR)"><input type="number" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} placeholder="500000" className={inputCls} /></Field>
        <Field label="Date"><input type="date" value={payForm.paidDate} onChange={(e) => setPayForm((p) => ({ ...p, paidDate: e.target.value }))} className={inputCls} /></Field>
        <Field label="Note (optional)"><input value={payForm.note} onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))} placeholder="Via BCA transfer" className={inputCls} /></Field>
        <div className="flex gap-2">
          <Btn onClick={() => addPayment(loanId)} disabled={!payForm.amount} className="flex-1">Save</Btn>
          <Btn variant="outline" onClick={() => { setPayFormId(null); setPayForm(blankPay); }}>✕</Btn>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND.blue }} /></div>;

  return (
    <div className="space-y-4">
      {/* ---- Blue gradient header ---- */}
      <div className="rounded-2xl p-4 md:p-5" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDark})` }}>
        <div className="flex items-center gap-2 mb-3 text-white/90"><HandCoins size={16} /><span className="text-sm font-semibold">Loans summary</span></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[["Total lent", idr(totalLent)], ["Collected", idr(totalCollected)], ["Outstanding", idr(totalRemaining)], ["Active loans", activeLoans.length], ["Overdue", idr(overdueAmt)]].map(([label, value]) => (
            <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.14)" }}>
              <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</div>
              <Num className="block text-base md:text-lg font-semibold text-white mt-0.5">{value}</Num>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Overdue warning ---- */}
      {overdueLoans.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: BRAND.redTint, color: BRAND.red, border: `1px solid ${BRAND.redLight}` }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{overdueLoans.length} loan{overdueLoans.length > 1 ? "s are" : " is"} overdue — total {idr(overdueAmt)} outstanding past due date.</span>
        </div>
      )}

      {/* ---- Controls ---- */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full p-1 shadow-sm">
          {[["card", "Cards", LayoutList], ["table", "Table", TableIcon]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setView(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors" style={view === id ? { backgroundColor: BRAND.blue, color: "#fff" } : { color: "#78716c" }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowForm((v) => !v)}><Plus size={15} /> {showForm ? "Cancel" : "New Loan"}</Btn>
      </div>

      {/* ---- New loan form ---- */}
      {showForm && (
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-stone-800">Add new loan</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Borrower">
              <div className="space-y-2">
                <select value={loanForm.borrowerMode} onChange={(e) => { const m = e.target.value; const p = parties[0]; setLoanForm((f) => ({ ...f, borrowerMode: m, borrowerId: m === "party" ? (p?.id || "") : "", borrowerName: m === "party" ? (p?.name || "") : "" })); }} className={inputCls}>
                  <option value="party">From People list</option>
                  <option value="manual">Type a name manually</option>
                </select>
                {loanForm.borrowerMode === "party" ? (
                  <select value={loanForm.borrowerId} onChange={(e) => { const p = parties.find((x) => x.id === e.target.value); setLoanForm((f) => ({ ...f, borrowerId: e.target.value, borrowerName: p?.name || "" })); }} className={inputCls}>
                    {parties.length === 0 && <option value="">No people added yet</option>}
                    {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <input value={loanForm.borrowerName} onChange={(e) => setLoanForm((f) => ({ ...f, borrowerName: e.target.value }))} placeholder="Full name" className={inputCls} />
                )}
              </div>
            </Field>
            <Field label="Description"><input value={loanForm.description} onChange={(e) => setLoanForm((f) => ({ ...f, description: e.target.value }))} placeholder="Emergency hospital bill" className={inputCls} /></Field>
            <Field label="Principal amount (IDR)"><input type="number" value={loanForm.principal} onChange={(e) => setLoanForm((f) => ({ ...f, principal: e.target.value }))} placeholder="5000000" className={inputCls} /></Field>
            <Field label="Source account (debit only)">
              <select value={loanForm.sourceAccountId} onChange={(e) => setLoanForm((f) => ({ ...f, sourceAccountId: e.target.value }))} className={inputCls}>
                <option value="">— none —</option>
                {debitAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Issue date"><input type="date" value={loanForm.issuedDate} onChange={(e) => setLoanForm((f) => ({ ...f, issuedDate: e.target.value }))} className={inputCls} /></Field>
            <Field label="Due date (optional)"><input type="date" value={loanForm.dueDate} onChange={(e) => setLoanForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} /></Field>
            <Field label="Notes (optional)" ><textarea value={loanForm.notes} onChange={(e) => setLoanForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any additional notes…" className={inputCls + " resize-none"} /></Field>
          </div>
          <Btn onClick={addLoan} disabled={!loanForm.principal || (loanForm.borrowerMode === "party" ? !loanForm.borrowerId : !loanForm.borrowerName)}>Save loan</Btn>
        </Card>
      )}

      {/* ---- Empty state ---- */}
      {loans.length === 0 && !showForm && <Empty icon={HandCoins} title="No loans recorded" body="Track money you lend to friends, family, or colleagues — see how much has been repaid and who still owes you." />}

      {/* ==================== CARD VIEW ==================== */}
      {view === "card" && loans.length > 0 && (
        <div className="space-y-3">
          {sortedLoans.map((loan) => {
            const paid = paidTotal(loan.id);
            const rem = remaining(loan);
            const pct = loan.principal > 0 ? Math.min(100, (paid / loan.principal) * 100) : 0;
            const overdue = isOverdue(loan);
            const expanded = expandedId === loan.id;
            const payOpen = payFormId === loan.id;
            const phone = partyPhone(loan.borrowerId);
            const waLink = phone ? whatsappLink(phone, loanWAMessage(loan.borrowerName, rem, loan.principal)) : null;
            const acct = accounts.find((a) => a.sourceAccountId === loan.sourceAccountId) || accounts.find((a) => a.id === loan.sourceAccountId);

            return (
              <Card key={loan.id} className={"p-4 " + (overdue ? "border-l-4" : "")} style={overdue ? { borderLeftColor: BRAND.red } : {}}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: BRAND.blue }}>
                      {loan.borrowerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-900 truncate">{loan.borrowerName}</div>
                      {loan.description && <div className="text-sm text-stone-500 truncate">{loan.description}</div>}
                    </div>
                  </div>
                  {renderStatusBadge(loan)}
                </div>

                {/* Amounts */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-[11px] text-stone-400 uppercase font-medium">Principal</div><Num className="text-sm font-semibold text-stone-800">{idr(loan.principal)}</Num></div>
                  <div><div className="text-[11px] text-stone-400 uppercase font-medium">Paid</div><Num className="text-sm font-semibold" style={{ color: BRAND.success }}>{idr(paid)}</Num></div>
                  <div><div className="text-[11px] text-stone-400 uppercase font-medium">Remaining</div><Num className="text-sm font-semibold" style={{ color: rem > 0 ? BRAND.red : BRAND.success }}>{idr(rem)}</Num></div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: pct + "%", background: pct >= 100 ? BRAND.success : BRAND.blue }} />
                </div>
                <div className="text-[10px] text-stone-400 text-right mt-0.5 num">{Math.round(pct)}% repaid</div>

                {/* Dates + source */}
                <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-stone-400">
                  <span>Issued <Num>{loan.issuedDate}</Num></span>
                  {loan.dueDate && <span className={overdue ? "font-semibold" : ""} style={overdue ? { color: BRAND.red } : {}}>Due <Num>{loan.dueDate}</Num>{overdue && " ⚠"}</span>}
                  {acct && <span>From <span className="font-medium text-stone-600">{acct.name}</span></span>}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {effectiveStatus(loan) !== "paid_off" && (
                    <Btn variant="outline" onClick={() => { setPayFormId(payOpen ? null : loan.id); setExpandedId(null); setPayForm(blankPay); }} className="text-xs py-1.5">
                      <Plus size={13} /> Record Payment
                    </Btn>
                  )}
                  <button onClick={() => { setExpandedId(expanded ? null : loan.id); setPayFormId(null); }} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium">
                    {expanded ? "Hide" : `History (${loanPayments(loan.id).length})`}
                  </button>
                  {waLink && rem > 0 && (
                    <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: BRAND.successTint, color: BRAND.success }}>
                      <MessageCircle size={13} /> Remind
                    </a>
                  )}
                  <div className="ml-auto">
                    {deleteLoanId === loan.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        <button onClick={() => deleteLoan(loan.id)} className="text-red-500 hover:text-red-700 font-medium">Delete loan</button>
                        <button onClick={() => setDeleteLoanId(null)} className="text-stone-400">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeleteLoanId(loan.id)} className="text-stone-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>

                {payOpen && renderPayForm(loan.id)}
                {expanded && renderPayHistory(loan)}
                {loan.notes && !expanded && !payOpen && <div className="mt-2 text-xs text-stone-400 italic">{loan.notes}</div>}
              </Card>
            );
          })}
        </div>
      )}

      {/* ==================== TABLE VIEW ==================== */}
      {view === "table" && loans.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  {[["borrowerName", "Borrower"], ["description", "Description"], ["principal", "Principal"], ["paid", "Paid"], ["remaining", "Remaining"], ["issuedDate", "Issued"], ["dueDate", "Due"], ["status", "Status"]].map(([col, label]) => (
                    <th key={col} onClick={() => sortH(col)} className="px-4 py-3 text-left cursor-pointer hover:text-stone-700 select-none whitespace-nowrap">
                      {label}{renderSortIcon(col)}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sortedLoans.map((loan) => {
                  const paid = paidTotal(loan.id);
                  const rem = remaining(loan);
                  const overdue = isOverdue(loan);
                  const expanded = expandedId === loan.id;
                  const phone = partyPhone(loan.borrowerId);
                  const waLink = phone ? whatsappLink(phone, loanWAMessage(loan.borrowerName, rem, loan.principal)) : null;

                  return (
                    <React.Fragment key={loan.id}>
                      <tr className={"hover:bg-stone-50 transition-colors" + (overdue ? " border-l-2" : "")} style={overdue ? { borderLeftColor: BRAND.red } : {}}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: BRAND.blue }}>{loan.borrowerName[0].toUpperCase()}</div>
                            <span className="font-medium text-stone-800">{loan.borrowerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500 max-w-[180px] truncate">{loan.description || "—"}</td>
                        <td className="px-4 py-3 num font-medium">{idr(loan.principal)}</td>
                        <td className="px-4 py-3 num" style={{ color: BRAND.success }}>{idr(paid)}</td>
                        <td className="px-4 py-3 num font-semibold" style={{ color: rem > 0 ? BRAND.red : BRAND.success }}>{idr(rem)}</td>
                        <td className="px-4 py-3 num text-stone-500">{loan.issuedDate}</td>
                        <td className="px-4 py-3 num" style={overdue ? { color: BRAND.red, fontWeight: 600 } : { color: "#a8a29e" }}>{loan.dueDate || "—"}</td>
                        <td className="px-4 py-3">{renderStatusBadge(loan)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setExpandedId(expanded ? null : loan.id); setPayFormId(null); }} className="text-xs text-stone-400 hover:text-stone-700 font-medium whitespace-nowrap">
                              {expanded ? "Hide" : "Details"}
                            </button>
                            {waLink && rem > 0 && <a href={waLink} target="_blank" rel="noreferrer" className="text-stone-300 hover:text-green-500 transition-colors" title="WhatsApp reminder"><MessageCircle size={13} /></a>}
                            <button onClick={() => setDeleteLoanId(deleteLoanId === loan.id ? null : loan.id)} className="text-stone-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={9} className="px-4 pb-3">
                            {effectiveStatus(loan) !== "paid_off" && <div className="mb-3"><Btn variant="outline" onClick={() => { setPayFormId(payFormId === loan.id ? null : loan.id); setPayForm(blankPay); }} className="text-xs py-1"><Plus size={13} /> Record Payment</Btn></div>}
                            {payFormId === loan.id && renderPayForm(loan.id)}
                            {renderPayHistory(loan)}
                            {deleteLoanId === loan.id && (
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <span className="text-stone-500">Delete this loan and all its payments?</span>
                                <button onClick={() => deleteLoan(loan.id)} className="text-red-500 font-medium">Yes, delete</button>
                                <button onClick={() => setDeleteLoanId(null)} className="text-stone-400">Cancel</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- STATEMENTS ----------------------------- */
function StatementsPage({ accounts, statements, setStatements }) {
  const creditAccounts = accounts.filter((a) => a.type === "credit");
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = todayStr.slice(0, 7);
  const blank = { accountId: creditAccounts[0]?.id || "", month: currentMonth, statementDate: todayStr, dueDate: "", totalAmount: "", minPayment: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const parseAmt = (v) => parseFloat(String(v).replace(/[^\d.]/g, "")) || 0;

  const add = () => {
    if (!form.accountId || !form.totalAmount) return;
    setStatements((prev) => [
      ...prev,
      { id: crypto.randomUUID(), accountId: form.accountId, month: form.month, statementDate: form.statementDate || null, dueDate: form.dueDate || null, totalAmount: parseAmt(form.totalAmount), minPayment: form.minPayment ? parseAmt(form.minPayment) : null },
    ]);
    setForm(blank);
    setShowForm(false);
  };

  const del = (id) => setStatements((prev) => prev.filter((s) => s.id !== id));

  const sorted = [...statements].sort((a, b) => b.month.localeCompare(a.month) || (b.statementDate || "").localeCompare(a.statementDate || ""));

  const totalDue = statements.filter((s) => !s.dueDate || s.dueDate >= todayStr).reduce((sum, s) => sum + s.totalAmount, 0);

  const acctName = (id) => accounts.find((a) => a.id === id)?.name || id;
  const acctColor = (id) => accounts.find((a) => a.id === id)?.color || BRAND.blue;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const fmtMonth = (m) => { try { return new Date(m + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); } catch { return m; } };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-stone-400 font-medium mb-1">Total outstanding</div><div className="text-xl font-bold num" style={{ color: BRAND.red }}>{idr(totalDue)}</div></Card>
        <Card className="p-4"><div className="text-xs text-stone-400 font-medium mb-1">Statements recorded</div><div className="text-xl font-bold num">{statements.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-stone-400 font-medium mb-1">Cards tracked</div><div className="text-xl font-bold num">{new Set(statements.map((s) => s.accountId)).size}</div></Card>
      </div>

      <div className="flex justify-end">
        <Btn onClick={() => setShowForm((v) => !v)}><Plus size={15} /> {showForm ? "Cancel" : "Record Statement"}</Btn>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-stone-800">New statement</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Credit card account">
              <select value={form.accountId} onChange={f("accountId")} className={inputCls}>
                {creditAccounts.length === 0 && <option value="">No credit accounts</option>}
                {creditAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Statement month">
              <input type="month" value={form.month} onChange={f("month")} className={inputCls} />
            </Field>
            <Field label="Statement date">
              <input type="date" value={form.statementDate} onChange={f("statementDate")} className={inputCls} />
            </Field>
            <Field label="Due date">
              <input type="date" value={form.dueDate} onChange={f("dueDate")} className={inputCls} />
            </Field>
            <Field label="Total tagihan (IDR)">
              <input type="number" value={form.totalAmount} onChange={f("totalAmount")} placeholder="16684078" className={inputCls} />
            </Field>
            <Field label="Minimum payment (IDR)">
              <input type="number" value={form.minPayment} onChange={f("minPayment")} placeholder="834204" className={inputCls} />
            </Field>
          </div>
          <Btn onClick={add} disabled={!form.accountId || !form.totalAmount}>Save statement</Btn>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Empty icon={FileText} title="No statements recorded" body="Record your monthly credit card bill amounts here to track spending over time." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400">Account</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400">Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400">Statement date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400">Due date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-400">Total tagihan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-400">Min. payment</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sorted.map((s) => {
                  const overdue = s.dueDate && s.dueDate < todayStr;
                  return (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: acctColor(s.accountId) }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: acctColor(s.accountId) }} />
                          {acctName(s.accountId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{fmtMonth(s.month)}</td>
                      <td className="px-4 py-3 text-stone-500 num">{fmtDate(s.statementDate)}</td>
                      <td className="px-4 py-3 num">
                        <span className={overdue ? "text-red-500 font-medium" : "text-stone-500"}>{fmtDate(s.dueDate)}</span>
                        {overdue && <span className="ml-1 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">overdue</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold num">{idr(s.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-stone-500 num">{s.minPayment != null ? idr(s.minPayment) : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => del(s.id)} className="text-stone-300 hover:text-red-400"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- AUTH ----------------------------- */
function AuthToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t); // eslint-disable-line
  }, [toast]); // eslint-disable-line
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      background: ok ? BRAND.successTint : BRAND.redTint,
      border: `1.5px solid ${ok ? BRAND.successLight : BRAND.redLight}`,
      color: ok ? BRAND.success : BRAND.red,
      borderRadius: 12, padding: "12px 16px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      fontSize: 14, fontWeight: 500, width: "max-content", maxWidth: 360,
    }}>
      {ok ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span>{typeof toast.text === "string" ? toast.text : JSON.stringify(toast.text)}</span>
      <button onClick={onClose} style={{ marginLeft: 8, opacity: 0.55, cursor: "pointer", background: "none", border: "none", color: "inherit", display: "flex", padding: 0 }}><X size={14} /></button>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const notify = (type, text) => setToast({ type, text });

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setToast(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        notify("success", "Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      const errText =
        (typeof e?.message === "string" && e.message) ||
        (typeof e?.error_description === "string" && e.error_description) ||
        (typeof e === "string" && e) ||
        "Something went wrong. Please try again.";
      notify("error", errText);
    } finally { setLoading(false); }
  };
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) notify("error", error.message);
  };
  return (
    <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: "#FAF7F1", color: BRAND.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FontStyle />
      <AuthToast toast={toast} onClose={() => setToast(null)} />
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: BRAND.blue }}><Wallet size={20} className="text-white" /></div>
          <div className="leading-tight"><div className="text-xl font-semibold text-stone-900 tracking-tight">FinPlus</div><div className="text-xs text-stone-400">your money, sorted</div></div>
        </div>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">{mode === "signin" ? "Sign in" : "Create account"}</h2>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} autoComplete="email" /></Field>
            <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></Field>
            <Btn type="submit" disabled={loading} className="w-full">{loading && <Loader2 size={15} className="animate-spin" />}{mode === "signin" ? "Sign in" : "Sign up"}</Btn>
          </form>
          <div className="my-4 flex items-center gap-3"><div className="h-px flex-1 bg-stone-200" /><span className="text-xs text-stone-400">or</span><div className="h-px flex-1 bg-stone-200" /></div>
          <button type="button" onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 border border-stone-300 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <div className="mt-4 text-center text-sm text-stone-500">
            {mode === "signin"
              ? <>No account? <button type="button" onClick={() => { setMode("signup"); setToast(null); }} className="underline" style={{ color: BRAND.blue }}>Sign up</button></>
              : <>Already have one? <button type="button" onClick={() => { setMode("signin"); setToast(null); }} className="underline" style={{ color: BRAND.blue }}>Sign in</button></>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AuthWrapper() {
  const [session, setSession] = useState(null); const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setChecking(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (checking) return (
    <div style={{ fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: "#FAF7F1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FontStyle /><Loader2 className="animate-spin" style={{ color: BRAND.blue }} />
    </div>
  );
  if (!session) return <LoginPage />;
  return <App user={session.user} />;
}

export default AuthWrapper;

const rootStyle = { fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", background: "#FAF7F1", color: BRAND.ink, minHeight: "100vh" };
function FontStyle() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    :root{
      --brand:${BRAND.blue}; --brand-dark:${BRAND.blueDark}; --brand-tint:${BRAND.blueTint}; --brand-tint2:${BRAND.blueLight};
      --danger:${BRAND.red}; --danger-light:${BRAND.redLight}; --danger-tint:${BRAND.redTint};
      --warn:${BRAND.gold}; --warn-dark:${BRAND.goldDark}; --warn-tint:${BRAND.goldTint}; --warn-light:${BRAND.goldLight};
      --plum:${BRAND.plum}; --plum-light:${BRAND.plumLight}; --plum-tint:${BRAND.plumTint};
      --success:${BRAND.success}; --success-light:${BRAND.successLight}; --success-tint:${BRAND.successTint};
    }
    .num { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    select { background-image: none; }
    .fp-input:focus{ outline:none; box-shadow:0 0 0 2px var(--brand-tint2); border-color:var(--brand); }
    .fp-btn-primary{ background-color:var(--brand); color:#fff; }
    .fp-btn-primary:hover{ background-color:var(--brand-dark); }
    .fp-text-brand{ color:var(--brand); }
    .fp-text-danger{ color:var(--danger); }
    .fp-border-danger-light{ border-color:var(--danger-light); }
    .fp-bg-danger-tint-hover:hover{ background-color:var(--danger-tint); }
    .fp-text-warn{ color:var(--warn-dark); }
    .fp-border-warn{ border-color:var(--warn-light); }
    .fp-bg-warn-tint-static{ background-color:var(--warn-tint); }
    .fp-text-accent2{ color:var(--plum); }
    .fp-border-accent2-light{ border-color:var(--plum-light); }
    .fp-bg-accent2-tint-static{ background-color:var(--plum-tint); }
    .fp-accent-accent2{ accent-color:var(--plum); }
    .fp-text-success{ color:var(--success); }
    .fp-border-success-light{ border-color:var(--success-light); }
    .fp-bg-success-tint-static{ background-color:var(--success-tint); }
    .fp-accent-brand{ accent-color:var(--brand); }
  `}</style>;
}
