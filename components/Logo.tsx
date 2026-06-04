import Image from 'next/image'

interface LogoProps {
  className?: string
}

export default function Logo({ className = 'h-16 w-auto' }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Strong Together Run Club"
      width={180}
      height={180}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}
