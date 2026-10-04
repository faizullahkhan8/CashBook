import React,{useEffect,useMemo,useState}from'react';
import Sidebar from './components/Sidebar';
import SummaryView from './views/SummaryView';
import AddBillView from './views/AddBillView';
import AllBillsView from './views/AllBillsView';

const today=()=>new Date().toISOString().slice(0,10);const money=v=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
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
const tabs = [{ id: 'summary', label: 'Summary' }, { id: 'bills', label: 'Add Bill(s)' }, { id: 'all', label: 'All Bills' }];

export default function App() {
  const [items, setItems] = useState([]),
    [form, setForm] = useState(blank()),
    [paying, setPaying] = useState(null),
    [confirming, setConfirming] = useState(null),
    [payment, setPayment] = useState({ payment_date: today(), amount: '', payment_mode: 'CHEQUE', reference_no: '', remarks: '' }),
    [from, setFrom] = useState(`${today().slice(0, 8)}01`),
    [to, setTo] = useState(today()),
    [search, setSearch] = useState(''),
    [activeTab, setActiveTab] = useState('summary');

  const load = async () => setItems(await window.supplierAPI.list({ from, to }));
  useEffect(() => { load(); }, [from, to]);

  const totals = useMemo(() => items.reduce((s, b) => ({
    gross: s.gross + b.total_bill_amount,
    tax: s.tax + b.tax_amount,
    actual: s.actual + (b.category === 'PAYABLE' ? b.actual_amount : 0),
    paid: s.paid + b.paid_amount,
    balance: s.balance + b.remaining_balance,
  }), { gross: 0, tax: 0, actual: 0, paid: 0, balance: 0 }), [items]);

  const visible = items.filter((x) => `${x.supplier_name} ${x.supplier_bill_no} ${x.voucher_no}`.toLowerCase().includes(search.toLowerCase()));
  const suppliers = useMemo(() => Array.from(new Set(items.map((x) => x.supplier_name).filter(Boolean))).sort(), [items]);

  async function save(e) {
    e.preventDefault();
    const saved = await window.supplierAPI.saveBill(form);

    // If immediate payment was checked and has an amount, record payment transaction
    if (form.record_payment && Number(form.payment_amount) > 0 && saved?.sync_id) {
      await window.supplierAPI.addPayment({
        bill_sync_id: saved.sync_id,
        payment_date: form.payment_date || form.posting_date || today(),
        amount: Number(form.payment_amount),
        payment_mode: form.payment_mode || 'COUNTER_CASH',
        reference_no: form.payment_reference_no || '',
        remarks: form.payment_remarks || (form.remarks ? `Paid with bill: ${form.remarks}` : 'Payment recorded on bill entry'),
      });
    }

    setForm(blank());
    setActiveTab('all');
    load();
  }

  async function pay(e) {
    e.preventDefault();
    await window.supplierAPI.addPayment({ ...payment, bill_sync_id: paying.sync_id });
    setPaying(null);
    setPayment({ payment_date: today(), amount: '', payment_mode: 'CHEQUE', reference_no: '', remarks: '' });
    load();
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
    scrollTo(0, 0);
  }

  function onDeleteBill(record, kind = 'bill') {
    setConfirming({ kind, id: record.sync_id, label: kind === 'payment' ? 'this payment' : `bill ${record.supplier_bill_no}` });
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
        return <AllBillsView visible={visible} search={search} setSearch={setSearch} from={from} setFrom={setFrom} to={to} setTo={setTo} onEdit={onEditBill} onPay={setPaying} onDelete={onDeleteBill} />;
      default:
        return <SummaryView totals={totals} items={items} />;
    }
  }

 return <div className="app-shell"><Sidebar tabs={tabs} activeTab={activeTab} onChange={setActiveTab}/><div className="content-shell"><header><div><small>ZADA PHARMACY</small><h1>Supplier Reconciliation</h1><p>Bills, payments and outstanding balances</p></div><div className="live">● LIVE SYNC</div></header>{renderTab()}</div>
 {paying&&<div className="overlay"><form className="modal" onSubmit={pay}><h2>Record Payment</h2><p>{paying.supplier_name} · Balance Rs {money(paying.remaining_balance)}</p><label>Payment Date<input type="date" value={payment.payment_date} onChange={e=>setPayment(prev=>({...prev,payment_date:e.target.value}))}/></label><label>Amount<input type="number" max={paying.remaining_balance} required value={payment.amount} onChange={e=>setPayment(prev=>({...prev,amount:e.target.value}))}/></label><label>Mode<select value={payment.payment_mode} onChange={e=>setPayment(prev=>({...prev,payment_mode:e.target.value}))}><option>CHEQUE</option><option>ONLINE_TRANSFER</option><option>COUNTER_CASH</option><option>CASH_FROM_AFTAB</option><option>OTHER</option></select></label><label>Reference / Cheque No.<input value={payment.reference_no} onChange={e=>setPayment(prev=>({...prev,reference_no:e.target.value}))}/></label><label>Remarks<textarea value={payment.remarks} onChange={e=>setPayment(prev=>({...prev,remarks:e.target.value}))}/></label><button className="primary">Save Payment</button><button type="button" onClick={()=>setPaying(null)}>Cancel</button></form></div>}
 {confirming&&<div className="overlay"><div className="modal"><h2>Confirm deletion</h2><p>Are you sure you want to delete {confirming.label}? This change will also sync to the CEO server.</p><button className="danger" onClick={async()=>{confirming.kind==='bill'?await window.supplierAPI.deleteBill(confirming.id):await window.supplierAPI.deletePayment(confirming.id);setConfirming(null);load()}}>Yes, delete</button><button onClick={()=>setConfirming(null)}>Cancel</button></div></div>}</div>}
