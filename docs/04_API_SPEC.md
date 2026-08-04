# API Specifications — MyCashier

## 1. POST /api/orders
Mengirim pesanan meja baru dari pelanggan atau kasir.

### Request Body:
```json
{
  "tableNumber": "Meja 04",
  "customerName": "Sendy",
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "price": 28000,
      "notes": "Less Sugar"
    }
  ],
  "paymentMethod": "QRIS"
}
```

### Response (201 Created):
```json
{
  "success": true,
  "orderId": "ORD-88219",
  "status": "PENDING",
  "message": "Pesanan Meja 04 berhasil dibuat dan diteruskan ke Dapur!"
}
```

## 2. POST /api/chat
Menjawab pertanyaan manajemen & analitik bisnis resto via OpenRouter AI.

### Request Body:
```json
{
  "messages": [
    { "role": "user", "content": "Berapa total omzet hari ini dan menu apa yang paling laku?" }
  ]
}
```

### Response (200 OK):
```json
{
  "reply": "Omzet hari ini mencapai Rp 1.450.000 dengan total 28 transaksi. Menu terlaris adalah Kopi Susu Aren (14 porsi)."
}
```
