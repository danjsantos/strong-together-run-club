import Image from 'next/image'

interface LogoProps {
  className?: string
}

export default function Logo({ className = 'h-10 w-auto' }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Strong Together Run Club"
      width={120}
      height={120}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}
