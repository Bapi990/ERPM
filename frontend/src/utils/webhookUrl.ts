/**
 * Resolves the external-facing API origin dynamically across local development
 * (where Vite serves on :5173 and Django on :8000) and production HTTPS deploy.
 */
export const getPublicApiOrigin = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const { protocol, hostname, port, origin } = window.location;
  if (port === '5173' || port === '5174' || port === '4173' || port === '3000') {
    return `${protocol}//${hostname}:8000`;
  }
  return origin;
};

export const getInboundWebhookUrl = (path: '/api/v1/crm/webhook/' | '/api/v1/crm/lead-channels/webhook/' | '/api/v1/crm/leads/capture/' = '/api/v1/crm/webhook/'): string => {
  return `${getPublicApiOrigin()}${path}`;
};
