import { NextResponse } from 'next/server';

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  return { apiKey };
}

const CULINARY_KNOWLEDGE_PROMPT = `Anda adalah "Ask MyCashier AI", seorang Asisten Kuliner & Sommelier Interaktif profesional untuk restoran MyCashier.
Tugas utama Anda adalah menyapa pelanggan dengan ramah, menjelaskan secara detail RAHASIA PEMBUATAN (resep, bumbu, teknik masak), TEKNIK PENYAJIAN (plating, suhu, garnish), INFORMASI ALERGEN, serta REKOMENDASI PAIRING (paduan makanan & minuman terbaik) dari menu MyCashier berikut:

Daftar Menu Restoran MyCashier:
1. 🍲 **Nasi Goreng Wagyu Special (Rp 45.000)**
   - *Cara Pembuatan*: Beras pera super dimasak tumis wok hei suhu tinggi dengan bumbu rempah khas Nusantara, kecap manis kualitas super, dan irisan daging Wagyu A5 Australia meltique yang empuk dan juicy.
   - *Cara Penyajian*: Disajikan panas di piring keramik dengan telur mata sapi setengah matang, kerupuk udang renyah, irisan mentimun segar, tomat, dan acar cabai.
   - *Pairing Terbaik*: **Iced Lemon Tea Sparkle** untuk sensasi segar menetralisir rempah.

2. ☕ **Kopi Susu Gula Aren Premium (Rp 22.000)**
   - *Cara Pembuatan*: Double shot espresso dari racikan biji kopi Arabika Gayo & Robusta Dampit diekstrak 9 bar. Dicampur susu murni segar dingin dan sirup gula aren organik Sukabumi yang lezat.
   - *Cara Penyajian*: Disajikan dingin dalam gelas tinggi bening beres kristal dengan 3 lapisan warna estetik (gula aren pekat, susu murni, espresso mahoni).
   - *Pairing Terbaik*: **Croissant Butter Truffle** atau **Biscoff Lotus Cheese Cake**.

3. 🍵 **Matcha Cream Latté (Rp 28.000)**
   - *Cara Pembuatan*: Bubuk Matcha Uji kualitas ceremonial grade Kyoto dikocok bambu (chasen) 80°C hingga berbuih, dicampur Oatmilk gurih dan disiram foam krim vanilla lembut.
   - *Cara Penyajian*: Disajikan dalam gelas bulat dengan dusting bubuk matcha hijau segar di atas lapisan foam krim putih.
   - *Pairing Terbaik*: **Biscoff Lotus Cheese Cake**.

4. 🥩 **Beef Teriyaki Rice Bowl (Rp 38.000)**
   - *Cara Pembuatan*: Shortplate sapi impor USA irisan tipis dimarinasi saus Teriyaki manis gurih khas Tokyo (shoyu, mirin halal, jahe murni, wijen sangrai), ditumis cepat (searing) hingga caramelized.
   - *Cara Penyajian*: Disajikan di dalam rice bowl keramik di atas nasi hangat pulen, ditaburi wijen sangrai, daun bawang perai, dan edamame segar.
   - *Pairing Terbaik*: **Iced Lemon Tea Sparkle** atau **Kopi Susu Gula Aren**.

5. 🥐 **Croissant Butter Truffle (Rp 25.000)**
   - *Cara Pembuatan*: Pastry Prancis dengan 27 lapisan French AOP butter panggang keemasan renyah, diolesi truffle butter infusi minyak truffle hitam Italia.
   - *Cara Penyajian*: Disajikan hangat di atas piring kayu dengan serpihan garam laut Maldon dan aroma wangi truffle merekah.
   - *Pairing Terbaik*: **Kopi Susu Gula Aren Premium** atau **Matcha Cream Latté**.

6. 🍰 **Biscoff Lotus Cheese Cake (Rp 32.000)**
   - *Cara Pembuatan*: Cream cheese Philadelphia di-bake slow water-bath, berdasar crust biskuit Lotus Biscoff, dan dilumuri lelehan Biscoff spread cair serta remahan renyah.
   - *Cara Penyajian*: Disajikan dingin 4°C irisan segitiga estetik dengan drizzle saus Biscoff mengalir manis.
   - *Pairing Terbaik*: **Matcha Cream Latté** atau **Kopi Susu Gula Aren**.

7. 🍋 **Iced Lemon Tea Sparkle (Rp 18.000)**
   - *Cara Pembuatan*: Teh hitam seduh segar dikocok perasan buah lemon murni, sirup agave, es batu, dan topping sparkling soda menyegarkan.
   - *Cara Penyajian*: Disajikan dingin dengan garnish irisan lemon segar dan daun mint petikan.
   - *Pairing Terbaik*: **Nasi Goreng Wagyu** atau **Beef Teriyaki Rice Bowl**.

8. 🍟 **French Fries Truffle Oil (Rp 24.000)**
   - *Cara Pembuatan*: Kentang Shoestring Belgia digoreng double-fry renyah keemasan, dilumuri White Truffle Oil impor dan taburan keju Parmesan parut serta garam laut.
   - *Cara Penyajian*: Disajikan hangat dalam keranjang stainless dengan saus mayo garlic spesial.
   - *Pairing Terbaik*: **Iced Lemon Tea Sparkle**.

Jawablah setiap pertanyaan pengguna dengan gaya bahasa yang ramah, antusias, menggugah selera (*appetizing*), interaktif, menggunakan emoji yang pas, serta bahasa Indonesia yang sopan dan menyenangkan.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const client = getOpenRouterClient();
    const userMessage = messages[messages.length - 1]?.content || '';

    // If OpenRouter API Key is configured, use OpenRouter AI model
    if (client.apiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.apiKey}`,
            'HTTP-Referer': 'https://mycashier.app',
            'X-Title': 'MyCashier POS',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: CULINARY_KNOWLEDGE_PROMPT },
              ...messages,
            ],
          }),
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ reply });
        }
      } catch (e) {
        console.warn('OpenRouter API call failed, falling back to culinary smart engine:', e);
      }
    }

    // Interactive Fallback Culinary Engine (Instant response for local development)
    const reply = generateCulinaryReply(userMessage);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('MyCashier AI API Error:', error);
    return NextResponse.json({
      reply: 'Hai Kak! MyCashier AI siap bantu jelaskan resep rahasia, cara masak, atau rekomendasi pairing minuman favoritmu! 😋',
    });
  }
}

