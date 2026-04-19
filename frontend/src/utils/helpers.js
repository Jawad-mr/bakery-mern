export const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })

export const fmtDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts })

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

export const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`

export const today = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

// Export orders to CSV
export const exportCSV = (orders) => {
  const headers = ['Order ID','Customer','Phone','Items','Subtotal','GST','Total','Method','Date','Cashier']
  const rows = orders.map(o => [
    o.orderId,
    o.customer,
    o.phone || '',
    o.items.map(i => `${i.name}x${i.qty}`).join(' | '),
    o.subtotal,
    o.gstAmount,
    o.total,
    o.method,
    fmtDateTime(o.createdAt),
    o.cashierName || '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sweetcrumb-orders-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// WhatsApp receipt
export const whatsappReceipt = (order) => {
  const items = order.items.map(i => `  ${i.name} x${i.qty} — ${fmt(i.subtotal)}`).join('\n')
  const msg = encodeURIComponent(
    `🥐 *Sweet Crumb Bakery*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `*Order:* ${order.orderId}\n` +
    `*Date:* ${fmtDateTime(order.createdAt)}\n\n` +
    `*Items:*\n${items}\n\n` +
    `*Subtotal:* ${fmt(order.subtotal)}\n` +
    `*GST (5%):* ${fmt(order.gstAmount)}\n` +
    `*Total:* ${fmt(order.total)}\n` +
    `*Payment:* ${order.method}\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `Thank you for visiting Sweet Crumb! 🍞`
  )
  const phone = order.phone?.replace(/\D/g, '')
  window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${msg}`, '_blank')
}

// Print receipt
export const printReceipt = (order) => {
  const w = window.open('', '_blank', 'width=380,height=650')
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;padding:24px;max-width:320px;margin:auto}
  h2{text-align:center;font-size:20px}p.c{text-align:center}hr{border:none;border-top:1px dashed #999;margin:10px 0}
  .r{display:flex;justify-content:space-between;margin-bottom:3px}.b{font-weight:bold}.f{font-size:15px}</style></head><body>
  <h2>🥐 Sweet Crumb</h2><p class="c" style="font-size:11px;color:#666">Bakery & Patisserie</p>
  <hr/><div class="r"><span>${order.orderId}</span><span>${fmtDateTime(order.createdAt)}</span></div>
  <p>Customer: ${order.customer}</p>${order.phone ? `<p>Phone: ${order.phone}</p>` : ''}
  <p>Payment: ${order.method}</p><hr/>
  ${order.items.map(i => `<div class="r"><span>${i.name} ×${i.qty}</span><span>₹${i.subtotal.toLocaleString('en-IN')}</span></div>`).join('')}
  <hr/>
  <div class="r"><span>Subtotal</span><span>₹${order.subtotal.toLocaleString('en-IN')}</span></div>
  <div class="r"><span>GST (5%)</span><span>₹${order.gstAmount.toLocaleString('en-IN')}</span></div>
  <div class="r b f"><span>TOTAL</span><span>₹${order.total.toLocaleString('en-IN')}</span></div>
  <hr/><p class="c" style="font-size:11px;margin-top:10px">Thank you! Come back soon 🍞</p>
  <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
  w.document.close()
}
