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
