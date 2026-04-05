export default function SectionContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-5xl mx-auto px-6">
      {children}
    </div>
  )
}
