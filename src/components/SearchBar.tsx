'use client'

interface SearchBarProps {
  searchKeyword: string
  onSearchChange: (value: string) => void
}

export default function SearchBar({
  searchKeyword,
  onSearchChange,
}: SearchBarProps) {
  return (
    <div className="search-box">
      <label>투표 검색</label>

      <input
        type="text"
        value={searchKeyword}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="제목, 설명, 카테고리로 검색"
      />
    </div>
  )
}
