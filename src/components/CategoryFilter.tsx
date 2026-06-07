'use client'

interface CategoryFilterProps {
  selectedCategory: string
  categories: string[]
  onCategoryChange: (category: string) => void
}

export default function CategoryFilter({
  selectedCategory,
  categories,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="category-filter">
      <label>카테고리</label>

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">전체 카테고리</option>

        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  )
}
