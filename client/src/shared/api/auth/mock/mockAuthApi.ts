import type { MemberApi, MemberProfile } from '../../member/memberService'
import { ROLE_LABEL, createAccount, createOrganization, currentAccount, fail, normalizeEmail, save, store, wait } from '../../mock/mockStore'
import type { MockAccount } from '../../mock/mockStore'
import type { AuthApi } from '../authService'

export function profile(account: MockAccount): MemberProfile {
  return {
    memberId: account.memberId,
    organizationId: account.organizationId,
    email: account.email,
    roleType: { code: account.role, description: ROLE_LABEL[account.role] },
  }
}

export const mockAuthApi: AuthApi = {
  login: async ({ email, password }) => {
    const account = store.accounts.find((item) => item.email === normalizeEmail(email) && item.password === password)
    if (!account) fail(401, 'LOGIN_FAILED', '아이디 또는 비밀번호가 일치하지 않습니다.')
    store.sessionMemberId = account.memberId
    save()
    return wait(profile(account))
  },

  signup: async ({ organizationName, email, password }) => {
    if (store.accounts.some((item) => item.email === normalizeEmail(email))) fail(409, 'ALREADY_EXIST', '이미 가입된 이메일입니다.')
    const organization = createOrganization(organizationName)
    return wait(profile(createAccount(organization.organizationId, email, password, 'ADMIN')))
  },

  logout: async () => {
    store.sessionMemberId = null
    save()
    await wait(undefined)
  },
}

export const mockMemberApi: MemberApi = {
  me: async () => wait(profile(currentAccount())),
}
