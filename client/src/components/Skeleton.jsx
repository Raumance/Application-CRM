/**
 * Skeleton loader - États de chargement modernes (inspiré Salesforce, HubSpot)
 */
import './Skeleton.css'

export function Skeleton({ className = '', width, height, variant = 'text' }) {
  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`.trim()}
      style={{ width, height }}
    />
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={16} className="skeleton-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} height={14} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  )
}
