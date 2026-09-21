import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import LeagueTable from '@/components/match/LeagueTable.vue'

const getStandings = vi.fn()

vi.mock('@/services/match', () => ({
  matchService: {
    getStandings: (...args) => getStandings(...args),
  },
}))

describe('LeagueTable', () => {
  const vuetify = createVuetify()

  beforeEach(() => {
    getStandings.mockReset()
    getStandings.mockResolvedValue([
      {
        rank: 1,
        teamId: 'inter',
        teamName: 'Inter Milan',
        shortName: 'Inter',
        played: 5,
        gd: 7,
        pts: 13,
        isRoma: false,
      },
      {
        rank: 2,
        teamId: '22033fe3-0a71-435a-9762-749984ea439c',
        teamName: 'AS Roma',
        shortName: 'Roma',
        played: 5,
        gd: 11,
        pts: 13,
        isRoma: true,
      },
    ])
  })

  it('highlights the Roma row', async () => {
    const wrapper = mount(LeagueTable, {
      global: { plugins: [vuetify] },
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    const romaRow = wrapper.find('.roma-row')
    expect(romaRow.exists()).toBe(true)
    expect(romaRow.text()).toContain('Roma')
    expect(romaRow.text()).toContain('13')
  })
})
