import React, { useState } from 'react'

interface UseDragResult {
  isDragging: boolean
  dragHandleProps: Record<string, unknown>
  dropProps: Record<string, unknown>
  isOver: boolean
}

export function useDrag(onReorder: (from: number, to: number) => void): UseDragResult {
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  return {
    isDragging,
    dragHandleProps: {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setIsDragging(true)
        const idx = parseInt(e.currentTarget.getAttribute('data-index') || '0', 10)
        setDragIndex(idx)
        e.dataTransfer.effectAllowed = 'move'
      },
      onDragEnd: () => {
        setIsDragging(false)
        if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
          onReorder(dragIndex, dropIndex)
        }
        setDragIndex(null)
        setDropIndex(null)
      },
    },
    dropProps: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        setIsOver(true)
        const idx = parseInt(e.currentTarget.getAttribute('data-index') || '0', 10)
        setDropIndex(idx)
      },
      onDragLeave: () => {
        setIsOver(false)
        setDropIndex(null)
      },
      onDrop: () => {
        setIsOver(false)
      },
    },
    isOver,
  }
}

export function DraggableTrackRow({
  index,
  children,
  onReorder,
}: {
  index: number
  children: React.ReactNode
  onReorder: (from: number, to: number) => void
}) {
  const { dragHandleProps, dropProps, isOver } = useDrag(onReorder)

  return (
    <div
      data-index={index}
      {...dragHandleProps}
      {...dropProps}
      className={isOver ? 'bg-accent/10 border-t-2 border-accent' : ''}
    >
      {children}
    </div>
  )
}