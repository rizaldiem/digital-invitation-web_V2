"use client"

import QRCode from "react-qr-code"

interface InvitationQRProps {
  url: string
}

export default function InvitationQR({ url }: InvitationQRProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <QRCode value={url} size={180} />
    </div>
  )
}