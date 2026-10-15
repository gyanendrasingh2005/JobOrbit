import React from 'react'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useDispatch, useSelector } from 'react-redux'
import { setJobFilter, clearAllFilters } from '@/redux/jobSlice'
import { filterCategories } from '@/utils/filterUtils'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'

const FilterCard = () => {
    const dispatch = useDispatch()
    const { filters, searchedQuery } = useSelector((store) => store.job)

    const activeFilterCount =
        Object.values(filters || {}).filter(Boolean).length + (searchedQuery ? 1 : 0)

    const handleSelectOption = (categoryKey, option) => {
        // Toggle selection off if already selected
        if (filters?.[categoryKey] === option) {
            dispatch(setJobFilter({ key: categoryKey, value: '' }))
        } else {
            dispatch(setJobFilter({ key: categoryKey, value: option }))
        }
    }

    const handleClearCategory = (categoryKey) => {
        dispatch(setJobFilter({ key: categoryKey, value: '' }))
    }

    const handleClearAll = () => {
        dispatch(clearAllFilters())
    }

    return (
        <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    <h2 className="font-bold text-gray-900 text-base">Filter Jobs</h2>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 font-semibold">
                            {activeFilterCount}
                        </Badge>
                    )}
                </div>

                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 font-medium flex items-center gap-1 cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear All
                    </Button>
                )}
            </div>

            <div className="space-y-5 pt-3">
                {filterCategories.map((category) => {
                    const currentSelected = filters?.[category.key] || ''
                    return (
                        <div key={category.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500">
                                    {category.title}
                                </h3>
                                {currentSelected && (
                                    <button
                                        type="button"
                                        onClick={() => handleClearCategory(category.key)}
                                        className="text-[11px] text-gray-400 hover:text-gray-700 font-medium flex items-center gap-0.5 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            <RadioGroup
                                value={currentSelected}
                                onValueChange={(val) => handleSelectOption(category.key, val)}
                                className="space-y-1.5"
                            >
                                {category.options.map((option, idx) => {
                                    const itemId = `filter-${category.key}-${idx}`
                                    const isSelected = currentSelected === option
                                    return (
                                        <div
                                            key={itemId}
                                            onClick={() => handleSelectOption(category.key, option)}
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? 'bg-purple-50 text-purple-900 font-medium border border-purple-200'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value={option}
                                                id={itemId}
                                                className={isSelected ? 'border-purple-600 text-purple-600' : ''}
                                            />
                                            <Label
                                                htmlFor={itemId}
                                                className="cursor-pointer text-sm leading-none flex-1 pointer-events-none"
                                            >
                                                {option}
                                            </Label>
                                        </div>
                                    )
                                })}
                            </RadioGroup>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default FilterCard
