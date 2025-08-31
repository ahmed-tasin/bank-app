/*storage and state */

const STORAGE_KEY = "flowerbank.v1";

const initialState = () => ({
    balance: 0,
    transactions: [], // { id, type: 'Add'|'Withdraw', amount, balanceAfter, at }
    lastUpdated: null,
});

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return initialState();
        const parsed = JSON.parse(raw);
        // basic shape validation
        if (
            typeof parsed.balance !== "number" ||
            !Array.isArray(parsed.transactions)
        ) {
            return initialState();
        }
        return parsed;
    } catch (e) {
        console.error("Failed to load state:", e);
        return initialState();
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

/** -----------------------
 *  Utilities
 * ----------------------*/
const fmtBDT = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
});

function parseAmount(input) {
    if (typeof input === "string") {
        input = input.replace(/[,\s]/g, "");
    }
    const value = Number(input);
    if (!Number.isFinite(value)) return NaN;
    return Math.round(value * 100) / 100; // 2-decimal precision
}

function nowISO() {
    return new Date().toISOString();
}

function toLocalDT(iso) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function addTransaction(type, amount) {
    const id = crypto.randomUUID();
    const balanceAfter = state.balance;
    const entry = { id, type, amount, balanceAfter, at: nowISO() };
    state.transactions.unshift(entry); // newest first
    state.lastUpdated = entry.at;
    saveState(state);
    render();
    return entry;
}


