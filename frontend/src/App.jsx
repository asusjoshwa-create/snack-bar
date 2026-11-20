import { useEffect, useState } from 'react'

const api = async (url, method = 'GET', data) => {
  const r = await fetch('/api' + url, { method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Something went wrong')
  return j
}
const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN')

function Photo({ item, className = '' }) {
  const [bad, setBad] = useState(false)
  return bad
    ? <div className={`flex items-center justify-center bg-coal text-6xl ${className}`}>{item.emoji}</div>
    : <img src={item.image} alt={item.name} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />
}

export default function App() {
  const [menu, setMenu] = useState([])
  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '{}'))
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('home')
  const [modal, setModal] = useState(null) // 'auth' | 'cart' | 'checkout'
  const [toast, setToast] = useState(null)
  const [showTop, setShowTop] = useState(false)

  const notify = (msg, kind = 'ok') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    api('/menu/').then((d) => setMenu(d.categories)).catch(() => notify('Could not load the menu. Is the Django server running?', 'bad'))
    api('/me/').then((d) => setUser(d.user))
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart])

  const all = menu.flatMap((c) => c.items)
  const lines = Object.entries(cart).map(([id, qty]) => ({ item: all.find((i) => i.id == id), qty })).filter((l) => l.item)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0)
  const change = (id, d) => setCart((c) => { const n = { ...c, [id]: (c[id] || 0) + d }; if (n[id] <= 0) delete n[id]; return n })

  const goto = (sec) => { setPage('home'); setTimeout(() => document.getElementById(sec)?.scrollIntoView({ behavior: 'smooth' }), 50) }
  const logout = async () => { await api('/logout/', 'POST'); setUser(null); setPage('home'); notify('You have been logged out.') }
  const startCheckout = () => user ? setModal('checkout') : (notify('Log in to place your order.', 'bad'), setModal('auth'))

  const visible = (menu[tab]?.items || []).filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      {/* NAVBAR */}
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-start justify-between">
          <button onClick={() => goto('home')} className="bg-white text-ink w-20 md:w-24 h-24 md:h-28 flex flex-col items-center justify-center">
            <span className="text-3xl">🍽️</span>
            <span className="font-display font-bold text-sm leading-none mt-1">SNACK<span className="text-ember">&</span>BAR</span>
          </button>
          <nav className="flex items-center gap-4 md:gap-7 pt-8 font-display text-xs md:text-sm tracking-wider">
            {[['Home', 'home'], ['Menu', 'menu'], ['About', 'about'], ['Contact', 'contact']].map(([l, s]) => (
              <button key={s} onClick={() => goto(s)} className="hidden sm:block hover:text-ember">{l.toUpperCase()}</button>))}
            {user?.is_seller && <button onClick={() => setPage('seller')} className="hover:text-ember">DASHBOARD</button>}
            {user && <button onClick={() => setPage('orders')} className="hover:text-ember">MY ORDERS</button>}
            <button onClick={() => setModal('cart')} className="relative hover:text-ember">CART
              {count > 0 && <span className="absolute -top-3 -right-4 bg-ember text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center">{count}</span>}
            </button>
            {user ? <button onClick={logout} className="btn !py-1">LOG OUT</button>
                  : <button onClick={() => setModal('auth')} className="btn !py-1">LOGIN</button>}
          </nav>
        </div>
      </header>

      {page === 'seller' && <Seller notify={notify} />}
      {page === 'orders' && <MyOrders />}
      {page === 'home' && (<>
        {/* HERO */}
        <section id="home" className="relative min-h-screen flex items-center justify-center text-center px-4 overflow-hidden"
          style={{ background: "linear-gradient(rgba(13,11,10,.55),rgba(13,11,10,.85)), url('/images/hero.jpg') center/cover, radial-gradient(circle at 70% 40%, #5a2a12, #0d0b0a 70%)" }}>
          <div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="h-px w-24 md:w-40 bg-ember" /><span className="text-ember text-2xl">🍴</span><span className="h-px w-24 md:w-40 bg-ember" />
            </div>
            <h1 className="font-display font-extralight text-6xl md:text-8xl leading-[1.05]">BETTER SNACKS,<br />BETTER MOOD</h1>
            <p className="mt-6 max-w-xl mx-auto text-sm text-paper/80 leading-7">Pizzas, burgers, puffs and momos hot from the kitchen, with shakes, tea and cakes to match. Fresh in Sivakasi, every day.</p>
            <button onClick={() => goto('menu')} className="btn mt-8">ORDER NOW</button>
          </div>
        </section>

        {/* MENU */}
        <section id="menu" className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="font-display font-extralight text-5xl text-center">Our Menu</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {menu.map((c, i) => (
              <button key={c.name} onClick={() => setTab(i)}
                className={`font-display tracking-wider px-4 py-1.5 border ${tab === i ? 'bg-ember border-ember' : 'border-white/20 hover:border-ember'}`}>{c.name}</button>))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this section" className="field max-w-xs mx-auto block mt-5" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-10">
            {visible.map((i) => (
              <article key={i.id} className="bg-coal border border-white/10 flex flex-col">
                <Photo item={i} className="h-36 md:h-44 w-full" />
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-lg leading-tight">{i.name}</h3>
                  <p className="text-ember font-display text-lg">{rupee(i.price)}</p>
                  <div className="mt-auto pt-3">
                    {cart[i.id] ? (
                      <div className="flex items-center justify-between border border-ember">
                        <button className="px-3 py-1 hover:bg-ember" onClick={() => change(i.id, -1)}>−</button>
                        <span>{cart[i.id]}</span>
                        <button className="px-3 py-1 hover:bg-ember" onClick={() => change(i.id, 1)}>+</button>
                      </div>
                    ) : <button className="btn w-full" onClick={() => { change(i.id, 1); notify(`${i.name} added to cart`) }}>ADD TO CART</button>}
                  </div>
                </div>
              </article>))}
            {!visible.length && <p className="col-span-full text-center text-paper/60">Nothing matches that search. Try another name.</p>}
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="bg-coal py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extralight text-5xl">About Snack Bar</h2>
            <p className="mt-6 leading-8 text-paper/80">Snack Bar is a neighbourhood snack and juice counter in Sivakasi. We bake our puffs and cakes each morning, fry cutlets and momos to order, and brew tea and filter coffee all day. Order online and we deliver to your door.</p>
          </div>
        </section>
      </>)}

      {/* FOOTER */}
      <footer id="contact" className="border-t border-ember/40 px-4 py-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-sm leading-7">
          <div><h4 className="font-display font-bold text-xl mb-2">Snack Bar</h4><p className="text-paper/70">Fresh snacks, juices, hot drinks and cakes, made in Sivakasi since 2020.</p></div>
          <div><h4 className="font-display font-bold text-xl mb-2">Contact</h4>
            <p className="text-paper/70">📞 +91 98765 43210<br />✉️ hello@snackbar.example<br />Open daily, 9 AM to 10 PM</p></div>
          <div><h4 className="font-display font-bold text-xl mb-2">Address</h4>
            <p className="text-paper/70">Snack Bar, 42 Sattur Road,<br />Near Bus Stand, Sivakasi,<br />Tamil Nadu 626123</p></div>
        </div>
        <p className="text-center text-xs text-paper/40 mt-10">© 2026 Snack Bar. All rights reserved.</p>
      </footer>

      {showTop && <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-ember text-white text-2xl hover:bg-orange-600">↑</button>}

      {toast && <div role="status" className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 shadow-xl text-sm text-white ${toast.kind === 'bad' ? 'bg-red-700' : 'bg-emerald-700'}`}>{toast.msg}</div>}

      {modal === 'auth' && <Auth close={() => setModal(null)} onUser={(u, msg) => { setUser(u); setModal(null); notify(msg) }} />}
      {modal === 'cart' && <Cart lines={lines} total={total} change={change} close={() => setModal(null)} checkout={() => { setModal(null); startCheckout() }} />}
      {modal === 'checkout' && <Checkout user={user} lines={lines} total={total} close={() => setModal(null)}
        done={(o) => { setCart({}); setModal(null); setPage('orders'); window.scrollTo(0, 0); notify(`Order #${o.id} placed. Thank you!`) }} notify={notify} />}
    </div>
  )
}

function Overlay({ children, close, side }) {
  return (
    <div className={`fixed inset-0 z-50 bg-black/70 flex ${side ? 'justify-end' : 'items-center justify-center'} p-0 md:p-4`} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className={`bg-ink border border-white/15 overflow-y-auto max-h-screen ${side ? 'w-full max-w-md h-full' : 'w-full max-w-md'}`}>{children}</div>
    </div>)
}

function Auth({ close, onUser }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { const d = await api(mode === 'login' ? '/login/' : '/register/', 'POST', f)
      onUser(d.user, mode === 'login' ? `Welcome back, ${d.user.name}! You are logged in.` : `Account created. Welcome, ${d.user.name}!`)
    } catch (x) { setError(x.message) }
  }
  return (
    <Overlay close={close}>
      <form onSubmit={submit} className="p-7 space-y-4">
        <div className="flex justify-between items-center"><h3 className="font-display font-extralight text-4xl">{mode === 'login' ? 'Log in' : 'Create account'}</h3>
          <button type="button" onClick={close} aria-label="Close">✕</button></div>
        {mode === 'register' && <input className="field" placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input className="field" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className="field" type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn btn-solid w-full">{mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}</button>
        <p className="text-sm text-paper/70 text-center">{mode === 'login' ? 'New here? ' : 'Already registered? '}
          <button type="button" className="text-ember underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
      </form>
    </Overlay>)
}

function Cart({ lines, total, change, close, checkout }) {
  return (
    <Overlay close={close} side>
      <div className="p-6 flex flex-col min-h-full">
        <div className="flex justify-between items-center"><h3 className="font-display font-extralight text-4xl">Your cart</h3><button onClick={close} aria-label="Close">✕</button></div>
        {!lines.length ? <p className="mt-10 text-paper/60">Your cart is empty. Pick something from the menu.</p> : (<>
          <ul className="mt-6 divide-y divide-white/10 flex-1">
            {lines.map(({ item, qty }) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <Photo item={item} className="w-14 h-14 !text-2xl" />
                <div className="flex-1"><p className="font-display font-bold">{item.name}</p><p className="text-sm text-paper/60">{rupee(item.price)}</p></div>
                <div className="flex items-center border border-ember"><button className="px-2" onClick={() => change(item.id, -1)}>−</button><span className="px-2">{qty}</span><button className="px-2" onClick={() => change(item.id, 1)}>+</button></div>
              </li>))}
          </ul>
          <div className="pt-4 border-t border-white/20 flex justify-between font-display text-xl"><span>Total</span><span className="text-ember">{rupee(total)}</span></div>
          <button className="btn btn-solid mt-4" onClick={checkout}>CHECKOUT</button>
        </>)}
      </div>
    </Overlay>)
}

