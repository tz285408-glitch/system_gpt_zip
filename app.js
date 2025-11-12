/* js/app.js - منطق النظام (LocalStorage) */
const DB = {
  useFirebase: false,
  async init(){
    if(!localStorage.getItem('nextIds')){
      localStorage.setItem('nextIds', JSON.stringify({
        item:1,supplier:1,customer:1,treasury:1,purchase:1,sale:1,pr:1,sr:1,journal:1
      }));
    }
  },
  _get(key,def=[]){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch(e){ return def; } },
  _set(key,val){ localStorage.setItem(key, JSON.stringify(val)); },
  getItems(){ return this._get('items',[]); },
  saveItems(items){ this._set('items', items); },
  getSuppliers(){ return this._get('suppliers',[]); },
  saveSuppliers(s){ this._set('suppliers', s); },
  getCustomers(){ return this._get('customers',[]); },
  saveCustomers(c){ this._set('customers', c); },
  getTreasury(){ return this._get('treasury',[]); },
  saveTreasury(t){ this._set('treasury', t); },
  getPurchases(){ return this._get('purchases',[]); },
  savePurchases(p){ this._set('purchases', p); },
  getPurchaseReturns(){ return this._get('purchaseReturns',[]); },
  savePurchaseReturns(r){ this._set('purchaseReturns', r); },
  getSales(){ return this._get('sales',[]); },
  saveSales(s){ this._set('sales', s); },
  getSalesReturns(){ return this._get('salesReturns',[]); },
  saveSalesReturns(r){ this._set('salesReturns', r); },
  getJournal(){ return this._get('journal',[]); },
  saveJournal(j){ this._set('journal', j); },
  getNextId(type){
    const nxt = this._get('nextIds', {item:1,supplier:1,customer:1,treasury:1,purchase:1,sale:1,pr:1,sr:1,journal:1});
    const id = nxt[type]||1; nxt[type]=id+1; this._set('nextIds', nxt); return id;
  }
};

function nowISO(){ return new Date().toISOString(); }
function nowHuman(){ const d=new Date(); return {date:d.toLocaleDateString(), time:d.toLocaleTimeString(), iso: d.toISOString()}; }

async function initApp(){
  await DB.init();
  const cname = localStorage.getItem('companyName'); if(cname) {
    const span = document.querySelector('.logo span');
    if(span) span.textContent = cname;
  }
  const clogo = localStorage.getItem('companyLogo'); if(clogo){
    const img = document.querySelector('.logo img');
    if(img) img.src = clogo;
  }
  populateAllSelects();
}

/* Items */
function addItemApp(name, unit, buy, sell){
  if(!name) return {ok:false, msg:'اسم الصنف مطلوب'};
  const items = DB.getItems();
  const id = DB.getNextId('item');
  const rec = {id, name, unit, buy: Number(buy||0), sell: Number(sell||0), qty:0, createdAt: nowISO()};
  items.push(rec); DB.saveItems(items); populateAllSelects(); return {ok:true, rec};
}
function updateItemApp(id, fields){
  const items = DB.getItems(); const idx = items.findIndex(x=>x.id==id); if(idx<0) return false;
  items[idx] = {...items[idx], ...fields}; DB.saveItems(items); populateAllSelects(); return true;
}
function deleteItemApp(id){
  let items = DB.getItems(); items = items.filter(x=>x.id!=id); DB.saveItems(items); populateAllSelects();
}

/* Suppliers */
function addSupplierApp(name, phone, address){
  const suppliers = DB.getSuppliers(); const id = DB.getNextId('supplier'); const rec = {id,name,phone,address,createdAt:nowISO()}; suppliers.push(rec); DB.saveSuppliers(suppliers); return rec;
}
function updateSupplierApp(id, fields){ const s=DB.getSuppliers(); const i=s.findIndex(x=>x.id==id); if(i<0) return false; s[i]={...s[i],...fields}; DB.saveSuppliers(s); return true; }
function deleteSupplierApp(id){ let s=DB.getSuppliers(); s=s.filter(x=>x.id!=id); DB.saveSuppliers(s); }

/* Customers */
function addCustomerApp(name, phone, address){
  const arr = DB.getCustomers(); const id=DB.getNextId('customer'); const rec={id,name,phone,address,createdAt:nowISO()}; arr.push(rec); DB.saveCustomers(arr); return rec;
}
function updateCustomerApp(id, fields){ const a=DB.getCustomers(); const i=a.findIndex(x=>x.id==id); if(i<0) return false; a[i]={...a[i],...fields}; DB.saveCustomers(a); return true; }
function deleteCustomerApp(id){ let a=DB.getCustomers(); a=a.filter(x=>x.id!=id); DB.saveCustomers(a); }

