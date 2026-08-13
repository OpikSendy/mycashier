import { NextRequest, NextResponse } from 'next/server';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo: string;
  tagline: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  primaryColor: string;
  city: string;
}

const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 't-1',
    slug: 'mycashier-resto',
    name: 'MyCashier Resto Utama',
    logo: '/icon.jpg',
    tagline: 'Modern F&B Self-Ordering & POS',
    plan: 'ENTERPRISE',
    primaryColor: '#10b981',
    city: 'Jakarta Pusat',
  },
  {
    id: 't-2',
    slug: 'kopi-kenangan',
    name: 'Kopi Kenangan Mantan',
    logo: '/icon.jpg',
    tagline: 'Specialty Indonesian Espresso & Pastry',
    plan: 'PRO',
    primaryColor: '#f59e0b',
    city: 'Bandung Dago',
  },
  {
    id: 't-3',
    slug: 'burger-n-co',
    name: 'Burger & Co. Artisanal',
    logo: '/icon.jpg',
    tagline: 'Gourmet Smash Burgers & Craft Shakes',
    plan: 'PRO',
    primaryColor: '#ef4444',
    city: 'Surabaya Barat',
  },
  {
    id: 't-4',
    slug: 'ramen-ya',
    name: 'Ramen Ya! Authentic Noodle',
    logo: '/icon.jpg',
    tagline: 'Authentic Japanese Tonkotsu & Gyoza',
    plan: 'ENTERPRISE',
    primaryColor: '#8b5cf6',
    city: 'Bali Seminyak',
  },
];

let tenantsList = [...DEFAULT_TENANTS];

export async function GET() {
  return NextResponse.json({ success: true, data: tenantsList });
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, tagline, plan, city } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nama dan Slug resto wajib diisi' }, { status: 400 });
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name,
      logo: '/icon.jpg',
      tagline: tagline || 'Restoran SaaS Terdaftar',
      plan: plan || 'FREE',
      primaryColor: '#10b981',
      city: city || 'Jakarta',
    };

    tenantsList.push(newTenant);

    return NextResponse.json({
      success: true,
      tenant: newTenant,
      message: `Restoran ${name} berhasil terdaftar sebagai Multi-Tenant SaaS!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal meregistrasi restoran baru' }, { status: 500 });
  }
}