const PAYS = [['cod', 'Cash on Delivery'], ['gpay', 'Google Pay'], ['phonepe', 'PhonePe'], ['credit', 'Credit Card'], ['debit', 'Debit Card']]

function Checkout({ user, lines, total, close, done, notify }) {
  const [f, setF] = useState({ name: user.name, phone: '', address: '', payment_method: 'cod', upi: '', card: '', exp: '', cvv: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pm = f.payment_method
  const submit = async (e) => {
    e.preventDefault()
    if ((pm === 'gpay' || pm === 'phonepe') && !f.upi.includes('@')) return notify('Enter a valid UPI ID, like name@okbank.', 'bad')
    if ((pm === 'credit' || pm === 'debit') && (f.card.replace(/\s/g, '').length < 12 || !f.exp || f.cvv.length < 3)) return notify('Enter complete card details.', 'bad')
    setBusy(true)
    try { const d = await api('/orders/', 'POST', { name: f.name, phone: f.phone, address: f.address, payment_method: pm,
      items: lines.map((l) => ({ id: l.item.id, qty: l.qty })) }); done(d.order)
    } catch (x) { notify(x.message, 'bad'); setBusy(false) }
  }
  return (
    <Overlay close={close}>
      <form onSubmit={submit} className="p-7 space-y-3">
        <div className="flex justify-between items-center"><h3 className="font-display font-extralight text-4xl">Checkout</h3><button type="button" onClick={close} aria-label="Close">✕</button></div>
        <input className="field" placeholder="Name" value={f.name} onChange={set('name')} required />
        <input className="field" placeholder="Phone number" value={f.phone} onChange={set('phone')} pattern="[0-9+ ]{10,15}" required />
        <textarea className="field" rows="3" placeholder="Delivery address" value={f.address} onChange={set('address')} required />
        <fieldset className="space-y-1 pt-2"><legend className="font-display font-bold mb-1">Payment method</legend>
          {PAYS.map(([v, l]) => <label key={v} className="flex items-center gap-2 text-sm"><input type="radio" name="pay" checked={pm === v} onChange={() => setF({ ...f, payment_method: v })} className="accent-orange-600" />{l}</label>)}
        </fieldset>
        {(pm === 'gpay' || pm === 'phonepe') && <input className="field" placeholder="UPI ID (name@okbank)" value={f.upi} onChange={set('upi')} />}
        {(pm === 'credit' || pm === 'debit') && <div className="space-y-2">
          <input className="field" placeholder="Card number" inputMode="numeric" value={f.card} onChange={set('card')} />
          <div className="flex gap-2"><input className="field" placeholder="MM/YY" value={f.exp} onChange={set('exp')} /><input className="field" placeholder="CVV" type="password" maxLength="4" value={f.cvv} onChange={set('cvv')} /></div></div>}
        {pm !== 'cod' && <p className="text-xs text-paper/50">Demo payment: details are checked here but never sent or stored. Connect a gateway such as Razorpay for real payments.</p>}
        <button disabled={busy} className="btn btn-solid w-full">{busy ? 'PLACING ORDER…' : `PLACE ORDER · ${rupee(total)}`}</button>
      </form>
    </Overlay>)
}

function OrderLines({ items }) { return <span>{items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span> }

function MyOrders() {
  const [orders, setOrders] = useState(null)
  useEffect(() => { api('/my-orders/').then((d) => setOrders(d.orders)).catch(() => setOrders([])) }, [])
  return (
    <section className="max-w-4xl mx-auto px-4 pt-36 pb-20 min-h-screen">
      <h2 className="font-display font-extralight text-5xl">My orders</h2>
      {orders && !orders.length && <p className="mt-6 text-paper/60">You haven't ordered yet.</p>}
      <div className="mt-8 space-y-4">{orders?.map((o) => (
        <div key={o.id} className="bg-coal border border-white/10 p-4 text-sm">
          <div className="flex justify-between font-display text-lg"><span>Order #{o.id}</span><span className="text-ember">{o.status}</span></div>
          <p className="text-paper/70 mt-1"><OrderLines items={o.items} /></p>
          <p className="mt-2">{rupee(o.total)} · {o.payment_method} ({o.payment_status}) · {o.created_at}</p>
        </div>))}</div>
    </section>)
}

function Seller({ notify }) {
  const [data, setData] = useState(null)
  const load = () => api('/seller/orders/').then(setData).catch((e) => notify(e.message, 'bad'))
  useEffect(() => { load() }, [])
  const update = async (id, status) => { await api(`/seller/orders/${id}/status/`, 'POST', { status }); notify(`Order #${id} marked ${status}`); load() }
  if (!data) return <section className="pt-36 px-4 min-h-screen text-center">Loading orders…</section>
  const revenue = data.orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0)
  return (
    <section className="max-w-6xl mx-auto px-4 pt-36 pb-20 min-h-screen">
      <h2 className="font-display font-extralight text-5xl">Seller dashboard</h2>
      <div className="grid grid-cols-3 gap-4 mt-6 text-center">
        {[['Orders', data.orders.length], ['New', data.orders.filter((o) => o.status === 'Placed').length], ['Revenue', rupee(revenue)]].map(([l, v]) => (
          <div key={l} className="bg-coal border border-white/10 p-4"><p className="font-display text-3xl text-ember">{v}</p><p className="text-sm text-paper/60">{l}</p></div>))}
      </div>
      <div className="overflow-x-auto mt-8"><table className="w-full text-sm text-left">
        <thead className="font-display text-paper/60 border-b border-white/20"><tr>{['#', 'Customer', 'Phone / Email', 'Delivery address', 'Items', 'Total', 'Payment', 'Placed', 'Status'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
        <tbody>{data.orders.map((o) => (
          <tr key={o.id} className="border-b border-white/10 align-top">
            <td className="py-3 pr-3">{o.id}</td><td className="pr-3">{o.customer}</td>
            <td className="pr-3">{o.phone}<br /><span className="text-paper/60">{o.email}</span></td>
            <td className="pr-3 max-w-[200px]">{o.address}</td><td className="pr-3 max-w-[220px]"><OrderLines items={o.items} /></td>
            <td className="pr-3 text-ember">{rupee(o.total)}</td><td className="pr-3">{o.payment_method}<br /><span className="text-paper/60">{o.payment_status}</span></td>
            <td className="pr-3">{o.created_at}</td>
            <td><select className="field !w-auto" value={o.status} onChange={(e) => update(o.id, e.target.value)}>{data.statuses.map((s) => <option key={s}>{s}</option>)}</select></td>
          </tr>))}</tbody></table>
        {!data.orders.length && <p className="text-paper/60 mt-6">No orders yet.</p>}
      </div>
    </section>)
}