/* Treasury */
function addTreasuryApp(name, type='cash'){ const arr=DB.getTreasury(); const id=DB.getNextId('treasury'); const rec={id,name,type,balance:0,createdAt:nowISO()}; arr.push(rec); DB.saveTreasury(arr); return rec; }
function updateTreasuryApp(id,fields){ const a=DB.getTreasury(); const i=a.findIndex(x=>x.id==id); if(i<0) return false; a[i]={...a[i],...fields}; DB.saveTreasury(a); return true; }

/* Purchases / Sales */
function savePurchaseInvoice({payType='نقد', supplierId=null, lines=[], discount=0, tax=0, shipping=0}){
  if(!lines || !lines.length) return {ok:false, msg:'لا توجد أصناف'};
  const id = DB.getNextId('purchase');
  const {date,time,iso}=nowHuman();
  const subtotal = lines.reduce((s,l)=>s + (l.qty*l.price),0);
  const net = subtotal - Number(discount||0) + Number(tax||0) + Number(shipping||0);
  const rec = {id, invoiceNo:id, type:'purchase', payType, supplierId, lines, subtotal, discount:Number(discount||0), tax:Number(tax||0), shipping:Number(shipping||0), net, date, time, savedAt:iso};
  const arr = DB.getPurchases(); arr.push(rec); DB.savePurchases(arr);
  const items = DB.getItems();
  for(const l of lines){ if(l.itemId){ const it = items.find(x=>x.id==l.itemId); if(it) it.qty = (Number(it.qty)||0) + Number(l.qty||0); } }
  DB.saveItems(items);
  return {ok:true, rec};
}
function savePurchaseReturn({lines=[]}){
  const id=DB.getNextId('pr'); const {date,time,iso}=nowHuman(); const subtotal = lines.reduce((s,l)=>s + (l.qty*l.price),0);
  const rec={id,invoiceNo:id,type:'purchaseReturn',lines,subtotal,date,time,savedAt:iso};
  const arr=DB.getPurchaseReturns(); arr.push(rec); DB.savePurchaseReturns(arr);
  const items=DB.getItems();
  for(const l of lines){ if(l.itemId){ const it=items.find(x=>x.id==l.itemId); if(it) it.qty = (Number(it.qty)||0) - Number(l.qty||0); } }
  DB.saveItems(items); return rec;
}
function saveSalesInvoice({payType='نقد', customerId=null, lines=[], discount=0, tax=0, shipping=0}){
  if(!lines || !lines.length) return {ok:false, msg:'لا توجد أصناف'};
  const id = DB.getNextId('sale');
  const {date,time,iso}=nowHuman();
  const subtotal = lines.reduce((s,l)=>s + (l.qty*l.price),0);
  const items = DB.getItems(); let cogs=0;
  for(const l of lines){ if(l.itemId){ const it=items.find(x=>x.id==l.itemId); if(it) cogs += Number(it.buy||0) * Number(l.qty||0); } }
  const net = subtotal - Number(discount||0) + Number(tax||0) + Number(shipping||0);
  const rec = {id,invoiceNo:id,type:'sale', payType, customerId, lines, subtotal, discount:Number(discount||0), tax:Number(tax||0), shipping:Number(shipping||0), net, cogs, date, time, savedAt:iso};
  const arr = DB.getSales(); arr.push(rec); DB.saveSales(arr);
  for(const l of lines){ if(l.itemId){ const it = items.find(x=>x.id==l.itemId); if(it) it.qty = (Number(it.qty)||0) - Number(l.qty||0); } }
  DB.saveItems(items);
  return {ok:true, rec};
}
function saveSalesReturn({lines=[]}){
  const id = DB.getNextId('sr'); const {date,time,iso}=nowHuman(); const subtotal = lines.reduce((s,l)=>s + (l.qty*l.price),0);
  const rec={id,invoiceNo:id,type:'salesReturn',lines,subtotal,date,time,savedAt:iso};
  const arr=DB.getSalesReturns(); arr.push(rec); DB.saveSalesReturns(arr);
  const items=DB.getItems();
  for(const l of lines){ if(l.itemId){ const it=items.find(x=>x.id==l.itemId); if(it) it.qty = (Number(it.qty)||0) + Number(l.qty||0); } }
  DB.saveItems(items); return rec;
}

