import { NextResponse } from 'next/server';

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  return { apiKey };
}

const CULINARY_HUMAN_WAITER_PROMPT = `Anda adalah seorang Pelayan & Koki Senior yang sangat ramah, hangat, dan komunikatif di restoran MyCashier.
Tugas Anda adalah merespons pertanyaan pelanggan layaknya SEORANG MANUSIA (pelayan resto yang ramah dan membantu), BUKAN seperti bot AI dengan poin-poin data kaku (DILARANG menggunakan header kaku seperti "**Cara Pembuatan:**", "**Cara Penyajian:**", atau "**Rekomendasi Pairing:**").

Gunakan gaya bercerita mengalir (*storytelling*), hangat, natural, dan menggugah selera (*appetizing*). Gunakan bahasa Indonesia yang santai, sopan, dan bersahabat.

Pengetahuan Menu Restoran MyCashier:
1. 🍲 Nasi Goreng Wagyu Special (Rp 45.000): Beras pera tumis wok hei suhu tinggi, rempah khas, kecap super, daging Wagyu A5 Australia meltique empuk juicy. Disajikan panas bareng telur mata sapi setengah matang, kerupuk udang, & acar. Pairing terbaik: Iced Lemon Tea Sparkle.
2. ☕ Kopi Susu Gula Aren Premium (Rp 22.000): Double shot espresso Arabika Gayo & Robusta Dampit 9 bar, susu murni dingin, gula aren organik Sukabumi. Penyajian estetik 3 layer warna di gelas es batu. Pairing terbaik: Croissant Butter Truffle / Biscoff Cheese Cake.
3. 🍵 Matcha Cream Latté (Rp 28.000): Uji Matcha ceremonial grade Kyoto Jepang dikocok chasen bambu 80°C, Oatmilk gurih, foam krim vanilla. Pairing terbaik: Biscoff Lotus Cheese Cake.
4. 🥩 Beef Teriyaki Rice Bowl (Rp 38.000): Shortplate sapi impor USA marinasi saus Teriyaki shoyu & mirin halal, ditumis cepat caramelized, nasi pulen Jepang, wijen & edamame. Pairing terbaik: Iced Lemon Tea Sparkle.
5. 🥐 Croissant Butter Truffle (Rp 25.000): 27 lapisan French AOP butter renyah di luar lembut di dalam, diolesi truffle butter Italia & Maldon sea salt. Pairing terbaik: Kopi Susu Gula Aren.
6. 🍰 Biscoff Lotus Cheese Cake (Rp 32.000): Philadelphia cream cheese bake slow water-bath, crust biskuit Biscoff, drizzle caramel cair. Disajikan dingin 4°C. Pairing terbaik: Matcha Cream Latté.
7. 🍋 Iced Lemon Tea Sparkle (Rp 18.000): Teh hitam kocok perasan lemon murni, agave nectar, sparkling soda. Disajikan dingin irisan lemon & mint. Pairing terbaik: Nasi Goreng Wagyu / Beef Teriyaki.
8. 🍟 French Fries Truffle Oil (Rp 24.000): Kentang Belgi double-fry renyah keemasan, White Truffle Oil Italia, parmesan, mayo garlic. Pairing terbaik: Iced Lemon Tea Sparkle.`;

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
              { role: 'system', content: CULINARY_HUMAN_WAITER_PROMPT },
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
        console.warn('OpenRouter API call failed, falling back to human waiter response:', e);
      }
    }

    // Interactive Human Waiter Storytelling Reply Generator
    const reply = generateHumanWaiterReply(userMessage);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('MyCashier AI API Error:', error);
    return NextResponse.json({
      reply: 'Hai Kak! Mau cerita tentang resep rahasia masakan kita, rekomendasi pairing minuman, atau ada yang bisa saya bantu pilihkan? 😊',
    });
  }
}

