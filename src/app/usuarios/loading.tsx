export default function Loading() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: 'var(--bg-main)',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem'
    }}>
      Cargando usuarios...
    </div>
  )
}
