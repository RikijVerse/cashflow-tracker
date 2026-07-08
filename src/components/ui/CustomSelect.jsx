import { useState, useRef, useEffect } from 'react'

export default function CustomSelect({ id, label, value, onChange, options = [], disabled, placeholder = 'Pilih...', size = 'md', style = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find(o => o.value === value)
  
  const isSm = size === 'sm'
  const btnPadding = isSm ? '8px 12px' : '11px 14px'
  const btnRadius = isSm ? 8 : 10

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', ...style }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%', padding: btnPadding, borderRadius: btnRadius, 
          background: 'var(--bg-base)', border: '1px solid var(--border)', 
          color: 'var(--text-primary)', outline: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          borderColor: isOpen ? 'var(--cyan)' : 'var(--border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(34,211,238,0.10)' : 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          fontFamily: 'inherit'
        }}
      >
        {selectedOption ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedOption.emoji && <span style={{ fontSize: '1.1rem' }}>{selectedOption.emoji}</span>}
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedOption.label}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{placeholder}</span>
        )}
        
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div 
          style={{ 
            position: 'absolute', top: '100%', left: 0, right: 0, 
            marginTop: 4, padding: '6px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)', 
            borderRadius: 12, zIndex: 9999,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            maxHeight: 240, overflowY: 'auto',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              Tidak ada opsi
            </div>
          ) : (
            options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', textAlign: 'left',
                    background: isSelected ? 'rgba(34,211,238,0.1)' : 'transparent',
                    border: 'none', borderRadius: 8,
                    color: isSelected ? 'var(--cyan)' : (opt.disabled ? 'var(--text-muted)' : 'var(--text-primary)'),
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.5 : 1,
                    transition: 'background 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => { if (!isSelected && !opt.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { if (!isSelected && !opt.disabled) e.currentTarget.style.background = 'transparent' }}
                >
                  {opt.emoji && <span style={{ fontSize: '1.1rem' }}>{opt.emoji}</span>}
                  <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500 }}>{opt.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
