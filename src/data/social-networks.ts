import { Instagram, Facebook, Music2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SocialNetworkId = 'instagram' | 'facebook' | 'tiktok';

export interface SocialNetworkConfig {
  id: SocialNetworkId;
  label: string;
  handle: string;
  icon: LucideIcon;
  brandColor: string;          // tailwind color usado em borda/texto
  oauthAuthorizeUrl: string;   // URL base do provider
  scopes: string[];
  appIdEnv: string;            // nome da var VITE_*
}

export const SOCIAL_NETWORKS: SocialNetworkConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@purepilatesbr',
    icon: Instagram,
    brandColor: 'text-pink-600 border-pink-600',
    oauthAuthorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_read_engagement',
      'pages_show_list',
    ],
    appIdEnv: 'VITE_META_APP_ID',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: '/pure.pilates.br',
    icon: Facebook,
    brandColor: 'text-blue-600 border-blue-600',
    oauthAuthorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: [
      'pages_read_engagement',
      'pages_show_list',
      'read_insights',
    ],
    appIdEnv: 'VITE_META_APP_ID',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@purepilatesbr',
    icon: Music2,
    brandColor: 'text-zinc-900 border-zinc-900',
    oauthAuthorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scopes: ['user.info.basic', 'user.info.stats', 'video.list'],
    appIdEnv: 'VITE_TIKTOK_CLIENT_KEY',
  },
];

export function getNetwork(id: SocialNetworkId): SocialNetworkConfig {
  const network = SOCIAL_NETWORKS.find((n) => n.id === id);
  if (!network) throw new Error(`Unknown social network: ${id}`);
  return network;
}
