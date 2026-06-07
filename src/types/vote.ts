export interface VoteSummary {
  id: number
  creator: `0x${string}`
  title: string
  description: string
  category: string
  createdAt: bigint
  deadline: bigint
  showResultImmediately: boolean
  isPrivate: boolean
  deleted: boolean
  optionCount: bigint
}
