'use client'

import { useState, useEffect } from 'react'
import { Settings, Trash2 } from 'lucide-react'
import { InvoiceFormMobile } from '@/components/mobile/invoice-form-mobile'
import { InvoicePreview } from '@/components/mobile/invoice-preview'
import { FABButton } from '@/components/mobile/fab-button'
import { OfflineBanner } from '@/components/mobile/offline-banner'
import { SettingsModal } from '@/components/mobile/settings-modal'
import { useInvoiceStore } from '@/lib/store'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { addPendingRequest } from '@/lib/offline'
import { Invoice } from '@/lib/types'
import { formatDate, generateUUID } from '@/lib/utils'

function PreviewView({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const { currentInvoice, storeSettings, isOffline, setPendingSync, deleteDraft, saveCompleted } = useInvoiceStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = async () => {
    if (!currentInvoice || !currentInvoice.id) return

    setIsGenerating(true)

    try {
      if (isOffline) {
        // Queue for later when online
        await addPendingRequest({
          id: generateUUID(),
          url: '/api/generate-pdf',
          method: 'POST',
          body: { invoice: currentInvoice as Invoice, storeSettings },
          timestamp: new Date(),
          retryCount: 0,
        })
        setPendingSync(1)
        alert('You are offline. PDF will be generated when you are back online.')
        return
      }

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: currentInvoice as Invoice,
          storeSettings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `Invoice-${currentInvoice.invoiceNumber}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Try to share on mobile
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        try {
          const file = new File([blob], filename, {
            type: 'application/pdf',
          })
          await navigator.share({
            files: [file],
            title: `Invoice ${currentInvoice.invoiceNumber}`,
          })
        } catch (shareError) {
          // Share cancelled or not supported, file already downloaded
          console.log('Share cancelled or not supported')
        }
      }

      // Save as completed invoice and remove from drafts
      if (currentInvoice.id) {
        deleteDraft(currentInvoice.id)
        saveCompleted()
      }
      
      // Notify completion
      onComplete()
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!currentInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No invoice to preview</p>
      </div>
    )
  }

  return (
    <>
      <OfflineBanner />
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-primary font-medium"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Preview</h1>
          <div className="w-16" />
        </div>
      </header>
      <InvoicePreview
        invoice={currentInvoice as Invoice}
        storeSettings={storeSettings}
        onDownload={handleDownloadPDF}
        isGenerating={isGenerating}
      />
    </>
  )
}

export default function HomePage() {
  const [view, setView] = useState<'home' | 'form' | 'preview'>('home')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'drafts' | 'completed'>('drafts')
  const { 
    draftInvoices, 
    completedInvoices,
    initializeNewInvoice, 
    storeSettings, 
    loadDraft, 
    deleteDraft,
    loadCompleted,
    deleteCompleted,
    currentInvoice 
  } = useInvoiceStore()
  
  // Monitor online/offline status
  useOnlineStatus()

  // Show settings modal on first visit if not configured
  useEffect(() => {
    if (!storeSettings && view === 'home') {
      const timer = setTimeout(() => {
        setShowSettings(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [storeSettings, view])

  const handleNewInvoice = () => {
    initializeNewInvoice()
    setView('form')
  }

  const handleOpenDraft = (draftId: string) => {
    loadDraft(draftId)
    setView('form')
  }

  const handleOpenCompleted = (invoiceId: string) => {
    loadCompleted(invoiceId)
    setView('form')
  }

  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    if (confirm('Delete this draft?')) {
      deleteDraft(draftId)
    }
  }

  const handleDeleteCompleted = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation()
    if (confirm('Delete this invoice?')) {
      deleteCompleted(invoiceId)
    }
  }

  const handlePreview = () => {
    setView('preview')
  }

  const handleInvoiceComplete = () => {
    alert('Invoice created successfully!')
    setView('home')
    setActiveTab('completed')
  }

  if (view === 'form') {
    const isEditingDraft = currentInvoice?.status === 'draft' && currentInvoice?.items && currentInvoice.items.length > 0
    
    return (
      <>
        <OfflineBanner />
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('home')}
              className="text-primary font-medium"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEditingDraft ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <div className="w-16" />
          </div>
        </header>
        <InvoiceFormMobile onPreview={handlePreview} />
      </>
    )
  }

  if (view === 'preview') {
    return <PreviewView onBack={() => setView('form')} onComplete={handleInvoiceComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="11" cy="4" r="2"/>
              <circle cx="18" cy="8" r="2"/>
              <circle cx="20" cy="16" r="2"/>
              <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
            </svg>
            Invow
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 px-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard
            </h2>
            <p className="text-gray-600">
              Generate invoices quickly
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{completedInvoices.length}</div>
              <div className="text-sm text-primary/80">Invoices Created</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{draftInvoices.length}</div>
              <div className="text-sm text-gray-600">Drafts Saved</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({completedInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'drafts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Drafts ({draftInvoices.length})
            </button>
          </div>

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <>
              {draftInvoices.length > 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Draft Invoices</h3>
                  <div className="space-y-2">
                    {draftInvoices.slice(0, 10).map((draft) => (
                  <div
                    key={draft.id}
                    className="relative border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between p-3">
                      <button
                        onClick={() => handleOpenDraft(draft.id)}
                        className="flex-1 min-w-0 pr-2 text-left"
                      >
                        <div className="font-medium text-gray-900 truncate">{draft.invoiceNumber}</div>
                        <div className="text-sm text-gray-600 truncate">{draft.customer.name || 'No customer'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {draft.items?.length || 0} item{draft.items?.length !== 1 ? 's' : ''} • {formatDate(new Date(draft.updatedAt))}
                        </div>
                      </button>
                      <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Draft
                        </span>
                        <button
                          onClick={(e) => handleDeleteDraft(e, draft.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors"
                          aria-label="Delete draft"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No drafts yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first invoice to get started</p>
              </div>
            )}
          </>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <>
              {completedInvoices.length > 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Completed Invoices</h3>
                  <div className="space-y-2">
                    {completedInvoices.slice().reverse().slice(0, 10).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="relative border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between p-3">
                          <button
                            onClick={() => handleOpenCompleted(invoice.id)}
                            className="flex-1 min-w-0 pr-2 text-left"
                          >
                            <div className="font-medium text-gray-900 truncate">{invoice.invoiceNumber}</div>
                            <div className="text-sm text-gray-600 truncate">{invoice.customer.name || 'No customer'}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''} • {formatDate(new Date(invoice.updatedAt))}
                            </div>
                          </button>
                          <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Completed
                            </span>
                            <button
                              onClick={(e) => handleDeleteCompleted(e, invoice.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors"
                              aria-label="Delete invoice"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <p className="text-gray-500">No completed invoices yet</p>
                  <p className="text-sm text-gray-400 mt-1">Download a PDF to complete an invoice</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button - Green Zone */}
      <FABButton onClick={handleNewInvoice} />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}