function generateHumanWaiterReply(input: string): string {
  const query = input.toLowerCase();

  if (query.includes('wagyu') || query.includes('nasi goreng')) {
    return `Nasi Goreng Wagyu kita ini salah satu menu yang paling difavoritkan Kak! 👨‍🍳 

Daging Wagyu-nya pilihan super empuk, ditumis di wajan wok suhu tinggi bareng racikan rempah khas resto kita. Aromanya wangi harum beneran menggugah selera dan dagingnya empuk lumer di mulut. 

Pas dihidangkan, kita kasih telur mata sapi setengah matang, kerupuk udang renyah, plus acar segar. Biar makin mantap, cocok banget dipadukan sama **Iced Lemon Tea Sparkle** yang dingin dan menyegarkan! 😋`;
  }

  if (query.includes('kopi') || query.includes('aren')) {
    return `Kopi Susu Gula Aren kita rasanya legit dan pas banget di lidah Kak! ☕ 

Espresso-nya kita racik dari biji kopi Arabika Gayo & Robusta pilihan yang diekstrak pas, terus dipadukan susu murni segar dingin dan lelehan gula aren murni Sukabumi. Penyajiannya di gelas bening estetik 3 layer warna. 

Paling nikmat kalau diminum sambil nemenin **Croissant Butter Truffle** atau **Biscoff Lotus Cheese Cake** kita! 🥐🍰`;
  }

  if (query.includes('matcha')) {
    return `Matcha Cream Latté kita memakai bubuk Matcha Uji asli Kyoto Jepang grade ceremonial Kak! 🍵 

Dikocok pakai mangkuk bambu tradisional biar buihnya halus, dicampur Oatmilk gurih, dan disiram foam krim vanilla lembut di atasnya. Rasanya manis-gurih menenangkan banget, paling mantap kalau diminum bareng **Biscoff Lotus Cheese Cake**! 😋`;
  }

  if (query.includes('teriyaki') || query.includes('beef') || query.includes('rice bowl')) {
    return `Beef Teriyaki Rice Bowl ini rasa gurih-manisnya beneran nagih Kak! 🥩 

Irisan daging sapi impor USA-nya dimarinasi saus Teriyaki otentik khas Tokyo, terus ditumis cepat sampai bumbunya meresap merata. Disajikan hangat di dalam rice bowl di atas nasi pulen Jepang plus taburan wijen sangrai dan edamame segar. 

Biar makin lengkap, pas banget ditemani **Iced Lemon Tea Sparkle** ya! 🍋`;
  }

  if (query.includes('croissant') || query.includes('truffle pastry')) {
    return `Croissant Butter Truffle kita ini aromanya wangi truffle banget begitu dihidangkan hangat Kak! 🥐 

Dibuat dari 27 lapisan French AOP butter yang renyah beremah di luar tapi lembut bertekstur di dalam, terus diolesi truffle butter murni Italia dan taburan Maldon sea salt. Sempurna banget kalau dinikmati bareng **Kopi Susu Gula Aren** kita! ☕`;
  }

  if (query.includes('biscoff') || query.includes('cheese cake') || query.includes('dessert')) {
    return `Kue keju Biscoff kita ini teksturnya lembut lumer banget di mulut Kak! 🍰 

Dibuat dari Philadelphia cream cheese yang dipanggang pelan dengan teknik water-bath, berdasar crust biskuit Biscoff yang renyah, terus disiram saus caramel Biscoff cair melimpah di atasnya. Disajikan dingin 4°C, rasanya pas banget kalau ditemani **Matcha Cream Latté**! 🍵`;
  }

  if (query.includes('lemon tea') || query.includes('sparkle') || query.includes('minum')) {
    return `Iced Lemon Tea Sparkle kita ini penyelamat dahaga banget Kak! 🍋 

Teh hitam pilihan dikocok segar bareng perasan lemon asli, sirup agave murni, es batu, dan sensasi sparkling soda yang nyelekit segar. Disajikan dingin dengan irisan lemon dan daun mint. Pas banget buat nemenin makanan gurih kayak **Nasi Goreng Wagyu**! 🔥`;
  }

  if (query.includes('fries') || query.includes('kentang') || query.includes('snack')) {
    return `French Fries Truffle Oil kita ini cemilan paling favorit buat nongkrong Kak! 🍟 

Kentang Belgia potongan garing digoreng double-fry sampai renyah keemasan, terus dilumuri minyak truffle putih Italia dan taburan keju Parmesan parut yang wangi. Disajikan hangat di keranjang bareng saus mayo garlic spesial! 😋`;
  }

  return `Hai Kak! Selamat datang di **MyCashier Resto**! 👨‍🍳✨

Saya pelayan resto yang siap bantu jelaskan cita rasa masakan, resep rahasia, atau kasih rekomendasi kombinasi makanan & minuman terbaik buat Kakak!

Ada menu yang penasaran mau ditanyakan? 😊`;
}
