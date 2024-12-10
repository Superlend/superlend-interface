import { TGetLoginChallengeParams, TLoginChallengeResponse } from '@/types';
import { request } from './request';

export async function getLoginChallenge({ user_address }: TGetLoginChallengeParams) {
  return request<TLoginChallengeResponse>({
    method: 'GET',
    path: `/auth/challenge/${user_address}`,
  });
}
