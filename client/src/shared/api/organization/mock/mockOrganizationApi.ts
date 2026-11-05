import { profile } from '../../auth/mock/mockAuthApi'
import { createAccount, currentAccount, requireAdmin, store, wait } from '../../mock/mockStore'
import type { OrganizationApi } from '../organizationService'

export const mockOrganizationApi: OrganizationApi = {
  get: async () => {
    const organization = store.organizations.find((item) => item.organizationId === currentAccount().organizationId)!
    return wait({
      organizationId: organization.organizationId,
      name: organization.name,
      planType: { code: 'PILOT', description: '파일럿' },
      pilotEndsAt: organization.pilotEndsAt,
    })
  },
  members: async () => {
    const admin = requireAdmin()
    return wait(store.accounts.filter((item) => item.organizationId === admin.organizationId).map(profile))
  },
  addMember: async ({ email, password, roleType }) => {
    const admin = requireAdmin()
    return wait(profile(createAccount(admin.organizationId, email, password, roleType)))
  },
}