function generateCulinaryReply(input: string): string {
  const query = input.toLowerCase();

  if (query.includes('wagyu') || query.includes('nasi goreng')) {
    return `🍲 **Nasi Goreng Wagyu Special (Rp 45.000)**

🔥 **Cara Pembuatan**: 
Beras pera dimasak tumis wok hei suhu tinggi dengan racikan bumbu merah otentik, kecap super, dan potongan daging Wagyu A5 Australia meltique yang super lembut dan juicy!

🍽️ **Cara Penyajian**: 
Disajikan panas di piring keramik putih dengan telur mata sapi setengah matang, kerupuk udang renyah, mentimun segar, tomat, dan acar cabai.

🍹 **Rekomendasi Pairing**: 
Sangat pas dipadukan dengan **Iced Lemon Tea Sparkle** segar untuk menetralisir rasa gurih rempah Wagyu! 😋`;
  }

  if (query.includes('kopi') || query.includes('aren')) {
    return `☕ **Kopi Susu Gula Aren Premium (Rp 22.000)**

☕ **Cara Pembuatan**: 
Double shot espresso dari biji kopi Arabika Gayo & Robusta Dampit diekstrak tekanan 9 bar. Dicampur susu murni segar dingin dan sirup gula aren organik asli Sukabumi!

🍹 **Cara Penyajian**: 
Disajikan dingin dalam gelas bening beres batu kristal dengan 3 gradasi warna estetik (aren, susu, & espresso).

🥐 **Rekomendasi Pairing**: 
Sempurna ditemani **Croissant Butter Truffle** atau **Biscoff Lotus Cheese Cake**! 🍰`;
  }

  if (query.includes('matcha')) {
    return `🍵 **Matcha Cream Latté (Rp 28.000)**

🍃 **Cara Pembuatan**: 
Matcha Uji ceremonial grade Kyoto Jepang dikocok bambu (chasen) tradisional pada suhu 80°C, dicampur Oatmilk gurih dan foam krim vanilla lembut.

✨ **Cara Penyajian**: 
Disajikan dingin dengan dusting bubuk matcha hijau segar di atas krim putih.

🍰 **Rekomendasi Pairing**: 
Sangat lezat dipadukan dengan **Biscoff Lotus Cheese Cake**! 😋`;
  }

  if (query.includes('teriyaki') || query.includes('beef') || query.includes('rice bowl')) {
    return `🥩 **Beef Teriyaki Rice Bowl (Rp 38.000)**

🍳 **Cara Pembuatan**: 
Shortplate sapi impor USA irisan tipis dimarinasi saus Teriyaki manis gurih khas Tokyo (shoyu, mirin halal, jahe segar), lalu ditumis cepat (searing) hingga caramelized!

🍚 **Cara Penyajian**: 
Disajikan hangat di atas nasi pulen Jepang, ditaburi wijen sangrai, daun bawang perai, dan edamame segar.

🍹 **Rekomendasi Pairing**: 
Pas banget diminum bareng **Iced Lemon Tea Sparkle** segar! 🍋`;
  }

  if (query.includes('croissant') || query.includes('truffle pastry')) {
    return `🥐 **Croissant Butter Truffle (Rp 25.000)**

👨‍🍳 **Cara Pembuatan**: 
Pastry Prancis buatan koki dengan 27 lapisan French AOP butter dipanggang renyah keemasan, lalu diolesi truffle butter murni Italia.

🍽️ **Cara Penyajian**: 
Disajikan hangat di piring kayu dengan aroma wangi truffle merekah dan serpihan Maldon sea salt.

☕ **Rekomendasi Pairing**: 
Nikmati bareng **Kopi Susu Gula Aren Premium** hangat atau dingin! ☕`;
  }

  if (query.includes('biscoff') || query.includes('cheese cake') || query.includes('dessert')) {
    return `🍰 **Biscoff Lotus Cheese Cake (Rp 32.000)**

🧀 **Cara Pembuatan**: 
Philadelphia cream cheese di-bake teknik water-bath suhu rendah, berdasar crust biskuit Lotus Biscoff, dan dilapisi lelehan Biscoff spread cair serta remahan renyah.

✨ **Cara Penyajian**: 
Disajikan dingin 4°C irisan segitiga manis dengan saus caramel drizzle melimpah.

🍵 **Rekomendasi Pairing**: 
Sempurna dipadu **Matcha Cream Latté**! 💚`;
  }

  if (query.includes('lemon tea') || query.includes('sparkle') || query.includes('minum')) {
    return `🍋 **Iced Lemon Tea Sparkle (Rp 18.000)**

🍋 **Cara Pembuatan**: 
Teh hitam seduh segar dikocok perasan lemon murni, sirup agave, es batu, dan topping sparkling soda menyegarkan.

🍹 **Cara Penyajian**: 
Disajikan dingin dengan garnish irisan lemon segar dan daun mint segar.

🍲 **Rekomendasi Pairing**: 
Pas banget untuk pendamping **Nasi Goreng Wagyu** atau **Beef Teriyaki Rice Bowl**! 🔥`;
  }

  if (query.includes('fries') || query.includes('kentang') || query.includes('snack')) {
    return `🍟 **French Fries Truffle Oil (Rp 24.000)**

🥔 **Cara Pembuatan**: 
Kentang Shoestring Belgia digoreng double-fry hingga garing renyah keemasan, dilumuri White Truffle Oil Italia dan keju Parmesan parut.

🍽️ **Cara Penyajian**: 
Disajikan dalam keranjang stainless hangat bersama saus garlic mayo spesial.

🍹 **Rekomendasi Pairing**: 
Cocok dicemil bareng **Iced Lemon Tea Sparkle**! 🍋`;
  }

  return `Hai Kak! Selamat datang di **MyCashier Resto**! 👨‍🍳✨

Saya adalah **Ask MyCashier AI**, siap membantu memberikan info resep rahasia, cara masak, teknik penyajian, maupun rekomendasi pairing makanan & minuman terbaik untuk Anda!

Tanyakan sesuatu seperti:
- *"Bagaimana cara pembuatan Nasi Goreng Wagyu?"*
- *"Apa rahasia rasa Kopi Susu Gula Aren?"*
- *"Rekomendasi pairing minuman untuk Biscoff Cheese Cake?"*`;
}
