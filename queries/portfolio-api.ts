import { TGetPortfolioParams, TPortfolio } from '@/types/queries/portfolio';
import { request } from './request';

export async function getPortfolioData({
  user_address,
  chain_id = [],
  platform_id = [],
  position_type,
  protocol_identifier = [],
}: TGetPortfolioParams) {
  const params = new URLSearchParams();

  // Add chain_id as a comma-separated list
  if (chain_id.length > 0) {
    params.append('chain_id', chain_id.join(','));
  }

  // Add platform_id if needed (not in the example URL, but keeping it for flexibility)
  if (platform_id.length > 0) {
    params.append('platform_id', platform_id.join(','));
  }

  // Add position_type
  if (position_type) {
    params.append('position_type', position_type);
  }

  // Add protocol_identifier
  if (protocol_identifier.length > 0) {
    params.append('protocol_identifier', protocol_identifier.join(','));
  }

  return request<TPortfolio>({
    method: 'GET',
    path: `/users/portfolio/${user_address}`,
    query: params,
  });
}
