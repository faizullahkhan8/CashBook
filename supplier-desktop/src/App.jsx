import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import SummaryView from './views/SummaryView';
import AddBillView from './views/AddBillView';
import AllBillsView from './views/AllBillsView';
import UsersView from './views/UsersView';
import LoginView from './views/LoginView';
import { api, getSavedUser, setToken, setSavedUser } from './api';

const today = () => new Date().toISOString().slice(0, 10);
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const blank = () => ({
  posting_date: today(),
  bill_date: today(),
  supplier_name: '',
  supplier_bill_no: '',
  voucher_no: '',
  total_bill_amount: '',
  tax_percent: '0',
  category: 'PAYABLE',
  remarks: '',
  record_payment: false,
  payment_date: today(),
  payment_amount: '',
  payment_mode: 'COUNTER_CASH',
  payment_reference_no: '',
  payment_remarks: '',
});

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());
  const [authChecking, setAuthChecking] = useState(true);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank());
  const [paying, setPaying] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [payment, setPayment] = useState({
    payment_date: today(),
    amount: '',
    payment_mode: 'CHEQUE',
    reference_no: '',
    remarks: '',
  });
  const [from, setFrom] = useState(`${today().slice(0, 8)}01`);
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [errorMsg, setErrorMsg] = useState('');

  // Check current user session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        if (currentUser) {
          const res = await api.auth.me();
          setCurrentUser(res.user);
          setSavedUser(res.user);
        }
      } catch {
        setCurrentUser(null);
        setSavedUser(null);
        setToken(null);
      } finally {
        setAuthChecking(false);
      }
    }

    checkAuth();

    function onAuthExpired() {
      setCurrentUser(null);
    }
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, []);

  // Load bills when user is logged in
  const load = async () => {
    if (!currentUser) return;
    try {
      setErrorMsg('');
      const data = await api.bills.list({ from, to });
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load bills:', err);
      // Fallback to electron API if offline / dev electron
      if (window.supplierAPI) {
        try {
          const fallbackData = await window.supplierAPI.list({ from, to });
          setItems(fallbackData || []);
          return;
        } catch {
          // Ignore
        }
      }
      setErrorMsg(err.message || 'Failed to load records from MySQL server');
    }
  };

  useEffect(() => {
    if (currentUser) {
      load();
    }
  }, [from, to, currentUser]);

  const tabs = useMemo(() => {
    const list = [
      { id: 'summary', label: 'Summary', icon: '📊' },
      { id: 'bills', label: 'Add Bill(s)', icon: '📝' },
      { id: 'all', label: 'All Bills', icon: '📑' },
    ];
    if (currentUser?.role === 'admin') {
      list.push({ id: 'users', label: 'Users & Staff', icon: '👥' });
    }
    return list;
  }, [currentUser]);

  const totals = useMemo(() => {
    return items.reduce(
      (s, b) => ({
        gross: s.gross + Number(b.total_bill_amount || 0),
        tax: s.tax + Number(b.tax_amount || 0),
        actual: s.actual + (b.category === 'PAYABLE' ? Number(b.actual_amount || 0) : 0),
        paid: s.paid + Number(b.paid_amount || 0),
        balance: s.balance + Number(b.remaining_balance || 0),
      }),
      { gross: 0, tax: 0, actual: 0, paid: 0, balance: 0 }
    );
  }, [items]);

  const visible = items.filter((x) =>
    `${x.supplier_name || ''} ${x.supplier_bill_no || ''} ${x.voucher_no || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const suppliers = useMemo(
    () => Array.from(new Set(items.map((x) => x.supplier_name).filter(Boolean))).sort(),
    [items]
  );

  async function save(e) {
    e.preventDefault();
    try {
      let saved = null;
      try {
        saved = await api.bills.save(form);
      } catch (err) {
        if (window.supplierAPI) {
          saved = await window.supplierAPI.saveBill(form);
        } else {
          throw err;
        }
      }

      // Record immediate payment if checked
      if (form.record_payment && Number(form.payment_amount) > 0 && saved?.sync_id) {
        const paymentPayload = {
          bill_sync_id: saved.sync_id,
          payment_date: form.payment_date || form.posting_date || today(),
          amount: Number(form.payment_amount),
          payment_mode: form.payment_mode || 'COUNTER_CASH',
          reference_no: form.payment_reference_no || '',
          remarks: form.payment_remarks || (form.remarks ? `Paid with bill: ${form.remarks}` : 'Payment recorded on bill entry'),
        };

        try {
          await api.payments.add(paymentPayload);
        } catch (paymentErr) {
          if (window.supplierAPI) {
            await window.supplierAPI.addPayment(paymentPayload);
          } else {
            console.error('Error recording payment:', paymentErr);
          }
        }
      }

      setForm(blank());
      setActiveTab('all');
      await load();
    } catch (err) {
      alert(`Error saving bill: ${err.message}`);
    }
  }

  async function pay(e) {
    e.preventDefault();
    try {
      const paymentPayload = { ...payment, bill_sync_id: paying.sync_id };
      try {
        await api.payments.add(paymentPayload);
      } catch (err) {
        if (window.supplierAPI) {
          await window.supplierAPI.addPayment(paymentPayload);
        } else {
          throw err;
        }
      }

      setPaying(null);
      setPayment({ payment_date: today(), amount: '', payment_mode: 'CHEQUE', reference_no: '', remarks: '' });
      await load();
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
    }
  }

  function onEditBill(b) {
    setForm({
      ...blank(),
      ...b,
      record_payment: false,
      payment_amount: '',
      payment_reference_no: '',
      payment_remarks: '',
    });
    setActiveTab('bills');
    window.scrollTo(0, 0);
  }

  function onDeleteBill(record, kind = 'bill') {
    setConfirming({
      kind,
      id: record.sync_id,
      label: kind === 'payment' ? 'this payment' : `bill ${record.supplier_bill_no || record.voucher_no || 'entry'}`,
    });
  }

  function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      api.auth.logout();
      setCurrentUser(null);
    }
  }

  if (authChecking) {
    return (
      <div className="login-screen">
        <div className="login-container" style={{ textAlign: 'center' }}>
          <p style={{ color: '#34d399', fontWeight: 'bold' }}>Loading Zada SPMS...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  function renderTab() {
    switch (activeTab) {
      case 'bills':
        return (
          <AddBillView
            form={form}
            setForm={setForm}
            suppliers={suppliers}
            onSave={save}
            onCancel={() => setForm(blank())}
          />
        );
      case 'all':
        return (
          <AllBillsView
            visible={visible}
            search={search}
            setSearch={setSearch}
            from={from}
            setFrom={setFrom}
            to={to}
            setTo={setTo}
            onEdit={onEditBill}
            onPay={setPaying}
            onDelete={onDeleteBill}
          />
        );
      case 'users':
        return <UsersView currentUser={currentUser} />;
      default:
        return <SummaryView totals={totals} items={items} />;
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="content-shell">
        <header>
          <div>
            <small>ZADA PHARMACY</small>
            <h1>Supplier Reconciliation</h1>
            <p>Bills, payments and outstanding balances · MySQL Hosted</p>
          </div>
          <div className="live">● LIVE MYSQL</div>
        </header>

        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: 18 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {renderTab()}
      </div>

      {paying && (
        <div className="overlay">
          <form className="modal" onSubmit={pay}>
            <h2>Record Payment</h2>
            <p>
              {paying.supplier_name} · Balance Rs {money(paying.remaining_balance)}
            </p>
            <label>
              Payment Date
              <input
                type="date"
                value={payment.payment_date}
                onChange={(e) => setPayment((prev) => ({ ...prev, payment_date: e.target.value }))}
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                max={paying.remaining_balance}
                required
                value={payment.amount}
                onChange={(e) => setPayment((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </label>
            <label>
              Mode
              <select
                value={payment.payment_mode}
                onChange={(e) => setPayment((prev) => ({ ...prev, payment_mode: e.target.value }))}
              >
                <option>CHEQUE</option>
                <option>ONLINE_TRANSFER</option>
                <option>COUNTER_CASH</option>
                <option>CASH_FROM_AFTAB</option>
                <option>OTHER</option>
              </select>
            </label>
            <label>
              Reference / Cheque No.
              <input
                value={payment.reference_no}
                onChange={(e) => setPayment((prev) => ({ ...prev, reference_no: e.target.value }))}
              />
            </label>
            <label>
              Remarks
              <textarea
                value={payment.remarks}
                onChange={(e) => setPayment((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </label>
            <button className="primary">Save Payment</button>
            <button type="button" onClick={() => setPaying(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {confirming && (
        <div className="overlay">
          <div className="modal">
            <h2>Confirm deletion</h2>
            <p>
              Are you sure you want to delete {confirming.label}? This will update the MySQL database.
            </p>
            <button
              className="danger"
              onClick={async () => {
                try {
                  if (confirming.kind === 'bill') {
                    await api.bills.delete(confirming.id);
                  } else {
                    await api.payments.delete(confirming.id);
                  }
                } catch (delErr) {
                  if (window.supplierAPI) {
                    confirming.kind === 'bill'
                      ? await window.supplierAPI.deleteBill(confirming.id)
                      : await window.supplierAPI.deletePayment(confirming.id);
                  } else {
                    alert(delErr.message);
                  }
                }
                setConfirming(null);
                await load();
              }}
            >
              Yes, delete
            </button>
            <button onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
