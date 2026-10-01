'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'
import { ImportContactsModal } from './ImportContactsModal'

export function ImportContactsButton() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="btn btn-secondary btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <UploadCloud size={13} strokeWidth={2} />
        Import Contacts
      </button>

      <ImportContactsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
