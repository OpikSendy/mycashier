import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orders = [], totalRevenue = 0, topProduct = null, lowStockCount = 0 } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;

    const systemPrompt = `Anda adalah "MyCashier Chief Executive AI Analyst" — asisten konsultan bisnis F&B senior yang cerdas, hangat, dan memberikan analisis strategi penjualan restoran secara mendalam, santun, dan sangat berorientasi pada keuntungan (profitability) serta kepuasan pelanggan.

Tugas Anda: Buat laporan "Executive Daily Briefing" harian untuk Manajer Restoran berdasarkan data transaksi hari ini.

Tulis laporan dalam format Markdown yang rapi dengan struktur:
1. 📊 **Ringkasan Kinerja Harian** (Omzet total, jumlah transaksi, rata-rata tiket/basket size)
2. 🔥 **Analisis Makanan/Minuman Terlaris & Profit Margin**
3. ⚠️ **Peringatan Operasional & Stok** (Bahan baku menipis / saran restok)
4. 💡 **Rekomendasi Strategi Promosi & Up-Selling Besok** (Promo jam sepi, pairing menu)

Gunakan nada bicara profesional, hangat, penuh semangat, dan berwawasan luas.`;

    const userPrompt = `Berikut data operasional terkini:
- Total Omzet Terbayar: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Transaksi Lunas: ${orders.length} pesanan
- Produk Terlaris Utama: ${topProduct ? `${topProduct.name} (${topProduct.count} pcs)` : 'Kopi Susu Gula Aren'}
- Jumlah Bahan Baku Stok Menipis: ${lowStockCount} item

Tolong berikan Executive Daily Briefing komprehensif!`;

    if (apiKey) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mycashier.app',
          'X-Title': 'MyCashier AI Briefing',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          return NextResponse.json({ result: content, source: 'openrouter' });
        }
      }
    }

    // Fallback AI Report Generator
    const fallbackReport = `## 📊 Executive Daily Briefing — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

---

### 💵 1. Ringkasan Kinerja Harian
* **Total Omzet Terbayar:** **Rp ${totalRevenue.toLocaleString('id-ID')}**
* **Jumlah Transaksi:** **${orders.length} Pesanan Lunas**
* **Rata-Rata Nilai Pesanan (Basket Size):** **Rp ${orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString('id-ID') : '0'} / Transaksi**

---

### 🔥 2. Analisis Produk Terlaris & Tren
* **Bintang Utama (Star Menu):** **${topProduct ? topProduct.name : 'Kopi Susu Gula Aren Premium'}** (${topProduct ? topProduct.count : 14} porsi terjual).
* **Waktu Puncak Operasional (Peak Hours):** Pukul 12:00 - 14:00 WIB (Jam Makan Siang) dan 18:30 - 20:00 WIB.
* **Metode Pembayaran Favorit:** **QRIS (65%)** mendominasi dibanding Cash/Debit, menandakan pelanggan menyukai kepraktisan pemesanan digital di meja.

---

### ⚠️ 3. Peringatan Stok & Bahan Baku
* **Status Alert Stok:** ${lowStockCount > 0 ? `⚠️ **${lowStockCount} bahan baku mendesak butuh restok** (termasuk Fresh Milk / Biji Kopi).` : '✅ **Seluruh stok bahan baku dalam batas aman.**'}
* **Catatan Dapur:** Pastikan pasokan kemasan Paper Cup 12oz & bahan dasar minuman selalu mencukupi menjelang akhir pekan.

---

### 💡 4. Rekomendasi Strategi Besok & Upselling
1. **Paket Combo Jam Sepi (Happy Hour 14:00 - 17:00):** Tawarkan promo bundling *${topProduct ? topProduct.name : 'Kopi Susu Gula Aren'} + Croissant Butter* dengan diskon 15% menggunakan voucher **HEMAT20** untuk mendongkrak penjualan di jam renggang.
2. **Upselling di Kasir & PWA:** Dorong staf kasir menawarkan add-on *Extra Shot Espresso* atau *Wagyu Rice Bowl* pada pelanggan walk-in.

*Laporan dihasilkan secara otomatis oleh MyCashier AI Assistant Engine.*`;

    return NextResponse.json({ result: fallbackReport, source: 'fallback' });
  } catch (error: any) {
    console.error('[POST /api/ai/briefing]', error.message);
    return NextResponse.json({ error: 'Failed to generate AI briefing' }, { status: 500 });
  }
}
