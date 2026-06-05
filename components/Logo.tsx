interface LogoProps {
  className?: string
}

export default function Logo({ className = 'h-16 w-auto' }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Strong Together Run Club"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
