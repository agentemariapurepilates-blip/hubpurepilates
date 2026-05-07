export interface OAuthUrlParams {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
}

export function buildOAuthUrl(params: OAuthUrlParams): string {
  const url = new URL(params.authorizeUrl);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scopes.join(','));
  url.searchParams.set('state', params.state);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

export function generateState(): string {
  const a = crypto.randomUUID();
  const b = crypto.randomUUID();
  return (a + b).replace(/-/g, '');
}
