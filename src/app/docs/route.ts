import { ApiReference } from '@scalar/nextjs-api-reference';

export const GET = ApiReference({
  spec: {
    url: '/api/openapi.json',
  },
  theme: 'purple',
  pageTitle: 'MyCashier API Reference — Scalar Documentation',
});