/* Journal */
function saveJournalEntry({entries=[], description=''}){
  if(!entries||!entries.length) return {ok:false,msg:'لا قيود'};
  const id = DB.getNextId('journal'); const {date,time,iso}=nowHuman();
  const rec = {id, entries, description, date, time, savedAt:iso};
  const arr=DB.getJournal(); arr.push(rec); DB.saveJournal(arr); return {ok:true, rec};
}

/* Reports */
function computeAccountStatement(){
  const accounts = {};
  function ensure(name){ if(!accounts[name]) accounts[name]={debit:0,credit:0}; }
  for(const p of DB.getPurchases()){
    ensure('المشتريات'); accounts['المشتريات'].debit += p.net;
    const creditor = p.payType==='آجل' ? ('المورد_'+(p.supplierId||'')) : 'الصندوق';
    ensure(creditor); accounts[creditor].credit += p.net;
  }
  for(const r of DB.getPurchaseReturns()){
    ensure('مردود_مشتريات'); accounts['مردود_مشتريات'].credit += r.subtotal;
  }
  for(const s of DB.getSales()){
    ensure('المبيعات'); accounts['المبيعات'].credit += s.net;
    const debtor = s.payType==='آجل' ? ('العميل_'+(s.customerId||'')) : 'الصندوق';
    ensure(debtor); accounts[debtor].debit += s.net;
    ensure('تكلفة_المبيعات'); accounts['تكلفة_المبيعات'].debit += s.cogs||0;
    ensure('المخزون'); accounts['المخزون'].credit += s.cogs||0;
  }
  for(const r of DB.getSalesReturns()){
    ensure('مردود_مبيعات'); accounts['مردود_مبيعات'].debit += r.subtotal;
  }
  for(const j of DB.getJournal()){
    for(const e of j.entries){
      ensure(e.fromAccount); ensure(e.toAccount);
      accounts[e.fromAccount].debit += Number(e.amount||0);
      accounts[e.toAccount].credit += Number(e.amount||0);
    }
  }
  for(const k of Object.keys(accounts)){
    const a = accounts[k];
    const bal = Number(a.debit || 0) - Number(a.credit || 0);
    a.balance = Math.abs(bal);
    a.status = bal>0 ? 'له' : (bal<0 ? 'عليه' : 'متوازن');
  }
  return accounts;
}

function computeTrialBalance(){
  const purchasesTotal = DB.getPurchases().reduce((s,p)=>s + (p.net||0),0);
  const salesTotal = DB.getSales().reduce((s,p)=>s + (p.net||0),0);
  const prTotal = DB.getPurchaseReturns().reduce((s,p)=>s + (p.subtotal||0),0);
  const srTotal = DB.getSalesReturns().reduce((s,p)=>s + (p.subtotal||0),0);
  const cogs = DB.getSales().reduce((s,inv)=>s + (inv.cogs||0),0);
  const grossProfit = salesTotal - cogs;
  return {purchasesTotal, salesTotal, prTotal, srTotal, cogs, grossProfit};
}

function populateAllSelects(){
  const items = DB.getItems();
  const itemSelectIds = ['purchaseItemSelect','salesItemSelect','invoiceItemSelect','prItemSelect','srItemSelect'];
  itemSelectIds.forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    el.innerHTML=''; items.forEach(it=>{
      const o=document.createElement('option'); o.value=it.id; o.text=`${it.id} - ${it.name}`; el.appendChild(o);
    });
  });
  const suppliers = DB.getSuppliers(); const supEl=document.getElementById('selectSupplier'); if(supEl){ supEl.innerHTML=''; suppliers.forEach(s=>{ const o=document.createElement('option'); o.value=s.id; o.text=`${s.id} - ${s.name}`; supEl.appendChild(o); });}
  const customers = DB.getCustomers(); const cusEl=document.getElementById('selectCustomer'); if(cusEl){ cusEl.innerHTML=''; customers.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.text=`${c.id} - ${c.name}`; cusEl.appendChild(o); });}
  const treasury = DB.getTreasury(); const trEl=document.getElementById('selectTreasury'); if(trEl){ trEl.innerHTML=''; treasury.forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.text=`${t.id} - ${t.name}`; trEl.appendChild(o); });}
}

window.App = {
  initApp, DB,
  addItemApp, updateItemApp, deleteItemApp,
  addSupplierApp, updateSupplierApp, deleteSupplierApp,
  addCustomerApp, updateCustomerApp, deleteCustomerApp,
  addTreasuryApp, updateTreasuryApp,
  savePurchaseInvoice, savePurchaseReturn, saveSalesInvoice, saveSalesReturn,
  saveJournalEntry,
  computeAccountStatement, computeTrialBalance,
  populateAllSelects
};

initApp();
