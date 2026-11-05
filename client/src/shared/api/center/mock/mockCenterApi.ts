import { createCenter, currentAccount, requireAdmin, store, wait } from '../../mock/mockStore'
import type { MockCenter } from '../../mock/mockStore'
import type { CenterApi, CenterProfile } from '../centerService'

const toProfile = ({ centerId, code, name, region }: MockCenter): CenterProfile => ({ centerId, code, name, region })

export const mockCenterApi: CenterApi = {
  list: async () => {
    const { organizationId } = currentAccount()
    return wait(
      store.centers
        .filter((item) => item.organizationId === organizationId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(toProfile),
    )
  },
  register: async ({ code, name, region }) => wait(toProfile(createCenter(requireAdmin().organizationId, code, name, region))),
}
