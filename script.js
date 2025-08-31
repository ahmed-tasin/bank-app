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



/** -----------------------
 *  Rendering
 * ----------------------*/
const balanceEl = document.getElementById('current-balance');
const updatedEl = document.getElementById('last-updated');
const recentTxEl = document.getElementById('recent-tx');
const historyTableEl = document.getElementById('history-table');

function renderBalance() {
    balanceEl.textContent = fmtBDT.format(state.balance);
    updatedEl.textContent = state.lastUpdated ? `Last updated: ${toLocalDT(state.lastUpdated)}` : '—';
}

function renderRecent() {
    const rows = state.transactions.slice(0, 5).map(tx => {
        const sign = tx.type === 'Add' ? '+' : '−';
        const color = tx.type === 'Add' ? 'text-emerald-700' : 'text-rose-700';
        return `
            <tr class="border-b last:border-none">
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">${toLocalDT(tx.at)}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium">${tx.type}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm ${color} tabular-nums">${sign}${fmtBDT.format(tx.amount).replace('BDT', '').trim()}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700 tabular-nums">${fmtBDT.format(tx.balanceAfter)}</td>
            </tr>`;
    }).join('');

    recentTxEl.innerHTML = `
        <table class="min-w-full text-left">
            <thead>
            <tr class="text-xs uppercase text-gray-500">
                <th class="px-4 py-2">Date</th>
                <th class="px-4 py-2">Type</th>
                <th class="px-4 py-2">Amount</th>
                <th class="px-4 py-2">Balance After</th>
            </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="4" class="px-4 py-6 text-sm text-gray-500">No transactions yet.</td></tr>`}</tbody>
        </table>`;
}

function renderHistory() {
    const rows = state.transactions.map((tx, i) => {
        const sign = tx.type === 'Add' ? '+' : '−';
        const color = tx.type === 'Add' ? 'text-emerald-700' : 'text-rose-700';
        return `
        <tr class="border-b last:border-none">
            <td class="px-4 py-3 text-sm text-gray-500">${i + 1}</td>
            <td class="px-4 py-3 text-sm">${toLocalDT(tx.at)}</td>
            <td class="px-4 py-3 text-sm font-medium">${tx.type}</td>
            <td class="px-4 py-3 text-sm ${color} tabular-nums">${sign}${fmtBDT.format(tx.amount).replace('BDT', '').trim()}</td>
            <td class="px-4 py-3 text-sm tabular-nums">${fmtBDT.format(tx.balanceAfter)}</td>
        </tr>`;
    }).join('');

    historyTableEl.innerHTML = `
        <table class="min-w-full text-left">
        <thead>
            <tr class="text-xs uppercase text-gray-500">
                <th class="px-4 py-2">#</th>
                <th class="px-4 py-2">Date</th>
                <th class="px-4 py-2">Type</th>
                <th class="px-4 py-2">Amount</th>
                <th class="px-4 py-2">Balance After</th>
            </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="5" class="px-4 py-6 text-sm text-gray-500">No transactions yet.</td></tr>`}</tbody>
        </table>`;
}

function render() {
    renderBalance();
    renderRecent();
    renderHistory();
}





/** -----------------------
 *  Navigation
 * ----------------------*/
const views = {
    dashboard: document.getElementById('view-dashboard'),
    add: document.getElementById('view-add'),
    withdraw: document.getElementById('view-withdraw'),
    history: document.getElementById('view-history'),
};

function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
        const hidden = key !== name;
        el.classList.toggle('hidden', hidden);
    });
    // Update nav button styles
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isActive = btn.dataset.view === name;
        btn.classList.toggle('bg-gray-900', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow', isActive);
        btn.classList.toggle('bg-gray-100', !isActive);
        btn.classList.toggle('text-gray-900', !isActive);
    });
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (btn && btn.dataset.view) {
        e.preventDefault();
        showView(btn.dataset.view);
    }
});




/** -----------------------
 *  Forms & Validation
 * ----------------------*/
function validatePositiveNumber(value) {
    if (Number.isNaN(value)) return 'Please enter a valid number.';
    if (value <= 0) return 'Amount must be greater than 0.';
    if (value > 1_000_000_000) return 'Amount is too large.';
    return '';
}



// Add Money
const addForm = document.getElementById('form-add');
const addInput = document.getElementById('add-amount');
const addError = document.getElementById('add-error');

addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseAmount(addInput.value);
    const msg = validatePositiveNumber(amount);
    if (msg) {
        addError.textContent = msg;
        addError.classList.remove('hidden');
        addInput.classList.add('border-rose-400', 'bg-rose-50');
        return;
    }
    addError.classList.add('hidden');
    addInput.classList.remove('border-rose-400', 'bg-rose-50');

    state.balance = Math.round((state.balance + amount) * 100) / 100;
    saveState(state);
    addTransaction('Add', amount);

    addInput.value = '';
    showView('dashboard');
});





// Withdraw
const wForm = document.getElementById('form-withdraw');
const wInput = document.getElementById('withdraw-amount');
const wError = document.getElementById('withdraw-error');

wForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseAmount(wInput.value);
    let msg = validatePositiveNumber(amount);
    if (!msg && amount > state.balance) {
        msg = 'Insufficient balance for this withdrawal.';
    }
    if (msg) {
        wError.textContent = msg;
        wError.classList.remove('hidden');
        wInput.classList.add('border-rose-400', 'bg-rose-50');
        return;
    }
    wError.classList.add('hidden');
    wInput.classList.remove('border-rose-400', 'bg-rose-50');

    state.balance = Math.round((state.balance - amount) * 100) / 100;
    saveState(state);
    addTransaction('Withdraw', amount);

    wInput.value = '';
    showView('dashboard');
});





/** -----------------------
 *  History actions
 * ----------------------*/
document.getElementById('export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowerbank-data.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('reset-data').addEventListener('click', () => {
    if (!confirm('Reset all demo data? This cannot be undone.')) return;
    state = initialState();
    saveState(state);
    render();
    showView('dashboard');
});
